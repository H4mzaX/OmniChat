"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* ─── Token design ─────────────────────────────────────────── */
const S = {
  bg: "var(--bg)",
  bgCard: "var(--bg-card)",
  bgSide: "var(--bg-sidebar)",
  border: "var(--border)",
  borderMd: "var(--border-md)",
  t1: "var(--t1)",
  t2: "var(--t2)",
  t3: "var(--t3)",
  t4: "var(--t4)",
  accent: "var(--accent)",
  info: "var(--info)",
  danger: "var(--danger)",
  success: "#16a34a",
  warn: "#b45309",
};

/* ─── Provider metadata ─────────────────────────────────────── */
const PDOC = {
  anthropic: "https://console.anthropic.com/keys",
  openai: "https://platform.openai.com/api-keys",
  gemini: "https://aistudio.google.com/app/apikey",
  openrouter: "https://openrouter.ai/keys",
  groq: "https://console.groq.com/keys",
  deepseek: "https://platform.deepseek.com/api_keys",
  mistral: "https://console.mistral.ai/api-keys",
  xai: "https://console.x.ai",
  together: "https://api.together.xyz/settings/api-keys",
  fireworks: "https://fireworks.ai/account/api-keys",
  perplexity: "https://www.perplexity.ai/settings/api",
  cohere: "https://dashboard.cohere.com/api-keys",
};
const PDOT = {
  builtin: "#22c55e",
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
  cohere: "#39594d",
  ollama: "#9ca3af",
  lmstudio: "#6366f1",
};

/* ─── Tab defs ─────────────────────────────────────────────── */
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "privacy", label: "Privacy & Safety" },
  { id: "assistant", label: "Assistant" },
  { id: "apikeys", label: "API Keys", badge: "BYOK" },
  { id: "models", label: "Models" },
  { id: "mcp", label: "MCP Servers" },
  { id: "skills", label: "Skills" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "about", label: "About" },
];

/* ─── Shared atoms ──────────────────────────────────────────── */
function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "sm",
}) {
  const [hov, setHov] = useState(false);
  const bg =
    variant === "primary"
      ? disabled
        ? "var(--bg-active)"
        : hov
          ? S.warn
          : S.accent
      : hov
        ? "var(--bg-active)"
        : "var(--bg-hover)";
  const color = variant === "primary" ? (disabled ? S.t4 : "#fff") : S.t2;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: size === "xs" ? "4px 10px" : "7px 14px",
        fontSize: size === "xs" ? 12 : 13,
        fontWeight: 500,
        borderRadius: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: bg,
        color,
        fontFamily: "var(--font)",
        transition: "background 80ms",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  mono,
  autoFocus,
  onKeyDown,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      style={{
        flex: 1,
        minWidth: 0,
        background: "var(--bg)",
        border: "1px solid var(--border-md)",
        borderRadius: 8,
        outline: "none",
        padding: "8px 12px",
        fontSize: 13,
        color: S.t1,
        fontFamily: mono ? "'SF Mono',monospace" : "var(--font)",
      }}
    />
  );
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        background: value ? S.accent : "var(--border-strong)",
        transition: "background 150ms",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          transition: "left 150ms",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

function Row({ label, desc, right, border = true }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: border ? `1px solid ${S.border}` : "none",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: S.t1 }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: S.t3, marginTop: 3 }}>{desc}</div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

function SectionHead({ label }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: S.t4,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 12,
        marginTop: 20,
      }}
    >
      {label}
    </div>
  );
}

function Badge({ children, color = S.info }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: color + "18",
        border: `1px solid ${color}33`,
        borderRadius: 999,
        padding: "2px 7px",
      }}
    >
      {children}
    </span>
  );
}

