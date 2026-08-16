import React from "react";
import Link from "next/link";
import { db, ensureDbSeeded } from "@/db";
import { users, attempts, exams, subjects, topics, questions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AdmitCard } from "@/components/AdmitCard";
import { BubbleFill } from "@/components/BubbleFill";
import { HeaderNav } from "@/components/HeaderNav";
import { getCurrentUser } from "@/db/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureDbSeeded();

  const user = await getCurrentUser();
  const demoUserId = user?.id || "demo-user-id";
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, demoUserId),
  });

  if (!userRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0A0A0A] font-mono">
        <h1 className="text-xl text-vermillion font-bold mb-4">Demo User Not Found</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          Please run the database seed script to insert the default demo user before accessing the dashboard.
        </p>
        <Link href="/" className="text-marigold underline hover:text-opacity-80">
          Return Home
        </Link>
      </div>
    );
  }

  // Fetch MECEE-BL exam
  const meceeExam = await db.query.exams.findFirst({
    where: eq(exams.slug, "mecee-bl"),
  });

  const meceeSubjects = meceeExam
    ? await db.query.subjects.findMany({
        where: eq(subjects.examId, meceeExam.id),
      })
    : [];

  // Query all user attempts joined with questions and topics
  const userAttemptsWithDetails = await db
    .select({
      attemptId: attempts.id,
      isCorrect: attempts.isCorrect,
      topicId: questions.topicId,
      subjectId: topics.subjectId,
      createdAt: attempts.createdAt,
    })
    .from(attempts)
    .innerJoin(questions, eq(attempts.questionId, questions.id))
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .where(eq(attempts.userId, demoUserId))
    .orderBy(desc(attempts.createdAt));

  // Determine last active topic for "resume quiz" button
  const lastActiveAttempt = userAttemptsWithDetails[0];
  const resumeQuizHref = lastActiveAttempt?.topicId
    ? `/quiz/${lastActiveAttempt.topicId}`
    : "/exams/mecee-bl";

  // Compute overall stats for AdmitCard
  const totalAttemptsCount = userAttemptsWithDetails.length;
  const correctAttemptsCount = userAttemptsWithDetails.filter((a) => a.isCorrect).length;
  const overallMasteryPercentage =
    totalAttemptsCount > 0
      ? Math.round((correctAttemptsCount / totalAttemptsCount) * 100)
      : 0;

  // Compute mastery per subject
  const subjectStats = meceeSubjects.map((sub) => {
    const subAttempts = userAttemptsWithDetails.filter((a) => a.subjectId === sub.id);
    const total = subAttempts.length;
    const correct = subAttempts.filter((a) => a.isCorrect).length;
    const mastery = total > 0 ? Math.round((correct / total) * 100) : null;

    return {
      subject: sub,
      total,
      correct,
      mastery,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <HeaderNav user={userRecord} />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-12 space-y-12">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start">
          <div className="space-y-4 max-w-lg">
            <div className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              📊 dashboard / overview
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#EDEDED]">
              Namaste, <span className="text-marigold font-semibold">{userRecord.name}</span>
            </h1>
            <p className="text-neutral-400 leading-relaxed font-sans text-sm">
              Track your daily progress and accuracy. Your dashboard integrates directly with Nepal&apos;s physical admit card format to showcase your active mock stats, strengths, and priority focus topics.
            </p>

            <div className="pt-2">
              <Link
                href={resumeQuizHref}
                className="inline-block px-5 py-3 bg-marigold text-black font-semibold font-mono text-xs rounded hover:bg-opacity-95 transition-all"
              >
                resume quiz
              </Link>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <AdmitCard
              name={userRecord.name}
              rollNo={userRecord.rollNumber}
              exam="MECEE-BL"
              focus="Biology · Genetics"
              masteryPercentage={overallMasteryPercentage}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-800">
          <div className="font-mono text-xs text-neutral-500 mb-6 pb-2 border-b border-neutral-800 uppercase tracking-widest">
            02subjects / mastery-matrix
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {subjectStats.map(({ subject, total, correct, mastery }) => (
              <div
                key={subject.id}
                className={`p-5 border border-neutral-800 bg-surface rounded-lg space-y-3 ${
                  mastery === null ? "opacity-70" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#EDEDED]">{subject.name}</span>
                  <span
                    className={`text-xs font-mono ${
                      mastery === null
                        ? "text-neutral-500"
                        : mastery >= 50
                        ? "text-sal-green"
                        : "text-vermillion"
                    }`}
                  >
                    {mastery !== null ? `${mastery}%` : "Not started"}
                  </span>
                </div>
                <BubbleFill type="display" percentage={mastery ?? 0} totalBubbles={10} />
                <span className="block text-[10px] font-mono text-neutral-500 uppercase">
                  {correct} / {total} Qs Correct
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-xs text-neutral-500 mb-4 pb-2 border-b border-neutral-800 uppercase tracking-widest">
            03recommended/
          </div>

          <div className="p-4 border border-neutral-800/80 bg-surface/40 rounded-lg space-y-3.5 max-w-2xl font-mono text-xs text-neutral-400">
            <div className="flex items-center gap-2.5">
              <span className="text-marigold">▸</span>
              <span>
                Genetics — <span className="text-vermillion">weak topic</span>, 8 questions pending
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-marigold">▸</span>
              <span>
                ▶ YouTube: <span className="underline cursor-pointer">Mendelian inheritance playlist</span>
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
