"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BubbleFill } from "@/components/BubbleFill";
import { submitAnswerAction } from "./actions";

interface QuestionOption {
  id: string;
  label: "A" | "B" | "C" | "D";
  body: string;
}

interface Question {
  id: string;
  body: string;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
  options: QuestionOption[];
}

interface Concept {
  id: string;
  title: string;
  summary: string;
  requiredFailedAttempts: number;
}

interface QuizClientProps {
  topicId?: string;
  topicName: string;
  questions: Question[];
  initialConcept?: Concept | null;
  initialFailedAttempts?: number;
}

export function QuizClient({
  topicName,
  questions,
  initialConcept,
  initialFailedAttempts = 0,
}: QuizClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(initialFailedAttempts);
  const [concept, setConcept] = useState<Concept | null>(initialConcept || null);
  const [unlockedConcept, setUnlockedConcept] = useState(
    initialFailedAttempts >= (initialConcept?.requiredFailedAttempts || 5)
  );

  const [feedback, setFeedback] = useState<{
    submitted: boolean;
    isCorrect?: boolean;
    explanation?: string;
    correctOptionId?: string;
  }>({ submitted: false });

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-[#0A0A0A] font-mono">
        <h1 className="text-xl text-vermillion font-bold mb-4">No Questions Available</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md">
          There are no questions found for this topic. Please ensure the database is fully seeded.
        </p>
        <Link href="/exams/mecee-bl" className="text-marigold underline hover:text-opacity-80">
          Go Back to Exams
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const bubbleOptions = currentQuestion.options.map((opt) => ({
    value: opt.body,
    label: opt.label,
  }));

  const selectedLabel = currentQuestion.options.find((opt) => opt.id === selectedOptionId)?.body || "";

  const handleSelectOption = (value: string) => {
    if (feedback.submitted) return;
    const opt = currentQuestion.options.find((o) => o.body === value);
    if (opt) {
      setSelectedOptionId(opt.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId || submitting || feedback.submitted) return;

    setSubmitting(true);
    try {
      const demoUserId = "demo-user-id";
      const timeTakenMs = 42000;

      const result = await submitAnswerAction({
        userId: demoUserId,
        questionId: currentQuestion.id,
        selectedOptionId,
        timeTakenMs,
      });

      setFeedback({
        submitted: true,
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        correctOptionId: result.correctOptionId,
      });

      setFailedAttempts(result.failedAttemptsCount);
      if (result.isConceptUnlocked && result.conceptRecord) {
        setConcept(result.conceptRecord);
        setUnlockedConcept(true);
      }
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId("");
      setFeedback({ submitted: false });
    } else {
      router.push("/dashboard");
    }
  };

  const currentCorrectOption = currentQuestion.options.find(
    (opt) => opt.id === feedback.correctOptionId
  );

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8 space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-2 font-mono text-xs text-neutral-500 uppercase tracking-widest pb-3 border-b border-neutral-800">
        <div>
          Subject › <span className="text-marigold font-semibold">{topicName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>⏱ 00:42</span>
          <span>
            Q {currentIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Topic Completion Bar */}
      <div className="flex items-center justify-between gap-4 font-mono text-xs text-neutral-400 bg-surface/35 border border-neutral-800/80 p-3 rounded-lg">
        <span className="uppercase tracking-widest text-[10px]">Topic Progress</span>
        <BubbleFill type="display" percentage={progressPercent} totalBubbles={5} />
      </div>

      {/* Unlocked Concept Summary Card (Available after 5+ failed attempts) */}
      {unlockedConcept && concept ? (
        <div className="p-5 border border-marigold/40 bg-marigold/5 rounded-lg space-y-3 font-sans animate-fadeIn">
          <div className="flex items-center justify-between font-mono text-xs text-marigold">
            <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
              💡 Concept Guide Unlocked
            </span>
            <span className="text-[10px] bg-marigold/20 px-2 py-0.5 rounded border border-marigold/30">
              {failedAttempts} Incorrect Attempts
            </span>
          </div>
          <h3 className="text-base font-semibold text-[#EDEDED] font-mono">{concept.title}</h3>
          <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line font-mono">
            {concept.summary}
          </p>
        </div>
      ) : (
        <div className="p-3 border border-neutral-800 bg-surface/30 rounded-lg flex items-center justify-between text-xs font-mono text-neutral-500">
          <span>🔒 Concept Guide locked</span>
          <span>Unlocks after 5 incorrect attempts ({failedAttempts}/5)</span>
        </div>
      )}

      {/* Question Card */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-marigold px-2 py-0.5 rounded">
              DIFFICULTY: {currentQuestion.difficulty}
            </span>
            <span className="text-[10px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-500 px-2 py-0.5 rounded">
              NEB / MECEE-BL
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#EDEDED] font-sans leading-snug">
            {currentQuestion.body}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BubbleFill
            type="interactive"
            options={bubbleOptions}
            selectedValue={selectedLabel}
            onSelect={handleSelectOption}
            disabled={feedback.submitted || submitting}
          />

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800/60">
            <Link
              href="/exams/mecee-bl"
              className="px-4 py-2 border border-neutral-800 bg-surface text-neutral-400 hover:text-[#EDEDED] rounded text-xs font-mono transition-all"
            >
              ◄ back to topics
            </Link>

            {!feedback.submitted ? (
              <button
                type="submit"
                disabled={!selectedOptionId || submitting}
                className="px-5 py-2.5 bg-marigold text-black font-semibold rounded text-xs font-mono hover:bg-opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "submitting..." : "submit answer"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-sal-green text-[#EDEDED] font-semibold rounded text-xs font-mono hover:bg-opacity-95 transition-all flex items-center gap-1"
              >
                {currentIndex < questions.length - 1 ? (
                  <>next question ►</>
                ) : (
                  <>view dashboard 📊</>
                )}
              </button>
            )}
          </div>
        </form>

        {feedback.submitted && (
          <div
            className={`p-5 rounded-lg border font-sans animate-fadeIn space-y-3 ${
              feedback.isCorrect
                ? "bg-sal-green/10 border-sal-green/30 text-[#EDEDED]"
                : "bg-vermillion/10 border-vermillion/30 text-[#EDEDED]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  feedback.isCorrect ? "bg-sal-green" : "bg-vermillion"
                }`}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                {feedback.isCorrect ? "CORRECT ANSWER" : "INCORRECT ANSWER"}
              </span>
            </div>

            {!feedback.isCorrect && currentCorrectOption && (
              <p className="text-sm font-sans font-medium text-neutral-300">
                Correct choice: <span className="text-sal-green font-mono">({currentCorrectOption.label})</span> {currentCorrectOption.body}
              </p>
            )}

            <p className="text-sm leading-relaxed text-neutral-300 font-light">
              <strong className="font-mono text-xs text-neutral-400 block mb-1">EXPLANATION:</strong>
              {feedback.explanation || currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
