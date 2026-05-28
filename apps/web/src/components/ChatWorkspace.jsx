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
            style={{
              animation: "spin 1.8s linear infinite",
            }}
          >
            <path
              d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 0 1-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
              fill="var(--accent)"
            />
          </svg>
          <span style={{ color: "var(--t2)", fontWeight: 400 }}>Working</span>
        </div>
      )}
    </div>
  );}

/* ─── Typing indicator (3 bouncing dots) ──────────────────────── */
function TypingIndicator({ fileName }) {
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
      <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--t2)" }}>
            OmniChat
          </span>
        </div>
        {fileName && <ProcessNote fileName={fileName} isWorking={true} />}
        <div style={{ display: "flex", gap: 5, marginTop: fileName ? 12 : 0 }}>
          {[0, 180, 360].map((d) => (
            <div
              key={d}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--t4)",
                animation: `oc-dot 1.2s ease-in-out ${d}ms infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Streaming message with blinking cursor + thinking ────────── */
function StreamingMessage({ content, modelId, thinking, fileName }) {
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
        {thinking && (
          <div
            style={{
              background: "var(--bg-sidebar)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 10,
              fontSize: 13,
              color: "var(--t3)",
              fontStyle: "italic",
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 500, color: "var(--t2)", marginBottom: 4, fontSize: 12 }}>
              Thinking...
            </div>
            {thinking}
          </div>
        )}
        <div className="oc-prose" style={{ whiteSpace: "pre-wrap" }}>
          {content}
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
function WelcomeState({ greetingText, composer, onSendSuggestion }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 80px",
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
          marginBottom: 32,
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
            fontSize: 28,
            fontWeight: 500,
            fontFamily: "var(--font)",
            color: "var(--t1)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            margin: 0,
            textAlign: "center",
          }}
        >
          {greetingText}
        </h1>
      </div>

      {/* Bento Grid Suggestions */}
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
            try {
              const ev = JSON.parse(line.slice(5).trim());
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
              if (ev.error) throw new Error(ev.error);
              if (ev.done) {
                const art = detectArtifact(acc);
                if (art) {
                  setArtifact(art);
                  setArtifactOpen(true);
                }
                await qc.invalidateQueries({ queryKey: ["messages", sid] });
                await qc.invalidateQueries({ queryKey: ["sessions"] });
              }
            } catch (_) {}
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setStreamError(err.message);
          qc.setQueryData(["messages", sid], (old) => ({
            messages: (old?.messages || []).filter((m) => m.id !== tempId),
          }));
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
                  if (hr >= 7 && hr < 16) return "Coffee and OmniChat time?";
                  return "Hi Ameer! What are you building today?";
                })()
              }
              composer={composer}
              onSendSuggestion={handleSend}
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
