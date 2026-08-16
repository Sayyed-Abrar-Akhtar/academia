import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY_STRING =
  process.env.NEXTAUTH_SECRET || "academia_secret_jwt_key_min_length_32_bytes_dev_testing";
const SECRET_KEY = new TextEncoder().encode(SECRET_KEY_STRING);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/quiz");
  const isProtectedApi = pathname.startsWith("/api/");

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      if (typeof payload.userId === "string") {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
