import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { attempts, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdmitCard } from "@/components/AdmitCard";
import { BubbleFill } from "@/components/BubbleFill";
import { getCurrentUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, session } = await getCurrentUserSession();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0A0A0A] font-mono">
        <h1 className="text-xl text-vermillion font-bold mb-4">User Session Not Found</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          Please log in with your mobile number to access your student dashboard.
        </p>
        <Link href="/login" className="px-5 py-2.5 bg-marigold text-black font-semibold rounded text-xs">
          Go to Login
        </Link>
      </div>
    );
  }

  // Calculate overall user attempts & accuracy
  const userAttempts = await db.query.attempts.findMany({
    where: eq(attempts.userId, user.id),
  });

  const totalAttempts = userAttempts.length;
  const correctAttempts = userAttempts.filter((a) => a.isCorrect).length;
  const masteryPercentage = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : 0;

  // Calculate days remaining in 14-day (1 fortnight) session
  let sessionDaysLeft = 14;
  if (session?.expiresAt) {
    // eslint-disable-next-line react-hooks/purity
    const msLeft = new Date(session.expiresAt).getTime() - Date.now();
    sessionDaysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  // Retrieve all subjects & topics to build subject-wise matrix
  const allSubjects = await db.query.subjects.findMany();
  const allTopics = await db.query.topics.findMany();
  const allConcepts = await db.query.concepts.findMany();

  // Find unlocked concept guides for this user (where failed attempts >= required)
  const unlockedConceptsList: { conceptTitle: string; conceptSummary: string; topicName: string; failedCount: number }[] = [];

  for (const topicRecord of allTopics) {
    const topicQuestions = await db.query.questions.findMany({
      where: eq(questions.topicId, topicRecord.id),
    });
    const topicQuestionIds = topicQuestions.map((q) => q.id);

    if (topicQuestionIds.length === 0) continue;

    const topicFailedAttempts = userAttempts.filter(
      (att) => topicQuestionIds.includes(att.questionId) && !att.isCorrect
    ).length;

    const matchingConcept = allConcepts.find((c) => c.topicId === topicRecord.id);
    if (matchingConcept && topicFailedAttempts >= (matchingConcept.requiredFailedAttempts || 5)) {
      unlockedConceptsList.push({
        conceptTitle: matchingConcept.title,
        conceptSummary: matchingConcept.summary,
        topicName: topicRecord.name,
        failedCount: topicFailedAttempts,
      });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <header className="border-b border-neutral-800 bg-[#0A0A0A]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center text-xs font-mono">
          <Link href="/" className="font-bold text-marigold tracking-wider text-sm flex items-center gap-1.5 hover:opacity-90">
            <span>⌂</span> academic.tsx
          </Link>
          <div className="flex items-center gap-5 text-neutral-400">
            <Link href="/" className="hover:text-marigold transition-colors">
              home
            </Link>
            <span className="text-neutral-700">|</span>
            <Link href="/exams/mecee-bl" className="hover:text-marigold transition-colors">
              exams
            </Link>
            <span className="text-neutral-700">|</span>
            <Link href="/login" className="text-marigold font-semibold hover:opacity-80">
              {user.mobileNumber || "login"}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-12 space-y-12">
        {/* Welcome and AdmitCard Header widget */}
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-neutral-500 uppercase tracking-widest">📊 dashboard / overview</span>
              <span className="bg-sal-green/10 text-sal-green border border-sal-green/30 text-[10px] px-2 py-0.5 rounded">
                Active Session ({sessionDaysLeft}d remaining)
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#EDEDED]">
              Namaste, <span className="text-marigold font-semibold">{user.name}</span>
            </h1>

            <p className="text-neutral-400 leading-relaxed font-sans text-sm">
              Mobile Account: <span className="text-neutral-200 font-mono">{user.mobileNumber || user.email}</span>. Your active session remains signed in for 1 fortnight.
            </p>

            <div className="pt-2 flex gap-3 font-mono text-xs">
              <Link
                href="/exams/mecee-bl"
                className="px-5 py-3 bg-marigold text-black font-semibold rounded hover:bg-opacity-95 transition-all"
              >
                resume quiz
              </Link>
              <Link
                href="/login"
                className="px-4 py-3 border border-neutral-800 bg-surface text-neutral-300 rounded hover:bg-neutral-900 transition-all"
              >
                switch account
              </Link>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <AdmitCard
              name={user.name}
              rollNo={user.rollNumber}
              exam="MECEE-BL"
              focus="Biology · Genetics"
              masteryPercentage={masteryPercentage}
            />
          </div>
        </div>

        {/* Unlocked Concepts & Summaries Section */}
        <div className="pt-6 border-t border-neutral-800 space-y-4">
          <div className="flex justify-between items-center font-mono text-xs">
            <span className="text-neutral-500 uppercase tracking-widest">
              💡 Unlocked Concept Summaries (5+ incorrect attempts)
            </span>
            <span className="text-marigold">{unlockedConceptsList.length} unlocked</span>
          </div>

          {unlockedConceptsList.length === 0 ? (
            <div className="p-4 border border-neutral-800 bg-surface/30 rounded-lg font-mono text-xs text-neutral-500">
              No concept guides unlocked yet. Concept guides unlock automatically after 5 incorrect attempts on any topic to help you master challenging subjects.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {unlockedConceptsList.map((c, i) => (
                <div key={i} className="p-5 border border-marigold/30 bg-marigold/5 rounded-lg space-y-2.5 font-sans">
                  <div className="flex justify-between items-center font-mono text-[10px] text-marigold uppercase">
                    <span>{c.topicName}</span>
                    <span>{c.failedCount} Failed Attempts</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#EDEDED] font-mono">{c.conceptTitle}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-line">
                    {c.conceptSummary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects list */}
        <div className="pt-6 border-t border-neutral-800">
          <div className="font-mono text-xs text-neutral-500 mb-6 pb-2 border-b border-neutral-800 uppercase tracking-widest">
            02subjects / mastery-matrix
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {allSubjects.map((sub) => (
              <div key={sub.id} className="p-5 border border-neutral-800 bg-surface rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#EDEDED]">{sub.name}</span>
                  <span className="text-xs font-mono text-sal-green">
                    {sub.slug === "biology" ? `${masteryPercentage}%` : "0%"}
                  </span>
                </div>
                <BubbleFill
                  type="display"
                  percentage={sub.slug === "biology" ? masteryPercentage : 0}
                  totalBubbles={10}
                />
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">
                  WEIGHT: {sub.weightMarks} MARKS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended syllabus guidelines */}
        <div>
          <div className="font-mono text-xs text-neutral-500 mb-4 pb-2 border-b border-neutral-800 uppercase tracking-widest">
            03recommended/
          </div>

          <div className="p-4 border border-neutral-800/80 bg-surface/40 rounded-lg space-y-3.5 max-w-2xl font-mono text-xs text-neutral-400">
            <div className="flex items-center gap-2.5">
              <span className="text-marigold">▸</span>
              <span>
                Genetics — <span className="text-vermillion font-bold">weak topic</span>, practice available questions
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-marigold">▸</span>
              <span>
                ▶ Organic Chemistry — functional groups and mechanisms
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
