import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { db } from "@/db";
import { seed } from "@/db/seed";
import { questions, questionOptions, attempts, subjects, topics, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { submitAnswerAction } from "@/app/quiz/actions";
import { BubbleFill } from "@/components/BubbleFill";
import { getSubjectMasteryForUser, getLastActiveTopicIdForUser } from "@/lib/mastery";
import DashboardPage from "@/app/dashboard/page";
import ExamsMeceeBlPage from "@/app/exams/mecee-bl/page";
import { Header } from "@/components/Header";

beforeEach(async () => {
  await seed();
});

describe("Nepal MECEE-BL Phase 1 MVP Tests", () => {
  it("should have seeded questions and options correctly", async () => {
    const questionsList = await db.select().from(questions);
    expect(questionsList.length).toBeGreaterThanOrEqual(8);

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
      timeTakenMs: 10000,
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

  // Bug 1 Test: Dashboard subject-mastery matrix shows computed Biology percentage, no Physics, "Not started" for Chemistry if zero attempts
  it("Bug 1 Test: Dashboard subject-mastery matrix is wired to real data", async () => {
    // Seed user with attempts on Biology only (q-1 correct, q-2 wrong)
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b", // correct
      timeTakenMs: 10000,
    });
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-2",
      selectedOptionId: "opt-2-a", // wrong
      timeTakenMs: 10000,
    });

    const biologySubject = await db.query.subjects.findFirst({
      where: eq(subjects.slug, "biology"),
    });
    const chemistrySubject = await db.query.subjects.findFirst({
      where: eq(subjects.slug, "chemistry"),
    });

    expect(biologySubject).toBeDefined();
    expect(chemistrySubject).toBeDefined();

    const bioMastery = await getSubjectMasteryForUser("demo-user-id", biologySubject!.id);
    expect(bioMastery.isNotStarted).toBe(false);
    expect(bioMastery.totalAttempts).toBe(2);
    expect(bioMastery.correctAttempts).toBe(1);
    expect(bioMastery.percentage).toBe(50);

    const chemMastery = await getSubjectMasteryForUser("demo-user-id", chemistrySubject!.id);
    expect(chemMastery.isNotStarted).toBe(true);
    expect(chemMastery.totalAttempts).toBe(0);

    // Render Dashboard component
    const dashboardJsx = await DashboardPage();
    const { queryByText, getAllByText } = render(dashboardJsx);

    // Bio percentage visible
    expect(getAllByText("50%").length).toBeGreaterThan(0);
    // Chemistry status "Not started"
    expect(getAllByText("Chemistry").length).toBeGreaterThan(0);
    // Physics row should NOT exist
    expect(queryByText("Physics")).toBeNull();
  });

  // Bug 2 Test: Exams listing page renders Biology, Chemistry, Cell Biology, and Organic Chemistry
  it("Bug 2 Test: /exams/mecee-bl renders all seeded subjects and topics", async () => {
    const examsJsx = await ExamsMeceeBlPage();
    const { getAllByText } = render(examsJsx);

    expect(getAllByText("Biology").length).toBeGreaterThan(0);
    expect(getAllByText("Chemistry").length).toBeGreaterThan(0);
    expect(getAllByText("Genetics").length).toBeGreaterThan(0);
    expect(getAllByText("Cell Biology").length).toBeGreaterThan(0);
    expect(getAllByText("Organic Chemistry").length).toBeGreaterThan(0);
  });

  // Bug 3 Test: Header nav includes login link when no session cookie is present
  it("Bug 3 Test: Header nav renders login link when no session cookie is present", async () => {
    const { getAllByText } = render(<Header user={null} />);

    const loginLinks = getAllByText("login");
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0].getAttribute("href")).toBe("/login");

    const { getAllByText: getAllByTextLoggedIn } = render(
      <Header user={{ id: "user-1", name: "Aarav" }} />
    );
    expect(getAllByTextLoggedIn(/account \(Aarav\)/i).length).toBeGreaterThan(0);
  });

  // Bug 4 Test: resume quiz button links directly to user's last active topic
  it("Bug 4 Test: resume quiz links to last active topic (topic-genetics)", async () => {
    // Submit attempt on Genetics (q-1)
    await submitAnswerAction({
      userId: "demo-user-id",
      questionId: "q-1",
      selectedOptionId: "opt-1-b",
      timeTakenMs: 10000,
    });

    const lastTopicId = await getLastActiveTopicIdForUser("demo-user-id");
    expect(lastTopicId).toBe("topic-genetics");

    const dashboardJsx = await DashboardPage();
    const { getAllByText } = render(dashboardJsx);

    const resumeLinks = getAllByText(/resume quiz/i);
    expect(resumeLinks.length).toBeGreaterThan(0);
    expect(resumeLinks[0].getAttribute("href")).toBe("/quiz/topic-genetics");
  });

  // Regression Test: Assert same mastery percentage appears on both /exams/mecee-bl and /dashboard for a seeded user
  it("Regression Test: /exams/mecee-bl and /dashboard report identical subject mastery percentages", async () => {
    // Seed user with attempts on Biology: 3 total attempts, 2 correct = 67%
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
      selectedOptionId: "opt-3-a", // wrong
      timeTakenMs: 10000,
    });

    const biologySubject = await db.query.subjects.findFirst({
      where: eq(subjects.slug, "biology"),
    });

    const bioMastery = await getSubjectMasteryForUser("demo-user-id", biologySubject!.id);
    expect(bioMastery.percentage).toBe(67);

    const dashboardJsx = await DashboardPage();
    const { getAllByText: getByTextDash } = render(dashboardJsx);
    expect(getByTextDash("67%").length).toBeGreaterThan(0);

    const examsJsx = await ExamsMeceeBlPage();
    const { getAllByText: getByTextExams } = render(examsJsx);
    expect(getByTextExams("67% accuracy").length).toBeGreaterThan(0);
  });
});
