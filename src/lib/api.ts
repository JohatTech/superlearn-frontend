const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  // ── Dynamic Syllabus & Knowledge Graph ──────────────────────────────────────
  getGraph: () => request<{ nodes: any[]; edges: any[] }>("/api/v1/syllabus/graph"),
  getRecommendations: (top_k = 5) =>
    request<{ recommendations: any[] }>(`/api/v1/syllabus/route-next?top_k=${top_k}`),
  addConcept: (name: string, description: string) =>
    request("/api/v1/syllabus/concepts", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  addEdge: (
    source_concept_id: string,
    target_concept_id: string,
    semantic_relation_label = "prerequisite_for",
    graph_partition = "grand"
  ) =>
    request("/api/v1/syllabus/edges", {
      method: "POST",
      body: JSON.stringify({
        source_concept_id,
        target_concept_id,
        semantic_relation_label,
        graph_partition,
      }),
    }),

  // ── Mental Schema & Confusion Compass ───────────────────────────────────────
  getUserGraph: () => request<{ nodes: any[]; edges: any[] }>("/api/v1/schema/user-graph"),
  addUserConcept: (name: string, description: string) =>
    request("/api/v1/schema/user-concept", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    }),
  addUserEdge: (
    source_concept_id: string,
    target_concept_id: string,
    semantic_relation_label = "relates_to"
  ) =>
    request("/api/v1/schema/user-edge", {
      method: "POST",
      body: JSON.stringify({
        source_concept_id,
        target_concept_id,
        semantic_relation_label,
      }),
    }),
  diffGraphs: () => request<any>("/api/v1/schema/diff"),
  uploadMindMap: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/v1/schema/parse-mindmap`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Multisource Contrast Ingestion ──────────────────────────────────────────
  uploadDocument: async (file: File, source_name: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("source_name", source_name);
    const res = await fetch(`${API_BASE}/api/v1/ingest/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  alignContrast: (query: string, source_a: string, source_b: string, top_k = 3) =>
    request<any>(
      `/api/v1/contrast/align?query=${encodeURIComponent(query)}&source_a=${encodeURIComponent(
        source_a
      )}&source_b=${encodeURIComponent(source_b)}&top_k=${top_k}`
    ),
  listSources: () => request<{ sources: string[] }>("/api/v1/contrast/sources"),
  search: (query: string, top_k = 5) =>
    request<{ results: any[] }>(
      `/api/v1/contrast/search?query=${encodeURIComponent(query)}&top_k=${top_k}`
    ),

  // ── Adaptive Testing & Bloom Assessment ─────────────────────────────────────
  generateQuestion: (concept_id: string, bloom_tier = 4) =>
    request<any>("/api/v1/test/generate", {
      method: "POST",
      body: JSON.stringify({ concept_id, bloom_tier }),
    }),
  submitAnswer: (session_id: string, answer_text: string, effort_latency_seconds: number) =>
    request<any>("/api/v1/test/submit", {
      method: "POST",
      body: JSON.stringify({
        session_id,
        answer_text,
        effort_latency_seconds,
      }),
    }),

  // ── System Health ───────────────────────────────────────────────────────────
  health: () =>
    request<{ status: string; llm_provider: string; llm_model: string; vector_store: string }>(
      "/health"
    ),
};
