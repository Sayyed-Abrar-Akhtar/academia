import React from "react";
import Link from "next/link";
import { BubbleFill } from "@/components/BubbleFill";
import { HeaderNav } from "@/components/HeaderNav";
import { getCurrentUser } from "@/db/session";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const nepaliDatePlaceholder = "Shrawan 28, 2083 BS";
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] selection:bg-marigold selection:text-black">
      <HeaderNav user={user} />

      <main className="flex-grow flex flex-col justify-center max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex flex-wrap justify-between items-center border-b border-neutral-800 pb-3 mb-8 text-xs font-mono text-neutral-400">
          <span className="tracking-wider">ROLL_NO: —</span>
          <span className="text-right text-neutral-500">{nepaliDatePlaceholder}</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#EDEDED] font-sans">
            Prepare for <span className="text-marigold">MECEE-BL</span>.
            <br />
            <span className="text-neutral-400 font-light">Question by question.</span>
          </h1>

          <p className="max-w-xl text-base text-neutral-400 font-sans leading-relaxed">
            The foundation for Nepal&apos;s medical entrance exams. Master high-yield questions, tracking accuracy and topic progress in real time with our customized OMR bubble simulator.
          </p>
        </div>

        <div className="mt-10 p-5 rounded-lg border border-neutral-800 bg-surface max-w-md">
          <div className="flex justify-between items-center mb-2 font-mono text-xs text-neutral-400">
            <span>SYLLABUS PROGRESS</span>
            <span className="text-marigold font-bold">62% covered</span>
          </div>
          <BubbleFill type="display" percentage={62} totalBubbles={10} />
          <p className="mt-3 text-xs text-neutral-500 font-sans leading-relaxed">
            Placeholder statistics representing current syllabus targets in general biology, genetics, physiology, and botany.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4 font-mono text-sm">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-marigold text-black font-semibold rounded hover:bg-opacity-95 transition-all shadow-md focus:ring-2 focus:ring-marigold flex items-center gap-2"
          >
            start mock test
          </Link>
          <Link
            href="/exams/mecee-bl"
            className="px-6 py-3.5 border border-neutral-800 bg-surface text-neutral-300 rounded hover:bg-neutral-900 transition-all focus:ring-2 focus:ring-neutral-700 flex items-center gap-2"
          >
            browse exams
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <span>CURRICULUM: NEB GRADE 11–12 + MECEE SYLLABUS</span>
          <span>NEPAL EXAM PORTAL v1.0.0</span>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 bg-neutral-950/60 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Built for Nepali Medical aspirants.</p>
      </footer>
    </div>
  );
}
