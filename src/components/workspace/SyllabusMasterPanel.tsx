"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Topic {
  name: string;
  description: string;
}

interface SyllabusMasterPanelProps {
  onRefreshClassrooms?: () => void;
  className?: string;
}

export default function SyllabusMasterPanel({ onRefreshClassrooms, className = "" }: SyllabusMasterPanelProps) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState<"prompt" | "generating" | "preview">("prompt");
  const [syllabusTitle, setSyllabusTitle] = useState("");
  const [syllabusDescription, setSyllabusDescription] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setPhase("generating");
    setErrorMessage("");
    try {
      const response = await api.generateSyllabus(topic.trim());
      setSyllabusTitle(response.syllabus_title);
      setSyllabusDescription(response.description);
      setTopics(response.topics);
      setPhase("preview");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate syllabus preview.");
      setPhase("prompt");
    }
  };

  const handleApprove = async () => {
    if (topics.length === 0) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await api.approveSyllabus({
        topic_query: topic.trim() || syllabusTitle,
        syllabus_title: syllabusTitle,
        description: syllabusDescription,
        topics: topics.filter((t) => t.name.trim() !== ""),
      });
      if (onRefreshClassrooms) {
        onRefreshClassrooms();
      }
      // Redirect to the newly created classroom study page
      router.push(`/classroom/${result.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to approve and save classroom.");
      setIsSaving(false);
    }
  };

  const handleUpdateTopicName = (index: number, newName: string) => {
    const updated = [...topics];
    updated[index].name = newName;
    setTopics(updated);
  };

  const handleUpdateTopicDesc = (index: number, newDesc: string) => {
    const updated = [...topics];
    updated[index].description = newDesc;
    setTopics(updated);
  };

  const handleAddTopic = () => {
    setTopics([...topics, { name: "New Topic", description: "Topic description..." }]);
  };

  const handleRemoveTopic = (index: number) => {
    const updated = topics.filter((_, idx) => idx !== index);
    setTopics(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...topics];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setTopics(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === topics.length - 1) return;
    const updated = [...topics];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setTopics(updated);
  };

  return (
    <aside className={`workspace-right-panel ${className}`} style={{ flexGrow: 1 }}>
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title">🎓 Syllabus Master</div>
          <div className="panel-subtitle">LLM-Generated Learning Classrooms</div>
        </div>
        {phase === "preview" && (
          <button className="btn btn-outline btn-sm" onClick={() => setPhase("prompt")}>
            ✕ Cancel
          </button>
        )}
      </div>

      {/* Scrollable Body */}
      <div className="panel-scrollable">
        {errorMessage && (
          <div
            style={{
              padding: "0.6rem",
              fontSize: "0.75rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--accent-danger)",
              borderRadius: "var(--radius-xs)",
              color: "var(--accent-danger)",
              marginBottom: "1rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* ── PHASE 1: PROMPT ENTRY ───────────────────────────────────────── */}
        {phase === "prompt" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="syllabus-prompt-container">
              <label className="form-label" style={{ color: "var(--accent-secondary)" }}>
                Start a New Classroom Study Path
              </label>
              <input
                className="syllabus-prompt-input"
                placeholder="e.g. Vibration Mechanics, Quantum Mechanics, Next.js..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                autoFocus
              />
              <p style={{ fontSize: "0.75rem", color: "var(--text-2)", lineHeight: 1.4 }}>
                Enter any topic. Generate directly or benchmark side-by-side across 3 AI models (Phi, Qwen, Azure OpenAI) with real-time GPU performance statistics.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: "0.7rem", fontWeight: 700 }}
                  onClick={() => router.push(`/syllabus${topic.trim() ? `?topic=${encodeURIComponent(topic.trim())}` : ""}`)}
                >
                  ⚡ Multi-Model Compare (Phi, Qwen, Azure) →
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "0.6rem", fontSize: "0.8rem" }}
                  onClick={handleGenerate}
                  disabled={!topic.trim()}
                >
                  Draft Single Syllabus Path →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 2: GENERATING ─────────────────────────────────────────── */}
        {phase === "generating" && (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <span className="spinner" style={{ width: 32, height: 32, marginBottom: "1rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-0)" }}>
              Analyzing Syllabi Topologies...
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-2)", marginTop: "0.5rem", lineHeight: 1.5 }}>
              Interrogating top-tier university curricula to design the optimal pedagogical route for <strong style={{ color: "var(--accent-secondary)" }}>"{topic}"</strong>.
            </p>
          </div>
        )}

        {/* ── PHASE 3: PREVIEW & EDIT ─────────────────────────────────────── */}
        {phase === "preview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Syllabus Metadata Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Syllabus / Classroom Title</label>
                <textarea
                  className="textarea"
                  value={syllabusTitle}
                  onChange={(e) => setSyllabusTitle(e.target.value)}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                  }}
                  rows={1}
                  style={{ fontWeight: 700, fontSize: "0.9rem", resize: "none", overflow: "hidden", fontFamily: "inherit", minHeight: "38px" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Syllabus Overview Description</label>
                <textarea
                  className="textarea"
                  value={syllabusDescription}
                  onChange={(e) => setSyllabusDescription(e.target.value)}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                  }}
                  rows={2}
                  style={{ minHeight: "60px", fontFamily: "inherit", fontSize: "0.78rem", resize: "none", overflow: "hidden" }}
                />
              </div>
            </div>

            {/* Topics list */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.6rem",
                }}
              >
                <span className="form-label" style={{ marginBottom: 0 }}>
                  Curriculum Sequence ({topics.length} topics)
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddTopic}
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem" }}
                >
                  ➕ Add Topic
                </button>
              </div>

              <div className="syllabus-preview-list">
                {topics.map((t, idx) => (
                  <div key={idx} className="syllabus-preview-item">
                    <div className="syllabus-item-order">{idx + 1}</div>
                    
                    <div className="syllabus-item-content">
                      <textarea
                        className="syllabus-item-input-textarea"
                        value={t.name}
                        onChange={(e) => handleUpdateTopicName(idx, e.target.value)}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = "auto";
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                        }}
                        placeholder="Topic Title"
                        rows={1}
                        style={{ resize: "none", overflow: "hidden" }}
                      />
                      <textarea
                        className="syllabus-item-textarea"
                        value={t.description}
                        onChange={(e) => handleUpdateTopicDesc(idx, e.target.value)}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }
                        }}
                        onInput={(e) => {
                          e.currentTarget.style.height = "auto";
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                        }}
                        placeholder="Brief explanation..."
                        rows={1}
                        style={{ resize: "none", overflow: "hidden" }}
                      />
                    </div>

                    <div className="syllabus-item-actions">
                      <button
                        className="syllabus-action-btn"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        className="syllabus-action-btn"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === topics.length - 1}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        className="syllabus-action-btn delete"
                        onClick={() => handleRemoveTopic(idx)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approval Trigger */}
            <button
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.85rem" }}
              onClick={handleApprove}
              disabled={isSaving || topics.length === 0}
            >
              {isSaving ? (
                <>
                  <span className="spinner" style={{ width: 12, height: 12 }} /> Approving & Building Classroom...
                </>
              ) : (
                "✅ Approve & Start Study Classroom →"
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
