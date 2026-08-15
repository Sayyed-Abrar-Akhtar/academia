import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { db } from "@/db";
import { seed } from "@/db/seed";
import { questions, attempts, sessions, concepts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { submitAnswerAction } from "@/app/quiz/actions";
import { loginWithMobileAction } from "@/lib/auth";
import { BubbleFill } from "@/components/BubbleFill";

const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await seed();
});

describe("Nepal MECEE-BL Phase 1 Expanded Feature Tests", () => {
  it("should have seeded expanded question bank, concepts, and active fortnight session", async () => {
    const questionsList = await db.select().from(questions);
    expect(questionsList.length).toBeGreaterThanOrEqual(8);

    const conceptsList = await db.select().from(concepts);
    expect(conceptsList.length).toBeGreaterThanOrEqual(3);

    const activeSessions = await db.select().from(sessions);
    expect(activeSessions.length).toBeGreaterThanOrEqual(1);

    const demoSession = activeSessions[0];
    expect(new Date(demoSession.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("should handle mobile login and create a 14-day (1 fortnight) session", async () => {
    const formData = new FormData();
    formData.append("mobileNumber", "+977-9841000000");
    formData.append("loginType", "whatsapp_otp");
    formData.append("otpCode", "123456");

    const result = await loginWithMobileAction(formData);
    expect(result.success).toBe(true);
    expect(result.user?.mobileNumber).toBe("+977-9841000000");

    const createdSession = await db.query.sessions.findFirst({
      where: eq(sessions.userId, result.user!.id),
    });

    expect(createdSession).toBeDefined();
    const expiryMs = new Date(createdSession!.expiresAt).getTime() - Date.now();
    expect(expiryMs).toBeGreaterThan(FORTNIGHT_MS - 60000);
  });

  it("should submit a correct answer via server action and record a successful attempt", async () => {
    const result = await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b",
      timeTakenMs: 15000,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toContain("Mitochondria generate ATP");

    const userAttempts = await db
      .select()
      .from(attempts)
      .where(eq(attempts.questionId, "q-1"));
    expect(userAttempts.length).toBeGreaterThanOrEqual(1);
    expect(userAttempts[0].isCorrect).toBe(true);
  });

  it("should unlock concept guide after 5 failed attempts on a topic", async () => {
    const demoUserId = "demo-user-id";

    // Submit 5 failed attempts on q-1
    for (let i = 0; i < 5; i++) {
      await submitAnswerAction({
        userId: demoUserId,
        questionId: "q-1",
        selectedOptionId: "opt-1-a",
        timeTakenMs: 5000,
      });
    }

    const result = await submitAnswerAction({
      userId: demoUserId,
      questionId: "q-1",
      selectedOptionId: "opt-1-a",
      timeTakenMs: 5000,
    });

    expect(result.failedAttemptsCount).toBeGreaterThanOrEqual(5);
    expect(result.isConceptUnlocked).toBe(true);
    expect(result.conceptRecord).toBeDefined();
    expect(result.conceptRecord?.title).toContain("Mendelian Inheritance");
  });

  it("<BubbleFill> renders correct visual representations of percentage props", () => {
    const { container: container52 } = render(<BubbleFill type="display" percentage={52} totalBubbles={10} />);
    const bubbles52 = container52.querySelectorAll(".w-3\\.5");
    expect(bubbles52.length).toBe(10);

    const filled52 = Array.from(bubbles52).filter((el) => el.classList.contains("bg-marigold"));
    expect(filled52.length).toBe(5);
  });
});
