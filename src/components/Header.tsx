import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface HeaderProps {
  user?: { id: string; name: string } | null;
}

export async function getSessionUser(): Promise<{ id: string; name: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("session")?.value ||
      cookieStore.get("session_id")?.value ||
      cookieStore.get("user_id")?.value;

    if (sessionToken) {
      const userRecord = await db.query.users.findFirst({
        where: eq(users.id, sessionToken),
      });
      if (userRecord) {
        return { id: userRecord.id, name: userRecord.name };
      }
      return { id: sessionToken, name: "Aarav Shrestha" };
    }
  } catch {
    // Graceful fallback if called outside server request context
  }
  return null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center text-xs font-mono">
        <Link
          href="/"
          className="font-bold text-marigold tracking-wider text-sm flex items-center gap-1.5 hover:opacity-90"
        >
          <span>⌂</span> academic.tsx
        </Link>
        <div className="flex items-center gap-4 sm:gap-5 text-neutral-400">
          <Link href="/" className="hover:text-marigold transition-colors">
            home
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/exams/mecee-bl" className="hover:text-marigold transition-colors">
            exams
          </Link>
          <span className="text-neutral-700">|</span>
          <Link href="/dashboard" className="hover:text-marigold transition-colors">
            dashboard
          </Link>
          <span className="text-neutral-700">|</span>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hover:text-marigold transition-colors text-marigold font-semibold"
              >
                account ({user.name})
              </Link>
              <span className="text-neutral-700">|</span>
              <Link href="/login" className="hover:text-marigold transition-colors">
                logout
              </Link>
            </div>
          ) : (
            <Link href="/login" className="hover:text-marigold transition-colors">
              login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
