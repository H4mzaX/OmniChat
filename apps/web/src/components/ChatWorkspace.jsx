"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import ArtifactPanel from "./ArtifactPanel";

/* ─── Helpers ─────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TICK = String.fromCharCode(96, 96, 96);
function detectArtifact(content) {
  if (!content) return null;
  let i = 0;
  while (i < content.length) {
    const s = content.indexOf(TICK, i);
    if (s === -1) break;
    const nl = content.indexOf("\n", s + 3);
    if (nl === -1) break;
    const lang = content
      .slice(s + 3, nl)
      .trim()
      .toLowerCase();
    const close = content.indexOf("\n" + TICK, nl);
    if (close === -1) break;
    const code = content.slice(nl + 1, close).trim();
    if (
      ["html", "jsx", "tsx", "js", "ts", "mermaid", "json", "svg"].includes(
        lang,
      )
    )
      return { type: lang, code };
    i = close + 4;
  }
  return null;
}

/* ─── SVG Icons for Header ───────────────────────────────────── */
const McpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const SettingsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

/* ─── Brand avatar ───────────────────────────────────────────── */
function OmniAvatar({ size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--accent-light)",
        border: "1.5px solid var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "var(--sh-xs)",
      }}
    >
      <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M12 8L13.5 10.5L16 12L13.5 13.5L12 16L10.5 13.5L8 12L10.5 10.5L12 8Z" fill="var(--accent)" />
      </svg>
    </div>
  );
}

/* ─── Process note showing executed steps ──────────────────────── */
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
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: "spin 1.8s linear infinite",
              flexShrink: 0,
            }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M12 8L13.5 10.5L16 12L13.5 13.5L12 16L10.5 13.5L8 12L10.5 10.5L12 8Z" fill="var(--accent)" />
          </svg>
          <span style={{ color: "var(--t2)", fontWeight: 400 }}>Working</span>
        </div>
      )}
    </div>
  );}

/* ─── Typing indicator (Claude-like text process + spark spinner) ──────────────────────── */
function TypingIndicator({ fileName }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 24px",
        fontSize: 13.5,
        color: "var(--t3)",
        fontWeight: 400,
        fontFamily: "var(--font)",
      }}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: "spin 1.8s linear infinite",
          flexShrink: 0,
        }}
      >
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M12 8L13.5 10.5L16 12L13.5 13.5L12 16L10.5 13.5L8 12L10.5 10.5L12 8Z" fill="var(--accent)" />
      </svg>
      <span>
        {fileName ? `Reading ${fileName}...` : "Working..."}
      </span>
    </div>
  );
}

