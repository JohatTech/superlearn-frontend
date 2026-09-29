"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, MultiModelCompareResponse, SyllabusModelResult } from "@/lib/api";

function SyllabusBenchmarkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";

  const [topic, setTopic] = useState(initialTopic);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comparisonData, setComparisonData] = useState<MultiModelCompareResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [approvingModelId, setApprovingModelId] = useState<string | null>(null);

  const handleRunComparison = useCallback(async (searchTopic?: string) => {
    const queryTopic = (searchTopic || topic).trim();
    if (!queryTopic) return;

    setIsGenerating(true);
    setErrorMessage("");
    setComparisonData(null);

    try {
      const data = await api.compareSyllabusModels(queryTopic);
      setComparisonData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute multi-model benchmark.");
    } finally {
      setIsGenerating(false);
    }
  }, [topic]);

  useEffect(() => {
    if (initialTopic) {
      handleRunComparison(initialTopic);
    }
  }, [initialTopic, handleRunComparison]);

  const handleApproveClassroom = async (modelRes: SyllabusModelResult) => {
    if (!modelRes.syllabus || modelRes.status !== "success") return;
    
    setApprovingModelId(modelRes.model_id);
    setErrorMessage("");

    try {
      const approved = await api.approveSyllabus({
        topic_query: topic.trim() || modelRes.syllabus.syllabus_title,
        syllabus_title: modelRes.syllabus.syllabus_title,
        description: modelRes.syllabus.description,
        topics: modelRes.syllabus.topics,
      });

      // Redirect directly to the newly created classroom
      router.push(`/classroom/${approved.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save classroom.");
      setApprovingModelId(null);
    }
  };

  // Extract maximum values for comparative bar charts scaling
  const getMetricMax = (key: keyof SyllabusModelResult["metrics"]) => {
    if (!comparisonData) return 1;
    const vals = comparisonData.models.map((m) => Number(m.metrics[key]) || 0);
    const maxVal = Math.max(...vals);
    return maxVal > 0 ? maxVal : 1;
  };

  const getModelColor = (modelId: string) => {
    switch (modelId) {
      case "phi":
        return "#6366f1"; // Indigo
      case "qwen":
        return "#06b6d4"; // Cyan
      case "azure_openai":
        return "#10b981"; // Emerald
      default:
        return "#a855f7";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-0)", color: "var(--text-0)" }}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="top-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/" className="brand-logo" onClick={(e) => { e.preventDefault(); router.push("/"); }}>
            <span>🧠</span>
            <span>SuperLearn</span>
          </a>
          <span style={{ color: "var(--text-3)", fontSize: "0.9rem" }}>/</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)" }}>
            🎓 Multi-Model Syllabus Benchmark
          </span>
        </div>

        <button className="btn btn-outline btn-sm" onClick={() => router.push("/")}>
          ← Back to Classrooms
        </button>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          
          {/* Top Hero & Input Card */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(14, 17, 23, 0.9) 0%, rgba(21, 24, 33, 0.9) 100%)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem 2rem",
              boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Multi-Model Syllabus Generation Benchmark
                </h1>
                <p style={{ fontSize: "0.85rem", color: "var(--text-1)", marginTop: "0.35rem", maxWidth: "750px" }}>
                  Test and compare 3 AI models (<strong>Phi-4</strong>, <strong>Qwen-2.5</strong>, and <strong>Azure OpenAI</strong>) side-by-side. Generations execute <em>sequentially</em> to protect local RAM and VRAM. Select your preferred syllabus to create your classroom.
                </p>
              </div>

              {/* Models Badge Strip */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-xs)", fontSize: "0.72rem", fontWeight: 600 }}>
                  Phi-4 (Local)
                </span>
                <span className="badge" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee", border: "1px solid rgba(6, 182, 212, 0.3)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-xs)", fontSize: "0.72rem", fontWeight: 600 }}>
                  Qwen-2.5 (Local)
                </span>
                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "0.3rem 0.6rem", borderRadius: "var(--radius-xs)", fontSize: "0.72rem", fontWeight: 600 }}>
                  Azure OpenAI (Cloud)
                </span>
              </div>
            </div>

            {/* Prompt Form */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <input
                className="syllabus-prompt-input"
                style={{ flex: 1, fontSize: "0.95rem", padding: "0.75rem 1rem" }}
                placeholder="Enter topic prompt (e.g. Vibration Mechanics, Quantum Computing, Machine Learning)..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunComparison()}
              />
              <button
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.5rem", fontWeight: 700, whiteSpace: "nowrap" }}
                disabled={isGenerating || !topic.trim()}
                onClick={() => handleRunComparison()}
              >
                {isGenerating ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    Running Sequential Benchmark...
                  </span>
                ) : (
                  "⚡ Benchmark 3 Models"
                )}
              </button>
            </div>

            {errorMessage && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(239, 68, 68, 0.15)", border: "1px solid var(--accent-danger)", color: "var(--accent-danger)", borderRadius: "var(--radius-xs)", fontSize: "0.8rem" }}>
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* Sequential Loading Stepper Banner */}
          {isGenerating && (
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <span className="spinner" style={{ width: 20, height: 20 }} />
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Executing 3 Models Sequentially (RAM / VRAM Safe Mode)...
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "0.5rem" }}>
                <div style={{ background: "var(--bg-3)", padding: "0.75rem", borderRadius: "var(--radius-xs)", borderLeft: "4px solid #6366f1" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#818cf8" }}>Step 1: Phi-4 (Local Ollama)</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Generating syllabus structure...</div>
                </div>
                <div style={{ background: "var(--bg-3)", padding: "0.75rem", borderRadius: "var(--radius-xs)", borderLeft: "4px solid #06b6d4" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22d3ee" }}>Step 2: Qwen-2.5 (Local Ollama)</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Awaiting turn (prevents VRAM spike)...</div>
                </div>
                <div style={{ background: "var(--bg-3)", padding: "0.75rem", borderRadius: "var(--radius-xs)", borderLeft: "4px solid #10b981" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#34d399" }}>Step 3: Azure OpenAI (Cloud API)</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: "0.2rem" }}>Awaiting turn...</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Comparative Performance Analytics & Interactive Graphs ────────── */}
          {comparisonData && !isGenerating && (
            <div style={{ background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-0)" }}>
                    📊 Performance & Hardware Telemetry Comparative Analysis
                  </h2>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-2)", marginTop: "0.15rem" }}>
                    Benchmark results for topic: "<strong>{comparisonData.topic}</strong>"
                  </div>
                </div>
              </div>

              {/* 4 Performance Graph Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                
                {/* Graph 1: Inference Latency */}
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.75rem" }}>
                    ⏱️ Inference Latency (Seconds)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {comparisonData.models.map((m) => {
                      const val = m.metrics.inference_time_seconds;
                      const max = getMetricMax("inference_time_seconds");
                      const pct = Math.min(100, Math.round((val / max) * 100));
                      const color = getModelColor(m.model_id);
                      return (
                        <div key={m.model_id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                            <span>{m.model_name}</span>
                            <span style={{ fontWeight: 700, color }}>{m.status === "success" ? `${val}s` : "Failed"}</span>
                          </div>
                          <div style={{ height: "8px", background: "var(--bg-3)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${m.status === "success" ? Math.max(pct, 5) : 0}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graph 2: Hardware GPU Usage % */}
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.75rem" }}>
                    ⚡ Peak GPU Utilization (%)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {comparisonData.models.map((m) => {
                      const val = m.metrics.gpu_usage_percent;
                      const color = getModelColor(m.model_id);
                      return (
                        <div key={m.model_id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                            <span>{m.model_name}</span>
                            <span style={{ fontWeight: 700, color }}>{m.status === "success" ? `${val}%` : "N/A"}</span>
                          </div>
                          <div style={{ height: "8px", background: "var(--bg-3)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, Math.max(val, 2))}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graph 3: VRAM Memory Used (MB) */}
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.75rem" }}>
                    💾 Peak VRAM Consumption (MB)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {comparisonData.models.map((m) => {
                      const val = m.metrics.vram_used_mb;
                      const max = getMetricMax("vram_used_mb");
                      const pct = Math.min(100, Math.round((val / max) * 100));
                      const color = getModelColor(m.model_id);
                      return (
                        <div key={m.model_id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                            <span>{m.model_name}</span>
                            <span style={{ fontWeight: 700, color }}>{val > 0 ? `${val} MB` : "API Direct"}</span>
                          </div>
                          <div style={{ height: "8px", background: "var(--bg-3)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${val > 0 ? Math.max(pct, 5) : 0}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Graph 4: Topic Count */}
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.75rem" }}>
                    📖 Curriculum Topics Generated
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {comparisonData.models.map((m) => {
                      const val = m.metrics.topic_count;
                      const max = getMetricMax("topic_count");
                      const pct = Math.min(100, Math.round((val / max) * 100));
                      const color = getModelColor(m.model_id);
                      return (
                        <div key={m.model_id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.2rem" }}>
                            <span>{m.model_name}</span>
                            <span style={{ fontWeight: 700, color }}>{val} Topics</span>
                          </div>
                          <div style={{ height: "8px", background: "var(--bg-3)", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${val > 0 ? Math.max(pct, 5) : 0}%`, height: "100%", background: color, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── Side-by-Side Model Syllabus Display Columns ──────────────────── */}
          {comparisonData && !isGenerating && (
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-0)", marginBottom: "1rem" }}>
                📜 Generated Syllabi Side-by-Side Comparison
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", alignItems: "stretch" }}>
                {comparisonData.models.map((m) => {
                  const color = getModelColor(m.model_id);
                  const isSuccess = m.status === "success" && m.syllabus;

                  return (
                    <div
                      key={m.model_id}
                      style={{
                        background: "var(--bg-1)",
                        border: `1px solid ${color}44`,
                        borderRadius: "var(--radius-lg)",
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        boxShadow: `0 4px 20px ${color}15`,
                      }}
                    >
                      {/* Column Header */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <div>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-0)" }}>
                              {m.model_name}
                            </div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-2)", fontFamily: "monospace" }}>
                              {m.model_tag}
                            </div>
                          </div>

                          <span
                            className="badge"
                            style={{
                              background: isSuccess ? `${color}20` : "rgba(239,68,68,0.15)",
                              color: isSuccess ? color : "var(--accent-danger)",
                              border: `1px solid ${isSuccess ? color : "var(--accent-danger)"}44`,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                            }}
                          >
                            {isSuccess ? "● Generated" : "✕ Error"}
                          </span>
                        </div>

                        {/* Performance Statistics Metrics Card */}
                        <div
                          style={{
                            background: "var(--bg-2)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-xs)",
                            padding: "0.6rem 0.75rem",
                            marginBottom: "1rem",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "0.4rem",
                            fontSize: "0.7rem",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--text-2)" }}>Inference Time: </span>
                            <strong style={{ color: "var(--text-0)" }}>{m.metrics.inference_time_seconds}s</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-2)" }}>GPU Usage: </span>
                            <strong style={{ color: "var(--text-0)" }}>{m.metrics.gpu_usage_percent}%</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-2)" }}>VRAM Used: </span>
                            <strong style={{ color: "var(--text-0)" }}>{m.metrics.vram_used_mb} MB</strong>
                          </div>
                          <div>
                            <span style={{ color: "var(--text-2)" }}>GPU Model: </span>
                            <strong style={{ color: "var(--text-0)", fontSize: "0.65rem" }} title={m.metrics.gpu_model}>
                              {m.metrics.gpu_model.length > 14 ? `${m.metrics.gpu_model.slice(0, 14)}...` : m.metrics.gpu_model}
                            </strong>
                          </div>
                        </div>

                        {/* Syllabus Body */}
                        {isSuccess ? (
                          <div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-0)", marginBottom: "0.25rem" }}>
                              {m.syllabus!.syllabus_title}
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-1)", lineHeight: 1.4, marginBottom: "0.85rem" }}>
                              {m.syllabus!.description}
                            </p>

                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: color, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              Curriculum Topics ({m.syllabus!.topics.length})
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "360px", overflowY: "auto", paddingRight: "0.2rem" }}>
                              {m.syllabus!.topics.map((t, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: "var(--bg-2)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "var(--radius-xs)",
                                    padding: "0.5rem 0.6rem",
                                  }}
                                >
                                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-0)" }}>
                                    {idx + 1}. {t.name}
                                  </div>
                                  {t.description && (
                                    <div style={{ fontSize: "0.68rem", color: "var(--text-2)", marginTop: "0.15rem", lineHeight: 1.3 }}>
                                      {t.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: "1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-xs)", color: "var(--accent-danger)", fontSize: "0.75rem" }}>
                            <strong>Generation Error:</strong>
                            <div style={{ marginTop: "0.25rem", fontFamily: "monospace", fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                              {m.error_message || "Failed to generate syllabus for this model."}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Accept / Approve Button */}
                      <div style={{ marginTop: "1.25rem" }}>
                        <button
                          className="btn btn-primary"
                          style={{
                            width: "100%",
                            background: isSuccess ? color : "var(--bg-3)",
                            borderColor: isSuccess ? color : "var(--border)",
                            padding: "0.65rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            opacity: isSuccess ? 1 : 0.5,
                            cursor: isSuccess ? "pointer" : "not-allowed",
                          }}
                          disabled={!isSuccess || approvingModelId === m.model_id}
                          onClick={() => handleApproveClassroom(m)}
                        >
                          {approvingModelId === m.model_id ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                              <span className="spinner" style={{ width: 14, height: 14 }} />
                              Creating Classroom...
                            </span>
                          ) : (
                            `✓ Accept ${m.model_name} Syllabus`
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function SyllabusBenchmarkPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-0)", color: "var(--text-0)" }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    }>
      <SyllabusBenchmarkContent />
    </Suspense>
  );
}
