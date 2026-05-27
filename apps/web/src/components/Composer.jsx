"use client";
import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import ModelSelector from "./ModelSelector";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const PlusIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MicIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="14" rx="3" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="23" x2="12" y2="19" />
  </svg>
);

const SendIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="4" />
    <polyline points="5 11 12 4 19 11" />
  </svg>
);

const StopIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

const FileIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const CameraIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const GitHubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
  </svg>
);

const ToolsIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>
);

const PlugIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v6M8 2v6M16 2v6" />
    <path d="M8 8a4 4 0 008 0" />
    <path d="M12 12v4" />
    <path d="M8 22h8" />
    <path d="M12 16v6" />
  </svg>
);

const GlobeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const PaletteIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="12" r="0.5" fill="currentColor" stroke="none" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const FolderIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const ChevronRight = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CheckSmall = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ─── Premium SVG Icons for Composer bottom toolbar & category pills ─── */
const WaveformIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M3 10v4M6 6v12M9 10v4M12 4v16M15 8v8M18 10v4M21 12v0" />
  </svg>
);

const CapsuleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="4" y="4" width="16" height="16" rx="8" fill="#e0e7ff" opacity="0.4" />
    <g transform="rotate(45 12 12)">
      <path d="M6 9a3 3 0 0 1 3-3h3v6H9a3 3 0 0 1-3-3z" fill="#f8fafc" stroke="#3b82f6" strokeWidth={1.2} />
      <path d="M12 6h3a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h-3V6z" fill="#2563eb" stroke="#1d4ed8" strokeWidth={1.2} />
      <line x1="8.5" y1="8" x2="8.5" y2="10" stroke="#94a3b8" strokeWidth={1} strokeLinecap="round" />
      <line x1="10.5" y1="7.5" x2="10.5" y2="10.5" stroke="#94a3b8" strokeWidth={1} strokeLinecap="round" />
    </g>
  </svg>
);

const CodeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const HatIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const BrushIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="11.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="16.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="14.5" r="1" fill="currentColor" />
  </svg>
);

const PencilIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const CoffeeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

/* ─── Plus Menu Items ───────────────────────────────────────── */
const PLUS_ITEMS = [
  { id: "files", label: "Add files or photos", icon: FileIcon },
  { id: "screenshot", label: "Take a screenshot", icon: CameraIcon },
  { id: "project", label: "Add to project", icon: FolderIcon, hasSubmenu: true, disabled: true },
  { id: "github", label: "Add from GitHub", icon: GitHubIcon, disabled: true },
  { divider: true },
  { id: "skills", label: "Skills", icon: ToolsIcon, hasSubmenu: true, disabled: true },
  { id: "connectors", label: "Connectors", icon: PlugIcon, hasSubmenu: true, disabled: true },
  { id: "search", label: "Web search", icon: GlobeIcon, toggle: true },
  { id: "style", label: "Use style", icon: PaletteIcon, hasSubmenu: true, disabled: true },
];

/* ─── Category Pills ─── */
const CATEGORIES = [
  { label: "Code", id: "code", prompt: "Help me write code", icon: CodeIcon },
  { label: "Learn", id: "learn", prompt: "Help me learn something new", icon: HatIcon },
  { label: "Create", id: "create", prompt: "Help me create something", icon: BrushIcon },
  { label: "Write", id: "write", prompt: "Help me write", icon: PencilIcon },
  { label: "Life stuff", id: "life", prompt: "Help me with life stuff", icon: CoffeeIcon },
];

/* ─── Main Composer ─────────────────────────────────────────── */
const SLASH_COMMANDS = [
  { id: "code", label: "Write code", desc: "Generate code in any language", icon: ">", prompt: "Write code to" },
  { id: "explain", label: "Explain", desc: "Explain something in detail", icon: "?", prompt: "Explain" },
  { id: "write", label: "Write", desc: "Draft an article or document", icon: "W", prompt: "Write" },
  { id: "research", label: "Research", desc: "Research a topic deeply", icon: "R", prompt: "Research" },
  { id: "summarize", label: "Summarize", desc: "Summarize content", icon: "S", prompt: "Summarize" },
  { id: "translate", label: "Translate", desc: "Translate text", icon: "T", prompt: "Translate" },
];

