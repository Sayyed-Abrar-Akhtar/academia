"use server";

import { db, ensureDbSeeded } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, gt, and } from "drizzle-orm";
import { cookies } from "next/headers";

const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

export async function getCurrentUserSession() {
  await ensureDbSeeded();
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get("session_token")?.value;
  } catch {
    // Ignore request-store context error when called outside Next.js request
  }

  if (!token) {
    const demoUser = await db.query.users.findFirst({
      where: eq(users.id, "demo-user-id"),
    });
    return { user: demoUser, session: null };
  }

  const activeSession = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, token),
      gt(sessions.expiresAt, new Date())
    ),
  });

  if (!activeSession) {
    const demoUser = await db.query.users.findFirst({
      where: eq(users.id, "demo-user-id"),
    });
    return { user: demoUser, session: null };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, activeSession.userId),
  });

  return { user, session: activeSession };
}

export async function loginWithMobileAction(formData: FormData) {
  await ensureDbSeeded();

  const mobileNumber = formData.get("mobileNumber")?.toString().trim();
  const password = formData.get("password")?.toString().trim();
  const otpCode = formData.get("otpCode")?.toString().trim();
  const loginType = formData.get("loginType")?.toString() || "password";

  if (!mobileNumber) {
    return { success: false, error: "Mobile number is required" };
  }

  let user = await db.query.users.findFirst({
    where: eq(users.mobileNumber, mobileNumber),
  });

  if (!user) {
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRollNumber = `MECEE-2083-${Math.floor(1000 + Math.random() * 9000)}`;
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name: `Student (${mobileNumber.slice(-4)})`,
        email: `student_${Date.now()}@mecee.np`,
        mobileNumber,
        passwordHash: password || "demo1234",
        rollNumber: newRollNumber,
        createdAt: new Date(),
      })
      .returning();
    user = newUser;
  } else if (loginType === "password" && password && user.passwordHash !== password) {
    return { success: false, error: "Invalid password for this mobile number" };
  } else if (loginType === "whatsapp_otp" && otpCode && otpCode !== "123456") {
    return { success: false, error: "Invalid WhatsApp OTP code. Use test code: 123456" };
  }

  const token = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = new Date(Date.now() + FORTNIGHT_MS);

  await db.insert(sessions).values({
    id: `sess-id-${Date.now()}`,
    userId: user.id,
    token,
    expiresAt,
    createdAt: new Date(),
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });
  } catch {
    // Ignore request-store context error when called outside Next.js request
  }

  return { success: true, user, token, expiresAt };
}
