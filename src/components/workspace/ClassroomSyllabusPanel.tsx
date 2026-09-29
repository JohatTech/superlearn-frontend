"use client";

interface SyllabusItem {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface ClassroomSyllabusPanelProps {
  classroomTitle: string;
  classroomDescription: string;
  topics: SyllabusItem[];
  activeTopicId: string | null;
  onSelectTopic: (topic: SyllabusItem) => void;
  onOpenSearchReferences?: (conceptName: string, conceptDescription?: string) => void;
  className?: string;
}

export default function ClassroomSyllabusPanel({
  classroomTitle,
  classroomDescription,
  topics,
  activeTopicId,
  onSelectTopic,
  onOpenSearchReferences,
  className = "",
}: ClassroomSyllabusPanelProps) {
  return (
    <aside className={`workspace-left-panel ${className}`}>
      {/* Panel Header */}
      <div className="panel-header" style={{ justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
          <div className="panel-title" style={{ fontSize: "0.95rem" }}>
            📖 Classroom Syllabus
          </div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-secondary)" }}>
            {classroomTitle}
          </div>
        </div>
        {onOpenSearchReferences && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];
              if (activeTopic) {
                onOpenSearchReferences(activeTopic.name, activeTopic.description);
              }
            }}
            title="Search References across Web, Books, and Papers"
            style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
          >
            🔍 Search References
          </button>
        )}
      </div>

      {/* Classroom Description Banner */}
      {classroomDescription && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--bg-2)",
            borderBottom: "1px solid var(--border-subtle)",
            fontSize: "0.75rem",
            color: "var(--text-1)",
            lineHeight: 1.45,
          }}
        >
          {classroomDescription}
        </div>
      )}

      {/* Scrollable Topics List */}
      <div className="panel-scrollable" style={{ padding: "0.75rem" }}>
        <div className="form-label" style={{ marginBottom: "0.5rem" }}>
          Topics Path ({topics.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {topics.map((topic, idx) => {
            const isActive = topic.id === activeTopicId;
            return (
              <div
                key={topic.id}
                className={`classroom-syllabus-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectTopic(topic)}
                style={{ flexDirection: "column", alignItems: "stretch", gap: "0.4rem" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div className="syllabus-item-order">{idx + 1}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flexGrow: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: isActive ? "var(--text-0)" : "var(--text-1)",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        lineHeight: "1.35",
                      }}
                    >
                      {topic.name}
                    </div>
                    {topic.description && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-2)", lineHeight: 1.4, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                        {topic.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-Concept Search References Button */}
                {onOpenSearchReferences && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTopic(topic);
                      onOpenSearchReferences(topic.name, topic.description);
                    }}
                    style={{
                      alignSelf: "flex-end",
                      fontSize: "0.68rem",
                      padding: "0.2rem 0.55rem",
                      background: "rgba(99, 102, 241, 0.12)",
                      borderColor: "rgba(99, 102, 241, 0.3)",
                      color: "var(--accent-primary, #6366f1)",
                    }}
                    title={`Search references for concept: ${topic.name}`}
                  >
                    🔍 Search References
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
