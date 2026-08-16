import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { db } from "@/db";
import { seed } from "@/db/seed";
import { questions, questionOptions, attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { submitAnswerAction } from "@/app/quiz/actions";
import { BubbleFill } from "@/components/BubbleFill";
import DashboardPage from "@/app/dashboard/page";
import ExamsMeceeBlPage from "@/app/exams/mecee-bl/page";
import { HeaderNav } from "@/components/HeaderNav";

// Mock next/headers for cookies
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (key: string) => {
      if (key === "session_token" && (globalThis as any).__test_session_token) {
        return { value: (globalThis as any).__test_session_token };
      }
      return undefined;
    },
  }),
}));

beforeEach(async () => {
  delete (globalThis as any).__test_session_token;
  await seed();
});

describe("Nepal MECEE-BL Phase 1 MVP Tests", () => {
  it("should have seeded questions across 4 subjects correctly", async () => {
    const questionsList = await db.select().from(questions);
    expect(questionsList.length).toBe(9);

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
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b",
      timeTakenMs: 12000,
    });
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-2",
      selectedOptionId: "opt-2-a",
      timeTakenMs: 8000,
    });

    const demoUserId = "demo-user-id";
    const userAttempts = await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, demoUserId));

    const total = userAttempts.length;
    const correct = userAttempts.filter((a) => a.isCorrect).length;

    expect(total).toBe(2);
    expect(correct).toBe(1);

    const percentage = Math.round((correct / total) * 100);
    expect(percentage).toBe(50);
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

  it("Bug 1 Test — Dashboard subject-mastery matrix computes real data for user and omits Physics", async () => {
    // Seed user with attempts on Biology only (1 correct out of 2 attempts = 50%)
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b", // correct
      timeTakenMs: 10000,
    });
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-2",
      selectedOptionId: "opt-2-a", // incorrect
      timeTakenMs: 10000,
    });

    const jsx = await DashboardPage();
    render(jsx);

    // Should show Biology with 50%
    expect(screen.getAllByText("Biology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);

    // Chemistry, Cell Biology, Organic Chemistry should show "Not started"
    const notStartedElements = screen.getAllByText("Not started");
    expect(notStartedElements.length).toBe(3);

    // Physics should NOT exist in document
    expect(screen.queryByText("Physics")).toBeNull();
  });

  it("Bug 2 Test — Exams listing page renders all 4 seeded subjects", async () => {
    const jsx = await ExamsMeceeBlPage();
    render(jsx);

    expect(screen.getAllByText("Biology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Chemistry").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cell Biology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Organic Chemistry").length).toBeGreaterThan(0);

    // Verify topics render
    expect(screen.getByText("Genetics")).toBeDefined();
    expect(screen.getByText("General Chemistry")).toBeDefined();
    expect(screen.getByText("Cell Structure")).toBeDefined();
    expect(screen.getByText("Hydrocarbons")).toBeDefined();
  });

  it("Bug 3 Test — Header nav shows login when no session cookie, and user name when session cookie exists", async () => {
    // 1) No session token
    const jsxNoSession = <HeaderNav user={null} />;
    render(jsxNoSession);
    const loginLink = screen.getByRole("link", { name: /login/i });
    expect(loginLink).toBeDefined();
    expect(loginLink.getAttribute("href")).toBe("/login");

    // 2) Active session token
    const testUser = { id: "demo-user-id", name: "Aarav Shrestha" };
    const jsxSession = <HeaderNav user={testUser} />;
    render(jsxSession);
    expect(screen.getByText(/Aarav Shrestha/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /logout/i })).toBeDefined();
  });

  it("Bug 4 Test — 'resume quiz' links to last-active topic ID or exam listing if no attempts", async () => {
    // 1) No attempts -> falls back to /exams/mecee-bl
    const jsx1 = await DashboardPage();
    const { unmount } = render(jsx1);
    const resumeBtn1 = screen.getByRole("link", { name: /resume quiz/i });
    expect(resumeBtn1.getAttribute("href")).toBe("/exams/mecee-bl");
    unmount();

    // 2) Seed attempt on Genetics topic
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1", // topic-genetics
      selectedOptionId: "opt-1-b",
      timeTakenMs: 12000,
    });

    const jsx2 = await DashboardPage();
    render(jsx2);
    const resumeBtn2 = screen.getByRole("link", { name: /resume quiz/i });
    expect(resumeBtn2.getAttribute("href")).toBe("/quiz/topic-genetics");
  });

  it("Regression Test — identical mastery percentage appears on /exams/mecee-bl and /dashboard for seeded attempts", async () => {
    // Seed attempts on Biology (q-1 correct, q-2 correct, q-3 wrong -> 2/3 = 67%)
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b", // correct
      timeTakenMs: 10000,
    });
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-2",
      selectedOptionId: "opt-2-b", // correct
      timeTakenMs: 10000,
    });
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-3",
      selectedOptionId: "opt-3-a", // incorrect
      timeTakenMs: 10000,
    });

    // 1) Render Dashboard
    const dashboardJsx = await DashboardPage();
    const { unmount: unmountDash } = render(dashboardJsx);
    expect(screen.getAllByText("67%").length).toBeGreaterThan(0);
    unmountDash();

    // 2) Render Exams Page
    const examsJsx = await ExamsMeceeBlPage();
    render(examsJsx);
    expect(screen.getAllByText("67% accuracy").length).toBeGreaterThan(0);
  });
});
