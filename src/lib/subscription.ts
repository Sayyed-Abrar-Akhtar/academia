import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export interface UserSubscriptionInfo {
  isPro: boolean;
  tier: "basic_pro" | "full_pro" | "free";
  expiresAt: Date | null;
}

/**
 * Retrieves the current active subscription for a user.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionInfo> {
  const activeSub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active"),
      gte(subscriptions.expiresAt, new Date())
    ),
  });

  if (!activeSub) {
    return {
      isPro: false,
      tier: "free",
      expiresAt: null,
    };
  }

  return {
    isPro: true,
    tier: activeSub.tier,
    expiresAt: activeSub.expiresAt,
  };
}

/**
 * Quick helper to check if a user has any active Pro subscription.
 */
export async function isUserPro(userId: string): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  return sub.isPro;
}
