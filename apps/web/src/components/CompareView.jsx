"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Clock, Zap, DollarSign, Plus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PROVIDER_DOTS = {
  anthropic: "#c96a32",
  openai: "#22c55e",
  gemini: "#3b82f6",
  groq: "#a855f7",
  deepseek: "#0ea5e9",
  mistral: "#f59e0b",
  xai: "#374151",
  openrouter: "#ec4899",
  together: "#14b8a6",
  fireworks: "#ff6b35",
  perplexity: "#1fb8cd",
  ollama: "#9ca3af",
};

function ModelPill({ model, onRemove }) {
  const dot = PROVIDER_DOTS[model.provider_slug] || "var(--color-text-inverse)";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: "var(--color-surface-muted)",
        border: "1px solid var(--color-border-default)",
        borderRadius: 20,
        fontSize: 12,
        boxShadow: "var(--shadow-1)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
        {model.display_name}
      </span>
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--color-text-inverse)",
          display: "inline-flex",
          transition: "color 60ms",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-danger)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--color-text-inverse)")
        }
      >
        <X size={11} />
      </button>
    </div>
  );
}

function ResultCard({ result, rank }) {
  const dot =
    PROVIDER_DOTS[result.provider_slug] || "var(--color-text-inverse)";
  const isWinner = rank === 0;

  return (
    <div
      style={{
        background: "var(--color-surface-muted)",
        border:
          "1px solid " +
          (isWinner ? "rgba(201,106,50,0.3)" : "var(--color-border-default)"),
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: isWinner
          ? "0 0 0 2px rgba(201,106,50,0.12)"
          : "var(--shadow-1)",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--color-surface-raised)",
          borderBottom: "1px solid var(--color-border-default)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dot,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {result.model_id}
          </span>
          {isWinner && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--color-accent)",
                background: "rgba(201,106,50,0.1)",
                border: "1px solid rgba(201,106,50,0.2)",
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              Fastest
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {result.latency_ms && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: "var(--color-text-inverse)",
              }}
            >
              <Clock size={10} />
              {(result.latency_ms / 1000).toFixed(1)}s
            </span>
          )}
          {(result.input_tokens || result.output_tokens) && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: "var(--color-text-inverse)",
              }}
            >
              <Zap size={10} />
              {(
                (result.input_tokens || 0) + (result.output_tokens || 0)
              ).toLocaleString()}{" "}
              tok
            </span>
          )}
          {result.estimated_cost > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 11,
                color: "var(--color-text-inverse)",
              }}
            >
              <DollarSign size={10} />
              {result.estimated_cost.toFixed(5)}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div
        style={{
          flex: 1,
          padding: "14px 16px",
          overflowY: "auto",
          maxHeight: 400,
        }}
      >
        {result.error ? (
          <div style={{ fontSize: 13, color: "#b91c1c", lineHeight: 1.6 }}>
            Error: {result.error}
          </div>
        ) : (
          <div className="oc-prose">
            <ReactMarkdown>{result.content || ""}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompareView() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelected] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelSearch, setModelSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const { data: modelsData } = useQuery({
    queryKey: ["models", "connected"],
    queryFn: async () => {
      const r = await fetch("/api/models?connected=true");
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const allModels = modelsData?.models || [];
  const filteredModels = allModels.filter((m) => {
    const q = modelSearch.toLowerCase();
    return (
      m.display_name.toLowerCase().includes(q) ||
      m.model_id.toLowerCase().includes(q)
    );
  });

  const addModel = (m) => {
    if (selectedModels.find((s) => s.model_id === m.model_id)) return;
    if (selectedModels.length >= 6) return;
    setSelected((prev) => [...prev, m]);
    setShowPicker(false);
    setModelSearch("");
  };

  const removeModel = (modelId) =>
    setSelected((prev) => prev.filter((m) => m.model_id !== modelId));

  const handleCompare = useCallback(async () => {
    if (!prompt.trim() || selectedModels.length < 2) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/router/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          models: selectedModels.map((m) => ({
            model_id: m.model_id,
            provider_slug: m.provider_slug,
          })),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Compare failed");
      }
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedModels]);

  const sorted = results
    ? [...results].sort(
        (a, b) =>
          (a.error ? 1 : 0) - (b.error ? 1 : 0) ||
          (a.latency_ms || Infinity) - (b.latency_ms || Infinity),
      )
    : null;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--color-surface-raised)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px 0",
          borderBottom: "1px solid var(--color-border-default)",
          flexShrink: 0,
          background: "var(--color-surface-raised)",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: 4,
          }}
        >
          Compare Models
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-inverse)",
            marginBottom: 16,
          }}
        >
          Run the same prompt across multiple models in parallel and compare
          results.
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Model selection */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-inverse)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Models ({selectedModels.length}/6)
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            {selectedModels.map((m) => (
              <ModelPill
                key={m.model_id}
                model={m}
                onRemove={() => removeModel(m.model_id)}
              />
            ))}
            {selectedModels.length < 6 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    background: "var(--color-surface-muted)",
                    border: "1px dashed var(--color-border-default)",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--color-text-inverse)",
                    fontFamily: "var(--font-family-primary)",
                    transition: "all 60ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(11,11,11,0.3)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-default)";
                    e.currentTarget.style.color = "var(--color-text-inverse)";
                  }}
                >
                  <Plus size={12} /> Add model
                </button>

                {showPicker && (
                  <div
                    style={{
                      position: "absolute",
                      top: 34,
                      left: 0,
                      zIndex: 100,
                      width: 260,
                      background: "var(--color-surface-muted)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                      boxShadow: "var(--shadow-elevated)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 10px",
                        borderBottom: "1px solid var(--color-border-default)",
                      }}
                    >
                      <input
                        autoFocus
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          fontSize: 12,
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-family-primary)",
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      {filteredModels.length === 0 ? (
                        <div
                          style={{
                            padding: "12px 12px",
                            fontSize: 12,
                            color: "var(--color-text-inverse)",
                          }}
                        >
                          No models found
                        </div>
                      ) : (
                        filteredModels.map((m) => {
                          const dot =
                            PROVIDER_DOTS[m.provider_slug] || "#9ca3af";
                          const already = !!selectedModels.find(
                            (s) => s.model_id === m.model_id,
                          );
                          return (
                            <button
                              key={m.model_id}
                              onClick={() => !already && addModel(m)}
                              disabled={already}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                width: "100%",
                                padding: "8px 12px",
                                background: "transparent",
                                border: "none",
                                cursor: already ? "default" : "pointer",
                                textAlign: "left",
                                fontFamily: "var(--font-family-primary)",
                                opacity: already ? 0.4 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!already)
                                  e.currentTarget.style.background =
                                    "var(--color-surface-raised)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: dot,
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "var(--color-text-primary)",
                                  }}
                                >
                                  {m.display_name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "var(--color-text-inverse)",
                                  }}
                                >
                                  {m.provider_name}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Prompt input */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-inverse)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Prompt
          </div>
          <div
            style={{
              background: "var(--color-surface-muted)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 8,
              boxShadow: "var(--shadow-1)",
            }}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleCompare();
              }}
              placeholder="Enter a prompt to send to all selected models..."
              rows={4}
              style={{
                width: "100%",
                resize: "none",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--color-text-primary)",
                lineHeight: 1.6,
                fontFamily: "var(--font-family-primary)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderTop: "1px solid var(--color-border-default)",
              }}
            >
              <span
                style={{ fontSize: 11, color: "var(--color-text-inverse)" }}
              >
                {selectedModels.length < 2
                  ? "Select at least 2 models to compare"
                  : ""}
                {selectedModels.length >= 2 &&
                  "Cmd+Enter to run \u00B7 comparing " +
                    selectedModels.length +
                    " models"}
              </span>
              <CompareBtn
                onClick={handleCompare}
                disabled={
                  loading || selectedModels.length < 2 || !prompt.trim()
                }
              >
                {loading ? (
                  "Running..."
                ) : (
                  <>
                    <Send size={12} /> Run Compare
                  </>
                )}
              </CompareBtn>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(185,28,28,0.06)",
              border: "1px solid rgba(185,28,28,0.18)",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 12, color: "#b91c1c" }}>{error}</span>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--color-text-secondary)",
                fontWeight: 500,
                marginBottom: 8,
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
              <span>Working</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-inverse)",
              }}
            >
              Running {selectedModels.length} models in parallel...
            </div>
          </div>
        )}

        {sorted && !loading && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-text-inverse)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Results
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              {sorted.map((r, idx) => (
                <ResultCard key={r.model_id} result={r} rank={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompareBtn({ children, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        fontSize: 12,
        fontWeight: 500,
        color: disabled ? "var(--color-text-inverse)" : "#fff",
        background: disabled
          ? "rgba(11,11,11,0.08)"
          : hov
            ? "var(--color-accent-hover)"
            : "var(--color-accent)",
        border: "none",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 60ms",
        fontFamily: "var(--font-family-primary)",
      }}
    >
      {children}
    </button>
  );
}
