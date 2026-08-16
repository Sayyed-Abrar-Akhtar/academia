import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Ensure TextEncoder produces Node's native Uint8Array in jsdom/Vitest test environment
if (typeof process !== "undefined" && process.versions && process.versions.node) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const util = require("util");
    if (util && util.TextEncoder) {
      globalThis.TextEncoder = util.TextEncoder;
    }
  } catch {
    // Ignore if util module not available
  }
}

const SECRET_KEY_STRING =
  process.env.NEXTAUTH_SECRET || "academia_secret_jwt_key_min_length_32_bytes_dev_testing";
const SECRET_KEY = new Uint8Array(Buffer.from(SECRET_KEY_STRING));

export interface MagicLinkPayload {
  userId: string;
  email: string;
}

export interface SessionPayload {
  userId: string;
}

export async function generateMagicLinkToken(payload: MagicLinkPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(SECRET_KEY);
}

export async function verifyMagicLinkToken(token: string): Promise<MagicLinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (typeof payload.userId === "string" && typeof payload.email === "string") {
      return {
        userId: payload.userId,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (typeof payload.userId === "string") {
      return {
        userId: payload.userId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;

    const payload = await verifySessionToken(sessionCookie);
    if (!payload) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    return user || null;
  } catch {
    return null;
  }
}
