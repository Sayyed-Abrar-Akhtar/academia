import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions/auth";
import { db, ensureDbSeeded } from "@/db";
import { subscriptions } from "@/db/schema";

export async function POST(request: Request) {
  await ensureDbSeeded();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, string> = {};
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      formData.forEach((val, key) => {
        body[key] = val.toString();
      });
    } else {
      body = await request.json();
    }
  } catch {
    body = {};
  }

  const tier = body.tier === "full_pro" ? "full_pro" : "basic_pro";
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year validity

  const subId = `sub-khalti-${Date.now()}`;

  await db.insert(subscriptions).values({
    id: subId,
    userId: user.id,
    tier,
    currency: "NPR",
    paymentProvider: "khalti",
    status: "active",
    expiresAt,
    createdAt: now,
  });

  return NextResponse.redirect(new URL("/dashboard?payment=success", request.url), 303);
}
