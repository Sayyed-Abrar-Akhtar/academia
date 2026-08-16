import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export interface HeaderProps {
  user?: { id: string; name: string } | null;
}

export async function getSessionUser(): Promise<{ id: string; name: string } | null> {
  try {
    const user = await getCurrentUser();
    if (user) {
      return { id: user.id, name: user.name };
    }
  } catch {
    // Fallback if called outside server request context
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
              <form action="/api/auth/logout" method="POST" className="inline">
                <button
                  type="submit"
                  className="hover:text-marigold transition-colors cursor-pointer text-neutral-400"
                >
                  logout
                </button>
              </form>
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
