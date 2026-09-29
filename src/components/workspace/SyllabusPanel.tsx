"use client";
import { useState } from "react";
import { api } from "@/lib/api";

interface Concept {
  id: string;
  name: string;
  mastery: number;
  description?: string;
}

interface Recommendation {
  id: string;
  name: string;
  mastery: number;
  retrievability: number;
  priority_score: number;
  reason: string;
}

interface SyllabusPanelProps {
  concepts: Concept[];
  recommendations: Recommendation[];
  selectedConceptId: string | null;
  onSelectConcept: (conceptId: string) => void;
  onRefreshGraph: () => void;
  onOpenContrastModal: () => void;
}

export default function SyllabusPanel({
  concepts,
  recommendations,
  selectedConceptId,
  onSelectConcept,
  onRefreshGraph,
  onOpenContrastModal,
}: SyllabusPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConceptName, setNewConceptName] = useState("");
  const [newConceptDesc, setNewConceptDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const filteredConcepts = concepts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddConcept = async () => {
    if (!newConceptName.trim()) return;
    setIsAdding(true);
    try {
      await api.addConcept(newConceptName.trim(), newConceptDesc.trim());
      setNewConceptName("");
      setNewConceptDesc("");
      setShowAddForm(false);
      setStatusMsg("✅ Concept added to syllabus");
      onRefreshGraph();
    } catch (err: any) {
      setStatusMsg("❌ " + err.message);
    } finally {
      setIsAdding(false);
      setTimeout(() => setStatusMsg(""), 3000);
    }
  };

  return (
    <aside className="workspace-left-panel">
      {/* Panel Header */}
      <div className="panel-header" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ minWidth: 0, flex: "1 1 140px" }}>
          <div className="panel-title" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>🗺️ Syllabus & Queue</div>
          <div className="panel-subtitle">{concepts.length} concepts · FSRS Spaced Schedule</div>
        </div>
        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
          <button
            className="btn btn-secondary btn-sm"
            title="Search References per Syllabus Concept"
            onClick={onOpenContrastModal}
          >
            🔍 Search References
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "✕" : "+ Add"}
          </button>
        </div>
      </div>

      {/* Add Concept Collapsible Form */}
      {showAddForm && (
        <div style={{ padding: "0.75rem", background: "var(--bg-2)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label className="form-label">New Concept Name</label>
            <input
              className="input"
              placeholder="e.g. Dynamic Programming"
              value={newConceptName}
              onChange={(e) => setNewConceptName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddConcept()}
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label className="form-label">Brief Description</label>
            <input
              className="input"
              placeholder="Core mechanism..."
              value={newConceptDesc}
              onChange={(e) => setNewConceptDesc(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: "100%" }}
            onClick={handleAddConcept}
            disabled={isAdding || !newConceptName.trim()}
          >
            {isAdding ? "Registering..." : "Save Concept"}
          </button>
        </div>
      )}

      {statusMsg && (
        <div style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", background: "var(--bg-3)" }}>
          {statusMsg}
        </div>
      )}

      {/* Scrollable Body */}
      <div className="panel-scrollable">
        {/* FSRS Priority Queue Section */}
        <div>
          <div className="form-label" style={{ marginBottom: "0.45rem" }}>
            🎯 FSRS Study Queue ({recommendations.length})
          </div>
          {recommendations.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "var(--text-2)", padding: "0.5rem 0" }}>
              No concepts ready for spaced review.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              {recommendations.map((rec) => {
                const isSelected = rec.id === selectedConceptId;
                return (
                  <div
                    key={rec.id}
                    className={`concept-item-card ${isSelected ? "active" : ""}`}
                    onClick={() => onSelectConcept(rec.id)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                      <span className="concept-item-name">{rec.name}</span>
                      <span className="badge badge-cyan" style={{ flexShrink: 0 }}>R={Math.round(rec.retrievability * 100)}%</span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-2)", marginTop: "0.2rem", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                      {rec.reason}
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar-fill" style={{ width: `${rec.mastery * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Concepts List with Search Filter */}
        <div>
          <div className="form-label" style={{ marginBottom: "0.45rem" }}>
            📚 All Knowledge Nodes ({concepts.length})
          </div>
          <input
            className="input"
            style={{ marginBottom: "0.6rem" }}
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {filteredConcepts.map((concept) => {
              const isSelected = concept.id === selectedConceptId;
              return (
                <div
                  key={concept.id}
                  className={`concept-item-card ${isSelected ? "active" : ""}`}
                  onClick={() => onSelectConcept(concept.id)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span className="concept-item-name">{concept.name}</span>
                    <span className="badge badge-primary" style={{ flexShrink: 0 }}>{Math.round((concept.mastery || 0) * 100)}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar-fill" style={{ width: `${(concept.mastery || 0) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
