"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

type TestPhase = "idle" | "generating" | "answering" | "evaluating" | "feedback";

const BLOOM_LEVELS = [
  { level: 4, name: "Analyze", subtitle: "Deconstruct & Compare" },
  { level: 5, name: "Evaluate", subtitle: "Critique & Justify" },
  { level: 6, name: "Create", subtitle: "Synthesize & Formulate" },
];

interface TestPortalPanelProps {
  selectedConceptId: string | null;
  selectedConceptName: string | null;
  classroomId?: string;
  onTestCompleted: () => void;
  className?: string;
}

export default function TestPortalPanel({
  selectedConceptId,
  selectedConceptName,
  classroomId,
  onTestCompleted,
  className = "",
}: TestPortalPanelProps) {
  const [activeTab, setActiveTab] = useState<"portal" | "history">("portal");
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [bloomTier, setBloomTier] = useState<number>(4);
  const [sessionId, setSessionId] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");
  const [bloomLabel, setBloomLabel] = useState<string>("");
  const [answerText, setAnswerText] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // History state
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const startTimeRef = useRef<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer while answering
  useEffect(() => {
    let interval: any = null;
    if (phase === "answering") {
      interval = setInterval(() => {
        setElapsedSeconds(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const loadHistory = useCallback(async () => {
    if (!classroomId) return;
    setIsLoadingHistory(true);
    try {
      const history = await api.getTestHistory(classroomId);
      setTestHistory(history);
    } catch (err) {
      console.error("Failed to load test history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [classroomId]);

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  const handleGenerateQuestion = async () => {
    if (!selectedConceptId) return;
    setPhase("generating");
    setErrorMessage("");
    try {
      const response = await api.generateQuestion(selectedConceptId, bloomTier, classroomId);
      setSessionId(response.session_id);
      setQuestionText(response.question);
      setBloomLabel(response.bloom_label);
      setAnswerText("");
      setEvaluationResult(null);
      startTimeRef.current = Date.now();
      setPhase("answering");
    } catch (err: any) {
      setErrorMessage("❌ " + err.message);
      setPhase("idle");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;
    setPhase("evaluating");
    const effortSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const result = await api.submitAnswer(sessionId, answerText.trim(), effortSeconds);
      setEvaluationResult(result);
      setPhase("feedback");
      onTestCompleted();
      if (classroomId) loadHistory();
    } catch (err: any) {
      setErrorMessage("❌ Submission failed: " + err.message);
      setPhase("answering");
    }
  };

  const handleResetSession = () => {
    setPhase("idle");
    setSessionId("");
    setQuestionText("");
    setAnswerText("");
    setEvaluationResult(null);
    setErrorMessage("");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <aside className={`workspace-right-panel ${className}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <div>
          <div className="panel-title">🎯 Adaptive Test Portal</div>
          <div className="panel-subtitle">Forced Generation · Bloom Rubric</div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          {phase === "answering" && (
            <span className="badge badge-warn">⏱️ {formatTimer(elapsedSeconds)}</span>
          )}
          <div style={{ display: "flex", background: "var(--bg-2)", borderRadius: "var(--radius-xs)", padding: 2 }}>
            <button
              className={`btn btn-sm ${activeTab === "portal" ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.68rem", padding: "0.2rem 0.45rem" }}
              onClick={() => setActiveTab("portal")}
            >
              Test
            </button>
            <button
              className={`btn btn-sm ${activeTab === "history" ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: "0.68rem", padding: "0.2rem 0.45rem" }}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
          </div>
        </div>
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
              marginBottom: "0.5rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* ── HISTORY TAB ─────────────────────────────────────────────────── */}
        {activeTab === "history" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div className="form-label" style={{ margin: 0 }}>
                📜 Classroom Assessment History ({testHistory.length})
              </div>
              <button className="btn btn-secondary btn-sm" onClick={loadHistory} style={{ fontSize: "0.68rem" }}>
                Refresh
              </button>
            </div>

            {isLoadingHistory ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <span className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            ) : testHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-2)", fontSize: "0.8rem" }}>
                No completed tests yet in this classroom. Take your first test to see your score trajectory!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {testHistory.map((item) => (
                  <div
                    key={item.session_id}
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-0)" }}>
                        {item.concept_name || "Assessment"}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background:
                            item.score >= 0.8
                              ? "rgba(16, 185, 129, 0.15)"
                              : item.score >= 0.5
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color:
                            item.score >= 0.8
                              ? "var(--accent-success)"
                              : item.score >= 0.5
                              ? "var(--accent-warn)"
                              : "var(--accent-danger)",
                          fontWeight: 700,
                        }}
                      >
                        {Math.round((item.score || 0) * 100)}%
                      </span>
                    </div>

                    <div style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>
                      Bloom Level {item.bloom_tier} · {item.effort_latency_seconds || 0}s latency ·{" "}
                      {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : ""}
                    </div>

                    {item.feedback && (
                      <div style={{ fontSize: "0.72rem", color: "var(--text-1)", lineHeight: 1.4, marginTop: "0.2rem" }}>
                        {item.feedback.length > 120 ? item.feedback.slice(0, 120) + "..." : item.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── TEST PORTAL TAB ────────────────────────────────────────────── */
          <div>
            {/* ── PHASE 1: IDLE / CONFIGURATION ──────────────────────────────── */}
            {phase === "idle" && (
              <div>
                <div className="form-group">
                  <label className="form-label">Active Concept Target</label>
                  <div
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      color: selectedConceptName ? "var(--text-0)" : "var(--text-2)",
                    }}
                  >
                    {selectedConceptName || "← Select a concept from the syllabus"}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bloom's Taxonomy Challenge Level</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {BLOOM_LEVELS.map((b) => {
                      const isActive = bloomTier === b.level;
                      return (
                        <div
                          key={b.level}
                          onClick={() => setBloomTier(b.level)}
                          style={{
                            background: isActive ? "rgba(99, 102, 241, 0.15)" : "var(--bg-2)",
                            border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                            borderRadius: "var(--radius-sm)",
                            padding: "0.55rem 0.75rem",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: "0.82rem",
                                color: isActive ? "var(--accent-primary)" : "var(--text-0)",
                              }}
                            >
                              Level {b.level}: {b.name}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>{b.subtitle}</div>
                          </div>
                          {isActive && <span className="badge badge-primary">Selected</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.65rem" }}
                  onClick={handleGenerateQuestion}
                  disabled={!selectedConceptId}
                >
                  Synthesize Assessment Prompt →
                </button>
              </div>
            )}

            {/* ── PHASE 2: GENERATING PROMPT ──────────────────────────────────── */}
            {phase === "generating" && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <span className="spinner" style={{ width: 24, height: 24, marginBottom: "0.75rem" }} />
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-0)" }}>
                  Synthesizing Bloom Level {bloomTier} Challenge...
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "0.3rem" }}>
                  Formulating qualitative synthesis constraints
                </div>
              </div>
            )}

            {/* ── PHASE 3: ANSWERING / FORCED GENERATION ──────────────────────── */}
            {phase === "answering" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Meta Tags */}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  <span className="badge badge-primary">Bloom L{bloomTier}</span>
                  <span className="badge badge-cyan">{selectedConceptName}</span>
                  <span className="badge badge-warn">Anti-Spoiler Locked</span>
                </div>

                {/* Question Text */}
                <div
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.85rem",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    color: "var(--text-0)",
                  }}
                >
                  <div className="form-label" style={{ marginBottom: "0.4rem", color: "var(--accent-primary)" }}>
                    Assessment Question:
                  </div>
                  {questionText}
                </div>

                {/* Answer Textarea */}
                <div>
                  <div className="form-label" style={{ marginBottom: "0.3rem" }}>
                    Your Explanatory Synthesis:
                  </div>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 160 }}
                    placeholder="Draft your full explanation here. Explain the underlying mechanism, trade-offs, and conceptual dependencies..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    autoFocus
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "0.4rem",
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>
                      {answerText.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>
                      {answerText.trim().length < 20 ? "⚠️ Write a complete explanation" : "✅ Ready"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleResetSession}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleSubmitAnswer}
                    disabled={answerText.trim().length < 20}
                  >
                    Submit Answer for Evaluation →
                  </button>
                </div>
              </div>
            )}

            {/* ── PHASE 4: EVALUATING RUBRIC ─────────────────────────────────── */}
            {phase === "evaluating" && (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <span className="spinner" style={{ width: 24, height: 24, marginBottom: "0.75rem" }} />
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-0)" }}>
                  Conducting Qualitative Rubric Evaluation...
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "0.3rem" }}>
                  Analyzing conceptual depth, accuracy, and schema misconceptions
                </div>
              </div>
            )}

            {/* ── PHASE 5: EVALUATION FEEDBACK ───────────────────────────────── */}
            {phase === "feedback" && evaluationResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {/* Score Meter */}
                <div
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 800,
                      color:
                        evaluationResult.score >= 0.8
                          ? "var(--accent-success)"
                          : evaluationResult.score >= 0.5
                          ? "var(--accent-warn)"
                          : "var(--accent-danger)",
                    }}
                  >
                    {Math.round(evaluationResult.score * 100)}%
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
                    Demonstrated Bloom Level: {evaluationResult.bloom_level_demonstrated}
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.85rem",
                  }}
                >
                  <div className="form-label" style={{ color: "var(--accent-primary)", marginBottom: "0.3rem" }}>
                    Pedagogical Feedback
                  </div>
                  <div style={{ fontSize: "0.8rem", lineHeight: 1.6, color: "var(--text-1)" }}>
                    {evaluationResult.feedback}
                  </div>
                </div>

                {/* Strengths */}
                {evaluationResult.strengths?.length > 0 && (
                  <div>
                    <div className="form-label" style={{ color: "var(--accent-success)" }}>
                      Strengths Demonstrated
                    </div>
                    <ul style={{ paddingLeft: "1.2rem", fontSize: "0.78rem", color: "var(--accent-success)" }}>
                      {evaluationResult.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Misconceptions & Confusion Compass Links */}
                <div>
                  <div className="form-label" style={{ color: "var(--accent-danger)" }}>
                    Misconceptions & Edge Conflicts
                  </div>
                  {evaluationResult.misconceptions?.length > 0 ? (
                    evaluationResult.misconceptions.map((m: string, i: number) => (
                      <div key={i} className="conflict-chip">
                        <span className="conflict-dot-pulse" />
                        <span>{m}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-success)" }}>
                      ✅ No fundamental misconceptions detected.
                    </div>
                  )}
                </div>

                {/* FSRS Update Metrics */}
                {evaluationResult.fsrs_update && (
                  <div
                    style={{
                      background: "var(--bg-3)",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "0.72rem",
                      color: "var(--text-2)",
                    }}
                  >
                    FSRS Stability: <strong>{evaluationResult.fsrs_update.new_stability} days</strong> · Difficulty:{" "}
                    {evaluationResult.fsrs_update.new_difficulty}
                  </div>
                )}

                <button className="btn btn-primary" onClick={handleResetSession} style={{ width: "100%" }}>
                  Start Next Assessment Session →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
