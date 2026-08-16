import React from "react";
import { Header, getSessionUser } from "@/components/Header";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <Header user={user} />

      <main className="flex-grow flex items-center justify-center max-w-md w-full mx-auto px-4 py-12">
        <div className="w-full p-6 border border-neutral-800 bg-surface rounded-lg space-y-6 font-mono">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-marigold uppercase tracking-wider">
              Student Login
            </h1>
            <p className="text-xs text-neutral-400 font-sans">
              Enter your MECEE Roll Number or email address to access your dashboard.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-neutral-400 mb-1">
                Email / Roll Number
              </label>
              <input
                type="text"
                placeholder="MECEE-2083-0447"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-[#EDEDED] focus:outline-none focus:border-marigold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-neutral-400 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-[#EDEDED] focus:outline-none focus:border-marigold font-mono"
              />
            </div>

            <a
              href="/dashboard"
              className="block w-full py-2.5 bg-marigold text-black font-semibold rounded text-xs text-center hover:bg-opacity-95 transition-all uppercase"
            >
              Sign In
            </a>
          </form>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600 mt-auto">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
