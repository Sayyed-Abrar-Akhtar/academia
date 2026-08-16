import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/navigation so QuizClient and page components render safely in Vitest
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "",
}));
import { db, ensureDbSeeded } from "@/db";
import { resources } from "@/db/schema";
import LibraryPage from "@/app/library/page";
import QuizPage from "@/app/quiz/[topicId]/page";

describe("Phase 2: Library Foundation Tests", () => {
  beforeEach(async () => {
    await ensureDbSeeded();
  });

  it("should seed and verify all 4 resources insert correctly with their scoping fields", async () => {
    const allResources = await db.query.resources.findMany();
    expect(allResources).toHaveLength(4);

    const geneticsNotes = allResources.find((r) => r.id === "res-genetics-notes");
    expect(geneticsNotes).toBeDefined();
    expect(geneticsNotes?.type).toBe("notes");
    expect(geneticsNotes?.topicId).toBe("topic-genetics");
    expect(geneticsNotes?.subjectId).toBe("subj-biology");
    expect(geneticsNotes?.examId).toBe("exam-mecee");
    expect(geneticsNotes?.accessTier).toBe("free");

    const cellBioNotes = allResources.find((r) => r.id === "res-cell-bio-notes");
    expect(cellBioNotes).toBeDefined();
    expect(cellBioNotes?.type).toBe("notes");
    expect(cellBioNotes?.topicId).toBe("topic-cell-biology");
    expect(cellBioNotes?.accessTier).toBe("free");

    const geneticsVideo = allResources.find((r) => r.id === "res-genetics-video");
    expect(geneticsVideo).toBeDefined();
    expect(geneticsVideo?.type).toBe("video");
    expect(geneticsVideo?.topicId).toBe("topic-genetics");
    expect(geneticsVideo?.accessTier).toBe("free");

    const researchMethodology = allResources.find((r) => r.id === "res-research-methodology");
    expect(researchMethodology).toBeDefined();
    expect(researchMethodology?.type).toBe("thesis_guide");
    expect(researchMethodology?.topicId).toBeNull();
    expect(researchMethodology?.subjectId).toBeNull();
    expect(researchMethodology?.examId).toBeNull();
    expect(researchMethodology?.accessTier).toBe("pro");
  });

  it("/library renders all free resources and a pro-tier resource in a visibly locked state", async () => {
    const pageComponent = await LibraryPage({
      searchParams: Promise.resolve({}),
    });

    render(pageComponent);

    expect(screen.getByText("Genetics — Mendelian Inheritance Summary")).toBeDefined();
    expect(screen.getByText("Cell Biology — Structure Overview")).toBeDefined();
    expect(screen.getByText("Mendelian Inheritance Explained")).toBeDefined();
    expect(screen.getByText("How to Structure a Research Methodology Section")).toBeDefined();

    const lockedResources = screen.getAllByTestId("locked-resource");
    expect(lockedResources.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("🔒 Pro members only")).toBeDefined();
  });

  it("filtering /library by type=video returns only the video resource", async () => {
    const pageComponent = await LibraryPage({
      searchParams: Promise.resolve({ type: "video" }),
    });

    render(pageComponent);

    expect(screen.getByText("Mendelian Inheritance Explained")).toBeDefined();
    expect(screen.queryByText("Genetics — Mendelian Inheritance Summary")).toBeNull();
    expect(screen.queryByText("Cell Biology — Structure Overview")).toBeNull();
    expect(screen.queryByText("How to Structure a Research Methodology Section")).toBeNull();
  });

  it("/quiz/topic-genetics renders its 2 related resources; a topic with no resources renders no related-resources block", async () => {
    const geneticsQuizPage = await QuizPage({
      params: Promise.resolve({ topicId: "topic-genetics" }),
    });

    const { unmount } = render(geneticsQuizPage);

    const relatedBlock = screen.getByTestId("related-resources-block");
    expect(relatedBlock).toBeDefined();
    expect(screen.getByText("Genetics — Mendelian Inheritance Summary")).toBeDefined();
    expect(screen.getByText("Mendelian Inheritance Explained")).toBeDefined();

    unmount();

    const organicChemQuizPage = await QuizPage({
      params: Promise.resolve({ topicId: "topic-organic-chemistry" }),
    });

    render(organicChemQuizPage);

    expect(screen.queryByTestId("related-resources-block")).toBeNull();
  });
});
