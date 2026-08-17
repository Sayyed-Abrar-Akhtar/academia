import { describe, it, expect, beforeEach } from "vitest";
import { db, ensureDbSeeded } from "@/db";
import { subscriptions, masteryScores, resources, users, topics } from "@/db/schema";
import { calculateSM2, updateTopicMasteryOnAttempt, getWeakTopicVideoRecommendations } from "@/lib/adaptive";
import { getUserSubscription, isUserPro } from "@/lib/subscription";
import { eq } from "drizzle-orm";

describe("Phase 3: Monetization & Adaptive Core Tests", () => {
  beforeEach(async () => {
    await ensureDbSeeded();
  });

  describe("SM-2 Spaced Repetition Algorithm", () => {
    it("should correctly compute next interval and repetition for a correct response", () => {
      const initial = {
        quality: 4,
        repetition: 0,
        interval: 1,
        easinessFactor: 250,
      };

      const result = calculateSM2(initial);
      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1);
      expect(result.easinessFactor).toBeGreaterThanOrEqual(250);
      expect(result.nextReviewAt).toBeInstanceOf(Date);
    });

    it("should reset repetition and interval to 1 on an incorrect response (quality < 3)", () => {
      const initial = {
        quality: 1,
        repetition: 3,
        interval: 15,
        easinessFactor: 250,
      };

      const result = calculateSM2(initial);
      expect(result.repetition).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe("Mastery Scores & Weak Topic Video Recommendations", () => {
    it("should create/update masteryScores record on attempt", async () => {
      const userId = "demo-user-id";
      const topicId = "topic-genetics";

      await updateTopicMasteryOnAttempt(userId, topicId, true, 5000);

      const scoreRecord = await db.query.masteryScores.findFirst({
        where: eq(masteryScores.topicId, topicId),
      });

      expect(scoreRecord).toBeDefined();
      expect(scoreRecord?.userId).toBe(userId);
      expect(scoreRecord?.repetition).toBeGreaterThan(0);
    });

    it("should return video recommendations for weak topics (< 60 mastery score)", async () => {
      const userId = "demo-user-id";
      // Clear or set weak score for cell-biology
      await db
        .insert(masteryScores)
        .values({
          id: "test-weak-ms",
          userId,
          topicId: "topic-genetics",
          score: 30, // weak
          repetition: 1,
          interval: 1,
          easinessFactor: 250,
        })
        .onConflictDoUpdate({
          target: masteryScores.id,
          set: { score: 30 },
        });

      const videos = await getWeakTopicVideoRecommendations(userId);
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0].type).toBe("video");
      expect(videos[0].topicId).toBe("topic-genetics");
    });
  });

  describe("Subscription Management", () => {
    it("should accurately report active subscription status for admin and demo users", async () => {
      const adminSub = await getUserSubscription("admin-user-id");
      expect(adminSub.isPro).toBe(true);
      expect(adminSub.tier).toBe("full_pro");

      const demoSub = await getUserSubscription("demo-user-id");
      expect(demoSub.isPro).toBe(false);
      expect(demoSub.tier).toBe("free");

      const adminIsPro = await isUserPro("admin-user-id");
      expect(adminIsPro).toBe(true);

      const demoIsPro = await isUserPro("demo-user-id");
      expect(demoIsPro).toBe(false);
    });

    it("should grant Pro status when a active subscription is added", async () => {
      const userId = "demo-user-id";
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      await db.insert(subscriptions).values({
        id: "sub-test-demo",
        userId,
        tier: "basic_pro",
        currency: "NPR",
        paymentProvider: "esewa",
        status: "active",
        expiresAt,
      });

      const updatedSub = await getUserSubscription(userId);
      expect(updatedSub.isPro).toBe(true);
      expect(updatedSub.tier).toBe("basic_pro");
    });
  });
});
