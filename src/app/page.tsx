"use client";
import { useEffect, useState, useCallback } from "react";
import { useNodesState, useEdgesState, Node, Edge } from "@xyflow/react";
import { api } from "@/lib/api";
import SyllabusPanel from "@/components/workspace/SyllabusPanel";
import SchemaCenterCanvas from "@/components/workspace/SchemaCenterCanvas";
import TestPortalPanel from "@/components/workspace/TestPortalPanel";
import ContrastModal from "@/components/workspace/ContrastModal";

interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  llm_provider: string;
  llm_model: string;
  vector_store: string;
}

export default function UnifiedStudyWorkspacePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [concepts, setConcepts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedConceptName, setSelectedConceptName] = useState<string | null>(null);

  // React Flow state for User Mental Model Schema (Center Canvas)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Contrast Reader Modal state
  const [isContrastOpen, setIsContrastOpen] = useState(false);

  // ── 1. Load Data ────────────────────────────────────────────────────────────
  const loadWorkspaceData = useCallback(async () => {
    try {
      const [healthRes, recsRes, userGraphRes] = await Promise.all([
        api.health().catch(() => null),
        api.getRecommendations(5).catch(() => ({ recommendations: [] })),
        api.getUserGraph().catch(() => ({ nodes: [], edges: [] })),
      ]);

      if (healthRes) setHealth(healthRes as any);
      if (recsRes?.recommendations) {
        setRecommendations(recsRes.recommendations);
      }

      // Convert user graph to React Flow positioned nodes
      const userNodes: Node[] = (userGraphRes?.nodes || []).map((node: any, idx: number) => ({
        ...node,
        position: node.position && (node.position.x !== 0 || node.position.y !== 0)
          ? node.position
          : { x: (idx % 4) * 220 + 80, y: Math.floor(idx / 4) * 140 + 80 },
      }));

      const userEdges: Edge[] = (userGraphRes?.edges || []).map((edge: any) => ({
        ...edge,
        style: { stroke: "#6366f1", strokeWidth: 1.5 },
      }));

      setNodes(userNodes);
      setEdges(userEdges);

      // Extract list of all known concepts from grand graph
      const grandGraphRes = await api.getGraph().catch(() => ({ nodes: [] }));
      const conceptList = (grandGraphRes?.nodes || []).map((n: any) => ({
        id: n.id,
        name: n.data?.label || n.id,
        mastery: n.data?.mastery || 0,
        description: n.data?.description || "",
      }));
      setConcepts(conceptList);

      // Auto-select first recommendation if none selected
      if (!selectedConceptId && recsRes?.recommendations?.length > 0) {
        setSelectedConceptId(recsRes.recommendations[0].id);
        setSelectedConceptName(recsRes.recommendations[0].name);
      } else if (!selectedConceptId && conceptList.length > 0) {
        setSelectedConceptId(conceptList[0].id);
        setSelectedConceptName(conceptList[0].name);
      }
    } catch (err) {
      console.error("Failed to load workspace data:", err);
    }
  }, [selectedConceptId, setNodes, setEdges]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // ── 2. Selection Handlers ───────────────────────────────────────────────────
  const handleSelectConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    const found = concepts.find((c) => c.id === conceptId);
    if (found) {
      setSelectedConceptName(found.name);
    } else {
      const rec = recommendations.find((r) => r.id === conceptId);
      if (rec) setSelectedConceptName(rec.name);
    }
  };

  const handleSelectConceptByName = (name: string) => {
    const found = concepts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setSelectedConceptId(found.id);
      setSelectedConceptName(found.name);
    }
  };

  const handleTestCompleted = () => {
    loadWorkspaceData();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="top-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <a href="/" className="brand-logo">
            <span>🧠</span>
            <span>SuperLearn</span>
          </a>

          <div className="nav-status-badge">
            <span className={`status-dot ${health?.status === "healthy" ? "" : "offline"}`} />
            <span>
              {health
                ? `${health.llm_provider.toUpperCase()} (${health.llm_model}) · Embedded Qdrant`
                : "Engine Offline (Start uvicorn)"}
            </span>
          </div>
        </div>

        {/* Center Target Indicator */}
        {selectedConceptName && (
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-1)" }}>
            Current Focus: <span style={{ color: "var(--accent-secondary)" }}>{selectedConceptName}</span>
          </div>
        )}

        {/* Navigation & Analytics Link */}
        <div className="nav-links">
          <button
            className="nav-btn"
            onClick={() => setIsContrastOpen(true)}
            title="Cross-Document Contrast Alignment"
          >
            📚 Contrast Reader
          </button>
          <a href="/analytics" className="nav-btn">
            📊 Analytics & Mastery
          </a>
        </div>
      </header>

      {/* ── 3-Pane Unified Cognitive Study Workspace ───────────────────────── */}
      <div className="workspace-container">
        {/* Left Side: Syllabus & FSRS Priority Queue */}
        <SyllabusPanel
          concepts={concepts}
          recommendations={recommendations}
          selectedConceptId={selectedConceptId}
          onSelectConcept={handleSelectConcept}
          onRefreshGraph={loadWorkspaceData}
          onOpenContrastModal={() => setIsContrastOpen(true)}
        />

        {/* Center Canvas: Mental Model Schema (React Flow) */}
        <SchemaCenterCanvas
          nodes={nodes}
          edges={edges}
          selectedConceptName={selectedConceptName}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setEdges={setEdges}
          onRefreshUserGraph={loadWorkspaceData}
          onSelectConceptByName={handleSelectConceptByName}
        />

        {/* Right Side: Adaptive Bloom Testing Portal */}
        <TestPortalPanel
          selectedConceptId={selectedConceptId}
          selectedConceptName={selectedConceptName}
          onTestCompleted={handleTestCompleted}
        />
      </div>

      {/* ── Multisource Contrast Reader Modal ───────────────────────────────── */}
      <ContrastModal
        isOpen={isContrastOpen}
        onClose={() => setIsContrastOpen(false)}
        initialQuery={selectedConceptName || ""}
      />
    </div>
  );
}
