"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

/* ─── Model tier config (Claude.ai style) ──────────────────── */
const MODEL_TIERS = {
  // Anthropic models
  "claude-opus-4-20250514": { tier: "opus", desc: "Most capable for ambitious projects", premium: true },
  "claude-opus-4": { tier: "opus", desc: "Most capable for ambitious projects", premium: true },
  "claude-sonnet-4-20250514": { tier: "sonnet", desc: "Most efficient for everyday tasks", premium: false },
  "claude-sonnet-4": { tier: "sonnet", desc: "Most efficient for everyday tasks", premium: false },
  "claude-3-5-sonnet-20241022": { tier: "sonnet", desc: "Most efficient for everyday tasks", premium: false },
  "claude-3.5-sonnet": { tier: "sonnet", desc: "Most efficient for everyday tasks", premium: false },
  "claude-3-5-haiku-20241022": { tier: "haiku", desc: "Fastest for quick answers", premium: false },
  "claude-3-haiku": { tier: "haiku", desc: "Fastest for quick answers", premium: false },
  "claude-haiku-4": { tier: "haiku", desc: "Fastest for quick answers", premium: false },
};

function getModelMeta(model) {
  const tier = MODEL_TIERS[model.model_id];
  if (tier) return tier;
  // Generate descriptions for non-Anthropic models
  const name = (model.display_name || "").toLowerCase();
  if (name.includes("gpt-4") || name.includes("o1") || name.includes("o3")) return { desc: "Advanced reasoning model", premium: false };
  if (name.includes("gpt-3.5") || name.includes("gpt-4o-mini")) return { desc: "Fast and efficient", premium: false };
  if (name.includes("gemini")) return { desc: "Google's multimodal model", premium: false };
  if (name.includes("llama")) return { desc: "Open-source model", premium: false };
  if (name.includes("mixtral") || name.includes("mistral")) return { desc: "Fast open model", premium: false };
  if (name.includes("deepseek")) return { desc: "Advanced reasoning", premium: false };
  return { desc: model.provider_name || "AI model", premium: false };
}

