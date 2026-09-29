"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface ReferenceItem {
  title: string;
  url: string;
  type?: string;
  author_or_source?: string;
  snippet?: string;
  suitability_reason?: string;
  contrast_evaluation?: string;
}

interface SearchReferencesResult {
  concept_name: string;
  summary_evaluation?: string;
  references: ReferenceItem[];
}

interface SearchReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConceptName?: string;
  initialConceptDescription?: string;
}

export default function SearchReferencesModal({
  isOpen,
  onClose,
  initialConceptName = "",
  initialConceptDescription = "",
}: SearchReferencesModalProps) {
  const [conceptQuery, setConceptQuery] = useState(initialConceptName);
  const [conceptDescription, setConceptDescription] = useState(initialConceptDescription);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchReferencesResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialConceptName) {
      setConceptQuery(initialConceptName);
    }
    if (initialConceptDescription) {
      setConceptDescription(initialConceptDescription);
    }
  }, [initialConceptName, initialConceptDescription]);

  useEffect(() => {
    if (isOpen && conceptQuery.trim() && !results) {
      handleSearch();
    }
  }, [isOpen]);

  const handleSearch = async (queryToSearch?: string) => {
    const targetQuery = queryToSearch !== undefined ? queryToSearch : conceptQuery;
    if (!targetQuery.trim()) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await api.searchReferences(targetQuery.trim(), conceptDescription);
      setResults(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to search references.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTypeBadge = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("book")) return { icon: "📖", label: "Book / Textbook", color: "#3b82f6" };
    if (t.includes("paper")) return { icon: "📄", label: "Research Paper", color: "#a855f7" };
    if (t.includes("course") || t.includes("ocw")) return { icon: "🎓", label: "Open Courseware", color: "#10b981" };
    if (t.includes("video")) return { icon: "🎥", label: "Video Tutorial", color: "#ef4444" };
    return { icon: "🌐", label: "Web Article", color: "#06b6d4" };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.2rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.3rem" }}>🔍</span>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-0)", margin: 0 }}>
                Search References per Syllabus Concept
              </h2>
              <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "0.15rem" }}>
                Powered by StudyMaterialsAgent — Searches, reads, and contrasts references to curate the best suitable learning materials.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-2)",
              fontSize: "1.3rem",
              cursor: "pointer",
              padding: "0.2rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar Controls */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-1)",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <input
            value={conceptQuery}
            onChange={(e) => setConceptQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter concept to search references for..."
            style={{
              flex: 1,
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-0)",
              padding: "0.65rem 1rem",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={isLoading || !conceptQuery.trim()}
            style={{ padding: "0.65rem 1.25rem", whiteSpace: "nowrap" }}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} /> Researching...
              </>
            ) : (
              "🔍 Find References"
            )}
          </button>
        </div>

        {/* Modal Scrollable Body (Search Engine Results Layout) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {isLoading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem 1rem",
                gap: "1rem",
                textAlign: "center",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: 36,
                  height: 36,
                  borderColor: "var(--accent-primary) transparent var(--accent-primary) transparent",
                }}
              />
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-0)" }}>
                Study Materials Agent is reading & contrasting references...
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-2)", maxWidth: "460px", lineHeight: 1.5 }}>
                Searching academic databases, web articles, textbooks, and open courseware for{" "}
                <span style={{ color: "var(--accent-secondary)" }}>"{conceptQuery}"</span>. Evaluating clarity, mathematical rigor, and pedagogical fit.
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--accent-danger, #ef4444)",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {!isLoading && results && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Agent Synthesis Overview */}
              {results.summary_evaluation && (
                <div
                  style={{
                    padding: "1rem 1.2rem",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    color: "var(--text-1)",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>⚖️ Agent Comparative Evaluation & Decision</span>
                  </div>
                  {results.summary_evaluation}
                </div>
              )}

              {/* References Search Engine Results List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {results.references && results.references.length > 0 ? (
                  results.references.map((ref, idx) => {
                    const badge = getTypeBadge(ref.type);
                    const hrefUrl = ref.url || `https://www.google.com/search?q=${encodeURIComponent(ref.title)}`;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-2)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          padding: "1.1rem 1.25rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        {/* Top Line: Source Badge + Author/Platform */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: badge.color,
                              background: `${badge.color}15`,
                              border: `1px solid ${badge.color}35`,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span>{badge.icon}</span> {badge.label}
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
                              fontSize: "1.05rem",
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

                        {/* Hyperlink URL Breadcrumb */}
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--accent-secondary, #06b6d4)",
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
                          <div style={{ fontSize: "0.82rem", color: "var(--text-1)", lineHeight: 1.45 }}>
                            {ref.snippet}
                          </div>
                        )}

                        {/* Suitability & Contrast Card */}
                        {(ref.suitability_reason || ref.contrast_evaluation) && (
                          <div
                            style={{
                              marginTop: "0.3rem",
                              padding: "0.6rem 0.8rem",
                              background: "rgba(255, 255, 255, 0.03)",
                              borderLeft: "3px solid var(--accent-primary)",
                              borderRadius: "0 var(--radius-xs) var(--radius-xs) 0",
                              fontSize: "0.75rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.3rem",
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
                                <strong>⚖️ Contrast Note: </strong>
                                {ref.contrast_evaluation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-2)", padding: "2rem 0", fontSize: "0.85rem" }}>
                    No references found for this concept query. Try entering another topic name.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
