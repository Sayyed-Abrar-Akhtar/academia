import React from "react";
import Link from "next/link";
import { BubbleFill } from "@/components/BubbleFill";

// Page component to serve / (landing page)
export default function LandingPage() {
  // Setup a fixed mock Date BS-style placeholder
  const nepaliDatePlaceholder = "Shrawan 28, 2083 BS";

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] selection:bg-marigold selection:text-black">
      {/* Top Header/Navigation */}
      <header className="border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-marigold tracking-wider text-sm flex items-center gap-1.5 hover:opacity-90">
              <span>⌂</span> academic.tsx
            </Link>
            <nav className="hidden sm:flex items-center gap-5 text-neutral-400">
              <Link href="/exams/mecee-bl" className="hover:text-marigold transition-colors">
                📂 exams/mecee-bl
              </Link>
              <span className="text-neutral-700">|</span>
              <Link href="/dashboard" className="hover:text-marigold transition-colors">
                📊 dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-sal-green animate-pulse" />
            <span className="text-neutral-400 font-mono hidden xs:inline">1,204 active now</span>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-grow flex flex-col justify-center max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Eyebrow Status */}
        <div className="flex flex-wrap justify-between items-center border-b border-neutral-800 pb-3 mb-8 text-xs font-mono text-neutral-400">
          <span className="tracking-wider">ROLL_NO: —</span>
          <span className="text-right text-neutral-500">{nepaliDatePlaceholder}</span>
        </div>

        {/* Hero Headline Section */}
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

        {/* Bubble Syllabus Coverage Stat Widget */}
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

        {/* CTA Terminal styled command buttons */}
        <div className="mt-12 flex flex-wrap gap-4 font-mono text-sm">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-marigold text-black font-semibold rounded hover:bg-opacity-95 transition-all shadow-md focus:ring-2 focus:ring-marigold flex items-center gap-2"
          >
            <span className="opacity-60">$</span> start-mock-test
          </Link>
          <Link
            href="/exams/mecee-bl"
            className="px-6 py-3.5 border border-neutral-800 bg-surface text-neutral-300 rounded hover:bg-neutral-900 transition-all focus:ring-2 focus:ring-neutral-700 flex items-center gap-2"
          >
            <span className="text-marigold">&gt;</span> browse exams
          </Link>
        </div>

        {/* Nepal Specific Funnel Indicator */}
        <div className="mt-16 pt-8 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <span>CURRICULUM: NEB GRADE 11–12 + MECEE SYLLABUS</span>
          <span>NEPAL EXAM PORTAL v1.0.0</span>
        </div>
      </main>

      {/* Sticky Bottom Bar / Footer */}
      <footer className="border-t border-neutral-800 py-6 bg-neutral-950/60 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Built for Nepali Medical aspirants.</p>
      </footer>
    </div>
  );
}
