"use client";
import React, { useState, useCallback } from "react";

const FILE_ICONS = {
  pdf: "📄", docx: "📝", doc: "📝", txt: "📄", md: "📄",
  csv: "📊", xlsx: "📊", xls: "📊", tsv: "📊",
  json: "📋", xml: "📋", yaml: "📋", toml: "📋",
  png: "🖼", jpg: "🖼", jpeg: "🖼", webp: "🖼", gif: "🖼", svg: "🖼", bmp: "🖼",
  zip: "📦", tar: "📦", gz: "📦", "7z": "📦", rar: "📦",
  mp3: "🎵", wav: "🎵", flac: "🎵", aac: "🎵", ogg: "🎵", m4a: "🎵",
  mp4: "🎬", mov: "🎬", avi: "🎬", mkv: "🎬", webm: "🎬",
  pptx: "📽", ppt: "📽",
  js: "⚡", ts: "⚡", py: "🐍", rs: "🦀", go: "🔷", java: "☕",
  html: "🌐", css: "🎨", scss: "🎨", sh: "💻", sql: "🗄",
};

const FILE_GROUPS = {
  document: { label: "Document", color: "#6366f1" },
  spreadsheet: { label: "Spreadsheet", color: "#10b981" },
  image: { label: "Image", color: "#f59e0b" },
  archive: { label: "Archive", color: "#8b5cf6" },
  code: { label: "Code", color: "#06b6d4" },
  audio: { label: "Audio", color: "#ec4899" },
  video: { label: "Video", color: "#ef4444" },
  presentation: { label: "Presentation", color: "#f97316" },
};

export default function FilePreview({ file, data, onClose }) {
  const [tab, setTab] = useState("preview");
  const { group, ext, format, text, sizeHuman } = data || {};

  const icon = FILE_ICONS[ext] || "📎";
  const groupInfo = FILE_GROUPS[group] || { label: "File", color: "#6b7280" };

  const copyText = useCallback(() => {
    if (data?.text) navigator.clipboard.writeText(data.text.slice(0, 50000));
  }, [data]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(20,20,19,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 16,
        width: "90%", maxWidth: 900, maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>{file?.name || data?.name || "File"}</div>
              <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--t4)", marginTop: 2 }}>
                <span style={{ color: groupInfo.color, fontWeight: 500 }}>{groupInfo.label}</span>
                <span>•</span>
                <span>{ext?.toUpperCase()}</span>
                <span>•</span>
                <span>{sizeHuman}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              border: "none", background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--t3)", fontSize: 18,
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, padding: "0 20px",
          borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          {["preview", "structure", "metadata", "ask"].filter((t) => {
            if (t === "structure" && !data?.sheets && !data?.fields) return false;
            return true;
          }).map((t) => (
            <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === "preview" && "Preview"}
              {t === "structure" && "Structure"}
              {t === "metadata" && "Metadata"}
              {t === "ask" && "Ask"}
            </TabBtn>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20, fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>
          {tab === "preview" && (
            <PreviewContent data={data} group={group} ext={ext} text={text} />
          )}
          {tab === "structure" && (
            <StructureContent data={data} />
          )}
          {tab === "metadata" && (
            <MetadataContent data={data} />
          )}
          {tab === "ask" && (
            <AskContent data={data} onCopy={copyText} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 14px", fontSize: 12, fontWeight: 500,
      color: active ? "var(--accent)" : "var(--t3)",
      background: "none", border: "none", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
      cursor: "pointer", fontFamily: "var(--font)", transition: "all 80ms",
    }}>
      {children}
    </button>
  );
}

function PreviewContent({ data, group, ext, text }) {
  if (group === "image" && data?.base64) {
    return <img src={data.base64} alt="Preview" style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }} />;
  }
  if (group === "image" && data?.dataUri) {
    return <img src={data.dataUri} alt="Preview" style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }} />;
  }
  if (group === "spreadsheet" && data?.sheets) {
    return <SpreadsheetPreview sheets={data.sheets} />;
  }
  if (group === "spreadsheet" && data?.rows) {
    return <TablePreview rows={data.rows} fields={data.fields} />;
  }
  if (group === "archive" && data?.files) {
    return <ArchiveTree files={data.files} />;
  }
  if (group === "code") {
    return <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.5, fontFamily: '"SF Mono",monospace', overflow: "auto" }}><code>{text?.slice(0, 10000)}</code></pre>;
  }
  if (text) {
    return <div style={{ whiteSpace: "pre-wrap" }}>{text.slice(0, 15000)}</div>;
  }
  return <div style={{ color: "var(--t4)" }}>No preview available</div>;
}

