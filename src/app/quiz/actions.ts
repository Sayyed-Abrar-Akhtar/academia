"use server";

import { db, ensureDbSeeded } from "@/db";
import { attempts, questionOptions, questions, concepts } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SubmitAnswerParams {
  userId: string;
  questionId: string;
  selectedOptionId: string;
  timeTakenMs: number;
}

export async function submitAnswerAction({
  userId,
  questionId,
  selectedOptionId,
  timeTakenMs,
}: SubmitAnswerParams) {
  await ensureDbSeeded();

  const questionDetails = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!questionDetails) {
    throw new Error(`Question ${questionId} not found`);
  }

  const options = await db.query.questionOptions.findMany({
    where: eq(questionOptions.questionId, questionId),
  });

  const correctOption = options.find((opt) => opt.isCorrect);
  const isCorrect = selectedOptionId === correctOption?.id;

  const attemptId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(attempts).values({
    id: attemptId,
    userId,
    questionId,
    selectedOptionId,
    isCorrect,
    timeTakenMs,
    createdAt: new Date(),
  });

  const allTopicQuestions = await db.query.questions.findMany({
    where: eq(questions.topicId, questionDetails.topicId),
  });

  const topicQuestionIds = allTopicQuestions.map((q) => q.id);

  const userAttempts = await db.query.attempts.findMany({
    where: eq(attempts.userId, userId),
  });

  const failedAttemptsOnTopic = userAttempts.filter(
    (att) => topicQuestionIds.includes(att.questionId) && !att.isCorrect
  ).length;

  const conceptRecord = await db.query.concepts.findFirst({
    where: eq(concepts.topicId, questionDetails.topicId),
  });

  const isConceptUnlocked =
    conceptRecord &&
    failedAttemptsOnTopic >= (conceptRecord.requiredFailedAttempts || 5);

  return {
    isCorrect,
    explanation: questionDetails.explanation,
    correctOptionId: correctOption?.id,
    failedAttemptsCount: failedAttemptsOnTopic,
    conceptRecord: isConceptUnlocked ? conceptRecord : null,
    isConceptUnlocked,
    requiredFailedAttempts: conceptRecord?.requiredFailedAttempts || 5,
  };
}
