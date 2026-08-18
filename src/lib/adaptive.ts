import { db } from "@/db";
import { masteryScores, resources, questions, attempts, topics } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface SM2Input {
  quality: number; // 0 to 5 (e.g., 5 = correct fast, 3 = correct, 0 = incorrect)
  repetition: number;
  interval: number; // in days
  easinessFactor: number; // stored multiplied by 100 or as standard float (default 2.5 represented as 250 in DB or 2.5)
}

export interface SM2Output {
  repetition: number;
  interval: number;
  easinessFactor: number;
  nextReviewAt: Date;
  score: number; // percentage 0-100
}

/**
 * Calculates SM-2 spaced repetition values based on answer quality.
 * EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * Quality scale 0-5.
 */
export function calculateSM2({
  quality,
  repetition,
  interval,
  easinessFactor,
}: SM2Input): SM2Output {
  // Quality must be between 0 and 5
  const q = Math.max(0, Math.min(5, quality));

  // Convert easiness factor if stored as integer (e.g. 250 -> 2.5)
  let ef = easinessFactor > 20 ? easinessFactor / 100 : easinessFactor;
  if (ef < 1.3) ef = 1.3;

  let newRepetition = repetition;
  let newInterval = interval;

  if (q >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * ef);
    }
    newRepetition += 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  // Calculate new easiness factor
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  // Store EF multiplied by 100 as integer (e.g., 250)
  const storedEf = Math.round(ef * 100);

  // Score estimate based on repetition & ef
  const score = Math.min(100, Math.max(0, Math.round((newRepetition * 20) + (ef - 1.3) * 30)));

  return {
    repetition: newRepetition,
    interval: newInterval,
    easinessFactor: storedEf,
    nextReviewAt,
    score,
  };
}

/**
 * Updates or creates a user's masteryScore record for a topic based on an attempt result.
 */
export async function updateTopicMasteryOnAttempt(
  userId: string,
  topicId: string,
  isCorrect: boolean,
  timeTakenMs: number
) {
  // Map performance to 0-5 quality grade
  let quality = isCorrect ? 4 : 1;
  if (isCorrect && timeTakenMs < 10000) {
    quality = 5;
  } else if (!isCorrect && timeTakenMs > 30000) {
    quality = 0;
  }

  const existingMastery = await db.query.masteryScores.findFirst({
    where: and(eq(masteryScores.userId, userId), eq(masteryScores.topicId, topicId)),
  });

  const sm2Input: SM2Input = existingMastery
    ? {
        quality,
        repetition: existingMastery.repetition,
        interval: existingMastery.interval,
        easinessFactor: existingMastery.easinessFactor,
      }
    : {
        quality,
        repetition: 0,
        interval: 1,
        easinessFactor: 250,
      };

  const sm2Result = calculateSM2(sm2Input);

  if (existingMastery) {
    await db
      .update(masteryScores)
      .set({
        score: sm2Result.score,
        repetition: sm2Result.repetition,
        interval: sm2Result.interval,
        easinessFactor: sm2Result.easinessFactor,
        nextReviewAt: sm2Result.nextReviewAt,
        updatedAt: new Date(),
      })
      .where(eq(masteryScores.id, existingMastery.id));
  } else {
    const id = `ms-${userId}-${topicId}-${Date.now()}`;
    await db.insert(masteryScores).values({
      id,
      userId,
      topicId,
      score: sm2Result.score,
      repetition: sm2Result.repetition,
      interval: sm2Result.interval,
      easinessFactor: sm2Result.easinessFactor,
      nextReviewAt: sm2Result.nextReviewAt,
      updatedAt: new Date(),
    });
  }

  return sm2Result;
}

/**
 * Recommends curated videos for weak topics (score below threshold, e.g., 60%).
 */
export async function getWeakTopicVideoRecommendations(userId: string) {
  const userScores = await db.query.masteryScores.findMany({
    where: eq(masteryScores.userId, userId),
  });

  const weakTopicIds = userScores
    .filter((ms) => ms.score < 60)
    .map((ms) => ms.topicId);

  if (weakTopicIds.length === 0) {
    return [];
  }

  const videos = await db.query.resources.findMany({
    where: and(
      eq(resources.type, "video"),
      inArray(resources.topicId, weakTopicIds)
    ),
  });

  return videos;
}
