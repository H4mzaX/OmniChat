"use client";
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";

const Editor = lazy(() => import("@monaco-editor/react").then(m => ({ default: m.default })));

/* ─── Sandboxed HTML/CSS/JS live preview ────────────────────── */
function SandboxPreview({ code, type }) {
  const iframeRef = useRef(null);
  const [key, setKey] = useState(0);
  const [error, setError] = useState(null);

  const rerender = useCallback(() => {
    setKey((k) => k + 1);
    setError(null);
  }, []);

  useEffect(() => {
    if (!iframeRef.current) return;
    const handleMsg = (e) => {
      if (e.data?.type === "sandbox-error") setError(e.data.message);
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const buildDoc = () => {
    if (type === "html") return code;
    if (type === "svg") return `<!DOCTYPE html><html><body>${code}</body></html>`;
    const cssMatch = code.match(/\/\* css \*\/\s*([\s\S]*?)(?=\/\*|$)/);
    const htmlMatch = code.match(/<!-- html -->\s*([\s\S]*?)(?=<!--|$)/);
    const jsMatch = code.match(/\/\* js \*\/\s*([\s\S]*)/);
    return `<!DOCTYPE html><html><head><style>${cssMatch?.[1] || ""}</style></head><body>${htmlMatch?.[1] || ""}<script>${jsMatch?.[1] || ""}<\/script></body></html>`;
  };

  return (
    <div style={{ flex: 1, position: "relative", background: "#fff", display: "flex", flexDirection: "column" }}>
      {error && (
        <div style={{ padding: "6px 12px", background: "#fef2f2", color: "#991b1b", fontSize: 12, borderBottom: "1px solid #fecaca" }}>
          ⚠ {error}
        </div>
      )}
      <iframe
        key={key}
        ref={iframeRef}
        srcDoc={buildDoc()}
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: "100%", flex: 1, border: "none" }}
      />
    </div>
  );
}

/* ─── Monaco Editor wrapper ─────────────────────────────────── */
function MonacoView({ code, lang, onChange }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const fallback = (
    <pre style={{ margin: 0, padding: "16px", fontSize: 13, lineHeight: 1.6, overflow: "auto", minHeight: "100%", background: "#1e1e2e", color: "#cdd6f4", fontFamily: '"SF Mono","Fira Code",monospace' }}>
      <code>{code}</code>
    </pre>
  );
  if (!mounted) return fallback;
  return (
    <Suspense fallback={fallback}>
      <Editor
        height="100%"
        language={lang === "jsx" || lang === "tsx" ? "typescript" : lang === "mermaid" ? "markdown" : lang}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: '"SF Mono","Fira Code",monospace',
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          readOnly: !onChange,
          tabSize: 2,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
        }}
        loading={fallback}
      />
    </Suspense>
  );
}

/* ─── Artifact type config ──────────────────────────────────── */
const ARTIFACT_TYPES = {
  html: { label: "HTML Preview", color: "#e14335", preview: true, lang: "html" },
  svg: { label: "SVG Preview", color: "#e14335", preview: true, lang: "xml" },
  jsx: { label: "React / JSX", color: "#61dafb", preview: false, lang: "jsx" },
  tsx: { label: "React / TSX", color: "#61dafb", preview: false, lang: "tsx" },
  js: { label: "JavaScript", color: "#f7df1e", preview: false, lang: "javascript" },
  ts: { label: "TypeScript", color: "#3178c6", preview: false, lang: "typescript" },
  json: { label: "JSON", color: "#f59e0b", preview: false, lang: "json" },
  mermaid: { label: "Mermaid", color: "#2977d6", preview: false, lang: "mermaid" },
};

export default function ArtifactPanel({ artifact, onClose }) {
  const [code, setCode] = useState(artifact?.code || "");
  const [showPreview, setShowPreview] = useState(
    ARTIFACT_TYPES[artifact?.type]?.preview ?? true,
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [previewKey, setPreviewKey] = useState(0);
  const dragging = useRef(false);

  const meta = ARTIFACT_TYPES[artifact?.type] || {
    label: artifact?.type || "Code",
    color: "var(--t3)",
    preview: false,
    lang: artifact?.type || "text",
  };

  useEffect(() => {
    setCode(artifact?.code || "");
  }, [artifact]);

  // Resize split
  const onSplitMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const startX = e.clientX;
    const startPct = splitPos;
    const onMove = (ev) => {
      if (!dragging.current) return;
      const container = ev.currentTarget?.closest?.("[data-split]") || document.querySelector("[data-split]");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.min(85, Math.max(15, pct)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [splitPos]);

  const canPreview = meta.preview;

  const panelStyle = fullscreen
    ? { position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column", background: "var(--bg-card)" }
    : { width: "50%", flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-card)", minWidth: 320, borderLeft: "1px solid var(--border)" };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)" }}>{meta.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {canPreview && (
            <HeaderBtn onClick={() => setShowPreview((v) => !v)} title={showPreview ? "Source" : "Preview"}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span style={{ fontSize: 11 }}>{showPreview ? "Source" : "Preview"}</span>
            </HeaderBtn>
          )}
          <HeaderBtn onClick={() => setFullscreen((v) => !v)} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              {fullscreen
                ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
                : <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></>}
            </svg>
          </HeaderBtn>
          <HeaderBtn onClick={onClose} title="Close">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </HeaderBtn>
        </div>
      </div>

      {/* Content area */}
      <div data-split style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Editor / Code */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <MonacoView code={code} lang={meta.lang} onChange={setCode} />
        </div>

        {/* Preview pane (only for previewable types) */}
        {canPreview && showPreview && (
          <>
            <div
              onMouseDown={onSplitMouseDown}
              style={{ width: 4, cursor: "col-resize", flexShrink: 0, background: "transparent", position: "relative", zIndex: 10 }}
            />
            <div style={{ width: `${splitPos}%`, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "4px 10px", fontSize: 11, color: "var(--t4)", borderBottom: "1px solid var(--border)", background: "var(--bg-sidebar)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Preview</span>
                <button onClick={() => setPreviewKey((k) => k + 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontFamily: "var(--font)" }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  Refresh
                </button>
              </div>
              <SandboxPreview key={previewKey} code={code} type={artifact.type} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HeaderBtn({ children, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 7px",
        background: hov ? "var(--bg-hover)" : "transparent",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        color: "var(--t2)",
        transition: "background 60ms",
        fontFamily: "var(--font)",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}
