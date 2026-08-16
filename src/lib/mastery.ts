import { db } from "@/db";
import { attempts, questions, topics } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export interface SubjectMasteryResult {
  totalAttempts: number;
  correctAttempts: number;
  percentage: number;
  isNotStarted: boolean;
}

/**
  Computes subject mastery for a given user and subject.
  Mastery is correct attempts / total attempts for attempts joined through questions -> topics -> subjects.
  For current user only.
  If a subject has zero attempts, isNotStarted is true.
 */
export async function getSubjectMasteryForUser(
  userId: string,
  subjectId: string
): Promise<SubjectMasteryResult> {
  const subjectTopics = await db.query.topics.findMany({
    where: eq(topics.subjectId, subjectId),
  });

  if (subjectTopics.length === 0) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      percentage: 0,
      isNotStarted: true,
    };
  }

  const topicIds = subjectTopics.map((t) => t.id);

  const subjectQuestions = await db.query.questions.findMany({
    where: inArray(questions.topicId, topicIds),
  });

  if (subjectQuestions.length === 0) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      percentage: 0,
      isNotStarted: true,
    };
  }

  const questionIds = subjectQuestions.map((q) => q.id);

  const userAttempts = await db.query.attempts.findMany({
    where: (att, { and, eq, inArray }) =>
      and(eq(att.userId, userId), inArray(att.questionId, questionIds)),
  });

  const totalAttempts = userAttempts.length;
  if (totalAttempts === 0) {
    return {
      totalAttempts: 0,
      correctAttempts: 0,
      percentage: 0,
      isNotStarted: true,
    };
  }

  const correctAttempts = userAttempts.filter((a) => a.isCorrect).length;
  const percentage = Math.round((correctAttempts / totalAttempts) * 100);

  return {
    totalAttempts,
    correctAttempts,
    percentage,
    isNotStarted: false,
  };
}

/**
  Finds the topic ID of the user's most recent attempt.
  Returns null if user has no attempts.
 */
export async function getLastActiveTopicIdForUser(
  userId: string
): Promise<string | null> {
  const lastAttempt = await db.query.attempts.findFirst({
    where: eq(attempts.userId, userId),
    orderBy: [desc(attempts.createdAt), desc(attempts.id)],
  });

  if (!lastAttempt) {
    return null;
  }

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, lastAttempt.questionId),
  });

  return question ? question.topicId : null;
}
