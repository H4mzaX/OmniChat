"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import SandboxRunner from "./SandboxRunner";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const CopyIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StatsIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PinIcon = ({ size = 13, filled }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const TrashIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

/* ─── Process note showing executed steps (Claude style) ──────── */
function ProcessNote({ fileName, isWorking }) {
  const [expanded, setExpanded] = useState(false);
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const fileTypeStr = ext === "pdf" ? "pdf" : ext === "txt" ? "text file" : ext === "csv" ? "spreadsheet" : ext === "md" ? "markdown file" : "document";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        margin: "8px 0 16px",
        fontFamily: "var(--font)",
      }}
    >
      {/* Read document line */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--t3)",
          cursor: "pointer",
          userSelect: "none",
          width: "fit-content",
          padding: "3px 6px",
          marginLeft: "-6px",
          borderRadius: 4,
          transition: "background 100ms, color 100ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--t2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--t3)";
        }}
      >
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          style={{
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 150ms ease",
            color: "var(--t4)",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>Read the uploaded {fileTypeStr}</span>
      </div>

      {/* Expanded File Info */}
      {expanded && fileName && (
        <div
          style={{
            marginLeft: 12,
            padding: "8px 12px",
            background: "var(--bg-sidebar)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: 12.5,
            color: "var(--t2)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            width: "fit-content",
            animation: "oc-fadein 150ms ease",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t3)" }}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontWeight: 500 }}>{fileName}</span>
        </div>
      )}

      {/* Spinner row (only while working) */}
      {isWorking && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--t3)",
            fontWeight: 500,
            paddingLeft: 2,
            marginTop: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span className="oc-dot" style={{ animationDelay: "0ms" }} />
            <span className="oc-dot" style={{ animationDelay: "200ms" }} />
            <span className="oc-dot" style={{ animationDelay: "400ms" }} />
          </div>
          <span style={{ color: "var(--t2)", fontWeight: 400 }}>Working</span>
        </div>
      )}
    </div>
  );
}

/* ── Code block ─────────────────────────────────────────────── */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const lang = className?.replace("language-", "") || "text";
  const code = String(children).replace(/\n$/, "");
  const isJS = lang === "javascript" || lang === "js";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const download = () => {
    const ext = lang === "javascript" ? "js" : lang === "typescript" ? "ts" : lang === "jsx" ? "jsx" : lang === "tsx" ? "tsx" : lang;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid var(--border-md)",
        overflow: "hidden",
        margin: "14px 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "var(--bg-sidebar)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--t4)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {lang}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isJS && (
            <button
              onClick={() => setShowSandbox((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, padding: "2px 7px",
                color: showSandbox ? "var(--accent)" : "var(--t3)",
                background: showSandbox ? "rgba(204,120,92,0.1)" : "none",
                border: "none", borderRadius: 4, cursor: "pointer",
                fontFamily: "var(--font)", transition: "all 60ms",
              }}
            >
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </button>
          )}
          <button
            onClick={download}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "var(--t3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              transition: "color 100ms",
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            onClick={copy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: copied ? "var(--success)" : "var(--t3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              transition: "color 100ms",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      {/* Body */}
      <pre
        style={{
          overflowX: "auto",
          padding: "14px 16px",
          background: "var(--bg-card)",
          margin: 0,
        }}
      >
        <code
          style={{
            fontFamily: "'SF Mono','Fira Code',Menlo,monospace",
            fontSize: 13,
            color: "var(--t1)",
            lineHeight: 1.65,
          }}
        >
          {code}
        </code>
      </pre>
      {showSandbox && isJS && <SandboxRunner code={code} language="javascript" />}
    </div>
  );
}

/* ── Content block renderer (text + images) ──────────────────── */
const FileIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