function InfoBox({ children, color = S.info }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        background: color + "0e",
        border: `1px solid ${color}28`,
        borderRadius: 8,
        fontSize: 13,
        color: S.t2,
        marginBottom: 16,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════ TAB CONTENTS ══════════════════════════════════ */

/* ── Profile ── */
function ProfileTab() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          padding: "16px",
          background: S.bgSide,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: S.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 22, color: "#fff", fontWeight: 600 }}>
            {name[0]?.toUpperCase() || "U"}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: S.t1 }}>
            {name}
          </div>
          <div style={{ fontSize: 13, color: S.t3, marginTop: 2 }}>{email}</div>
          <Badge color={S.success}>Free Plan</Badge>
        </div>
      </div>
      <SectionHead label="Account" />
      <Row
        label="Display name"
        desc="Shown in the interface"
        border
        right={
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        }
      />
      <Row
        label="Email"
        desc="Your account email"
        border={false}
        right={
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        }
      />
      <div style={{ marginTop: 16 }}>
        <Btn>Save changes</Btn>
      </div>
    </div>
  );
}

/* ── Appearance ── */
function AppearanceTab({ theme, setTheme, density, setDensity, fontSize, setFontSize }) {

  const ThemeCard = ({ id, label, desc }) => (
    <div
      onClick={() => setTheme(id)}
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: 10,
        cursor: "pointer",
        border:
          theme === id ? `2px solid ${S.accent}` : `2px solid ${S.border}`,
        background: theme === id ? S.accent + "08" : S.bgCard,
        transition: "border-color 100ms, background 100ms",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: theme === id ? 600 : 400,
          color: theme === id ? S.accent : S.t1,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, color: S.t3, marginTop: 2 }}>{desc}</div>
    </div>
  );

  return (
    <div>
      <SectionHead label="Theme" />
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <ThemeCard id="light" label="Light" desc="Warm cream tones" />
        <ThemeCard id="dark" label="Dark" desc="Deep dark mode" />
        <ThemeCard id="system" label="System" desc="Match OS setting" />
      </div>

      <SectionHead label="Density" />
      <Row
        label="Message spacing"
        desc="How much space between messages"
        border={false}
        right={
          <select
            value={density}
            onChange={(e) => setDensity(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${S.borderMd}`,
              fontSize: 13,
              fontFamily: "var(--font)",
              background: S.bgCard,
              color: S.t1,
              cursor: "pointer",
            }}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        }
      />

      <SectionHead label="Font size" />
      <div style={{ display: "flex", gap: 8 }}>
        {["small", "default", "large"].map((s) => (
          <button
            key={s}
            onClick={() => setFontSize(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              cursor: "pointer",
              border:
                fontSize === s
                  ? `2px solid ${S.accent}`
                  : `2px solid ${S.border}`,
              background: fontSize === s ? S.accent + "10" : S.bgCard,
              fontSize: s === "small" ? 11 : s === "large" ? 16 : 13,
              color: fontSize === s ? S.accent : S.t2,
              fontFamily: "var(--font)",
              fontWeight: fontSize === s ? 600 : 400,
            }}
          >
            {s === "small" ? "Aa" : s === "default" ? "Aa" : "Aa"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Privacy ── */
function PrivacyTab() {
  const [settings, setSettings] = useState({
    shareConversations: false,
    analytics: true,
    improvements: true,
    notifications: false,
  });
  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  return (
    <div>
      <InfoBox color={S.info}>
        Your conversations are stored securely in your own database.
        OmniChat never shares your data with third parties.
      </InfoBox>
      <SectionHead label="Data & Privacy" />
      <Row
        label="Share conversations for training"
        desc="Help improve AI models by sharing anonymized conversations"
        border
        right={
          <Toggle
            value={settings.shareConversations}
            onChange={(v) => upd("shareConversations", v)}
          />
        }
      />
      <Row
        label="Usage analytics"
        desc="Anonymous usage data to improve the product"
        border
        right={
          <Toggle
            value={settings.analytics}
            onChange={(v) => upd("analytics", v)}
          />
        }
      />
      <Row
        label="Product improvements"
        desc="Receive feature announcements and tips"
        border={false}
        right={
          <Toggle
            value={settings.improvements}
            onChange={(v) => upd("improvements", v)}
          />
        }
      />

      <SectionHead label="Danger Zone" />
      <div
        style={{
          padding: "14px 16px",
          background: "var(--bg-card)",
          border: `1px solid ${S.danger}33`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: S.danger }}>
            Delete all conversations
          </div>
          <div style={{ fontSize: 12, color: S.t3, marginTop: 2 }}>
            This will permanently delete all your chat history
          </div>
        </div>
        <button
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: "none",
            background: S.danger,
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font)",
            fontWeight: 500,
          }}
        >
          Delete all
        </button>
      </div>
    </div>
  );
}

/* ── Assistant ── */
function AssistantTab() {
  const [settings, setSettings] = useState({
    memoryEnabled: true,
    artifacts: true,
    latex: true,
    citations: false,
    autoTitle: true,
  });
  const upd = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div>
      <SectionHead label="Behavior" />
      <Row
        label="Memory"
        desc="Remember key facts about you across conversations"
        border
        right={
          <Toggle
            value={settings.memoryEnabled}
            onChange={(v) => upd("memoryEnabled", v)}
          />
        }
      />
      <Row
        label="Artifacts"
        desc="Show code and content in a side panel for easy viewing"
        border
        right={
          <Toggle
            value={settings.artifacts}
            onChange={(v) => upd("artifacts", v)}
          />
        }
      />
      <Row
        label="LaTeX rendering"
        desc="Render mathematical expressions in responses"
        border
        right={
          <Toggle value={settings.latex} onChange={(v) => upd("latex", v)} />
        }
      />
      <Row
        label="Source citations"
        desc="Cite sources when referencing external information"
        border
        right={
          <Toggle
            value={settings.citations}
            onChange={(v) => upd("citations", v)}
          />
        }
      />
      <Row
        label="Auto-generate titles"
        desc="Automatically title new conversations based on content"
        border={false}
        right={
          <Toggle
            value={settings.autoTitle}
            onChange={(v) => upd("autoTitle", v)}
          />
        }
      />

      <SectionHead label="System prompt" />
      <div style={{ fontSize: 13, color: S.t3, marginBottom: 8 }}>
        Custom instructions added to every conversation
      </div>
      <textarea
        placeholder="You are a helpful assistant..."
        style={{
          width: "100%",
          minHeight: 100,
          padding: "10px 12px",
          border: `1px solid ${S.borderMd}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "var(--font)",
          color: S.t1,
          resize: "vertical",
          background: S.bgCard,
          outline: "none",
        }}
      />
      <div style={{ marginTop: 10 }}>
        <Btn size="sm">Save instructions</Btn>
      </div>
    </div>
  );
}

