import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db, ensureDbSeeded } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateMagicLinkToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    await ensureDbSeeded();

    let user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      const newUserId = crypto.randomUUID();
      const defaultName = normalizedEmail.split("@")[0];
      const newUserRecord = {
        id: newUserId,
        name: defaultName,
        email: normalizedEmail,
        emailVerified: false,
        rollNumber: null,
        createdAt: new Date(),
      };
      await db.insert(users).values(newUserRecord);
      user = await db.query.users.findFirst({
        where: eq(users.id, newUserId),
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to create or find user" }, { status: 500 });
    }

    const token = await generateMagicLinkToken({
      userId: user.id,
      email: user.email,
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/api/auth/verify-login?token=${token}`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_...") {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Academia <onboarding@resend.dev>",
          to: user.email,
          subject: "Log in to Academia",
          text: `Hi there,\n\nClick the link below to log in to Academia — it will expire in 20 minutes:\n\n${magicLink}\n\nIf you didn't request this, you can safely ignore this email.\n\n— The Academia Team`,
          html: `
            <div style="font-family: sans-serif; background-color: #0A0A0A; color: #EDEDED; padding: 24px; border-radius: 8px;">
              <h2 style="color: #F5A623;">Log in to Academia</h2>
              <p>Hi there,</p>
              <p>Click the link below to log in to Academia — it will expire in 20 minutes:</p>
              <p style="margin: 24px 0;">
                <a href="${magicLink}" style="background-color: #F5A623; color: #000; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Log In to Academia</a>
              </p>
              <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
              <p style="font-size: 12px; color: #888;">— The Academia Team</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Resend delivery failed:", err);
      }
    } else {
      console.log(`[DEV/TEST] Magic link generated for ${user.email}: ${magicLink}`);
    }

    return NextResponse.json({
      success: true,
      message: "Check your email for the login link",
    });
  } catch (err) {
    console.error("request-login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
