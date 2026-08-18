import React from "react";
import Link from "next/link";
import { BubbleFill } from "@/components/BubbleFill";
import { Header, getSessionUser } from "@/components/Header";

export default async function LandingPage() {
  const nepaliDatePlaceholder = "Shrawan 28, 2083 BS";
  const user = await getSessionUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] selection:bg-marigold selection:text-black">
      <Header user={user} />

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 sm:py-20 w-full">
        {/* Top Header Bar */}
        <div className="flex flex-wrap justify-between items-center border-b border-neutral-800 pb-3 mb-10 text-xs font-mono text-neutral-400">
          <span className="tracking-wider">ACADEMIA HUB · NEPAL</span>
          <span className="text-right text-neutral-500">{nepaliDatePlaceholder}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-6 mb-12">
          <div className="inline-block px-2.5 py-1 rounded bg-neutral-800 text-marigold text-xs font-mono font-semibold tracking-wide border border-neutral-700">
            📚 ACADEMIC RESOURCE & EXAM PREP LIBRARY
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#EDEDED] font-sans leading-tight">
            The Academic Hub for <br />
            <span className="text-marigold">Nepali Students</span>.
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-neutral-400 font-sans leading-relaxed">
            Your single digital library for board exam notes, entrance exam prep (MECEE-BL, IOE, CMAT), past papers, video explainers, and research thesis toolkits.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap gap-4 font-mono text-sm mb-16">
          <Link
            href="/library"
            className="px-6 py-3.5 bg-marigold text-black font-semibold rounded hover:bg-opacity-95 transition-all shadow-md focus:ring-2 focus:ring-marigold flex items-center gap-2"
          >
            📚 Explore Library Shelves
          </Link>
          <Link
            href="/exams/mecee-bl"
            className="px-6 py-3.5 border border-neutral-800 bg-surface text-neutral-300 rounded hover:bg-neutral-900 transition-all focus:ring-2 focus:ring-neutral-700 flex items-center gap-2"
          >
            🎯 Entrance Practice & Quizzes
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3.5 border border-neutral-800 bg-neutral-900 text-neutral-400 rounded hover:bg-neutral-800 transition-all focus:ring-2 focus:ring-neutral-700 flex items-center gap-2"
          >
            📊 Student Dashboard
          </Link>
        </div>

        {/* Library Shelves Feature Grid */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6 font-mono text-xs text-neutral-400 uppercase tracking-widest">
            <span className="text-marigold">01/</span> Core Academic Shelves
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg border border-neutral-800 bg-[#121212] hover:border-neutral-700 transition-all">
              <div className="text-2xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-neutral-100 mb-2 font-mono">NEB +2 Science Notes & Guides</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Comprehensive Grade 11 & 12 revision notes and model question answers targeting high-volume board exam syllabus topics.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-neutral-800 bg-[#121212] hover:border-neutral-700 transition-all">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-neutral-100 mb-2 font-mono">Entrance Exam Prep Suite</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Adaptive practice engines for MECEE-BL (Medical), IOE (Engineering), and CMAT/CSIT with real-time OMR bubble analytics and mastery tracking.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-neutral-800 bg-[#121212] hover:border-neutral-700 transition-all">
              <div className="text-2xl mb-3">🎥</div>
              <h3 className="text-lg font-bold text-neutral-100 mb-2 font-mono">Curated Video Library</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Topic-by-topic YouTube video explainers automatically linked to weak syllabus topics to bridge knowledge gaps instantly.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-neutral-800 bg-[#121212] hover:border-neutral-700 transition-all">
              <div className="text-2xl mb-3">🎓</div>
              <h3 className="text-lg font-bold text-neutral-100 mb-2 font-mono">Thesis & Research Toolkit</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Methodology templates, citation guidelines, and proposal writing frameworks to support academic research and thesis writing.
              </p>
            </div>
          </div>
        </div>

        {/* Live Mastery Simulator Widget */}
        <div className="p-6 rounded-lg border border-neutral-800 bg-surface mb-16">
          <div className="flex flex-wrap justify-between items-center mb-3 font-mono text-xs text-neutral-400">
            <span className="text-marigold font-bold uppercase">SYLLABUS MASTERY ENGINE</span>
            <span>62% COVERED</span>
          </div>
          <BubbleFill type="display" percentage={62} totalBubbles={10} />
          <p className="mt-4 text-xs text-neutral-500 font-sans leading-relaxed">
            Real-time mastery tracking across Biology, Chemistry, Physics, and Mathematics with space-repetition topic resurfacing.
          </p>
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <span>CURRICULUM: NEB GRADE 11–12 · MECEE-BL · IOE · CMAT</span>
          <span>NEPAL ACADEMIA PORTAL v1.0.0</span>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 bg-neutral-950/60 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Comprehensive academic resource library for Nepali students.</p>
      </footer>
    </div>
  );
}