/* ── Extract thinking/reasoning from content ───────────────────── */
function extractReasoning(content) {
  if (!content) return { reasoning: null, body: "" };

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

/* ─── Streaming message with blinking cursor + thinking ────────── */
function StreamingMessage({ content, modelId, thinking, fileName }) {
  const [showReasoning, setShowReasoning] = useState(true);
  const parsed = extractReasoning(content);
  const activeThinking = thinking || parsed.reasoning;
  const activeBody = parsed.body;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "3px 24px",
        alignItems: "flex-start",
      }}
    >
      <OmniAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--t2)" }}>
            OmniChat
          </span>
          {modelId && (
            <span
              style={{
                fontSize: 11,
                color: "var(--t4)",
                background: "rgba(0,0,0,0.04)",
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              {modelId}
            </span>
          )}
        </div>
        {fileName && <ProcessNote fileName={fileName} isWorking={true} />}
        {activeThinking && (
          <div style={{ marginBottom: 8, animation: "oc-fadein 200ms ease" }}>
            <button
              onClick={() => setShowReasoning((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--accent)",
                background: "var(--bg-sidebar)",
                border: "1px solid var(--border-md)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "var(--font)",
                fontWeight: 500,
                transition: "all 120ms ease",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-md)";
              }}
            >
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{
                  transform: showReasoning ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>{activeBody ? "Thought Process" : "Thinking..."}</span>
            </button>
            {showReasoning && (
              <div
                style={{
                  background: "var(--bg-sidebar)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 6,
                  fontSize: 13,
                  color: "var(--t3)",
                  fontStyle: "italic",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                {activeThinking}
              </div>
            )}
          </div>
        )}
        <div className="oc-prose" style={{ whiteSpace: "pre-wrap" }}>
          {activeBody}
          <span className="oc-cursor" />
        </div>
      </div>
    </div>
  );
}



/* Bento Grid Suggestion Items */
const SUGGESTIONS = [
  {
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
    title: "Draft an email",
    desc: "Compose a professional response detailing pricing strategies.",
    prompt: "Draft a polite and professional email response explaining our premium API key pricing and benefits to a startup customer."
  },
  {
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Optimize a SQL query",
    desc: "Explain indexing tricks for quick multi-table joints.",
    prompt: "Analyze and explain how to optimize a slow PostgreSQL query containing nested JOINs, GROUP BYs, and index strategies."
  },
  {
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5h20s-1-2.25-2.5-3.5" />
        <path d="M12 2C6.5 2 2 6.5 2 12c0 2.5 1 5 2.5 6.5l7.5-7.5 7.5 7.5c1.5-1.5 2.5-4 2.5-6.5 0-5.5-4.5-10-10-10z" />
      </svg>
    ),
    title: "Analyze genetic variants",
    desc: "Query non-coding regions and pathogenicity scores.",
    prompt: "Explain how to analyze non-coding genomic variants in regulatory enhancers using chromatin accessibility and phyloP conservation scores."
  },
  {
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "MCP server tools",
    desc: "Walk through setting up a Node or Python context server.",
    prompt: "Give me a step-by-step tutorial on how to build and configure a custom Model Context Protocol (MCP) server in TypeScript/Node.js."
  }
];

/* ─── Welcome / empty state (Premium Bento Grid) ─────────────────── */
function WelcomeState({ greetingText, composer, onSendSuggestion, isMobile }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "24px 16px 40px" : "40px 24px 80px",
        maxWidth: 800,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        animation: "oc-slideup 350ms var(--ease)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: isMobile ? 18 : 32,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M12 8L13.5 10.5L16 12L13.5 13.5L12 16L10.5 13.5L8 12L10.5 10.5L12 8Z" fill="var(--accent)" />
        </svg>
        <h1
          style={{
            fontSize: isMobile ? 26 : 34,
            fontWeight: 400,
            fontFamily: "var(--font-serif)",
            color: "var(--t1)",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            margin: 0,
            textAlign: "center",
          }}
        >
          {greetingText}
        </h1>
      </div>

      {/* Bento Grid Suggestions */}
      {!isMobile && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
            width: "100%",
            maxWidth: 680,
            margin: "12px 0 28px",
            boxSizing: "border-box",
          }}
        >
        {SUGGESTIONS.map((s, i) => (
          <div
            key={i}
            onClick={() => onSendSuggestion && onSendSuggestion(s.prompt)}
            className="oc-glass"
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              transition: "transform 180ms var(--ease), border-color 180ms, box-shadow 180ms, background-color 180ms",
              boxShadow: "var(--sh-xs)",
              animation: "oc-card-in 300ms var(--ease) " + (i * 60) + "ms both",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "var(--sh-md)";
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--sh-xs)";
              e.currentTarget.style.background = "";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "var(--accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--accent)",
                }}
              >
                {s.icon}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--t1)" }}>
                {s.title}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.4, margin: 0 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>
      )}

      <div style={{ width: "100%", maxWidth: 680 }}>
        {composer}
      </div>
    </div>
  );
}

