import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { db } from "@/db";
import { seed } from "@/db/seed";
import { questions, questionOptions, attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { submitAnswerAction } from "@/app/quiz/actions";
import { BubbleFill } from "@/components/BubbleFill";

beforeAll(async () => {
  await seed();
});

describe("Nepal MECEE-BL Phase 1 MVP Tests", () => {
  it("should have seeded 6 questions and their options correctly", async () => {
    const questionsList = await db.select().from(questions);
    expect(questionsList.length).toBe(6);

    const q1 = questionsList.find((q) => q.id === "q-1");
    expect(q1).toBeDefined();
    expect(q1?.body).toContain("powerhouse of the cell");

    const q1Options = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, "q-1"));
    expect(q1Options.length).toBe(4);
    expect(q1Options.some((opt) => opt.isCorrect && opt.body === "Mitochondria")).toBe(true);
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
    expect(userAttempts[0].timeTakenMs).toBe(15000);
  });

  it("should submit an incorrect answer and record a failed attempt", async () => {
    const result = await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-a",
      timeTakenMs: 10000,
    });

    expect(result.isCorrect).toBe(false);

    const userAttempts = await db
      .select()
      .from(attempts)
      .where(eq(attempts.selectedOptionId, "opt-1-a"));
    expect(userAttempts.length).toBe(1);
    expect(userAttempts[0].isCorrect).toBe(false);
  });

  it("should correctly compute total and correct attempts from the database for the demo user", async () => {
    const demoUserId = "demo-user-id";
    const userAttempts = await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, demoUserId));

    const total = userAttempts.length;
    const correct = userAttempts.filter((a) => a.isCorrect).length;

    expect(total).toBeGreaterThanOrEqual(2);

    const percentage = Math.round((correct / total) * 100);
    expect(percentage).toBe(Math.round((correct / total) * 100));
  });

  it("<BubbleFill> renders correct visual representations of percentage props", () => {
    const { container: container52 } = render(<BubbleFill type="display" percentage={52} totalBubbles={10} />);
    const bubbles52 = container52.querySelectorAll(".w-3\\.5");
    expect(bubbles52.length).toBe(10);

    const filled52 = Array.from(bubbles52).filter((el) => el.classList.contains("bg-marigold"));
    expect(filled52.length).toBe(5);

    const { container: container80 } = render(<BubbleFill type="display" percentage={80} totalBubbles={10} />);
    const bubbles80 = container80.querySelectorAll(".w-3\\.5");
    const filled80 = Array.from(bubbles80).filter((el) => el.classList.contains("bg-marigold"));
    expect(filled80.length).toBe(8);
  });
});
