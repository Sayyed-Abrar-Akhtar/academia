import React from "react";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import { getCurrentUser } from "@/db/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set("session_token", "demo-user-id", {
    path: "/",
    maxAge: 14 * 24 * 60 * 60, // 14 days (1 fortnight)
  });
  redirect("/dashboard");
}

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <HeaderNav user={user} />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 border border-neutral-800 bg-surface rounded-lg space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-marigold font-mono uppercase tracking-wider">
              Student Login
            </h1>
            <p className="text-xs text-neutral-400 font-sans">
              Enter your mobile number to access your MECEE-BL preparation dashboard.
            </p>
          </div>

          <form action={loginAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="mobile" className="block text-xs font-mono text-neutral-400 uppercase">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="98XXXXXXXX"
                defaultValue="9800000000"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-[#EDEDED] focus:outline-none focus:border-marigold font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-marigold text-black font-semibold rounded text-xs font-mono hover:bg-opacity-95 transition-all"
            >
              Log In
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs font-mono text-neutral-500 hover:text-neutral-400 underline">
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