function FileBlock({ file }) {
  const fileName = file.name || "Attached File";
  const ext = file.ext || fileName.split(".").pop()?.toUpperCase() || "FILE";
  const sizeKb = file.size ? `${(file.size / 1024).toFixed(1)} KB` : "";

  const downloadFile = () => {
    if (file.text) {
      // Text file - download as text
      const blob = new Blob([file.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (file.base64) {
      // Binary file - download from base64
      const byteCharacters = atob(file.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: "var(--bg-sidebar)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        margin: "6px 0",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--accent-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent)",
          flexShrink: 0,
        }}
      >
        <FileIcon size={16} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--t1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 200,
          }}
          title={fileName}
        >
          {fileName}
        </span>
        <span style={{ fontSize: 10, color: "var(--t3)", display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
          <span>{ext}</span>
          {sizeKb && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--t4)" }} />}
          {sizeKb && <span>{sizeKb}</span>}
        </span>
      </div>
      <button
        onClick={downloadFile}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--t3)",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background 60ms, color 60ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--t3)";
        }}
        title="Download file"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}

function ContentBlocks({ content }) {
  if (typeof content === "string" && content.startsWith("[")) {
    try {
      const blocks = JSON.parse(content);
      if (Array.isArray(blocks)) {
        return blocks.map((block, i) => {
          if (block.type === "text") {
            return <Prose key={i} content={block.text} />;
          }
          if (block.type === "image" && block.source) {
            const src = `data:${block.source.media_type};base64,${block.source.data}`;
            return (
              <ImageBlock key={i} src={src} />
            );
          }
          if (block.type === "file") {
            return (
              <FileBlock key={i} file={block} />
            );
          }
          return null;
        });
      }
    } catch {}
  }
  return <Prose content={content} />;
}

function ImageBlock({ src }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ margin: "8px 0" }}>
      <img
        src={src}
        onClick={() => setExpanded((v) => !v)}
        style={{
          maxWidth: expanded ? "100%" : 280,
          maxHeight: expanded ? 600 : 280,
          borderRadius: 10,
          cursor: "pointer",
          border: "1px solid var(--border)",
          objectFit: expanded ? "contain" : "cover",
          transition: "max-width 200ms, max-height 200ms",
        }}
        alt="Attached image"
      />
    </div>
  );
}

/* ── Prose renderer ──────────────────────────────────────────── */
function Prose({ content }) {
  return (
    <div className="oc-prose">
      <ReactMarkdown
        components={{
          code({ inline, className, children }) {
            if (inline) return <code>{children}</code>;
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ── Omni brand avatar ───────────────────────────────────────── */
function OmniAvatar() {
  const size = 28;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--sh-xs)",
      }}
    >
      <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
      </svg>
    </div>
  );
}

/* ── Mini icon button (icon only) ─────────────────────────────── */
function MiniBtn({ onClick, children, title, active, danger }) {
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
        justifyContent: "center",
        width: 28,
        height: 28,
        border: "none",
        borderRadius: 6,
        background: active
          ? "var(--bg-hover)"
          : hov
            ? "var(--bg-hover)"
            : "transparent",
        color:
          danger && (hov || active) ? "var(--danger)" : hov ? "var(--t2)" : "var(--t4)",
        cursor: "pointer",
        transition: "background 60ms, color 60ms",
      }}
    >
      {children}
    </button>
  );
}

/* ── Stat chip ───────────────────────────────────────────────── */
function Chip({ label, value }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: "var(--t4)",
        background: "var(--bg-sidebar)",
        borderRadius: 6,
        padding: "2px 8px",
      }}
    >
      <span style={{ color: "var(--t3)" }}>{label}</span> {value}
    </span>
  );
}

/* ── Extract thinking/reasoning from content ───────────────────── */
function extractReasoning(content) {
  if (!content) return { reasoning: null, body: content };

  // Try [thinking] ... [/thinking]
  let match = content.match(/^\[thinking\]\n?([\s\S]*?)(?:\[\/thinking\]|$)/);
  if (match) {
    const hasClosing = content.includes("[/thinking]");
    const reasoning = match[1].trim();
    let body = hasClosing ? content.slice(match[0].length) : "";
    body = body.replace(/^\n*<response>\n?/, "");
    body = body.replace(/\n*<\/response>\n*$/, "");
    return { reasoning, body: body.trim() || body };
  }

  // Try <thinking> ... </thinking>
  match = content.match(/^<thinking>\n?([\s\S]*?)(?:<\/thinking>|$)/);
  if (match) {
    const hasClosing = content.includes("</thinking>");
    const reasoning = match[1].trim();
    let body = hasClosing ? content.slice(match[0].length) : "";
    body = body.replace(/^\n*<response>\n?/, "");
    body = body.replace(/\n*<\/response>\n*$/, "");
    return { reasoning, body: body.trim() || body };
  }

  return { reasoning: null, body: content };
}