export default function Composer({
  onSend,
  onCancel,
  isStreaming,
  selectedModelId,
  onModelSelect,
  hasMessages = false,
}) {
  const [text, setText] = useState("");
  const [plusOpen, setPlusOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const textRef = useRef(null);
  const plusRef = useRef(null);
  const fileRef = useRef(null);
  const slashRef = useRef(null);
  const FilePreview = lazy(() => import("./files/FilePreview"));

  // Auto-resize textarea
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [text]);

  // Auto-focus
  useEffect(() => {
    if (!isStreaming) textRef.current?.focus();
  }, [isStreaming]);

  // Close plus menu on outside click
  useEffect(() => {
    if (!plusOpen) return;
    const close = (e) => {
      if (plusRef.current && !plusRef.current.contains(e.target)) setPlusOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [plusOpen]);

  // Slash command detection
  useEffect(() => {
    if (text.startsWith("/")) {
      const rest = text.slice(1);
      if (rest.length === 0 || /^[\w-]+$/.test(rest)) {
        setSlashOpen(true);
        setSlashFilter(rest);
        return;
      }
    }
    setSlashOpen(false);
    setSlashFilter("");
  }, [text]);

  // Close slash menu on outside click
  useEffect(() => {
    if (!slashOpen) return;
    const close = (e) => {
      if (slashRef.current && !slashRef.current.contains(e.target) && e.target !== textRef.current) setSlashOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [slashOpen]);

  const [slashIdx, setSlashIdx] = useState(0);
  const filteredCommands = slashOpen
    ? SLASH_COMMANDS.filter((c) => c.id.includes(slashFilter.toLowerCase()) || c.label.toLowerCase().includes(slashFilter.toLowerCase()))
    : [];

  // Reset index when filter changes
  useEffect(() => { setSlashIdx(0); }, [slashFilter]);

  const applySlash = (cmd) => {
    setText(cmd.prompt + " ");
    setSlashOpen(false);
    setSlashFilter("");
    textRef.current?.focus();
  };

  const send = useCallback(() => {
    if (!text.trim() && files.length === 0) return;
    onSend({ content: text.trim(), files, webSearch });
    setText("");
    setFiles([]);
    if (textRef.current) {
      textRef.current.style.height = "auto";
    }
  }, [text, files, webSearch, onSend]);

  const handleKey = (e) => {
    if (slashOpen && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIdx((i) => Math.min(i + 1, filteredCommands.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySlash(filteredCommands[slashIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      send();
    }
  };

  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/files", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return { file, meta: data, id: data.id };
    } catch (e) {
      console.error("Upload failed:", e);
      return { file, meta: null, error: e.message };
    } finally {
      setUploading(false);
    }
  }, []);

  const takeScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "screenshot.png", { type: "image/png" });
          const entry = await uploadFile(file);
          setFiles((prev) => [...prev, entry]);
        }
      }, "image/png");
    } catch (e) {
      if (e.name !== "NotAllowedError" && e.name !== "AbortError") {
        console.error("Screenshot error:", e);
      }
    }
  }, [uploadFile]);

  const handleFiles = useCallback(async (e) => {
    const newFiles = Array.from(e.target.files || []);
    const entries = await Promise.all(newFiles.map(uploadFile));
    setFiles((prev) => [...prev, ...entries]);
    e.target.value = "";
  }, [uploadFile]);

  const handleDropFiles = useCallback(async (dropped) => {
    const entries = await Promise.all(Array.from(dropped).map(uploadFile));
    setFiles((prev) => [...prev, ...entries]);
  }, [uploadFile]);

  // Drag-and-drop
  const dragCount = useRef(0);
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dragCount.current++; setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dragCount.current--; if (dragCount.current <= 0) { dragCount.current = 0; setDragOver(false); } };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false); dragCount.current = 0;
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length > 0) handleDropFiles(droppedFiles);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        width: "100%",
        maxWidth: 820,
        margin: "0 auto",
        padding: "0 20px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* Drag-and-drop overlay */}
      {dragOver && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 50,
            borderRadius: 18,
            border: "2px dashed var(--accent)",
            background: "rgba(204,120,92,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
            animation: "oc-fadein 100ms ease-out",
          }}
        >
          <div style={{ textAlign: "center", color: "var(--accent)" }}>
            <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ margin: "0 auto 8px" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Drop files here</div>
          </div>
        </div>
      )}
      {/* ── Main input container ── */}
      <div
        style={{
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border-md)",
          borderRadius: 26,
          boxShadow: "0 8px 30px rgba(0,0,0,0.03), 0 0 0 1px var(--border)",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        {/* ── File attachments inside composer (Claude.ai style) ── */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "24px 24px 0" }}>
            {files.map((f, i) => {
              const fileName = f.file?.name || f.name || f.id || "";
              const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";
              const isImage = ["PNG","JPG","JPEG","WEBP","GIF","SVG","BMP"].includes(ext);
              const thumbUrl = f.meta?.base64 || (f.file ? URL.createObjectURL(f.file) : null);
              return (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    width: 140,
                    height: 140,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-md)",
                    borderRadius: 12,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    animation: "oc-card-in 240ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    transformOrigin: "bottom left",
                  }}
                >
                  <button
                    onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(0,0,0,0.04)",
                      color: "var(--t3)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      padding: 0,
                      transition: "background 100ms, color 100ms",
                      zIndex: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                      e.currentTarget.style.color = "var(--t1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                      e.currentTarget.style.color = "var(--t3)";
                    }}
                  >
                    ✕
                  </button>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0, paddingRight: 10 }}>
                    {isImage && thumbUrl ? (
                      <div style={{ width: "100%", height: 50, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <img src={thumbUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(120,100,75,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--accent)",
                        flexShrink: 0,
                      }}>
                        <FileIcon size={16} />
                      </div>
                    )}
                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: "var(--t1)",
                      lineHeight: 1.35,
                      wordBreak: "break-word",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {fileName}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", marginTop: 4 }}>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      padding: "2px 6px",
                      background: "rgba(0,0,0,0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: "var(--t3)",
                      letterSpacing: "0.02em",
                    }}>
                      {ext}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Slash command menu */}
        {slashOpen && filteredCommands.length > 0 && (
          <div
            ref={slashRef}
            style={{
              position: "absolute",
              bottom: "100%",
              left: 12,
              marginBottom: 4,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(20,20,19,0.12)",
              padding: "4px",
              minWidth: 220,
              zIndex: 100,
            }}
          >
            {filteredCommands.map((cmd, i) => (
              <div
                key={cmd.id}
                onClick={() => applySlash(cmd)}
                onMouseEnter={() => setSlashIdx(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: i === slashIdx ? "var(--bg-sidebar)" : "transparent",
                  color: "var(--t1)",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: "var(--bg-sidebar)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 500, color: "var(--t2)",
                  flexShrink: 0,
                }}>{cmd.icon}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{cmd.label}</div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>{cmd.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="How can I help you today?"
          disabled={isStreaming}
          rows={1}
          style={{
            display: "block",
            width: "100%",
            padding: "28px 28px 12px",
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontFamily: "var(--font)",
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--t1)",
            minHeight: 56,
            maxHeight: 240,
          }}
        />

        {/* Bottom toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px 14px",
          }}
        >
          {/* Left: Plus button only */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Plus button */}
            <div ref={plusRef} style={{ position: "relative" }}>
              <ToolBtn onClick={() => setPlusOpen((v) => !v)} active={plusOpen} title="Add content">
                <PlusIcon size={16} />
              </ToolBtn>

              {/* Plus menu */}
              {plusOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: 0,
                    width: 220,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-md)",
                    borderRadius: 12,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    padding: "4px",
                    zIndex: 300,
                    animation: "oc-fadein 100ms ease-out",
                  }}
                >
                  {PLUS_ITEMS.map((item, i) => {
                    if (item.divider)
                      return <div key={i} style={{ margin: "4px 8px", borderTop: "1px solid var(--border)" }} />;
                    const IconCmp = item.icon;
                    return (
                      <PlusMenuItem
                        key={item.id}
                        label={item.label}
                        icon={<IconCmp size={15} />}
                        disabled={item.disabled}
                        hasSubmenu={item.hasSubmenu}
                        toggle={item.toggle}
                        checked={item.id === "search" ? webSearch : false}
                        onClick={() => {
                          if (item.id === "search") {
                            setWebSearch((v) => !v);
                          } else if (item.id === "files") {
                            fileRef.current?.click();
                            setPlusOpen(false);
                          } else if (item.id === "screenshot") {
                            takeScreenshot();
                            setPlusOpen(false);
                          } else {
                            setPlusOpen(false);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Model Selector, Mic, Waveform, Blue Capsule, Send/Stop */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Model selector */}
            <ModelSelector
              selectedModelId={selectedModelId}
              onSelect={onModelSelect}
            />

            <ToolBtn title="Voice input">
              <MicIcon size={15} />
            </ToolBtn>

            <ToolBtn title="Audio features">
              <WaveformIcon size={15} />
            </ToolBtn>

            {/* Send / Stop button */}
            {isStreaming ? (
              <button
                onClick={onCancel}
                title="Stop generating"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--send-bg)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--bg-card)",
                  flexShrink: 0,
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--send-hov)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--send-bg)"}
              >
                <StopIcon size={12} />
              </button>
            ) : (
              (text.trim() || files.length > 0) && (
                <button
                  onClick={send}
                  title="Send message"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "none",
                    background: "var(--send-bg)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bg-card)",
                    flexShrink: 0,
                    transition: "background 120ms, color 120ms",
                    animation: "oc-fadein 120ms ease-out",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--send-hov)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "var(--send-bg)"}
                >
                  <ArrowUpIcon size={14} />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Category pills (only when no messages) ── */}
      {!hasMessages && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.label}
              icon={c.icon}
              onClick={() => {
                setText("");
                onSend({
                  content: c.prompt,
                  files: [],
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />

      {/* File preview modal */}
      {previewFile && (
        <Suspense fallback={null}>
          <FilePreview
            file={previewFile.file}
            data={previewFile.meta}
            onClose={() => setPreviewFile(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

/* ─── Tool button ───────────────────────────────────────────── */
function ToolBtn({ children, onClick, title, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: active ? "var(--bg-hover)" : hov ? "var(--bg-hover)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--t1)" : hov ? "var(--t2)" : "var(--t3)",
        flexShrink: 0,
        transition: "background 60ms, color 60ms",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Plus menu item ────────────────────────────────────────── */
function PlusMenuItem({ label, icon, disabled, hasSubmenu, toggle, checked, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "8px 10px",
        border: "none",
        borderRadius: 8,
        background: hov && !disabled ? "var(--bg-hover)" : "transparent",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "var(--font)",
        fontSize: 13.5,
        color: disabled ? "var(--t4)" : "var(--t2)",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
        transition: "background 60ms",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", color: disabled ? "var(--t4)" : "var(--t3)" }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {hasSubmenu && <ChevronRight size={12} />}
      {toggle && checked && (
        <span style={{ color: "var(--accent)", display: "flex" }}>
          <CheckSmall size={14} />
        </span>
      )}
    </button>
  );
}

/* ─── Category pill ─────────────────────────────────────────── */
function CategoryPill({ label, icon: IconCmp, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        border: "1px solid var(--border)",
        borderRadius: 999,
        background: hov ? "var(--bg-hover)" : "transparent",
        cursor: "pointer",
        fontFamily: "var(--font)",
        fontSize: 13,
        color: hov ? "var(--t1)" : "var(--t3)",
        transition: "background 60ms, color 60ms",
        whiteSpace: "nowrap",
      }}
    >
      {IconCmp && <IconCmp size={14} style={{ color: hov ? "var(--t2)" : "var(--t4)" }} />}
      <span>{label}</span>
    </button>
  );
}
