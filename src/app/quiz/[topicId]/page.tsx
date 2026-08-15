import React from "react";
import Link from "next/link";
import { db, ensureDbSeeded } from "@/db";
import { topics, questions, questionOptions, concepts, attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuizClient } from "../QuizClient";

export const dynamic = "force-dynamic";

interface QuizPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  await ensureDbSeeded();

  const resolvedParams = await params;
  const topicId = resolvedParams.topicId;

  const topicRecord = await db.query.topics.findFirst({
    where: eq(topics.id, topicId),
  });

  if (!topicRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0A0A0A] font-mono">
        <h1 className="text-xl text-vermillion font-bold mb-4">Topic Not Found</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          The requested topic does not exist in the database. Please verify the URL or seed the database.
        </p>
        <Link href="/exams/mecee-bl" className="text-marigold underline hover:text-opacity-80">
          Back to Exams
        </Link>
      </div>
    );
  }

  const questionsRecord = await db.query.questions.findMany({
    where: eq(questions.topicId, topicId),
  });

  const questionsWithOptions = await Promise.all(
    questionsRecord.map(async (q) => {
      const optionsRecord = await db.query.questionOptions.findMany({
        where: eq(questionOptions.questionId, q.id),
      });

      return {
        id: q.id,
        body: q.body,
        difficulty: q.difficulty,
        explanation: q.explanation,
        options: optionsRecord.map((o) => ({
          id: o.id,
          label: o.label,
          body: o.body,
        })),
      };
    })
  );

  // Fetch concept summary for this topic
  const conceptRecord = await db.query.concepts.findFirst({
    where: eq(concepts.topicId, topicId),
  });

  // Fetch failed attempts count for demo user
  const demoUserId = "demo-user-id";
  const topicQuestionIds = questionsRecord.map((q) => q.id);
  const userAttempts = await db.query.attempts.findMany({
    where: eq(attempts.userId, demoUserId),
  });
  const failedAttempts = userAttempts.filter(
    (att) => topicQuestionIds.includes(att.questionId) && !att.isCorrect
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED]">
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
            <Link href="/dashboard" className="hover:text-marigold transition-colors">
              dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center py-12">
        <QuizClient
          topicId={topicId}
          topicName={topicRecord.name}
          questions={questionsWithOptions}
          initialConcept={conceptRecord}
          initialFailedAttempts={failedAttempts}
        />
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
