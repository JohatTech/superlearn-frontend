"use client";
import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "@/lib/api";

// ── Custom Mental Model Concept Node ──────────────────────────────────────────
function MentalConceptNode({ data, selected }: { data: any; selected?: boolean }) {
  const isConflict = data.hasConflict ?? false;
  const isTarget = data.isTarget ?? false;

  let borderColor = "var(--accent-primary)";
  if (isConflict) borderColor = "var(--accent-danger)";
  else if (isTarget) borderColor = "var(--accent-secondary)";

  return (
    <div
      className={`custom-flow-node ${selected ? "selected-node" : ""} ${
        isConflict ? "conflict-node" : ""
      }`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "var(--accent-primary)" }} />
      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-0)" }}>
        {data.label}
      </div>
      {data.description && (
        <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: 2 }}>
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "var(--accent-secondary)" }} />
    </div>
  );
}

const nodeTypes = {
  conceptNode: MentalConceptNode,
};

interface SchemaCenterCanvasProps {
  nodes: Node[];
  edges: Edge[];
  selectedConceptName: string | null;
  onNodesChange: any;
  onEdgesChange: any;
  setEdges: any;
  onRefreshUserGraph: () => void;
  onSelectConceptByName: (name: string) => void;
}

export default function SchemaCenterCanvas({
  nodes,
  edges,
  selectedConceptName,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onRefreshUserGraph,
  onSelectConceptByName,
}: SchemaCenterCanvasProps) {
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [isDiffing, setIsDiffing] = useState(false);

  const onConnect = useCallback(
    async (params: Connection) => {
      setEdges((eds: Edge[]) => addEdge(params, eds));
      if (params.source && params.target) {
        await api.addUserEdge(params.source, params.target, "relates_to");
      }
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const label = (node.data as any)?.label;
      if (label) {
        onSelectConceptByName(label);
      }
    },
    [onSelectConceptByName]
  );

  const handleRunConfusionCompass = async () => {
    setIsDiffing(true);
    try {
      const result = await api.diffGraphs();
      setDiffResult(result);

      if (result) {
        const conflictEdgePairs = new Set([
          ...result.false_positive_edges.map((e: any) => `${e.source}-${e.target}`),
          ...result.inverted_edges.map((e: any) => `${e.source}-${e.target}`),
        ]);

        setEdges((eds: Edge[]) =>
          eds.map((edge) => {
            const isConflicted = conflictEdgePairs.has(`${edge.source}-${edge.target}`);
            return {
              ...edge,
              style: isConflicted
                ? { stroke: "#ef4444", strokeWidth: 3 }
                : { stroke: "#6366f1", strokeWidth: 1.5 },
              animated: isConflicted,
            };
          })
        );
      }
    } finally {
      setIsDiffing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const result = await api.uploadMindMap(e.target.files[0]);
        // Update nodes and edges based on result if needed, or refresh graph
        onRefreshUserGraph();
      } catch (err) {
        console.error("Failed to upload mind map", err);
      }
    }
  };

  return (
    <main className="workspace-center-canvas">
      {/* Floating Canvas Header Toolbar */}
      <div className="canvas-floating-toolbar">
        <div className="canvas-toolbar-group">
          <div className="canvas-pill">
            <span style={{ fontSize: "1rem" }}>🧠</span>
            <span>Mental Model Schema</span>
            {selectedConceptName && (
              <span className="badge badge-cyan" style={{ marginLeft: "0.25rem" }}>
                Target: {selectedConceptName}
              </span>
            )}
          </div>
        </div>

        <div className="canvas-toolbar-group">
          {diffResult && (
            <div className="canvas-pill">
              <span>Conflicts:</span>
              <span className={`badge ${diffResult.conflict_count > 0 ? "badge-danger" : "badge-success"}`}>
                {diffResult.conflict_count}
              </span>
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={handleRunConfusionCompass}
            disabled={isDiffing}
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
          >
            {isDiffing ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Diffing...</> : "🧭 Run Confusion Compass"}
          </button>
          
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", marginLeft: "8px" }}>
            📸 Upload Mind Map
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* React Flow Mental Model Graph Canvas */}
      <div style={{ flex: 1, width: "100%", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color="rgba(255, 255, 255, 0.08)" gap={20} size={1} />
          <Controls />
          <MiniMap
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
            }}
            nodeColor={(node) => ((node.data as any)?.hasConflict ? "#ef4444" : "#6366f1")}
          />
        </ReactFlow>
      </div>
    </main>
  );
}
