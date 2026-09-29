const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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

export interface SyllabusModelResult {
  model_id: string;
  model_name: string;
  provider: string;
  model_tag: string;
  status: "success" | "error";
  error_message?: string | null;
  metrics: {
    inference_time_seconds: number;
    gpu_model: string;
    gpu_usage_percent: number;
    vram_used_mb: number;
    vram_total_mb: number;
    topic_count: number;
  };
  syllabus?: {
    syllabus_title: string;
    description: string;
    topics: { name: string; description: string }[];
  } | null;
}

export interface MultiModelCompareResponse {
  topic: string;
  timestamp: number;
  models: SyllabusModelResult[];
}

export const api = {
  // ── Dynamic Syllabus & Knowledge Graph ──────────────────────────────────────
  getGraph: (classroomId?: string) =>
    request<{ nodes: any[]; edges: any[] }>(
      `/api/v1/syllabus/graph${classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : ""}`
    ),
  getRecommendations: (classroomId?: string, top_k = 5) =>
    request<{ recommendations: any[] }>(
      `/api/v1/syllabus/route-next?top_k=${top_k}${
        classroomId ? `&classroom_id=${encodeURIComponent(classroomId)}` : ""
      }`
    ),
  addConcept: (
    name: string,
    description: string,
    classroomId?: string,
    position_x?: number,
    position_y?: number
  ) =>
    request("/api/v1/syllabus/concepts", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        classroom_id: classroomId,
        position_x,
        position_y,
      }),
    }),
  addEdge: (
    source_concept_id: string,
    target_concept_id: string,
    semantic_relation_label = "prerequisite_for",
    graph_partition = "grand",
    classroomId?: string
  ) =>
    request("/api/v1/syllabus/edges", {
      method: "POST",
      body: JSON.stringify({
        source_concept_id,
        target_concept_id,
        semantic_relation_label,
        graph_partition,
        classroom_id: classroomId,
      }),
    }),

  // ── Mental Schema & Confusion Compass ───────────────────────────────────────
  getUserGraph: (classroomId?: string) =>
    request<{ nodes: any[]; edges: any[] }>(
      `/api/v1/schema/user-graph${classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : ""}`
    ),
  addUserConcept: (
    name: string,
    description: string,
    classroomId?: string,
    position_x?: number,
    position_y?: number
  ) =>
    request("/api/v1/schema/user-concept", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        classroom_id: classroomId,
        position_x,
        position_y,
      }),
    }),
  addUserEdge: (
    source_concept_id: string,
    target_concept_id: string,
    semantic_relation_label = "relates_to",
    classroomId?: string
  ) =>
    request("/api/v1/schema/user-edge", {
      method: "POST",
      body: JSON.stringify({
        source_concept_id,
        target_concept_id,
        semantic_relation_label,
        classroom_id: classroomId,
      }),
    }),
  deleteUserConcept: (conceptId: string) =>
    request<{ deleted: boolean; id: string; message: string }>(
      `/api/v1/schema/user-concept/${encodeURIComponent(conceptId)}`,
      { method: "DELETE" }
    ),
  updateUserConcept: (conceptId: string, name?: string, description?: string) =>
    request<{ id: string; name: string; description: string; message: string }>(
      `/api/v1/schema/user-concept/${encodeURIComponent(conceptId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name, description }),
      }
    ),
  saveLayout: (positions: { id: string; position: { x: number; y: number } }[], classroomId?: string) =>
    request("/api/v1/schema/layout", {
      method: "POST",
      body: JSON.stringify({ positions, classroom_id: classroomId }),
    }),
  diffGraphs: (classroomId?: string) =>
    request<any>(
      `/api/v1/schema/diff${classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : ""}`
    ),
  uploadMindMap: async (file: File, classroomId?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (classroomId) form.append("classroom_id", classroomId);
    const res = await fetch(`${API_BASE}/api/v1/schema/parse-mindmap`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Study Materials & References Search ─────────────────────────────────────
  searchReferences: (conceptName: string, conceptDescription?: string) => {
    const params = new URLSearchParams({ concept_name: conceptName });
    if (conceptDescription) params.append("concept_description", conceptDescription);
    return request<any>(`/api/v1/references/search?${params.toString()}`);
  },
  streamReferences: async (
    conceptName: string,
    conceptDescription: string = "",
    onReference: (ref: any) => void,
    onComplete?: () => void
  ) => {
    const params = new URLSearchParams({ concept_name: conceptName });
    if (conceptDescription) params.append("concept_description", conceptDescription);
    const res = await fetch(`${API_BASE}/api/v1/references/stream?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete line chunk

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const item = JSON.parse(line.trim());
          if (item.error) {
            console.error("Reference stream item error:", item.error);
          } else {
            onReference(item);
          }
        } catch (e) {
          console.warn("Failed to parse reference stream line:", e);
        }
      }
    }

    if (buffer.trim()) {
      try {
        const item = JSON.parse(buffer.trim());
        if (!item.error) onReference(item);
      } catch (e) {
        // ignore incomplete tail
      }
    }

    if (onComplete) onComplete();
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
  generateQuestion: (concept_id: string, bloom_tier = 4, classroomId?: string) =>
    request<any>("/api/v1/test/generate", {
      method: "POST",
      body: JSON.stringify({ concept_id, bloom_tier, classroom_id: classroomId }),
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
  getTestHistory: (classroomId?: string, conceptId?: string, limit = 50) => {
    const params = new URLSearchParams();
    if (classroomId) params.append("classroom_id", classroomId);
    if (conceptId) params.append("concept_id", conceptId);
    params.append("limit", limit.toString());
    return request<any[]>(`/api/v1/test/history?${params.toString()}`);
  },
  getTestSession: (sessionId: string) => request<any>(`/api/v1/test/session/${sessionId}`),
  getClassroomAnalytics: (classroomId: string) =>
    request<any>(`/api/v1/test/classroom/${classroomId}/analytics`),

  // ── Classroom & Syllabus Master ─────────────────────────────────────────────
  generateSyllabus: (topic: string) =>
    request<{ syllabus_title: string; description: string; topics: { name: string; description: string }[] }>(
      "/api/v1/syllabus-master/generate",
      {
        method: "POST",
        body: JSON.stringify({ topic }),
      }
    ),
  compareSyllabusModels: (topic: string) =>
    request<MultiModelCompareResponse>("/api/v1/syllabus-master/compare-models", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
  approveSyllabus: (payload: {
    topic_query: string;
    syllabus_title: string;
    description: string;
    topics: { name: string; description: string }[];
  }) =>
    request<{ id: string; title: string; description: string; message: string }>("/api/v1/syllabus-master/approve", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listClassrooms: () => request<any[]>("/api/v1/classrooms"),
  getClassroom: (id: string) => request<any>(`/api/v1/classrooms/${id}`),
  deleteClassroom: (id: string) => request<{ message: string }>(`/api/v1/classrooms/${id}`, { method: "DELETE" }),

  // ── System Health ───────────────────────────────────────────────────────────
  health: () =>
    request<{ status: string; llm_provider: string; llm_model: string; vector_store: string }>(
      "/health"
    ),
};
