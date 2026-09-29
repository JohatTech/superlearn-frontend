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
  className?: string;
}

export default function ClassroomSyllabusPanel({
  classroomTitle,
  classroomDescription,
  topics,
  activeTopicId,
  onSelectTopic,
  className = "",
}: ClassroomSyllabusPanelProps) {
  return (
    <aside className={`workspace-left-panel ${className}`}>
      {/* Panel Header */}
      <div className="panel-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
        <div className="panel-title" style={{ fontSize: "0.95rem" }}>
          📖 Classroom Syllabus
        </div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-secondary)" }}>
          {classroomTitle}
        </div>
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
              >
                <div className="syllabus-item-order">{idx + 1}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flexGrow: 1 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: isActive ? "var(--text-0)" : "var(--text-1)",
                    }}
                  >
                    {topic.name}
                  </div>
                  {topic.description && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-2)", lineHeight: 1.4 }}>
                      {topic.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
