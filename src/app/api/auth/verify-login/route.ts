import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbSeeded } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMagicLinkToken, createSessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return renderErrorPage();
    }

    const payload = await verifyMagicLinkToken(token);
    if (!payload) {
      return renderErrorPage();
    }

    await ensureDbSeeded();

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", req.url));
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const sessionToken = await createSessionToken({ userId: user.id });

    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("verify-login error:", err);
    return renderErrorPage();
  }
}

function renderErrorPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invalid Login Link - Academia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background-color: #0A0A0A; color: #EDEDED; font-family: monospace, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { border: 1px solid #262626; background-color: #121212; padding: 32px; border-radius: 8px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    h1 { color: #E54D2E; font-size: 16px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
    p { color: #A0A0A0; font-size: 13px; line-height: 1.5; margin-bottom: 24px; font-family: sans-serif; }
    a { display: inline-block; background-color: #F5A623; color: #000; font-weight: bold; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Invalid or Expired Link</h1>
    <p>This magic link is invalid or has expired (login links expire after 20 minutes). Please request a new link to sign in.</p>
    <a href="/login">Request New Link</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 400,
    headers: { "Content-Type": "text/html" },
  });
}
