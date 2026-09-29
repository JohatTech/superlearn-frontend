"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface ReferenceItem {
  title: string;
  url: string;
  type?: string;
  author_or_source?: string;
  snippet?: string;
  suitability_reason?: string;
  contrast_evaluation?: string;
  is_verified_active?: boolean;
}

interface SyllabusTopic {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface ClassroomDetails {
  id: string;
  title: string;
  description: string;
  syllabus: SyllabusTopic[];
}

export default function ClassroomReferencesPage() {
  const { id: classroomId } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialConcept = searchParams.get("concept") || "";

  const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
  const [activeConcept, setActiveConcept] = useState<string>(initialConcept);
  const [activeConceptDesc, setActiveConceptDesc] = useState<string>("");
  const [customSearchQuery, setCustomSearchQuery] = useState<string>(initialConcept);

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [errorMsg, setErrorMessage] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const streamingRef = useRef<boolean>(false);

  // 1. Load Classroom info
  useEffect(() => {
    async function loadClassroom() {
      try {
        const data = await api.getClassroom(classroomId);
        setClassroom(data);

        if (!activeConcept && data.syllabus && data.syllabus.length > 0) {
          const first = data.syllabus[0];
          setActiveConcept(first.name);
          setActiveConceptDesc(first.description);
          setCustomSearchQuery(first.name);
        } else if (activeConcept && data.syllabus) {
          const match = data.syllabus.find((s: SyllabusTopic) => s.name.toLowerCase() === activeConcept.toLowerCase());
          if (match) setActiveConceptDesc(match.description);
        }
      } catch (err: any) {
        console.error("Failed to load classroom details:", err);
      }
    }
    loadClassroom();
  }, [classroomId]);

  // 2. Trigger real-time flushed reference streaming whenever activeConcept changes
  useEffect(() => {
    if (activeConcept.trim()) {
      startStreamingReferences(activeConcept, activeConceptDesc);
    }
  }, [activeConcept]);

  const startStreamingReferences = async (query: string, desc: string = "") => {
    setReferences([]);
    setErrorMessage("");
    setIsStreaming(true);
    streamingRef.current = true;

    try {
      await api.streamReferences(
        query,
        desc,
        (newRef: ReferenceItem) => {
          if (!streamingRef.current) return;
          // Flush reference item immediately into state as soon as received!
          setReferences((prev) => {
            // Deduplicate by URL
            if (prev.some((r) => r.url === newRef.url)) return prev;
            return [...prev, newRef];
          });
        },
        () => {
          setIsStreaming(false);
          streamingRef.current = false;
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Error streaming references.");
      setIsStreaming(false);
      streamingRef.current = false;
    }
  };

  const handleSelectTopic = (topic: SyllabusTopic) => {
    setActiveConcept(topic.name);
    setActiveConceptDesc(topic.description);
    setCustomSearchQuery(topic.name);
  };

  const handleCustomSearch = () => {
    if (!customSearchQuery.trim()) return;
    setActiveConcept(customSearchQuery.trim());
    setActiveConceptDesc("");
  };

  const filteredReferences = references.filter((ref) => {
    if (activeCategory === "all") return true;
    const t = (ref.type || "").toLowerCase();
    if (activeCategory === "books") return t.includes("book");
    if (activeCategory === "papers") return t.includes("paper");
    if (activeCategory === "courses") return t.includes("course") || t.includes("ocw");
    if (activeCategory === "articles") return t.includes("article") || t.includes("web");
    if (activeCategory === "videos") return t.includes("video");
    return true;
  });

  const getTypeBadge = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("book")) return { icon: "📖", label: "Book / Textbook", color: "#3b82f6" };
    if (t.includes("paper")) return { icon: "📄", label: "Research Paper", color: "#a855f7" };
    if (t.includes("course") || t.includes("ocw")) return { icon: "🎓", label: "Open Courseware", color: "#10b981" };
    if (t.includes("video")) return { icon: "🎥", label: "Video Tutorial", color: "#ef4444" };
    return { icon: "🌐", label: "Web Article", color: "#06b6d4" };
  };

  return (
    <div style={{ height: "100vh", overflowY: "auto", background: "var(--bg-0)", color: "var(--text-0)", display: "flex", flexDirection: "column" }}>
      {/* Navigation Header */}
      <header className="top-navbar" style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--bg-1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(`/classroom/${classroomId}`)}
            style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
          >
            ← Back to Classroom
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🔍</span>
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>Search References Workspace</span>
          </div>
        </div>

        {classroom && (
          <div style={{ fontSize: "0.82rem", color: "var(--accent-secondary)", fontWeight: 600 }}>
            {classroom.title}
          </div>
        )}
      </header>

      {/* Main Page Layout (Scrollable Feed) */}
      <div style={{ flex: 1, display: "flex", maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "1.5rem", gap: "1.5rem", minHeight: 0 }}>
        {/* Left Sidebar: Syllabus Topics Selector */}
        <aside
          style={{
            width: "320px",
            flexShrink: 0,
            background: "var(--bg-1)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            maxHeight: "calc(100vh - 120px)",
            position: "sticky",
            top: "1.5rem",
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-0)" }}>
            📖 Syllabus Concepts ({classroom?.syllabus?.length || 0})
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-2)", lineHeight: 1.4 }}>
            Select a concept to stream and contrast at least 15 verified study references in real-time.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
            {classroom?.syllabus?.map((topic, idx) => {
              const isSelected = topic.name.toLowerCase() === activeConcept.toLowerCase();
              return (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(99, 102, 241, 0.15)" : "var(--bg-2)",
                    border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    color: isSelected ? "var(--text-0)" : "var(--text-1)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: isSelected ? "var(--accent-primary)" : "var(--bg-3)",
                      color: isSelected ? "#fff" : "var(--text-2)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "4px",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: isSelected ? 700 : 500, lineHeight: 1.3 }}>
                    {topic.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Area: Streamed References Feed */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0, paddingBottom: "5rem" }}>
          {/* Active Concept Header & Search Bar */}
          <div
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-0)" }}>
                  Concept: <span style={{ color: "var(--accent-primary)" }}>{activeConcept}</span>
                </h1>
                {activeConceptDesc && (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-2)", margin: "0.25rem 0 0 0", lineHeight: 1.4 }}>
                    {activeConceptDesc}
                  </p>
                )}
              </div>

              {/* Streaming Status Counter */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "20px",
                  background: isStreaming ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${isStreaming ? "rgba(99, 102, 241, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: isStreaming ? "var(--accent-primary)" : "#10b981",
                }}
              >
                {isStreaming ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    Flushing References... ({references.length} found)
                  </>
                ) : (
                  <>
                    <span>✅ Verified Stream Complete: {references.length} References</span>
                  </>
                )}
              </div>
            </div>

            {/* Custom Search Query Bar */}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <input
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomSearch()}
                placeholder="Search or refine concept references..."
                style={{
                  flex: 1,
                  background: "var(--bg-2)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.55rem 0.9rem",
                  color: "var(--text-0)",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleCustomSearch}
                disabled={isStreaming || !customSearchQuery.trim()}
                style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { id: "all", label: "All References", icon: "🌐" },
              { id: "books", label: "Textbooks", icon: "📖" },
              { id: "papers", label: "Research Papers", icon: "📄" },
              { id: "courses", label: "Open Courseware", icon: "🎓" },
              { id: "articles", label: "Web Articles", icon: "🌐" },
              { id: "videos", label: "Video Tutorials", icon: "🎥" },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    background: isActive ? "var(--accent-primary)" : "var(--bg-1)",
                    color: isActive ? "#fff" : "var(--text-1)",
                    border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    borderRadius: "20px",
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              );
            })}
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "0.85rem 1.1rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "0.85rem",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Streamed References Feed (SERP Flush Layout) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredReferences.map((ref, idx) => {
              const badge = getTypeBadge(ref.type);
              const hrefUrl = ref.url || "#";

              return (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.15rem 1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.55rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    animation: "fadeIn 0.25s ease-in-out",
                  }}
                >
                  {/* Top Line: Verified Status + Source Badge + Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: badge.color,
                        background: `${badge.color}15`,
                        border: `1px solid ${badge.color}35`,
                        padding: "0.15rem 0.55rem",
                        borderRadius: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span>{badge.icon}</span> {badge.label}
                    </span>

                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      🟢 Link Verified Active
                    </span>

                    {ref.author_or_source && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-2)", fontWeight: 500 }}>
                        · {ref.author_or_source}
                      </span>
                    )}
                  </div>

                  {/* Title Hyperlink (Search Engine Style) */}
                  <div>
                    <a
                      href={hrefUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        color: "#38bdf8",
                        textDecoration: "none",
                        lineHeight: 1.35,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {ref.title} ↗
                    </a>
                  </div>

                  {/* Monospaced URL Breadcrumb */}
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--accent-secondary)",
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hrefUrl}
                  </div>

                  {/* Snippet Excerpt */}
                  {ref.snippet && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-1)", lineHeight: 1.5 }}>
                      {ref.snippet}
                    </div>
                  )}

                  {/* Suitability & Contrast Evaluation Card */}
                  {(ref.suitability_reason || ref.contrast_evaluation) && (
                    <div
                      style={{
                        marginTop: "0.35rem",
                        padding: "0.65rem 0.9rem",
                        background: "rgba(255, 255, 255, 0.025)",
                        borderLeft: "3px solid var(--accent-primary)",
                        borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
                        fontSize: "0.78rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                      }}
                    >
                      {ref.suitability_reason && (
                        <div style={{ color: "var(--text-0)" }}>
                          <strong style={{ color: "var(--accent-primary)" }}>💡 Suitability Decision: </strong>
                          {ref.suitability_reason}
                        </div>
                      )}
                      {ref.contrast_evaluation && (
                        <div style={{ color: "var(--text-2)" }}>
                          <strong>⚖️ Contrast Evaluation: </strong>
                          {ref.contrast_evaluation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredReferences.length === 0 && !isStreaming && (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 1rem",
                  background: "var(--bg-1)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-2)",
                  fontSize: "0.9rem",
                }}
              >
                No references found matching this category. Select another category or try a custom search.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