function SpreadsheetPreview({ sheets }) {
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = sheets[activeSheet];
  if (!sheet) return null;

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {sheets.map((s, i) => (
          <button key={s.name} onClick={() => setActiveSheet(i)} style={{
            padding: "4px 10px", fontSize: 11, borderRadius: 6,
            border: "1px solid var(--border)", cursor: "pointer",
            background: i === activeSheet ? "var(--accent)" : "var(--bg-sidebar)",
            color: i === activeSheet ? "#fff" : "var(--t2)",
            fontFamily: "var(--font)",
          }}>
            {s.name} ({s.rows} rows)
          </button>
        ))}
      </div>
      <div style={{ overflow: "auto", maxHeight: 400 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
          <thead>
            <tr>
              {(sheet.headers || sheet.rows?.[0] || []).slice(0, 20).map((h, i) => (
                <th key={i} style={{ padding: "4px 8px", border: "1px solid var(--border)", background: "var(--bg-sidebar)", fontWeight: 600, textAlign: "left", whiteSpace: "nowrap", color: "var(--t1)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sheet.sample || sheet.rows?.slice(0, 50) || []).slice(1).map((row, ri) => (
              <tr key={ri}>
                {(Array.isArray(row) ? row : []).slice(0, 20).map((cell, ci) => (
                  <td key={ci} style={{ padding: "3px 8px", border: "1px solid var(--border)", color: "var(--t2)", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{String(cell ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sheet.summary && <SummaryCards summary={sheet.summary} />}
    </div>
  );
}

function TablePreview({ rows, fields }) {
  if (!rows || rows.length === 0) return <div>No data</div>;
  const sample = rows.slice(0, 50);
  return (
    <div style={{ overflow: "auto", maxHeight: 400 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
        <thead>
          <tr>
            {(fields || Object.keys(sample[0] || {})).slice(0, 15).map((f) => (
              <th key={f} style={{ padding: "4px 8px", border: "1px solid var(--border)", background: "var(--bg-sidebar)", fontWeight: 600, textAlign: "left", whiteSpace: "nowrap", color: "var(--t1)" }}>{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sample.map((row, ri) => (
            <tr key={ri}>
              {(fields || Object.keys(row)).slice(0, 15).map((f) => (
                <td key={f} style={{ padding: "3px 8px", border: "1px solid var(--border)", color: "var(--t2)", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{String(row[f] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ArchiveTree({ files }) {
  return (
    <div style={{ fontFamily: '"SF Mono",monospace', fontSize: 12 }}>
      {files.slice(0, 200).map((f, i) => (
        <div key={i} style={{ padding: "3px 0", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "var(--t4)", width: 60, textAlign: "right", flexShrink: 0 }}>{formatSize2(f.size)}</span>
          <span style={{ color: f.type === "image" ? "var(--accent)" : "var(--t2)" }}>{f.path}</span>
        </div>
      ))}
      {files.length > 200 && <div style={{ color: "var(--t4)", padding: "4px 0" }}>... and {files.length - 200} more files</div>}
    </div>
  );
}

function SummaryCards({ summary }) {
  if (!summary || Object.keys(summary).length === 0) return null;
  return (
    <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
      {Object.entries(summary).slice(0, 15).map(([col, info]) => (
        <div key={col} style={{
          padding: "6px 10px", borderRadius: 8, background: "var(--bg-sidebar)",
          border: "1px solid var(--border)", fontSize: 11,
        }}>
          <div style={{ fontWeight: 600, color: "var(--t1)", marginBottom: 2 }}>{col}</div>
          <div style={{ color: "var(--t3)" }}>
            {info.type} • {info.count} values
            {info.avg !== undefined && ` • avg ${info.avg.toFixed(1)}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function StructureContent({ data }) {
  if (data?.sheets) {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--t1)" }}>{data.sheetCount} sheets</div>
        {data.sheets.map((s) => (
          <div key={s.name} style={{ padding: "6px 10px", margin: "4px 0", background: "var(--bg-sidebar)", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--t1)" }}>{s.name}</span>
            <span style={{ color: "var(--t4)" }}>{s.rows} rows × {s.cols} cols {s.hasFormulas ? "• formulas" : ""}</span>
          </div>
        ))}
      </div>
    );
  }
  if (data?.fields) {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--t1)" }}>{data.fields.length} fields</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {data.fields.map((f) => (
            <span key={f} style={{ padding: "2px 8px", borderRadius: 4, background: "var(--bg-sidebar)", fontSize: 12, color: "var(--t2)", border: "1px solid var(--border)" }}>{f}</span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--t4)" }}>{data.total} rows total</div>
      </div>
    );
  }
  if (data?.pages) {
    return <div style={{ color: "var(--t1)", fontWeight: 500 }}>{data.pages} pages</div>;
  }
  if (data?.lines) {
    return <div style={{ color: "var(--t1)" }}>{data.lines} lines</div>;
  }
  if (data?.parsed) {
    return <pre style={{ fontSize: 12, fontFamily: '"SF Mono",monospace' }}>{JSON.stringify(data.parsed, null, 2).slice(0, 3000)}</pre>;
  }
  return <div style={{ color: "var(--t4)" }}>No structured data available</div>;
}

function MetadataContent({ data }) {
  const fields = [];
  for (const [key, val] of Object.entries(data || {})) {
    if (["text", "base64", "dataUri", "rawBuffer", "rows", "sheets", "files", "parsed", "analysis", "ocr", "frames", "transcript", "sample", "summary", "anomalies"].includes(key)) continue;
    if (typeof val === "object" && val !== null) continue;
    fields.push({ key, val });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "4px 12px", fontSize: 12 }}>
      {fields.map(({ key, val }) => (
        <React.Fragment key={key}>
          <div style={{ color: "var(--t4)", fontWeight: 500 }}>{key}</div>
          <div style={{ color: "var(--t1)", wordBreak: "break-all" }}>{String(val)}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

function AskContent({ data, onCopy }) {
  const [question, setQuestion] = useState("");
  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12, color: "var(--t3)", lineHeight: 1.5 }}>
        Ask questions about this file. The content will be sent to the model along with your question.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Summarize this, What's the main topic?"
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: "1px solid var(--border)", outline: "none",
            fontSize: 13, fontFamily: "var(--font)", color: "var(--t1)",
            background: "var(--bg)",
          }}
        />
        <button onClick={() => {}} style={{
          padding: "8px 16px", borderRadius: 8,
          background: "var(--accent)", color: "#fff",
          border: "none", fontSize: 13, cursor: "pointer", fontWeight: 500,
          fontFamily: "var(--font)", opacity: question.trim() ? 1 : 0.5,
        }} disabled={!question.trim()}>
          Ask
        </button>
        <button onClick={onCopy} style={{
          padding: "8px 12px", borderRadius: 8,
          background: "var(--bg-sidebar)", color: "var(--t2)",
          border: "1px solid var(--border)", fontSize: 12, cursor: "pointer",
          fontFamily: "var(--font)", whiteSpace: "nowrap",
        }}>
          Copy text
        </button>
      </div>
    </div>
  );
}

function formatSize2(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

