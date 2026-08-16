"use client";

import React, { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/request-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to send magic link. Please try again.");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-4 text-center animate-fadeIn">
        <div className="p-4 border border-sal-green/30 bg-sal-green/10 rounded-lg text-left space-y-2">
          <div className="flex items-center gap-2 text-sal-green font-mono text-xs font-bold uppercase">
            <span>✓</span> Check your email
          </div>
          <p className="text-xs text-neutral-300 font-sans leading-relaxed">
            We sent a magic link to <strong className="font-mono text-marigold">{email}</strong>.
            Click the link in your email to log in — it will expire in 20 minutes.
          </p>
        </div>

        <button
          onClick={() => {
            setStatus("idle");
            setErrorMessage("");
          }}
          className="text-xs font-mono text-neutral-400 hover:text-marigold underline transition-colors cursor-pointer"
        >
          Use a different email or try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-xs uppercase text-neutral-400 mb-1 font-mono">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@example.com"
          disabled={status === "loading"}
          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-[#EDEDED] focus:outline-none focus:border-marigold font-mono placeholder:text-neutral-600 disabled:opacity-50"
        />
      </div>

      {status === "error" && (
        <div className="p-3 border border-vermillion/40 bg-vermillion/10 rounded text-xs text-vermillion font-mono">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="block w-full py-2.5 bg-marigold text-black font-semibold rounded text-xs text-center hover:bg-opacity-95 transition-all uppercase font-mono cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Sending link..." : "Send Magic Link"}
      </button>

      <p className="text-[11px] text-neutral-500 font-mono text-center">
        No password needed. We&apos;ll send a secure login link to your inbox.
      </p>
    </form>
  );
}
