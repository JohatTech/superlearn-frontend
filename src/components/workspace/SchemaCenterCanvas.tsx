"use client";
import { useCallback, useState, useRef } from "react";
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
  MarkerType,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "@/lib/api";

// ── Edit Modal ────────────────────────────────────────────────────────────────
interface EditModalProps {
  nodeId: string;
  initialName: string;
  initialDescription: string;
  onSave: (nodeId: string, name: string, description: string) => void;
  onClose: () => void;
}

function EditConceptModal({ nodeId, initialName, initialDescription, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await onSave(nodeId, name.trim(), description.trim());
    setIsSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-0)", margin: 0 }}>
            ✏️ Edit Concept
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-2)",
              cursor: "pointer",
              fontSize: "1.2rem",
              lineHeight: 1,
              padding: "0.2rem",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Concept Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            autoFocus
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-0)",
              padding: "0.6rem 0.75rem",
              fontSize: "0.9rem",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-0)",
              padding: "0.6rem 0.75rem",
              fontSize: "0.85rem",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? (
              <><span className="spinner" style={{ width: 12, height: 12 }} /> Saving…</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────
interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeLabel: string;
  nodeDescription: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ConceptContextMenu({ x, y, nodeId, nodeLabel, nodeDescription, onEdit, onDelete, onClose }: ContextMenuProps) {
  return (
    <>
      {/* Invisible overlay to close on outside click */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9990 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          left: x,
          top: y,
          zIndex: 9991,
          background: "var(--bg-1)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
          padding: "0.5rem",
          minWidth: "180px",
          display: "flex",
          flexDirection: "column",
          gap: "0.15rem",
        }}
      >
        <div
          style={{
            padding: "0.4rem 0.6rem 0.6rem",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "0.2rem",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginBottom: "0.1rem" }}>Concept</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-0)" }}>{nodeLabel}</div>
        </div>

        <button
          onClick={() => { onClose(); onEdit(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.45rem 0.65rem",
            background: "transparent",
            border: "none",
            borderRadius: "var(--radius-xs)",
            color: "var(--text-1)",
            fontSize: "0.82rem",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span>✏️</span> Edit Concept
        </button>

        <button
          onClick={() => { onClose(); onDelete(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.45rem 0.65rem",
            background: "transparent",
            border: "none",
            borderRadius: "var(--radius-xs)",
            color: "var(--accent-danger, #ef4444)",
            fontSize: "0.82rem",
            cursor: "pointer",
            textAlign: "left",
            width: "100%",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.10)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span>🗑️</span> Delete Bubble
        </button>
      </div>
    </>
  );
}

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
      style={{ borderColor, minWidth: 140, padding: "0.6rem 0.8rem" }}
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
      {selected && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            background: "rgba(99,102,241,0.18)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "4px",
            padding: "1px 5px",
            fontSize: "0.6rem",
            color: "var(--accent-primary)",
            pointerEvents: "none",
          }}
        >
          right-click ›
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
  classroomId?: string;
  onNodesChange: any;
  onEdgesChange: any;
  setEdges: any;
  onRefreshUserGraph: () => void;
  onSelectConceptByName: (name: string) => void;
  className?: string;
}

export default function SchemaCenterCanvas({
  nodes,
  edges,
  selectedConceptName,
  classroomId,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onRefreshUserGraph,
  onSelectConceptByName,
  className = "",
}: SchemaCenterCanvasProps) {
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [isDiffing, setIsDiffing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeLabel: string;
    nodeDescription: string;
  } | null>(null);

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    nodeId: string;
    name: string;
    description: string;
  } | null>(null);

  const onConnect = useCallback(
    async (params: Connection) => {
      const edgeWithMarker = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--accent-primary)" },
        style: { stroke: "var(--accent-primary)", strokeWidth: 1.5 },
      };
      setEdges((eds: Edge[]) => addEdge(edgeWithMarker, eds));
      if (params.source && params.target) {
        try {
          await api.addUserEdge(params.source, params.target, "relates_to", classroomId);
        } catch (err) {
          console.error("Failed to persist user edge:", err);
        }
      }
    },
    [setEdges, classroomId]
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

  // Right-click on a node → open context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      event.stopPropagation();
      const data = node.data as any;
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
        nodeLabel: data?.label ?? node.id,
        nodeDescription: data?.description ?? "",
      });
    },
    []
  );

  const onNodeDragStop = useCallback(
    async (_: any, node: Node) => {
      if (classroomId && node) {
        try {
          await api.saveLayout(
            [{ id: node.id, position: { x: node.position.x, y: node.position.y } }],
            classroomId
          );
        } catch (err) {
          console.error("Failed to persist node position:", err);
        }
      }
    },
    [classroomId]
  );

  // ── Delete concept ────────────────────────────────────────────────────────
  const handleDeleteConcept = useCallback(
    async (nodeId: string) => {
      setStatusMessage("Deleting concept…");
      try {
        await api.deleteUserConcept(nodeId);
        // Remove node + its edges from local React Flow state immediately
        onNodesChange([{ type: "remove", id: nodeId }]);
        setEdges((eds: Edge[]) =>
          eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
        );
        setStatusMessage("Concept deleted.");
        setTimeout(() => setStatusMessage(""), 3000);
      } catch (err: any) {
        setStatusMessage("Delete failed: " + err.message);
      }
    },
    [onNodesChange, setEdges]
  );

  // ── Edit concept save ─────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(
    async (nodeId: string, name: string, description: string) => {
      try {
        await api.updateUserConcept(nodeId, name, description);
        // Update the node label in React Flow state immediately
        onNodesChange([
          {
            type: "replace",
            id: nodeId,
            item: {
              id: nodeId,
              data: { label: name, description },
              // position is preserved from current state
            } as any,
          },
        ]);
        // Simpler: trigger a full refresh so the node data re-syncs from server
        onRefreshUserGraph();
        setStatusMessage("Concept updated.");
        setTimeout(() => setStatusMessage(""), 3000);
      } catch (err: any) {
        setStatusMessage("Update failed: " + err.message);
      } finally {
        setEditModal(null);
      }
    },
    [onNodesChange, onRefreshUserGraph]
  );

  const handleRunConfusionCompass = async () => {
    setIsDiffing(true);
    setStatusMessage("");
    try {
      const result = await api.diffGraphs(classroomId);
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isConflicted ? "#ef4444" : "#6366f1",
              },
              style: isConflicted
                ? { stroke: "#ef4444", strokeWidth: 3 }
                : { stroke: "#6366f1", strokeWidth: 1.5 },
              animated: isConflicted,
            };
          })
        );
      }
    } catch (err: any) {
      setStatusMessage("Diff error: " + err.message);
    } finally {
      setIsDiffing(false);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    setStatusMessage("Extracting concepts & arrows via OCR & Computer Vision…");
    try {
      const result = await api.uploadMindMap(file, classroomId);
      setStatusMessage(result.message || "Mind map replaced successfully!");
      onRefreshUserGraph();
    } catch (err: any) {
      console.error("Failed to upload mind map", err);
      setStatusMessage("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
      // Reset the input value so the same file can be re-uploaded
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  // Format edges with arrow markers if not already set
  const styledEdges = edges.map((e) => ({
    ...e,
    markerEnd: e.markerEnd || {
      type: MarkerType.ArrowClosed,
      color: "var(--accent-primary)",
    },
  }));

  return (
    <main className={`workspace-center-canvas ${className}`}>
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
            <span className="badge badge-purple" style={{ marginLeft: "0.25rem", fontSize: "0.68rem" }}>
              {nodes.length} {nodes.length === 1 ? "Concept" : "Concepts"}
            </span>
          </div>
          {statusMessage && (
            <div className="canvas-pill" style={{ color: "var(--accent-secondary)", fontSize: "0.72rem" }}>
              {statusMessage}
            </div>
          )}
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

          {nodes.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRunConfusionCompass}
              disabled={isDiffing}
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
            >
              {isDiffing ? (
                <>
                  <span className="spinner" style={{ width: 12, height: 12 }} /> Diffing...
                </>
              ) : (
                "🧭 Confusion Compass"
              )}
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={{ marginLeft: "4px" }}
            title="Upload a new mind map photo — replaces the current map completely"
          >
            {isUploading ? "⏳ Ingesting..." : "📸 Upload Map"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={isUploading}
            onChange={handleFileInputChange}
          />
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {nodes.length === 0 ? (
          /* Empty State: Upload Mind Map Prompt */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              zIndex: 5,
              background: isDraggingOver
                ? "rgba(99, 102, 241, 0.08)"
                : "transparent",
              transition: "background 0.2s ease",
            }}
          >
            <div
              style={{
                maxWidth: "520px",
                width: "100%",
                background: "var(--bg-1)",
                border: isDraggingOver
                  ? "2px dashed var(--accent-primary)"
                  : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "2.5rem 2rem",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.2rem",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.2rem",
                }}
              >
                📝
              </div>

              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-0)", marginBottom: "0.4rem" }}>
                  Upload Your Handwritten Mind Map
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                  Draw your concepts and connecting arrows on paper or a whiteboard, take a photo, and upload it here to visualize your personal mental model.
                </p>
              </div>

              {/* Step Badges */}
              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  width: "100%",
                  padding: "0.8rem",
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.75rem",
                  color: "var(--text-1)",
                }}
              >
                <span>✏️ 1. Draw Concepts & Arrows</span>
                <span>📸 2. Snap Photo</span>
                <span>⚡ 3. Direct OCR & CV Detection</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", alignItems: "center" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    maxWidth: "260px",
                    padding: "0.75rem 1.25rem",
                    fontSize: "0.9rem",
                    boxShadow: "0 6px 20px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  {isUploading ? (
                    <>
                      <span className="spinner" style={{ width: 14, height: 14 }} /> Processing...
                    </>
                  ) : (
                    "📸 Upload Mind Map Photo"
                  )}
                </button>
                <div style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>
                  or drag and drop an image file anywhere on this canvas
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--accent-secondary)",
                  background: "rgba(6, 182, 212, 0.08)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                }}
              >
                🔒 Zero LLM Hallucination: Topology is extracted strictly from your drawn strokes.
              </div>
            </div>
          </div>
        ) : null}

        {/* Help hint for non-empty canvas */}
        {nodes.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "4.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 6,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-sm)",
              padding: "0.3rem 0.7rem",
              fontSize: "0.68rem",
              color: "var(--text-2)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            Right-click any concept bubble to edit or delete it
          </div>
        )}

        {/* React Flow Mental Model Graph Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => setContextMenu(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color="rgba(255, 255, 255, 0.08)" gap={20} size={1} />
          <Controls />
          {nodes.length > 0 && (
            <MiniMap
              className="mobile-hide"
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
              nodeColor={(node) => ((node.data as any)?.hasConflict ? "#ef4444" : "#6366f1")}
            />
          )}
        </ReactFlow>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ConceptContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeLabel={contextMenu.nodeLabel}
          nodeDescription={contextMenu.nodeDescription}
          onClose={() => setContextMenu(null)}
          onEdit={() =>
            setEditModal({
              nodeId: contextMenu.nodeId,
              name: contextMenu.nodeLabel,
              description: contextMenu.nodeDescription,
            })
          }
          onDelete={() => handleDeleteConcept(contextMenu.nodeId)}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditConceptModal
          nodeId={editModal.nodeId}
          initialName={editModal.name}
          initialDescription={editModal.description}
          onSave={handleSaveEdit}
          onClose={() => setEditModal(null)}
        />
      )}
    </main>
  );
}