/* ─── Error popup (compact, scrollable) ───────────────────────── */
function ErrorBar({ msg, onClear, onOpenSettings }) {
  const isLong = msg.length > 120;
  const isKeyError = msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("settings") || msg.toLowerCase().includes("key") || msg.toLowerCase().includes("auth");
  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        maxWidth: 480,
        width: "90%",
        background: "#fff",
        border: "1px solid rgba(192,57,43,0.25)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        animation: "oc-slideup 200ms var(--ease)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: isLong ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 13, color: "var(--t1)", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
          {isLong ? msg.slice(0, 120) + "…" : msg}
        </span>
        {isKeyError && onOpenSettings && (
          <button
            onClick={() => {
              onOpenSettings("apikeys");
              onClear();
            }}
            style={{
              padding: "4px 10px",
              background: "rgba(204,120,92,0.10)",
              border: "1px solid rgba(204,120,92,0.25)",
              borderRadius: 6,
              color: "var(--accent)",
              fontSize: 11.5,
              fontWeight: 600,
              cursor: "pointer",
              marginRight: 6,
              flexShrink: 0,
              fontFamily: "var(--font)",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(204,120,92,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(204,120,92,0.10)"}
          >
            Configure
          </button>
        )}
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--t4)",
            fontSize: 18,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      {isLong && (
        <div
          style={{
            maxHeight: 200,
            overflowY: "auto",
            padding: "8px 14px 12px",
            fontSize: 12.5,
            color: "var(--t3)",
            lineHeight: 1.6,
            fontFamily: "var(--font-mono)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {msg}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function ChatWorkspace({
  sessionId,
  onSessionCreate,
  selectedModel,
  onModelSelect,
  onOpenSettings,
  isMobile = false,
}) {
  const selectedModelId = selectedModel?.model_id ?? null;
  const selectedProviderSlug = selectedModel?.provider_slug ?? null;

  const [streamText, setStreamText] = useState("");
  const [streamThinking, setStreamThinking] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [artifactOpen, setArtifactOpen] = useState(false);

  const [lastSentFileName, setLastSentFileName] = useState(null);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: async () => {
      if (!sessionId || sessionId === "new") return { messages: [] };
      const r = await fetch("/api/chat/sessions/" + sessionId + "/messages");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!sessionId,
  });
  const messages = data?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamText]);

  const handleSend = useCallback(
    async (input) => {
      const fileList = input?.files || [];
      const text = (typeof input === "string" ? input : input?.content)?.trim();
      if (!text && fileList.length === 0) return;

      if (!selectedModelId || !selectedProviderSlug) {
        setStreamError(
          "No model selected. Select a model from the model picker, or add an API key in Settings.",
        );
        return;
      }
      setStreamError(null);

      // Convert files to base64
      const fileData = await Promise.all(
        fileList.map(async (entry) => {
          const file = entry.file || entry;
          const meta = entry.meta || null;
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let bin = "";
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          return {
            name: file.name || meta?.name || "file",
            type: file.type || "application/octet-stream",
            base64: btoa(bin),
            size: file.size || 0,
            text: meta?.text || meta?.content || null,
            ext: meta?.ext || file.name?.split(".").pop(),
            group: meta?.group || null,
          };
        }),
      );
      if (fileList.length > 0) {
        const file = fileList[0].file || fileList[0];
        setLastSentFileName(file.name || "file");
      } else {
        setLastSentFileName(null);
      }

      let sid = sessionId;
      if (!sid) {
        sid = "new";
        onSessionCreate("new");
      }

      // Build user message content blocks for display
      let userContent = text;
      if (fileData.length > 0) {
        const blocks = text ? [{ type: "text", text }] : [];
        for (const f of fileData) {
          const isImg = f.type?.startsWith("image/");
          if (isImg) {
            blocks.push({ type: "image", source: { type: "base64", media_type: f.type, data: f.base64 } });
          } else {
            blocks.push({ type: "file", name: f.name, size: f.size, ext: f.ext, text: f.text || "" });
          }
        }
        userContent = JSON.stringify(blocks);
      }

      const tempId = "tmp-" + Date.now();
      qc.setQueryData(["messages", sid], (old) => ({
        messages: [
          ...(old?.messages || []),
          {
            id: tempId,
            role: "user",
            content: userContent,
            created_at: new Date().toISOString(),
          },
        ],
      }));

      setIsStreaming(true);
      setStreamText("");
      setStreamThinking("");
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sid,
            content: text,
            files: fileData,
            model_id: selectedModelId,
            provider_slug: selectedProviderSlug,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || res.statusText);
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "",
          acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).trimEnd();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            let ev;
            try {
              ev = JSON.parse(line.slice(5).trim());
            } catch (_) {
              continue;
            }

            if (ev.error) {
              throw new Error(ev.error);
            }

            if (ev.session_id) {
              const realSid = ev.session_id;
              if (sid === "new") {
                const cacheData = qc.getQueryData(["messages", "new"]);
                if (cacheData) {
                  qc.setQueryData(["messages", realSid], cacheData);
                }
                onSessionCreate(realSid);
                sid = realSid;
              }
            }
            if (ev.token) {
              acc += ev.token;
              setStreamText(acc);
            }
            if (ev.thinking) {
              setStreamThinking(ev.thinking);
            }
            if (ev.done) {
              const art = detectArtifact(acc);
              if (art) {
                setArtifact(art);
                setArtifactOpen(true);
              }
              await qc.invalidateQueries({ queryKey: ["messages", sid] });
              await qc.invalidateQueries({ queryKey: ["sessions"] });
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setStreamError(err.message);
        }
      } finally {
        setIsStreaming(false);
        setStreamText("");
        setStreamThinking("");
        abortRef.current = null;
      }
    },
    [sessionId, selectedModelId, selectedProviderSlug, selectedModel, onSessionCreate, qc],
  );

  const isEmpty = !sessionId && messages.length === 0 && !isStreaming;

  const composer = (
    <Composer
      onSend={handleSend}
      isStreaming={isStreaming}
      onCancel={() => abortRef.current?.abort()}
      selectedModelId={selectedModelId}
      onModelSelect={onModelSelect}
      hasMessages={!isEmpty}
      isMobile={isMobile}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          borderRight:
            artifactOpen && artifact ? "1px solid var(--border)" : "none",
        }}
      >
        {isEmpty ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
              overflowY: "auto",
              background: "var(--bg)",
            }}
          >
            {streamError && (
              <ErrorBar
                msg={streamError}
                onClear={() => setStreamError(null)}
                onOpenSettings={onOpenSettings}
              />
            )}
            <WelcomeState
              greetingText={
                (() => {
                  const hr = new Date().getHours();
                  if (hr >= 0 && hr < 7) return "Moonlit chat?";
                  if (hr >= 7 && hr < 16) return "Coffee and OmniChat time?";
                  return "What can I help you build today?";
                })()
              }
              composer={composer}
              onSendSuggestion={handleSend}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <>
            {/* Header strip */}
            {!isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 24px",
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <OmniAvatar size={22} />
                  <span
                    style={{ fontSize: 14, fontWeight: 500, color: "var(--t1)" }}
                  >
                    {selectedModel?.display_name || "OmniChat"}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 20,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  {[
                    { title: "MCP Servers", icon: <McpIcon />, tab: "mcp" },
                    { title: "Settings", icon: <SettingsIcon />, tab: "apikeys" },
                  ].map((btn) => (
                    <button
                      key={btn.tab}
                      onClick={() => onOpenSettings && onOpenSettings(btn.tab)}
                      title={btn.title}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        color: "var(--t3)",
                        transition: "background 80ms",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.06)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div
                style={{
                  maxWidth: 800,
                  margin: "0 auto",
                  paddingTop: 16,
                  paddingBottom: 8,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}
              >
                {messages.map((m, idx) => {
                  let prevUserFileName = null;
                  if (m.role === "assistant" && idx > 0) {
                    const prevMsg = messages[idx - 1];
                    if (prevMsg.role === "user" && prevMsg.content?.startsWith("[")) {
                      try {
                        const blocks = JSON.parse(prevMsg.content);
                        const fileBlock = blocks.find((b) => b.type === "file" || b.type === "image");
                        if (fileBlock) {
                          prevUserFileName = fileBlock.name || "file";
                        }
                      } catch (_) {}
                    }
                  }
                  return (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      fileName={prevUserFileName}
                      onArtifactOpen={(art) => {
                        setArtifact(art);
                        setArtifactOpen(true);
                      }}
                    />
                  );
                })}
                {isStreaming && streamText && (
                  <StreamingMessage
                    content={streamText}
                    modelId={selectedModelId}
                    thinking={streamThinking}
                    fileName={lastSentFileName}
                  />
                )}
                {isStreaming && !streamText && (
                  <TypingIndicator fileName={lastSentFileName} />
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {streamError && (
              <ErrorBar
                msg={streamError}
                onClear={() => setStreamError(null)}
                onOpenSettings={onOpenSettings}
              />
            )}

            <div
              style={{
                padding: "0 24px 32px",
                flexShrink: 0,
                background: "transparent",
                position: "relative",
                zIndex: 10,
              }}
            >
              <div style={{ maxWidth: 800, margin: "0 auto" }}>{composer}</div>
            </div>
          </>
        )}
      </div>
      {artifactOpen && artifact && (
        <ArtifactPanel
          artifact={artifact}
          onClose={() => setArtifactOpen(false)}
        />
      )}
    </div>
  );
}