const ChevronDown = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
export default function ModelSelector({ selectedModelId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef(null);
  const dropdownRef = useRef(null);

  const { data: connData } = useQuery({
    queryKey: ["models", "connected"],
    queryFn: async () => {
      const r = await fetch("/api/models?connected=true");
      if (!r.ok) return { models: [] };
      return r.json();
    },
  });
  const { data: allData } = useQuery({
    queryKey: ["models", "all"],
    queryFn: async () => {
      const r = await fetch("/api/models");
      if (!r.ok) return { models: [] };
      return r.json();
    },
  });

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Flip dropdown to stay within viewport
  useEffect(() => {
    if (!open || !ref.current) return;
    const check = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const estH = 240;
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      setDropUp(spaceBelow < estH && spaceAbove > spaceBelow);
    };
    check();
    const raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [open, showMore]);

  const connected = connData?.models || [];
  const all = allData?.models || [];
  
  // Make unique pool by model_id
  const allPool = [...connected, ...all];
  const uniquePool = Array.from(new Map(allPool.map(m => [m.model_id, m])).values());
  const selected = uniquePool.find((m) => m.model_id === selectedModelId);
  const activeModel = selected || (uniquePool.length > 0 ? uniquePool.find(m => m.model_id.includes("sonnet")) || uniquePool[0] : null);
  const otherModels = uniquePool.filter((m) => m.model_id !== activeModel?.model_id);

  // Dynamic filter for search box
  const q = search.toLowerCase().trim();
  const filteredOtherModels = otherModels.filter(
    (m) =>
      !q ||
      m.display_name.toLowerCase().includes(q) ||
      m.model_id.toLowerCase().includes(q)
  );

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* ── Trigger pill ── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          setShowMore(false);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={activeModel ? "Model: " + activeModel.display_name : "Select model"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          background: "transparent",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontFamily: "var(--font)",
          fontSize: 13,
          fontWeight: 400,
          color: "var(--t3)",
          transition: "background 100ms, color 100ms",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--t1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--t3)";
        }}
      >
        <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
          {activeModel?.display_name || "Select model"}
        </span>
        <ChevronDown />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          ref={dropdownRef}
          role="listbox"
          aria-label="Pick a model"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            zIndex: 300,
            background: "var(--bg-card)",
            border: "1px solid var(--border-md)",
            borderRadius: 16,
            boxShadow: "var(--sh-lg)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            animation: "oc-fadein 100ms ease-out",
          }}
        >
          {/* Left Panel */}
          <div style={{ width: 240, padding: "8px 6px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Active Model Row */}
            {activeModel && (
              <button
                onClick={() => {
                  onSelect(activeModel);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: 10,
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font)",
                  transition: "background 60ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ minWidth: 0, marginRight: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--t1)" }}>
                    {activeModel.display_name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2, lineHeight: 1.3 }}>
                    {getModelMeta(activeModel).desc}
                  </div>
                </div>
                <span style={{ color: "#3b82f6", display: "flex", flexShrink: 0 }}>
                  <CheckIcon />
                </span>
              </button>
            )}

            {/* Divider */}
            <div style={{ margin: "6px 8px", borderTop: "1px solid var(--border)" }} />

            {/* Adaptive Thinking Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
              }}
            >
              <div style={{ marginRight: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 400, color: "var(--t1)" }}>Adaptive thinking</div>
                <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2, lineHeight: 1.3 }}>Thinks for more complex tasks</div>
              </div>
              <ToggleSwitch />
            </div>

            {/* Divider */}
            <div style={{ margin: "6px 8px", borderTop: "1px solid var(--border)" }} />

            {/* More Models Row */}
            <button
              onClick={() => setShowMore((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderRadius: 10,
                background: showMore ? "var(--bg-active)" : "transparent",
                cursor: "pointer",
                fontFamily: "var(--font)",
                fontSize: 13.5,
                color: "var(--t2)",
                transition: "background 60ms",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = showMore ? "var(--bg-active)" : "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = showMore ? "var(--bg-active)" : "transparent"}
            >
              <span>More models</span>
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                style={{
                  transform: showMore ? "rotate(90deg)" : "none",
                  transition: "transform 120ms",
                  color: "var(--t3)"
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Right Panel (More Models) */}
          {showMore && (
            <>
              {/* Vertical border line */}
              <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
              
              <div style={{ width: 220, padding: "8px 6px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "6px 12px 4px", fontSize: 11, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  More models
                </div>
                {/* Sleek Search Box inside Panel */}
                <div style={{ padding: "4px 8px 8px", flexShrink: 0 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "4px 8px"
                  }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search models..."
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        outline: "none",
                        fontSize: 12,
                        color: "var(--t1)",
                        fontFamily: "var(--font)",
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--t4)",
                          fontSize: 10,
                          lineHeight: 1,
                          padding: 0,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", maxHeight: 220, paddingRight: 2 }}>
                  {filteredOtherModels.map((m) => {
                    const isPremium = m.model_id.includes("opus") || getModelMeta(m).premium;
                    const isSel = m.model_id === selectedModelId;
                    return (
                      <button
                        key={m.model_id}
                        onClick={() => {
                          onSelect(m);
                          setOpen(false);
                          setShowMore(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: 8,
                          background: isSel ? "var(--bg-active)" : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "var(--font)",
                          transition: "background 60ms",
                          marginBottom: 2,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isSel ? "var(--bg-active)" : "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = isSel ? "var(--bg-active)" : "transparent"}
                      >
                        <div style={{ minWidth: 0, marginRight: 8 }}>
                          <div style={{
                            fontSize: 13,
                            fontWeight: isSel ? 500 : 400,
                            color: isSel ? "var(--accent)" : "var(--t1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {m.display_name}
                          </div>
                        </div>
                        {isPremium ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(99, 102, 241, 0.08)",
                              color: "#4f46e5",
                              border: "1px solid rgba(99, 102, 241, 0.15)",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Upgrade
                          </span>
                        ) : isSel ? (
                          <span style={{ color: "var(--accent)", display: "flex", flexShrink: 0 }}>
                            <CheckIcon />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  {filteredOtherModels.length === 0 && (
                    <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 12, color: "var(--t4)" }}>
                      No matching models
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Toggle switch ─────────────────────────────────────────── */
function ToggleSwitch() {
  const [on, setOn] = useState(false);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        background: on ? "var(--accent)" : "var(--border-strong)",
        transition: "background 150ms",
        padding: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          transition: "left 150ms",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
