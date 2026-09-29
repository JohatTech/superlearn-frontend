"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNodesState, useEdgesState, Node, Edge } from "@xyflow/react";
import { api } from "@/lib/api";
import SchemaCenterCanvas from "@/components/workspace/SchemaCenterCanvas";
import TestPortalPanel from "@/components/workspace/TestPortalPanel";
import ClassroomSyllabusPanel from "@/components/workspace/ClassroomSyllabusPanel";
import SearchReferencesModal from "@/components/workspace/SearchReferencesModal";

interface ClassroomDetails {
  id: string;
  title: string;
  description: string;
  topic_query: string;
  created_at: string;
  syllabus: {
    id: string;
    name: string;
    description: string;
    order_index: number;
    concept_id: string;
    mastery_score?: number;
    bloom_level?: number;
    fsrs_stability?: number;
  }[];
}

interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  llm_provider: string;
  llm_model: string;
  vector_store: string;
}

export default function ClassroomStudyPage() {
  const { id: classroomId } = useParams() as { id: string };
  const router = useRouter();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
  const [activeTopic, setActiveTopic] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"syllabus" | "canvas" | "test">("syllabus");

  // React Flow state for User Mental Model Schema (Center Canvas)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Search References Modal state
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [selectedReferenceConcept, setSelectedReferenceConcept] = useState<{ name: string; description?: string } | null>(null);

  const handleOpenSearchReferences = (conceptName: string, conceptDescription?: string) => {
    router.push(`/classroom/${classroomId}/references?concept=${encodeURIComponent(conceptName)}`);
  };

  // ── 1. Load Classroom & Workspace Data ──────────────────────────────────────
  const loadClassroomData = useCallback(async () => {
    try {
      const [healthRes, classroomRes, userGraphRes] = await Promise.all([
        api.health().catch(() => null),
        api.getClassroom(classroomId),
        api.getUserGraph(classroomId).catch(() => ({ nodes: [], edges: [] })),
      ]);

      if (healthRes) setHealth(healthRes as any);
      if (classroomRes) {
        setClassroom(classroomRes);
        // Default to first syllabus item if none selected
        if (!activeTopic && classroomRes.syllabus && classroomRes.syllabus.length > 0) {
          setActiveTopic(classroomRes.syllabus[0]);
        }
      }

      // Convert user graph (from OCR mindmap / database) to React Flow positioned nodes
      const userNodes: Node[] = (userGraphRes?.nodes || []).map((node: any, idx: number) => ({
        ...node,
        position:
          node.position && (node.position.x !== 0 || node.position.y !== 0)
            ? node.position
            : { x: (idx % 3) * 240 + 80, y: Math.floor(idx / 3) * 150 + 80 },
      }));

      const userEdges: Edge[] = (userGraphRes?.edges || []).map((edge: any) => ({
        ...edge,
        style: { stroke: "#6366f1", strokeWidth: 1.5 },
      }));

      setNodes(userNodes);
      setEdges(userEdges);
    } catch (err) {
      console.error("Failed to load classroom data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, activeTopic, setNodes, setEdges]);

  useEffect(() => {
    loadClassroomData();
  }, [classroomId]);

  // ── 2. Selection Handlers ───────────────────────────────────────────────────
  const handleSelectTopic = (topic: any) => {
    setActiveTopic(topic);
  };

  const handleSelectConceptByName = (name: string) => {
    if (!classroom) return;
    const found = classroom.syllabus.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      setActiveTopic(found);
    }
  };

  const handleTestCompleted = () => {
    // Refresh to update mastery scores
    loadClassroomData();
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-0)",
        }}
      >
        <span className="spinner" style={{ width: 32, height: 32, marginRight: "1rem" }} />
        <span style={{ fontSize: "1rem", color: "var(--text-1)" }}>Loading study classroom...</span>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-0)",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "1.2rem", color: "var(--accent-danger)" }}>⚠️ Classroom Not Found</span>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="top-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href="/"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              router.push("/");
            }}
          >
            <span>🧠</span>
            <span>SuperLearn</span>
          </a>

          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/")} style={{ fontSize: "0.75rem" }}>
            ← Hub
          </button>
        </div>

        {/* Center Target Indicator */}
        {activeTopic && (
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--text-1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "240px",
            }}
          >
            Focus: <span style={{ color: "var(--accent-secondary)" }}>{activeTopic.name}</span>
          </div>
        )}

        {/* Navigation & Search References Link */}
        <div className="nav-links">
          <a
            href="/analytics"
            className="nav-btn"
            style={{ textDecoration: "none" }}
            title="Learner Analytics"
          >
            📊 Analytics
          </a>
          <button
            className="nav-btn"
            onClick={() => {
              const conceptName = activeTopic ? activeTopic.name : (classroom.syllabus[0]?.name || "");
              const conceptDesc = activeTopic ? activeTopic.description : (classroom.syllabus[0]?.description || "");
              handleOpenSearchReferences(conceptName, conceptDesc);
            }}
            title="Search References per Concept across Web, Papers & Books"
          >
            🔍 Search References
          </button>
        </div>
      </header>

      {/* ── 3-Pane Workspace ───────────────────────────────────────────────── */}
      <div className="workspace-container">
        {/* Left Side: Classroom Syllabus Panel */}
        <ClassroomSyllabusPanel
          className={mobileTab === "syllabus" ? "mobile-visible" : ""}
          classroomTitle={classroom.title}
          classroomDescription={classroom.description}
          topics={classroom.syllabus}
          activeTopicId={activeTopic ? activeTopic.id : null}
          onSelectTopic={(t) => {
            handleSelectTopic(t);
          }}
          onOpenSearchReferences={handleOpenSearchReferences}
        />

        {/* Center Canvas: Mental Model Schema (React Flow) */}
        <SchemaCenterCanvas
          className={mobileTab === "canvas" ? "mobile-visible" : ""}
          nodes={nodes}
          edges={edges}
          selectedConceptName={activeTopic ? activeTopic.name : null}
          classroomId={classroomId}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setEdges={setEdges}
          onRefreshUserGraph={loadClassroomData}
          onSelectConceptByName={handleSelectConceptByName}
        />

        {/* Right Side: Test Portal Panel */}
        <TestPortalPanel
          className={mobileTab === "test" ? "mobile-visible" : ""}
          selectedConceptId={activeTopic ? activeTopic.concept_id : null}
          selectedConceptName={activeTopic ? activeTopic.name : null}
          classroomId={classroomId}
          onTestCompleted={handleTestCompleted}
        />
      </div>

      {/* ── Search References Modal ────────────────────────────────────────── */}
      <SearchReferencesModal
        isOpen={isReferencesOpen}
        onClose={() => setIsReferencesOpen(false)}
        initialConceptName={selectedReferenceConcept?.name || (activeTopic ? activeTopic.name : "")}
        initialConceptDescription={selectedReferenceConcept?.description || (activeTopic ? activeTopic.description : "")}
      />

      {/* ── Mobile Bottom Navigation Bar ──────────────────────────────────── */}
      <nav className="mobile-tab-bar">
        <button
          className={`mobile-tab-btn ${mobileTab === "syllabus" ? "active" : ""}`}
          onClick={() => setMobileTab("syllabus")}
        >
          <span className="tab-icon">📖</span>
          <span>Syllabus</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === "canvas" ? "active" : ""}`}
          onClick={() => setMobileTab("canvas")}
        >
          <span className="tab-icon">🧠</span>
          <span>Schema Canvas</span>
        </button>
        <button
          className={`mobile-tab-btn ${mobileTab === "test" ? "active" : ""}`}
          onClick={() => setMobileTab("test")}
        >
          <span className="tab-icon">🎯</span>
          <span>Test Portal</span>
        </button>
      </nav>
    </div>
  );
}
