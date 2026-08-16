import React from "react";
import Link from "next/link";
import { db, ensureDbSeeded } from "@/db";
import { topics, questions, questionOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { QuizClient } from "../QuizClient";
import { Header, getSessionUser } from "@/components/Header";

export const dynamic = "force-dynamic";

interface QuizPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  await ensureDbSeeded();

  const user = await getSessionUser();
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

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED]">
      <Header user={user} />

      <main className="flex-grow flex flex-col justify-center py-12">
        <QuizClient
          topicId={topicId}
          topicName={topicRecord.name}
          questions={questionsWithOptions}
        />
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