/* ── Main message bubble ─────────────────────────────────────── */
export default function MessageBubble({
  message,
  onDelete,
  onPin,
  onArtifactOpen,
  fileName,
}) {
  const [copied, setCopied] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [hov, setHov] = useState(false);
  const isUser = message.role === "user";
  const parsed = extractReasoning(message.content);
  const reasoning = message.reasoning_content || parsed.reasoning;
  const body = parsed.body;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {isUser ? (
        /* ── User message — right-aligned bubble ── */
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "1px var(--msg-pad-x)",
          }}
        >
          <div style={{ maxWidth: "75%" }}>
            <div
              style={{
                background: "var(--bg-user-bubble)",
                borderRadius: "18px 18px 4px 18px",
                padding: "10px 16px",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--t1)",
                wordBreak: "break-word",
              }}
            >
              <ContentBlocks content={message.content} />
            </div>
            {hov && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--t4)" }}>
                  {timeStr}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Claude message — left-aligned with avatar ── */
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "3px var(--msg-pad-x)",
            alignItems: "flex-start",
          }}
        >
          <OmniAvatar />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)" }}
              >
                OmniChat
              </span>
              {message.model_id && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--t4)",
                    background: "var(--bg-active)",
                    borderRadius: 4,
                    padding: "1px 6px",
                  }}
                >
                  {message.model_id}
                </span>
              )}
              {hov && timeStr && (
                <span style={{ fontSize: 11, color: "var(--t4)" }}>
                  {timeStr}
                </span>
              )}
            </div>

            {/* Reasoning / thinking toggle */}
            {reasoning && (
              <div style={{ marginBottom: 8, animation: "oc-fadein 200ms ease" }}>
                <button
                  onClick={() => setShowReasoning((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--t3)",
                    background: "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontFamily: "var(--font)",
                    fontWeight: 500,
                    transition: "all 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.background = "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--t3)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <svg
                    width={10}
                    height={10}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    style={{
                      transform: showReasoning ? "rotate(90deg)" : "none",
                      transition: "transform 150ms ease",
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span style={{ fontStyle: "italic" }}>
                    {showReasoning ? "Thought process" : "Thought process"}
                  </span>
                  {showReasoning && (
                    <span style={{ 
                      fontSize: 11, 
                      color: "var(--t4)", 
                      fontStyle: "normal",
                      marginLeft: 4 
                    }}>
                      (click to hide)
                    </span>
                  )}
                </button>
                {showReasoning && (
                  <div
                    className="oc-thinking-scroll"
                    style={{
                      marginTop: 6,
                      padding: "12px 16px",
                      background: "var(--bg-sidebar)",
                      borderLeft: "2px solid var(--accent)",
                      borderRadius: "0 8px 8px 0",
                      fontSize: 13,
                      color: "var(--t3)",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      animation: "oc-slideup 200ms var(--ease)",
                      maxHeight: 240,
                      overflowY: "auto",
                    }}
                  >
                    {reasoning}
                  </div>
                )}
              </div>
            )}
            {fileName && (
              <ProcessNote fileName={fileName} isWorking={false} />
            )}
            {/* Body */}
            <ContentBlocks content={body} />

            {/* Actions — fade in on hover */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                marginTop: 6,
                opacity: hov ? 1 : 0,
                transition: "opacity 100ms",
              }}
            >
              <MiniBtn onClick={copy} title={copied ? "Copied" : "Copy"} active={copied}>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </MiniBtn>
              {(message.input_tokens ||
                message.output_tokens ||
                message.latency_ms) && (
                <MiniBtn onClick={() => setShowMeta((v) => !v)} title="Stats" active={showMeta}>
                  <StatsIcon />
                </MiniBtn>
              )}
              {onPin && (
                <MiniBtn onClick={() => onPin(message.id)} title={message.is_pinned ? "Unpin" : "Pin"} active={message.is_pinned}>
                  <PinIcon filled={message.is_pinned} />
                </MiniBtn>
              )}
              {onDelete && (
                <MiniBtn onClick={() => onDelete(message.id)} title="Delete" danger>
                  <TrashIcon />
                </MiniBtn>
              )}
            </div>

            {/* Stats */}
            {showMeta && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {message.input_tokens > 0 && (
                  <Chip
                    label="in"
                    value={message.input_tokens.toLocaleString() + " tok"}
                  />
                )}
                {message.output_tokens > 0 && (
                  <Chip
                    label="out"
                    value={message.output_tokens.toLocaleString() + " tok"}
                  />
                )}
                {message.latency_ms > 0 && (
                  <Chip
                    label="time"
                    value={(message.latency_ms / 1000).toFixed(1) + "s"}
                  />
                )}
                {parseFloat(message.estimated_cost || 0) > 0 && (
                  <Chip
                    label="cost"
                    value={"$" + parseFloat(message.estimated_cost).toFixed(6)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
