import React from "react";
import Link from "next/link";
import { Header, getSessionUser } from "@/components/Header";
import { getUserSubscription } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getSessionUser();
  const subscription = user ? await getUserSubscription(user.id) : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <Header user={user} />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-marigold text-xs font-mono font-semibold mb-3">
            AFFORDABLE PREP FOR NEPAL
          </div>
          <h1 className="text-3xl font-extrabold font-mono text-neutral-100 mb-4">
            Invest in Your Academic Success
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Upgrade to Academia Pro to unlock unlimited practice questions, full mock tests with percentile predictions, and complete access to the library & research toolkit.
          </p>
        </div>

        {subscription?.isPro && (
          <div className="max-w-2xl mx-auto mb-10 bg-emerald-950/60 border border-emerald-800/60 rounded-lg p-4 font-mono text-xs text-emerald-300 flex items-center justify-between">
            <div>
              <span className="font-bold">ACTIVE SUBSCRIPTION:</span>{" "}
              <span className="uppercase text-emerald-200">{subscription.tier.replace("_", " ")}</span>
            </div>
            {subscription.expiresAt && (
              <div>Expires: {new Date(subscription.expiresAt).toLocaleDateString()}</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Basic Pro Tier */}
          <div className="bg-[#121212] border border-neutral-800 hover:border-neutral-700 rounded-xl p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-mono text-neutral-100">Basic Pro</h2>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-neutral-800 text-neutral-300">
                  ENTRANCE FOCUS
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">
                Essential unlimited practice for MECEE-BL, IOE, and NEB aspirants.
              </p>

              <div className="mb-6 pb-6 border-b border-neutral-800">
                <span className="text-3xl font-extrabold font-mono text-marigold">NPR 599</span>
                <span className="text-neutral-400 text-xs font-mono"> / year</span>
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">Or NPR 79 / month</p>
              </div>

              <ul className="space-y-3 text-xs text-neutral-300 font-mono mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Unlimited practice questions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Topic-wise mastery heatmap & speed reports
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Spaced repetition (SM-2) wrong-answer review
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Full Library access (Notes & Videos)
                </li>
                <li className="flex items-center gap-2 text-neutral-500">
                  <span>✕</span> Full-length mock tests & rank prediction
                </li>
                <li className="flex items-center gap-2 text-neutral-500">
                  <span>✕</span> Thesis & research toolkit
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <form action="/api/payments/esewa" method="POST">
                <input type="hidden" name="tier" value="basic_pro" />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Pay with eSewa (NPR 599)
                </button>
              </form>
              <form action="/api/payments/khalti" method="POST">
                <input type="hidden" name="tier" value="basic_pro" />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded bg-purple-700 hover:bg-purple-600 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Pay with Khalti (NPR 599)
                </button>
              </form>
            </div>
          </div>

          {/* Full Pro Tier */}
          <div className="bg-[#121212] border-2 border-marigold/80 rounded-xl p-8 flex flex-col justify-between relative">
            <div className="absolute -top-3 right-6 bg-marigold text-black font-mono text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              MOST POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold font-mono text-marigold">Full Pro</h2>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                  COMPLETE SUITE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">
                Complete platform access including thesis toolkit and rank predictions.
              </p>

              <div className="mb-6 pb-6 border-b border-neutral-800">
                <span className="text-3xl font-extrabold font-mono text-marigold">NPR 1,299</span>
                <span className="text-neutral-400 text-xs font-mono"> / year</span>
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">Or NPR 149 / month</p>
              </div>

              <ul className="space-y-3 text-xs text-neutral-300 font-mono mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Everything in Basic Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Unlimited full-length timed mock tests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Peer rank & percentile prediction engine
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Full Thesis & Research Methodology Toolkit
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Dedicated weak-topic video recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Priority support & scholarship deadline alerts
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <form action="/api/payments/esewa" method="POST">
                <input type="hidden" name="tier" value="full_pro" />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Pay with eSewa (NPR 1,299)
                </button>
              </form>
              <form action="/api/payments/khalti" method="POST">
                <input type="hidden" name="tier" value="full_pro" />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded bg-purple-700 hover:bg-purple-600 text-white font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Pay with Khalti (NPR 1,299)
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-6 max-w-2xl mx-auto text-xs font-mono text-neutral-400">
          <h3 className="text-sm font-bold text-neutral-200 mb-2 font-mono">
            💡 Local Nepali Payment Gateways Supported
          </h3>
          <p className="leading-relaxed">
            We support instant online activation via eSewa digital wallet and Khalti SDK. Transactions are processed securely in NPR with HMAC signature verification.
          </p>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Pricing System.</p>
      </footer>
    </div>
  );
}
