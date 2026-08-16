import React from "react";
import Link from "next/link";
import { db, ensureDbSeeded } from "@/db";
import { exams, subjects, topics, attempts, questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BubbleFill } from "@/components/BubbleFill";
import { HeaderNav } from "@/components/HeaderNav";
import { getCurrentUser } from "@/db/session";

export const dynamic = "force-dynamic";

export default async function ExamsMeceeBlPage() {
  await ensureDbSeeded();

  const user = await getCurrentUser();
  const demoUserId = user?.id || "demo-user-id";
  const meceeExam = await db.query.exams.findFirst({
    where: eq(exams.slug, "mecee-bl"),
  });

  if (!meceeExam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-[#0A0A0A] font-mono">
        <h1 className="text-xl text-vermillion font-bold mb-4">Exam Record Not Found</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          Please run the database seed script to insert exam metadata, subjects, topics, and questions before accessing this page.
        </p>
        <Link href="/" className="text-marigold underline hover:text-opacity-80">
          Return Home
        </Link>
      </div>
    );
  }

  const meceeSubjects = await db.query.subjects.findMany({
    where: eq(subjects.examId, meceeExam.id),
  });

  const meceeTopics = await db.query.topics.findMany();

  // Query user attempts joined with questions and topics
  const userAttemptsWithDetails = await db
    .select({
      attemptId: attempts.id,
      isCorrect: attempts.isCorrect,
      topicId: questions.topicId,
      subjectId: topics.subjectId,
    })
    .from(attempts)
    .innerJoin(questions, eq(attempts.questionId, questions.id))
    .innerJoin(topics, eq(questions.topicId, topics.id))
    .where(eq(attempts.userId, demoUserId));

  // Compute stats per subject
  const subjectStats = meceeSubjects.map((sub) => {
    const subAttempts = userAttemptsWithDetails.filter((a) => a.subjectId === sub.id);
    const total = subAttempts.length;
    const correct = subAttempts.filter((a) => a.isCorrect).length;
    const mastery = total > 0 ? Math.round((correct / total) * 100) : null;
    const subTopics = meceeTopics.filter((t) => t.subjectId === sub.id);

    return {
      subject: sub,
      total,
      correct,
      mastery,
      topics: subTopics,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <HeaderNav user={user} />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <div className="mb-10 font-mono">
          <div className="text-xs text-neutral-500 mb-1.5 uppercase tracking-widest">
            📂 exams / mecee-bl
          </div>
          <h1 className="text-3xl font-bold text-marigold tracking-tight uppercase">
            {meceeExam.name} Entrance Prep
          </h1>
          <p className="text-sm text-neutral-400 mt-2 font-sans max-w-xl">
            Choose a subject or topic below to start testing your knowledge. Each topic provides standard past papers and expert-curated practice questions.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <div className="font-mono text-xs text-neutral-500 mb-4 pb-2 border-b border-neutral-800 uppercase tracking-widest">
              02subjects/
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {subjectStats.map(({ subject, mastery }) => (
                <div
                  key={subject.id}
                  className="p-5 border border-neutral-800 bg-surface rounded-lg space-y-4 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-[#EDEDED]">{subject.name}</h2>
                      <p className="text-xs text-neutral-500 font-mono mt-1">
                        WEIGHT: {subject.weightMarks} MARKS
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-marigold">
                      {subject.slug.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px] text-neutral-400 uppercase">
                      <span>Subject Progress</span>
                      <span>{mastery !== null ? `${mastery}% accuracy` : "Not started"}</span>
                    </div>
                    <BubbleFill type="display" percentage={mastery ?? 0} totalBubbles={10} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-8">
            <div className="font-mono text-xs text-neutral-500 mb-4 pb-2 border-b border-neutral-800 uppercase tracking-widest">
              03topics /
            </div>

            {subjectStats.map(({ subject, topics: subTopics }) => (
              <div key={subject.id} className="space-y-4">
                <h3 className="text-lg font-bold text-marigold font-mono uppercase tracking-wider">
                  {subject.name} Topics
                </h3>

                {subTopics.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic">No topics found for this subject.</p>
                ) : (
                  <div className="grid gap-4">
                    {subTopics.map((topic) => {
                      const topicAttempts = userAttemptsWithDetails.filter((a) => a.topicId === topic.id);
                      const topicTotal = topicAttempts.length;
                      const topicCorrect = topicAttempts.filter((a) => a.isCorrect).length;
                      const topicMastery = topicTotal > 0 ? Math.round((topicCorrect / topicTotal) * 100) : 0;

                      return (
                        <div
                          key={topic.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-neutral-800/80 bg-surface/50 rounded-lg hover:border-neutral-700 transition-colors gap-4"
                        >
                          <div>
                            <h4 className="text-base font-semibold text-[#EDEDED]">{topic.name}</h4>
                            <p className="text-xs text-neutral-500 font-mono mt-1">
                              SLUG: {topic.slug}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="hidden xs:block">
                              <BubbleFill type="display" percentage={topicMastery} totalBubbles={5} />
                            </div>

                            <Link
                              href={`/quiz/${topic.id}`}
                              className="px-4 py-2 bg-marigold text-black font-semibold rounded text-xs font-mono hover:bg-opacity-95 transition-all text-center whitespace-nowrap"
                            >
                              start quiz
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600 mt-auto">
        <p>© {new Date().getFullYear()} academic.tsx. Powered by MEC Nepal Syllabus.</p>
      </footer>
    </div>
  );
}
