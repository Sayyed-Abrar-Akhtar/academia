import React from "react";
import Link from "next/link";
import { db, ensureDbSeeded } from "@/db";
import { resources, subjects } from "@/db/schema";
import { Header, getSessionUser } from "@/components/Header";
import { isUserPro } from "@/lib/subscription";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface LibraryPageProps {
  searchParams: Promise<{
    type?: string;
    subjectId?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  await ensureDbSeeded();
  const user = await getSessionUser();
  const userIsPro = user ? await isUserPro(user.id) : false;
  const resolvedSearchParams = await searchParams;

  const typeFilter = resolvedSearchParams.type || "";
  const subjectFilter = resolvedSearchParams.subjectId || "";

  const allSubjects = await db.query.subjects.findMany();
  const allResources = await db.query.resources.findMany();

  const filteredResources = allResources.filter((res) => {
    if (typeFilter && res.type !== typeFilter) return false;
    if (subjectFilter && res.subjectId !== subjectFilter) return false;
    return true;
  });

  const resourceTypes = [
    { label: "All Types", value: "" },
    { label: "Notes", value: "notes" },
    { label: "Videos", value: "video" },
    { label: "Thesis Guides", value: "thesis_guide" },
    { label: "Books", value: "book" },
    { label: "Past Papers", value: "past_paper" },
    { label: "PDFs", value: "pdf" },
  ];

  function getYouTubeEmbedUrl(url: string) {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans">
      <Header user={user} />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <h1 className="text-2xl font-bold font-mono text-marigold mb-2">
            📚 Academic Library & Content Shelves
          </h1>
          <p className="text-sm text-neutral-400">
            Comprehensive learning resources, study guides, video explainer modules, and academic thesis toolkits.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-[#121212] border border-neutral-800 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-center justify-between text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Type:</span>
              <div className="flex flex-wrap gap-1.5">
                {resourceTypes.map((t) => {
                  const isActive = typeFilter === t.value;
                  const newParams = new URLSearchParams();
                  if (t.value) newParams.set("type", t.value);
                  if (subjectFilter) newParams.set("subjectId", subjectFilter);
                  const href = `/library${newParams.toString() ? `?${newParams.toString()}` : ""}`;

                  return (
                    <Link
                      key={t.value || "all"}
                      href={href}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        isActive
                          ? "bg-marigold text-black font-semibold"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Subject:</span>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={`/library${typeFilter ? `?type=${typeFilter}` : ""}`}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    !subjectFilter
                      ? "bg-marigold text-black font-semibold"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  All Subjects
                </Link>
                {allSubjects.map((s) => {
                  const isActive = subjectFilter === s.id;
                  const newParams = new URLSearchParams();
                  if (typeFilter) newParams.set("type", typeFilter);
                  newParams.set("subjectId", s.id);
                  const href = `/library?${newParams.toString()}`;

                  return (
                    <Link
                      key={s.id}
                      href={href}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        isActive
                          ? "bg-marigold text-black font-semibold"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      {s.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {(typeFilter || subjectFilter) && (
            <Link
              href="/library"
              className="text-vermillion hover:underline text-xs"
            >
              Reset Filters
            </Link>
          )}
        </div>

        {/* Resources Listing */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg text-neutral-500 font-mono text-sm">
            No resources match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredResources.map((res) => {
              const isLocked = res.accessTier === "pro" && !userIsPro;
              const isVideo = res.type === "video";

              return (
                <div
                  key={res.id}
                  data-testid={isLocked ? "locked-resource" : "resource-card"}
                  className={`relative border rounded-lg p-6 bg-[#121212] transition-colors ${
                    isLocked ? "border-amber-950/60 locked-resource" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-marigold font-bold">
                        {res.type.replace("_", " ")}
                      </span>
                      {res.sourceAttribution && (
                        <span className="text-neutral-400">
                          by {res.sourceAttribution}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        isLocked
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                          : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"
                      }`}
                    >
                      {isLocked ? "🔒 Pro members only" : "FREE ACCESS"}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-neutral-100 mb-3">
                    {res.title}
                  </h2>

                  {isLocked ? (
                    <div className="relative overflow-hidden rounded border border-neutral-800 bg-[#0A0A0A] p-4">
                      <div className="filter blur-sm select-none opacity-40 text-sm leading-relaxed text-neutral-300">
                        {res.description}
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-center">
                        <span className="text-2xl mb-1">🔒</span>
                        <p className="text-marigold font-mono font-bold text-sm mb-1">
                          Pro members only
                        </p>
                        <p className="text-neutral-400 text-xs max-w-md mb-3">
                          Upgrade to Academia Pro to unlock full thesis toolkits, comprehensive study guides, and past paper solutions.
                        </p>
                        <Link
                          href="/pricing"
                          className="px-3 py-1.5 rounded bg-marigold text-black font-mono font-bold text-xs hover:bg-amber-400 transition-colors"
                        >
                          View Pro Plans →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line mb-4">
                        {res.description}
                      </div>

                      {isVideo ? (
                        <div className="mt-4 aspect-video w-full max-w-2xl rounded overflow-hidden border border-neutral-800 bg-black">
                          <iframe
                            src={getYouTubeEmbedUrl(res.url)}
                            title={res.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="mt-4">
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-marigold text-xs font-mono transition-colors border border-neutral-700"
                          >
                            <span>↗</span> View Resource
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-800 py-6 text-center text-xs font-mono text-neutral-600">
        <p>© {new Date().getFullYear()} academic.tsx. Library Shelf System.</p>
      </footer>
    </div>
  );
}
