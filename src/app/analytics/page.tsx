"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ConceptMetric {
  id: string;
  name: string;
  mastery: number;
  bloom_level: number;
  description: string;
}

export default function AnalyticsPage() {
  const [concepts, setConcepts] = useState<ConceptMetric[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [graphEdgeCount, setGraphEdgeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getGraph().catch(() => ({ nodes: [], edges: [] })),
      api.getRecommendations(undefined, 10).catch(() => ({ recommendations: [] })),
    ]).then(([graphData, recsData]) => {
      const parsedConcepts: ConceptMetric[] = (graphData?.nodes || []).map((node: any) => ({
        id: node.id,
        name: node.data?.label || node.id,
        mastery: node.data?.mastery || 0,
        bloom_level: node.data?.bloom_level || 1,
        description: node.data?.description || "",
      }));
      setConcepts(parsedConcepts);
      setGraphEdgeCount(graphData?.edges?.length || 0);
      setRecommendations(recsData?.recommendations || []);
      setIsLoading(false);
    });
  }, []);

  const totalConcepts = concepts.length;
  const averageMastery =
    totalConcepts > 0
      ? concepts.reduce((acc, c) => acc + c.mastery, 0) / totalConcepts
      : 0;
  const masteredCount = concepts.filter((c) => c.mastery >= 0.85).length;
  const inProgressCount = concepts.filter((c) => c.mastery > 0 && c.mastery < 0.85).length;
  const unstartedCount = concepts.filter((c) => c.mastery === 0).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-0)", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <header className="top-navbar">
        <a href="/" className="brand-logo">
          <span>🧠</span>
          <span>SuperLearn</span>
        </a>
        <div className="nav-links">
          <a href="/" className="btn btn-primary btn-sm">
            ← Return to Study Session
          </a>
        </div>
      </header>

      {/* Analytics Content Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-0)" }}>
            📊 Learner Study Analytics & Mastery
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginTop: "0.25rem" }}>
            Aggregate cognitive telemetry, FSRS memory stability distributions, and mastery tracking
          </p>
        </div>

        {/* Aggregate KPI Stat Cards */}
        <div className="responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase" }}>Total Concepts</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-0)", marginTop: "0.25rem" }}>{totalConcepts}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--accent-secondary)", marginTop: "0.2rem" }}>{graphEdgeCount} Prerequisite Edges</div>
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase" }}>Average Mastery</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-primary)", marginTop: "0.25rem" }}>
              {Math.round(averageMastery * 100)}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Across all indexed nodes</div>
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase" }}>Mastered Concepts</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-success)", marginTop: "0.25rem" }}>{masteredCount}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Mastery ≥ 85%</div>
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase" }}>In FSRS Queue</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-warn)", marginTop: "0.25rem" }}>{recommendations.length}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Targeting R ≈ 75%</div>
          </div>
        </div>

        {/* Mastery Distribution Progress Bar */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-0)", marginBottom: "0.5rem" }}>
            Mastery State Breakdown
          </div>
          <div style={{ height: 12, background: "var(--bg-3)", borderRadius: 999, overflow: "hidden", display: "flex", margin: "0.75rem 0" }}>
            <div style={{ width: `${(masteredCount / Math.max(1, totalConcepts)) * 100}%`, background: "var(--accent-success)" }} title="Mastered" />
            <div style={{ width: `${(inProgressCount / Math.max(1, totalConcepts)) * 100}%`, background: "var(--accent-primary)" }} title="In Progress" />
            <div style={{ width: `${(unstartedCount / Math.max(1, totalConcepts)) * 100}%`, background: "var(--bg-4)" }} title="Unstarted" />
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.78rem" }}>
            <span style={{ color: "var(--accent-success)" }}>● Mastered: {masteredCount}</span>
            <span style={{ color: "var(--accent-primary)" }}>● In Progress: {inProgressCount}</span>
            <span style={{ color: "var(--text-2)" }}>● Unstarted: {unstartedCount}</span>
          </div>
        </div>

        {/* Detailed Concept Mastery Table */}
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-0)", marginBottom: "1rem" }}>
            Concept Performance Matrix
          </div>
          {concepts.length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: "var(--text-2)", textAlign: "center", padding: "2rem" }}>
              No concepts registered yet. Start by adding concepts in the study workspace!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {concepts.map((concept) => (
                <div
                  key={concept.id}
                  className="responsive-flex-stack"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ maxWidth: "100%" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-0)" }}>{concept.name}</div>
                    {concept.description && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-2)", marginTop: "0.15rem" }}>{concept.description}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between", width: "100%", maxWidth: "220px" }}>
                    <span className="badge badge-primary">Bloom L{concept.bloom_level}</span>
                    <div style={{ width: 100 }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-2)", textAlign: "right", marginBottom: "0.2rem" }}>
                        {Math.round(concept.mastery * 100)}%
                      </div>
                      <div className="progress-track">
                        <div className="progress-bar-fill" style={{ width: `${concept.mastery * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
