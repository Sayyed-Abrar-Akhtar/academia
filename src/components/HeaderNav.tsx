import React from "react";
import Link from "next/link";

interface HeaderNavProps {
  user?: {
    id: string;
    name: string;
  } | null;
}

export function HeaderNav({ user }: HeaderNavProps = {}) {
  return (
    <header className="border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center text-xs font-mono">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-marigold tracking-wider text-sm flex items-center gap-1.5 hover:opacity-90">
            <span>⌂</span> academic.tsx
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-neutral-400">
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
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 text-neutral-300 font-mono text-xs">
              <span className="text-marigold font-semibold">👤 {user.name}</span>
              <span className="text-neutral-700">|</span>
              <form action="/api/auth/logout" method="POST" className="inline">
                <button type="submit" className="text-neutral-400 hover:text-vermillion transition-colors underline">
                  logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 border border-marigold/50 text-marigold hover:bg-marigold hover:text-black rounded transition-all font-mono text-xs"
            >
              login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
