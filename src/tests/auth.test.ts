// @vitest-environment node

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { seed } from "@/db/seed";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateMagicLinkToken,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";
import { POST as requestLoginPOST } from "@/app/api/auth/request-login/route";
import { GET as verifyLoginGET } from "@/app/api/auth/verify-login/route";
import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { middleware } from "@/middleware";
import { SignJWT } from "jose";

beforeEach(async () => {
  await seed();
});

describe("Magic Link Authentication Flow Tests", () => {
  describe("Request Login API (/api/auth/request-login)", () => {
    it("should create a new user when called with an unrecognised email and return success", async () => {
      const newEmail = "student.new@example.com";

      const req = new NextRequest("http://localhost:3000/api/auth/request-login", {
        method: "POST",
        body: JSON.stringify({ email: newEmail }),
      });

      const res = await requestLoginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const createdUser = await db.query.users.findFirst({
        where: eq(users.email, newEmail),
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(newEmail);
      expect(createdUser?.name).toBe("student.new");
      expect(createdUser?.emailVerified).toBe(false);
    });

    it("should not create a duplicate user when called with an existing email", async () => {
      const existingEmail = "me@sayyedabrarakhtar.com.np";

      const req = new NextRequest("http://localhost:3000/api/auth/request-login", {
        method: "POST",
        body: JSON.stringify({ email: existingEmail }),
      });

      const res = await requestLoginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      const userMatches = await db
        .select()
        .from(users)
        .where(eq(users.email, existingEmail));

      expect(userMatches.length).toBe(1);
    });

    it("should reject invalid email formats with status 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/request-login", {
        method: "POST",
        body: JSON.stringify({ email: "invalid-email-string" }),
      });

      const res = await requestLoginPOST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe("Verify Login API (/api/auth/verify-login)", () => {
    it("should set session cookie, update emailVerified and lastLoginAt, and redirect to /dashboard on valid token", async () => {
      const demoUser = await db.query.users.findFirst({
        where: eq(users.email, "me@sayyedabrarakhtar.com.np"),
      });

      expect(demoUser).toBeDefined();

      const token = await generateMagicLinkToken({
        userId: demoUser!.id,
        email: demoUser!.email,
      });

      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-login?token=${token}`
      );

      const res = await verifyLoginGET(req);

      expect(res.status).toBe(307); // NextResponse.redirect status
      expect(res.headers.get("location")).toContain("/dashboard");

      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain("session=");

      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, demoUser!.id),
      });

      expect(updatedUser?.emailVerified).toBe(true);
      expect(updatedUser?.lastLoginAt).toBeDefined();
    });

    it("should render error page for expired token", async () => {
      const SECRET_KEY = new Uint8Array(
        Buffer.from(
          process.env.NEXTAUTH_SECRET || "academia_secret_jwt_key_min_length_32_bytes_dev_testing"
        )
      );

      const expiredToken = await new SignJWT({
        userId: "demo-user-id",
        email: "me@sayyedabrarakhtar.com.np",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
        .sign(SECRET_KEY);

      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-login?token=${expiredToken}`
      );

      const res = await verifyLoginGET(req);

      expect(res.status).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toContain("Invalid or Expired Link");
    });

    it("should render error page for tampered token", async () => {
      const tamperedToken = "header.payload.invalid_signature";

      const req = new NextRequest(
        `http://localhost:3000/api/auth/verify-login?token=${tamperedToken}`
      );

      const res = await verifyLoginGET(req);

      expect(res.status).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toContain("Invalid or Expired Link");
    });
  });

  describe("Session JWT Utilities", () => {
    it("should sign and verify valid session tokens", async () => {
      const token = await createSessionToken({ userId: "user-123" });
      const payload = await verifySessionToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe("user-123");
    });

    it("should return null when verifying invalid session token", async () => {
      const payload = await verifySessionToken("invalid-session-token");
      expect(payload).toBeNull();
    });
  });

  describe("Logout API (/api/auth/logout)", () => {
    it("should clear session cookie and redirect to /", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
      });

      const res = await logoutPOST(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3000/");

      const setCookieHeader = res.headers.get("set-cookie");
      expect(setCookieHeader).toContain("session=;");
    });
  });

  describe("Middleware Route Protection", () => {
    it("should redirect unauthenticated users accessing /dashboard to /login", async () => {
      const req = new NextRequest("http://localhost:3000/dashboard");

      const res = await middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login?redirect=%2Fdashboard");
    });

    it("should allow authenticated users accessing /dashboard", async () => {
      const sessionToken = await createSessionToken({ userId: "demo-user-id" });

      const req = new NextRequest("http://localhost:3000/dashboard", {
        headers: {
          cookie: `session=${sessionToken}`,
        },
      });

      const res = await middleware(req);

      expect(res.status).toBe(200);
    });

    it("should allow unauthenticated access to public routes like / and /exams/mecee-bl", async () => {
      const reqHome = new NextRequest("http://localhost:3000/");
      const resHome = await middleware(reqHome);
      expect(resHome.status).toBe(200);

      const reqExams = new NextRequest("http://localhost:3000/exams/mecee-bl");
      const resExams = await middleware(reqExams);
      expect(resExams.status).toBe(200);
    });
  });
});
