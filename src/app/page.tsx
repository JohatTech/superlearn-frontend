"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import SyllabusMasterPanel from "@/components/workspace/SyllabusMasterPanel";

interface Classroom {
  id: string;
  title: string;
  description: string;
  topic_query: string;
  created_at: string;
}

interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  llm_provider: string;
  llm_model: string;
  vector_store: string;
}

export default function UnifiedStudyWorkspacePage() {
  const router = useRouter();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");
  const [mobileTab, setMobileTab] = useState<"classrooms" | "hub" | "syllabus">("hub");

  // ── 1. Load Data ────────────────────────────────────────────────────────────
  const loadHubData = useCallback(async () => {
    try {
      const [healthRes, classroomsRes] = await Promise.all([
        api.health().catch(() => null),
        api.listClassrooms().catch(() => []),
      ]);

      if (healthRes) setHealth(healthRes as any);
      setClassrooms(classroomsRes);
    } catch (err) {
      console.error("Failed to load hub data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  const handleDeleteClassroom = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click trigger
    if (!confirm("Are you sure you want to delete this classroom? All its syllabus topics and settings will be permanently lost.")) {
      return;
    }
    try {
      await api.deleteClassroom(id);
      setClassrooms((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete classroom.");
      setTimeout(() => setDeleteError(""), 4000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="top-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <a href="/" className="brand-logo" onClick={(e) => { e.preventDefault(); loadHubData(); }}>
            <span>🧠</span>
            <span>SuperLearn</span>
          </a>

          <div className="nav-status-badge">
            <span className={`status-dot ${health?.status === "healthy" ? "" : "offline"}`} />
            <span>
              {health
                ? `${health.llm_provider.toUpperCase()} (${health.llm_model})`
                : "Engine Offline"}
            </span>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-1)" }}>
          Classroom Hub & Learning Workspace
        </div>
      </header>

      {/* ── 3-Pane Layout ─────────────────────────────────────────────────── */}
      <div className="workspace-container">
        {/* Left Panel: Sidebar list of Classrooms */}
        <aside className={`workspace-left-panel ${mobileTab === "classrooms" ? "mobile-visible" : ""}`} style={{ width: "280px" }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">📚 My Classrooms</div>
              <div className="panel-subtitle">{classrooms.length} active spaces</div>
            </div>
          </div>
          
          <div className="panel-scrollable" style={{ padding: "0.75rem" }}>
            {deleteError && (
              <div style={{ padding: "0.5rem", fontSize: "0.72rem", background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-danger)", borderRadius: "var(--radius-xs)", marginBottom: "0.5rem" }}>
                {deleteError}
              </div>
            )}
            
            {classrooms.length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "var(--text-2)", textAlign: "center", padding: "1.5rem 0" }}>
                No classrooms yet. Tap "Create" to build one!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {classrooms.map((c) => (
                  <div
                    key={c.id}
                    className="classroom-syllabus-item"
                    onClick={() => router.push(`/classroom/${c.id}`)}
                    style={{ justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", overflow: "hidden" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-2)" }}>
                        Topic: {c.topic_query}
                      </div>
                    </div>
                    <button
                      className="syllabus-action-btn delete"
                      onClick={(e) => handleDeleteClassroom(e, c.id)}
                      style={{ opacity: 0.6 }}
                      title="Delete Classroom"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Panel: Beautiful Welcome dashboard */}
        <main className={`workspace-center-canvas ${mobileTab === "hub" ? "mobile-visible" : ""}`} style={{ padding: "1.25rem", overflowY: "auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Hero Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                position: "relative",
              }}
            >
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.4rem", background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                SuperLearn Cognitive Hub
              </h1>
              <p style={{ fontSize: "0.85rem", color: "var(--text-1)", lineHeight: 1.5, maxWidth: "600px" }}>
                Welcome to your closed-loop autonomous learning engine. Select an approved classroom below to begin studying, or tap the button below to generate a new custom syllabus.
              </p>
            </div>

            {/* Prominent Mobile/Desktop Syllabus Prompt Action Box */}
            <div
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-0)" }}>
                  🎓 Build a New Academic Syllabus
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "0.15rem" }}>
                  Enter any topic to generate a university-level curriculum.
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setMobileTab("syllabus")}
                style={{ padding: "0.6rem 1rem", fontSize: "0.82rem" }}
              >
                + Create Syllabus Path
              </button>
            </div>

            {/* Classrooms Grid Section */}
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-0)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🏫</span> Active Classrooms ({classrooms.length})
              </h2>

              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                  <span className="spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : classrooms.length === 0 ? (
                <div
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "var(--text-2)",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>🗺️</span>
                  <div style={{ fontWeight: 700, color: "var(--text-1)", marginTop: "0.75rem" }}>No classrooms created yet</div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-2)", marginTop: "0.25rem" }}>
                    Build your first classroom using the Syllabus Master assistant.
                  </p>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setMobileTab("syllabus")}
                  >
                    🎓 Create Syllabus
                  </button>
                </div>
              ) : (
                <div className="classroom-grid">
                  {classrooms.map((c) => (
                    <div
                      key={c.id}
                      className="classroom-card"
                      onClick={() => router.push(`/classroom/${c.id}`)}
                    >
                      <div>
                        <div className="classroom-card-title">{c.title}</div>
                        <div className="classroom-card-desc">{c.description}</div>
                      </div>
                      <div className="classroom-card-meta">
                        <span>Query: <strong>{c.topic_query}</strong></span>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", borderColor: "var(--border)" }}
                        >
                          Enter →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Panel: Syllabus Master Generation Prompt */}
        <SyllabusMasterPanel
          className={mobileTab === "syllabus" ? "mobile-visible" : ""}
          onRefreshClassrooms={loadHubData}
        />
      </div>

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className="mobile-tab-bar">
        <button
          className={`mobile-tab-btn ${mobileTab === "classrooms" ? "active" : ""}`}
          onClick={() => setMobileTab("classrooms")}
        >
          <span className="tab-icon">📚</span>
          <span>Classrooms</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === "hub" ? "active" : ""}`}
          onClick={() => setMobileTab("hub")}
        >
          <span className="tab-icon">🧠</span>
          <span>Hub</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === "syllabus" ? "active" : ""}`}
          onClick={() => setMobileTab("syllabus")}
        >
          <span className="tab-icon">🎓</span>
          <span>Create</span>
        </button>
      </nav>
    </div>
  );
}
