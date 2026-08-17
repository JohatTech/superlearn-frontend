"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Passage {
  passage_text: string;
  source_name: string;
  chunk_index: number;
  similarity_score: number;
}

interface ContrastModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function ContrastModal({
  isOpen,
  onClose,
  initialQuery = "",
}: ContrastModalProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [sourceA, setSourceA] = useState("");
  const [sourceB, setSourceB] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [passagesA, setPassagesA] = useState<Passage[]>([]);
  const [passagesB, setPassagesB] = useState<Passage[]>([]);
  const [isAligning, setIsAligning] = useState(false);

  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      api.listSources().then((res) => {
        setSources(res.sources || []);
        if (res.sources?.length >= 2) {
          setSourceA(res.sources[0]);
          setSourceB(res.sources[1]);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file || !sourceName.trim()) return;
    setIsUploading(true);
    try {
      const res = await api.uploadDocument(file, sourceName.trim());
      setUploadMsg(`✅ Indexed "${res.source_name}" (${res.chunks_stored} chunks)`);
      const updated = await api.listSources();
      setSources(updated.sources || []);
      setFile(null);
      setSourceName("");
    } catch (err: any) {
      setUploadMsg("❌ " + err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMsg(""), 5000);
    }
  };

  const handleAlign = async () => {
    if (!query.trim() || !sourceA || !sourceB) return;
    setIsAligning(true);
    setPassagesA([]);
    setPassagesB([]);
    try {
      const res = await api.alignContrast(query.trim(), sourceA, sourceB, 3);
      setPassagesA(res.source_a.passages || []);
      setPassagesB(res.source_b.passages || []);
    } catch (err: any) {
      setUploadMsg("❌ " + err.message);
    } finally {
      setIsAligning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header" style={{ padding: "1rem 1.25rem" }}>
          <div>
            <div className="panel-title" style={{ fontSize: "1rem" }}>
              📚 Multisource Contrast Reader (Embedded Qdrant)
            </div>
            <div className="panel-subtitle">
              Upload canonical textbooks & compare differing perspectives side-by-side
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Upload Section */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div className="form-label" style={{ marginBottom: "0.5rem" }}>
              Index New Canonical Document
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "flex-end" }}>
              <div>
                <label className="form-label">Source Title</label>
                <input
                  className="input"
                  placeholder="e.g. CLRS Chapter 15"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">File (PDF, TXT, MD)</label>
                <input
                  type="file"
                  accept=".txt,.pdf,.md"
                  className="input"
                  style={{ paddingTop: "0.35rem" }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={isUploading || !file || !sourceName.trim()}
              >
                {isUploading ? "Indexing..." : "Upload"}
              </button>
            </div>
            {uploadMsg && (
              <div style={{ fontSize: "0.75rem", marginTop: "0.5rem", color: uploadMsg.startsWith("✅") ? "var(--accent-success)" : "var(--accent-danger)" }}>
                {uploadMsg}
              </div>
            )}
          </div>

          {/* Alignment Control */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div className="form-label" style={{ marginBottom: "0.5rem" }}>
              Cross-Document Alignment Query
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.75rem", alignItems: "flex-end" }}>
              <div>
                <label className="form-label">Concept / Question</label>
                <input
                  className="input"
                  placeholder="e.g. Memoization vs Tabulation"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAlign()}
                />
              </div>
              <div>
                <label className="form-label">Source A</label>
                <select className="select" value={sourceA} onChange={(e) => setSourceA(e.target.value)}>
                  <option value="">Select source...</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Source B</label>
                <select className="select" value={sourceB} onChange={(e) => setSourceB(e.target.value)}>
                  <option value="">Select source...</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAlign}
                disabled={isAligning || !query.trim() || !sourceA || !sourceB}
              >
                {isAligning ? "Aligning..." : "Compare →"}
              </button>
            </div>
          </div>

          {/* Split Panes Results */}
          {(passagesA.length > 0 || passagesB.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  <span className="badge badge-primary">{sourceA}</span>
                </div>
                {passagesA.map((p, i) => (
                  <div key={i} style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.85rem", marginBottom: "0.6rem", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    {p.passage_text}
                    <div style={{ fontSize: "0.68rem", color: "var(--accent-secondary)", marginTop: "0.4rem" }}>
                      Cosine Similarity: {p.similarity_score.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                  <span className="badge badge-cyan">{sourceB}</span>
                </div>
                {passagesB.map((p, i) => (
                  <div key={i} style={{ background: "var(--bg-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0.85rem", marginBottom: "0.6rem", fontSize: "0.8rem", lineHeight: 1.6 }}>
                    {p.passage_text}
                    <div style={{ fontSize: "0.68rem", color: "var(--accent-secondary)", marginTop: "0.4rem" }}>
                      Cosine Similarity: {p.similarity_score.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
