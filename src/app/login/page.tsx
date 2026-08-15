"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithMobileAction } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"password" | "whatsapp_otp">("password");
  const [mobileNumber, setMobileNumber] = useState("+977-9801234567");
  const [password, setPassword] = useState("demo1234");
  const [otpCode, setOtpCode] = useState("123456");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendOtp = () => {
    if (!mobileNumber) {
      setErrorMessage("Please enter a valid mobile number.");
      return;
    }
    setOtpSent(true);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("mobileNumber", mobileNumber);
      formData.append("loginType", loginType);
      formData.append("password", password);
      formData.append("otpCode", otpCode);

      const res = await loginWithMobileAction(formData);

      if (!res.success) {
        setErrorMessage(res.error || "Login failed. Please check your credentials.");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <header className="border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center text-xs font-mono">
          <Link href="/" className="font-bold text-marigold tracking-wider text-sm flex items-center gap-1.5 hover:opacity-90">
            <span>⌂</span> academic.tsx
          </Link>
          <Link href="/" className="text-neutral-400 hover:text-marigold transition-colors">
            return home
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center max-w-md w-full mx-auto px-4 py-12">
        <div className="w-full p-6 sm:p-8 bg-surface border border-neutral-800 rounded-lg shadow-xl space-y-6">
          <div className="space-y-2 text-center font-mono">
            <span className="text-[10px] text-marigold uppercase tracking-widest border border-marigold/30 px-2.5 py-0.5 rounded bg-marigold/10 inline-block">
              14-Day (1 Fortnight) Active Session
            </span>
            <h1 className="text-2xl font-bold text-[#EDEDED]">Student Login</h1>
            <p className="text-xs text-neutral-400 font-sans">
              Enter your mobile number to sign in or register automatically.
            </p>
          </div>

          {/* Login Type Selector */}
          <div className="grid grid-cols-2 p-1 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-xs text-center">
            <button
              type="button"
              onClick={() => {
                setLoginType("password");
                setErrorMessage("");
              }}
              className={`py-2 rounded transition-all ${
                loginType === "password"
                  ? "bg-marigold text-black font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType("whatsapp_otp");
                setErrorMessage("");
              }}
              className={`py-2 rounded transition-all ${
                loginType === "whatsapp_otp"
                  ? "bg-marigold text-black font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              WhatsApp OTP
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded bg-vermillion/10 border border-vermillion/30 text-vermillion text-xs font-mono text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm font-sans">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+977-98XXXXXXXX"
                className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-[#EDEDED] font-mono text-sm focus:border-marigold focus:outline-none"
              />
            </div>

            {loginType === "password" ? (
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-[#EDEDED] font-mono text-sm focus:border-marigold focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full py-2.5 bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-xs rounded hover:bg-neutral-700 transition-all"
                  >
                    Send OTP via WhatsApp 📲
                  </button>
                ) : (
                  <div>
                    <div className="p-2.5 mb-2 bg-sal-green/10 border border-sal-green/20 rounded text-[11px] font-mono text-sal-green">
                      WhatsApp OTP sent! Demo code: <strong>123456</strong>
                    </div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-wider">
                      Enter WhatsApp OTP Code
                    </label>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-[#EDEDED] font-mono text-sm focus:border-marigold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-marigold text-black font-semibold font-mono text-xs rounded hover:bg-opacity-95 transition-all focus:ring-2 focus:ring-marigold"
            >
              {submitting ? "Signing in..." : "Sign In (Keep Active 1 Fortnight)"}
            </button>
          </form>

          <div className="pt-2 text-center font-mono text-[11px] text-neutral-500 border-t border-neutral-800/80">
            Sessions remain active for 14 days (1 fortnight) across mobile and web.
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