/* ── API Keys (BYOK) ── */
function ApiKeysTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const r = await fetch("/api/providers");
      return r.json();
    },
  });

  const saveKey = useMutation({
    mutationFn: async ({ id, key }) => {
      const r = await fetch(`/api/providers/${id}/key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Failed");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });

  const removeKey = useMutation({
    mutationFn: async (id) => {
      const r = await fetch(`/api/providers/${id}/key`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });

  const providers = data?.providers || [];
  const commercial = providers.filter((p) => p.provider_type === "commercial");
  const local = providers.filter((p) => p.provider_type === "local");
  const builtin = providers.filter((p) => p.provider_type === "builtin");

  return (
    <div>
      <InfoBox color={S.info}>
        <strong>Bring Your Own Key (BYOK)</strong> — Paste your API keys
        below to connect any AI provider. Keys are stored securely in your
        database and sent directly to the provider.
      </InfoBox>

      {builtin.map((p) => (
        <BuiltinCard key={p.id} provider={p} />
      ))}

      {/* ── Free Models Section ── */}
      <FreeModelsSection />

      {commercial.length > 0 && (
        <>
          <SectionHead label="Commercial Providers" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {commercial.map((p) => (
              <ProvCard
                key={p.id}
                provider={p}
                onSave={(k) => saveKey.mutate({ id: p.id, key: k })}
                onRemove={() => removeKey.mutate(p.id)}
              />
            ))}
          </div>
        </>
      )}

      {local.length > 0 && (
        <>
          <SectionHead label="Local Providers" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {local.map((p) => (
              <ProvCard
                key={p.id}
                provider={p}
                onSave={(k) => saveKey.mutate({ id: p.id, key: k })}
                onRemove={() => removeKey.mutate(p.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BuiltinCard({ provider }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--bg-card)",
        border: `1px solid ${S.success}44`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 16 }}>✦</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.t1 }}>
            {provider.name}
          </div>
          <div style={{ fontSize: 12, color: S.success }}>
            Always available · No key required · Powered by Gemini 2.5 Flash
          </div>
        </div>
      </div>
      <Badge color="#16a34a">Free</Badge>
    </div>
  );
}

/* ── Free Models Section ── */
function FreeModelsSection() {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionHead label="Free Models" />
      <div
        style={{
          padding: "12px 14px",
          background: "var(--bg-card)",
          border: `1px solid var(--border-md)`,
          borderRadius: 12,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#fff", fontSize: 18 }}>∞</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.t1 }}>
                Free AI Models
              </div>
              <div style={{ fontSize: 12, color: S.t3 }}>
                Active & Rotated automatically · No API key needed
              </div>
            </div>
          </div>
          <Badge color="#7c3aed">Free</Badge>
        </div>

        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg)",
            border: `1px solid var(--border)`,
            borderRadius: 8,
            fontSize: 12.5,
            color: S.t2,
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Consolidated Free Pool</strong>: When using <strong>Free Models</strong>, OmniChat coordinates requests dynamically through high-capacity free endpoints.
          <div style={{ marginTop: 6, fontSize: 11.5, color: S.t3 }}>
            Includes auto-rotation and rate-limit protection for <strong>Gemini 2.5 Flash</strong>, <strong>DeepSeek V3</strong>, <strong>Llama 3.3</strong>, and <strong>Mistral Small</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

function ProvCard({ provider, onSave, onRemove }) {
  const [keyInput, setKeyInput] = useState("");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const dot = PDOT[provider.slug] || S.t4;
  const isConn = provider.is_connected;
  const isLocal = provider.provider_type === "local";

  const save = () => {
    if (!keyInput.trim() && !isLocal) return;
    onSave(isLocal ? "local-no-key-required" : keyInput.trim());
    setKeyInput("");
    setEditing(false);
  };

  return (
    <div
      style={{
        background: S.bgCard,
        border: `1px solid ${S.borderMd}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isConn && !editing ? 0 : 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dot,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.t1 }}>
              {provider.name}
            </div>
            {isLocal && (
              <div style={{ fontSize: 11, color: S.t4 }}>
                {provider.base_url}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isConn && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: S.success,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: S.success,
                }}
              />{" "}
              Connected
            </span>
          )}
          {!isConn && !editing && (
            <Btn size="xs" onClick={() => setEditing(true)} variant="secondary">
              {isLocal ? "Enable" : "Add key"}
            </Btn>
          )}
          {isConn && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{
                  fontSize: 12,
                  color: S.info,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                Change
              </button>
              <button
                onClick={onRemove}
                style={{
                  fontSize: 12,
                  color: S.danger,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {(editing || (!isConn && false)) && (
        <div>
          {isConn && !editing ? null : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!isLocal && (
                <div style={{ flex: 1, position: "relative" }}>
                  <Input
                    type={show ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste API key…"
                    onKeyDown={(e) => e.key === "Enter" && save()}
                    mono
                  />
                  {keyInput && (
                    <button
                      onClick={() => setShow((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: S.t4,
                        fontSize: 13,
                      }}
                    >
                      {show ? "🙈" : "👁"}
                    </button>
                  )}
                </div>
              )}
              {isLocal && (
                <div
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: S.t3,
                    padding: "8px 12px",
                    background: S.bgSide,
                    borderRadius: 8,
                  }}
                >
                  No key required — just enable the provider
                </div>
              )}
              <Btn
                size="xs"
                onClick={save}
                disabled={!keyInput.trim() && !isLocal}
              >
                Save
              </Btn>
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false);
                    setKeyInput("");
                  }}
                  style={{
                    fontSize: 12,
                    color: S.t3,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
          {PDOC[provider.slug] && !isLocal && (
            <div style={{ marginTop: 8 }}>
              <a
                href={PDOC[provider.slug]}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  background: "var(--accent-light)",
                  border: "1px solid rgba(226,138,108,0.18)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "background 80ms, transform 80ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(226,138,108,0.18)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-light)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Retrieve {provider.name} API Key
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Models ── */
function ModelsTab() {
  const [filter, setFilter] = useState("");
  const { data } = useQuery({
    queryKey: ["models", "all"],
    queryFn: async () => {
      const r = await fetch("/api/models");
      return r.json();
    },
  });
  const models = (data?.models || []).filter(
    (m) =>
      !filter ||
      m.display_name.toLowerCase().includes(filter.toLowerCase()) ||
      m.model_id.toLowerCase().includes(filter.toLowerCase()),
  );
  const grouped = models.reduce((acc, m) => {
    const k = m.provider_name || "Other";
    (acc[k] = acc[k] || []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <InfoBox color="#7c3aed">
        🧠 Models are automatically synced when you connect a provider.
        Enable/disable individual models below.
      </InfoBox>
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter models…"
      />
      <div style={{ marginTop: 16 }}>
        {Object.entries(grouped).map(([prov, ms]) => (
          <div key={prov} style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: PDOT[ms[0]?.provider_slug] || S.t4,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: S.t4,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {prov}
              </span>
              <div style={{ flex: 1, height: 1, background: S.border }} />
              <span style={{ fontSize: 11, color: S.t4 }}>
                {ms.length} models
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ms.map((m) => (
                <ModelRow key={m.model_id} model={m} />
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: S.t4,
              fontSize: 13,
              padding: "32px 0",
            }}
          >
            No models found
          </div>
        )}
      </div>
    </div>
  );
}

function ModelRow({ model }) {
  const cost = parseFloat(model.input_cost_per_1k || 0);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: S.bgCard,
        border: `1px solid ${S.border}`,
        borderRadius: 8,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: S.t1 }}>
          {model.display_name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: S.t4,
            fontFamily: "'SF Mono',monospace",
          }}
        >
          {model.model_id}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {model.context_window && (
          <span style={{ fontSize: 11, color: S.t4 }}>
            {model.context_window >= 1e6
              ? (model.context_window / 1e6).toFixed(0) + "M"
              : (model.context_window / 1000).toFixed(0) + "K"}
          </span>
        )}
        {model.supports_vision && <Badge color={S.info}>Vision</Badge>}
        {model.supports_tools && <Badge color="#7c3aed">Tools</Badge>}
        {cost === 0 ? (
          <Badge color={S.success}>Free</Badge>
        ) : (
          <span style={{ fontSize: 11, color: S.t4 }}>
            ${cost.toFixed(4)}/1K
          </span>
        )}
      </div>
    </div>
  );
}

/* ── MCP Servers ── */
function McpTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newToken, setNewToken] = useState("");
  const [testing, setTesting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mcp-connectors"],
    queryFn: async () => {
      const r = await fetch("/api/mcp");
      return r.json();
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_enabled }) => {
      const r = await fetch(`/api/mcp/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled }),
      });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-connectors"] }),
  });

  const addMut = useMutation({
    mutationFn: async (body) => {
      const r = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mcp-connectors"] });
      setShowAdd(false);
      setNewUrl("");
      setNewName("");
      setNewToken("");
    },
  });

  const testConn = async (id) => {
    setTesting(id);
    try {
      const r = await fetch(`/api/mcp/${id}`, { method: "POST" });
      const d = await r.json();
      qc.invalidateQueries({ queryKey: ["mcp-connectors"] });
    } finally {
      setTesting(null);
    }
  };

  const connectors = data?.connectors || [];
  const builtin = connectors.filter((c) => c.connector_type !== "custom");
  const custom = connectors.filter((c) => c.connector_type === "custom");

  return (
    <div>
      <InfoBox color="#7c3aed">
        ⚡ <strong>Model Context Protocol (MCP)</strong> — Connect your AI to
        external tools, databases, and services. MCP servers extend what your assistant
        can do.
      </InfoBox>

      <a
        href="https://modelcontextprotocol.io"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: S.info,
          marginBottom: 16,
          textDecoration: "underline",
        }}
      >
        ↗ Learn about MCP
      </a>

      <SectionHead label="Available Connectors" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {builtin.map((c) => (
          <McpCard
            key={c.id}
            connector={c}
            onToggle={(v) => toggleMut.mutate({ id: c.id, is_enabled: v })}
            onTest={() => testConn(c.id)}
            testing={testing === c.id}
          />
        ))}
      </div>

      <SectionHead label="Custom MCP Servers" />
      {custom.length === 0 && !showAdd && (
        <div style={{ fontSize: 13, color: S.t4, marginBottom: 12 }}>
          No custom servers added yet.
        </div>
      )}
      {custom.map((c) => (
        <McpCard
          key={c.id}
          connector={c}
          onToggle={(v) => toggleMut.mutate({ id: c.id, is_enabled: v })}
          onTest={() => testConn(c.id)}
          testing={testing === c.id}
        />
      ))}

      {showAdd ? (
        <div
          style={{
            padding: 14,
            background: S.bgSide,
            border: `1px solid ${S.borderMd}`,
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Server name (e.g. My Postgres)"
          />
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Server URL (e.g. http://localhost:3001)"
            mono
          />
          <Input
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="Auth token (optional)"
            type="password"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              size="xs"
              onClick={() =>
                addMut.mutate({
                  name: newName,
                  server_url: newUrl,
                  auth_token: newToken || undefined,
                  connector_type: "custom",
                })
              }
              disabled={!newName.trim() || !newUrl.trim()}
            >
              Add Server
            </Btn>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                fontSize: 12,
                color: S.t3,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            width: "100%",
            background: "transparent",
            border: `1.5px dashed ${S.borderMd}`,
            borderRadius: 10,
            cursor: "pointer",
            color: S.t3,
            fontSize: 13,
            fontFamily: "var(--font)",
            marginTop: 8,
          }}
        >
          + Add custom MCP server
        </button>
      )}
    </div>
  );
}

function McpCard({ connector, onToggle, onTest, testing }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "12px 14px",
        background: S.bgCard,
        border: `1px solid ${S.borderMd}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{connector.icon || "⚡"}</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: S.t1 }}>
              {connector.name}
            </span>
            {connector.is_connected && (
              <Badge color={S.success}>Connected</Badge>
            )}
            {connector.is_enabled && !connector.is_connected && (
              <Badge color={S.warn}>Not tested</Badge>
            )}
          </div>
          <div style={{ fontSize: 12, color: S.t3, marginTop: 1 }}>
            {connector.description}
          </div>
          {connector.server_url && (
            <div
              style={{
                fontSize: 11,
                color: S.t4,
                fontFamily: "'SF Mono',monospace",
                marginTop: 1,
              }}
            >
              {connector.server_url}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {(hov || connector.is_enabled) && connector.server_url && (
          <button
            onClick={onTest}
            disabled={testing}
            style={{
              fontSize: 11,
              color: S.info,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            {testing ? "Testing…" : "Test"}
          </button>
        )}
        <Toggle value={connector.is_enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

/* ── Skills ── */
function SkillsTab() {
  const { data } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      try {
        const r = await fetch("/api/skills");
        return r.json();
      } catch {
        return { skills: [] };
      }
    },
  });
  const skills = data?.skills || FALLBACK_SKILLS;

  return (
    <div>
      <InfoBox color={S.accent}>
        🛠 Skills extend your assistant's capabilities. Enable or disable them to control
        what your AI can do in conversations.
      </InfoBox>
      <SectionHead label="Built-in Skills" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {skills.map((s) => (
          <SkillCard key={s.slug || s.id} skill={s} />
        ))}
      </div>
    </div>
  );
}

const FALLBACK_SKILLS = [
  {
    slug: "web-search",
    name: "Web Search",
    description: "Search the web for up-to-date information",
    icon: "🌐",
    is_enabled: true,
  },
  {
    slug: "image-analysis",
    name: "Image Analysis",
    description: "Understand and analyze uploaded images",
    icon: "👁",
    is_enabled: true,
  },
  {
    slug: "doc-reading",
    name: "Document Reading",
    description: "Read and analyze uploaded PDFs and documents",
    icon: "📄",
    is_enabled: true,
  },
  {
    slug: "calculator",
    name: "Calculator",
    description: "Precise mathematical calculations",
    icon: "🧮",
    is_enabled: true,
  },
  {
    slug: "code-exec",
    name: "Code Execution",
    description: "Run code in a sandboxed environment",
    icon: "⚡",
    is_enabled: false,
  },
  {
    slug: "memory",
    name: "Memory",
    description: "Remember facts across conversations",
    icon: "🧠",
    is_enabled: false,
  },
];

function SkillCard({ skill }) {
  const [enabled, setEnabled] = useState(skill.is_enabled);
  return (
    <div
      style={{
        padding: "12px 14px",
        background: S.bgCard,
        border: `1px solid ${S.borderMd}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{skill.icon || "🔧"}</span>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: S.t1 }}>
              {skill.name}
            </span>
            {!enabled && <Badge color={S.t4}>Disabled</Badge>}
          </div>
          <div style={{ fontSize: 12, color: S.t3, marginTop: 1 }}>
            {skill.description}
          </div>
        </div>
      </div>
      <Toggle value={enabled} onChange={setEnabled} />
    </div>
  );
}

/* ── Diagnostics ── */
function DiagnosticsTab() {
  const [syncing, setSyncing] = useState(null);
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: async () => {
      const r = await fetch("/api/providers/diagnostics");
      return r.json();
    },
    staleTime: 30000,
  });

  const syncModels = async (id) => {
    setSyncing(id);
    try {
      const b = id ? { provider_id: id } : {};
      const r = await fetch("/api/providers/sync-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Sync failed");
      const msg = data.results?.map((r) => `${r.provider}: ${r.synced ?? r.error ?? "ok"}`).join(", ");
      await qc.invalidateQueries({ queryKey: ["models"] });
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSyncing(null);
    }
  };

  const diags = data?.diagnostics || [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: S.t3 }}>
          Provider health and connectivity
        </div>
        <button
          onClick={() => !isFetching && refetch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: S.info,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              animation: isFetching ? "spin 1s linear infinite" : "none",
            }}
          >
            ↻
          </span>
          {isFetching ? "Checking…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 32, color: S.t4 }}>
          Running diagnostics…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {diags.map((d) => (
            <DiagCard
              key={d.id}
              diag={d}
              onSync={() => syncModels(d.id)}
              syncing={syncing === d.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DiagCard({ diag, onSync, syncing }) {
  const dot = PDOT[diag.slug] || S.t4;
  const isOk = diag.ping_ok === true;
  const isFail = diag.ping_ok === false;
  const canSync =
    (diag.slug === "openrouter" || diag.slug === "ollama") && diag.is_connected;

  return (
    <div
      style={{
        padding: "12px 14px",
        background: S.bgCard,
        border: `1px solid ${S.borderMd}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot,
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.t1 }}>
            {diag.name}
          </div>
          <div style={{ fontSize: 11, color: S.t4 }}>
            {diag.model_count} models
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {diag.ping_latency_ms != null && (
          <span style={{ fontSize: 11, color: S.t4 }}>
            {diag.ping_latency_ms}ms
          </span>
        )}
        {!diag.is_connected ? (
          <Badge color={S.t4}>Not connected</Badge>
        ) : isOk ? (
          <Badge color={S.success}>✓ OK</Badge>
        ) : isFail ? (
          <Badge color={S.danger}>✗ Error</Badge>
        ) : (
          <Badge color={S.t4}>Not tested</Badge>
        )}
        {canSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            style={{
              fontSize: 12,
              color: S.info,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {syncing ? "Syncing…" : "↻ Sync"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── About ── */
function AboutTab() {
  const infos = [
    ["Version", "2.0.0"],
    ["Build", "2026.05.27"],
    ["Default model", "Gemini 2.5 Flash (Free, built-in)"],
    [
      "Supported providers",
      "Anthropic · OpenAI · Groq · Gemini · DeepSeek · Mistral · xAI · OpenRouter · Together · Fireworks · Perplexity · Ollama · LM Studio",
    ],
    ["MCP", "Model Context Protocol v1.0"],
    ["License", "MIT"],
  ];
  return (
    <div>
      <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: S.accent,
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2v20M2 12h20M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364"
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: S.t1 }}>
          OmniChat
        </div>
        <div style={{ fontSize: 13, color: S.t3, marginTop: 4 }}>
          Your personal multi-provider AI hub
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {infos.map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: S.bgCard,
              border: `1px solid ${S.border}`,
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 13, color: S.t3 }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: S.t2 }}>
              {v}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 12,
          color: S.t4,
        }}
      >
        Built with ♥ ·{" "}
        <a
          href="https://modelcontextprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: S.info }}
        >
          MCP Docs
        </a>
      </div>
    </div>
  );
}

/* ══════════════ MAIN MODAL ════════════════════════════════════ */
export default function SettingsModal({
  onClose,
  initialTab = "apikeys",
  theme,
  setTheme,
  density,
  setDensity,
  fontSize,
  setFontSize,
}) {
  const [activeTab, setActiveTab] = useState(
    TABS.find((t) => t.id === initialTab)?.id ||
      TABS.find((t) => t.label === initialTab)?.id ||
      "apikeys",
  );

  /* Close on Escape */
  useEffect(() => {
    const handle = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const TAB_CONTENT = {
    profile: <ProfileTab />,
    appearance: (
      <AppearanceTab
        theme={theme}
        setTheme={setTheme}
        density={density}
        setDensity={setDensity}
        fontSize={fontSize}
        setFontSize={setFontSize}
      />
    ),
    privacy: <PrivacyTab />,
    assistant: <AssistantTab />,
    apikeys: <ApiKeysTab />,
    models: <ModelsTab />,
    mcp: <McpTab />,
    skills: <SkillsTab />,
    diagnostics: <DiagnosticsTab />,
    about: <AboutTab />,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 820,
          height: "90vh",
          maxHeight: 720,
          display: "flex",
          background: S.bgCard,
          border: `1px solid ${S.borderMd}`,
          borderRadius: 16,
          boxShadow: "0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* ── Left sidebar ── */}
        <div
          style={{
            width: 200,
            background: S.bgSide,
            borderRight: `1px solid ${S.border}`,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflowY: "auto",
            padding: "16px 8px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: S.t4,
              padding: "0 8px 12px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Settings
          </div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                background:
                  activeTab === tab.id ? "var(--bg-active)" : "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "var(--font)",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? S.t1 : S.t2,
                textAlign: "left",
                transition: "background 80ms, color 80ms",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ flex: 1 }}>{tab.label}</span>
              {tab.badge && <Badge color={S.accent}>{tab.badge}</Badge>}
            </button>
          ))}
        </div>

        {/* ── Right content ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: `1px solid ${S.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: S.t1 }}>
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: S.t4,
                transition: "background 80ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}
          >
            {TAB_CONTENT[activeTab] || null}
          </div>
        </div>
      </div>
    </div>
  );
}
