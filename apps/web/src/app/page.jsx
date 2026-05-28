"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import ChatWorkspace from "../components/ChatWorkspace";
import SettingsModal from "../components/SettingsModal";
import CompareView from "../components/CompareView";

/* ─── Claude.ai–faithful global tokens + Premium Obsidian Dark Mode ──────────────────────── */
const GLOBAL_CSS = `
  :root {
    --font:       'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    --font-serif:  'Newsreader', 'Copernicus', 'Georgia', serif;
    --font-mono:  "SF Mono","Fira Code",Menlo,monospace;
    --font-family-primary: var(--font);

    /* Palette — Light Mode (Warm Sand & Cream) */
    --bg:            #f9f9f6;
    --bg-sidebar:    #f3f3ee;
    --bg-card:       #ffffff;
    --bg-hover:      rgba(20,20,19,0.04);
    --bg-active:     rgba(20,20,19,0.07);
    --bg-user-bubble: #f0ece5;

    --border:        rgba(120,100,75,0.10);
    --border-md:     rgba(120,100,75,0.18);
    --border-strong: rgba(120,100,75,0.28);

    --t1: #141413;   /* primary ink */
    --t2: #3d3d3a;   /* secondary text */
    --t3: #6c6a64;   /* tertiary / muted */
    --t4: #8e8b82;   /* placeholder */

    --accent:       #cc785c;
    --accent-hov:   #b8664a;
    --accent-light: rgba(204,120,92,0.10);

    --send-bg:      #141413;
    --send-hov:     #3d3d3a;

    --danger:       #c0392b;
    --info:         #2563eb;
    --success:      #16a34a;
    --warn:        #b45309;

    /* Spacing — strict tokens (2,6,8,10,12,16,24,32,48,64) */
    --s1:2px; --s2:6px; --s3:8px; --s4:10px; --s5:12px;
    --s6:16px; --s7:24px; --s8:32px; --s9:48px; --s10:64px;

    /* Radii — 6,8,14,18,24 */
    --r1:6px; --r2:8px; --r3:14px; --r4:18px; --r5:24px;
    --rf:9999px;

    /* Shadows */
    --sh-xs: 0 1px 2px rgba(20,20,19,0.06);
    --sh-sm: 0 1px 3px rgba(20,20,19,0.08), 0 0 0 1px rgba(20,20,19,0.04);
    --sh-md: 0 4px 8px rgba(20,20,19,0.07), 0 0 0 1px rgba(20,20,19,0.05);
    --sh-lg: 0 12px 24px rgba(20,20,19,0.09), 0 0 0 1px rgba(20,20,19,0.05);
    --sh-xl: 0 24px 48px rgba(20,20,19,0.12), 0 0 0 1px rgba(20,20,19,0.06);
    --sh-composer: 0 -2px 16px rgba(20,20,19,0.06), 0 0 0 1px rgba(20,20,19,0.04);

    /* Motion — 35,60,100,150,200,300,450 */
    --ease: cubic-bezier(0.25,0.46,0.45,0.94);
    --t-fastest: 35ms; --t-fast: 60ms; --t-base: 100ms; --t-slow: 150ms; --t-xslow: 200ms; --t-xxslow: 300ms; --t-xxxslow: 450ms;

    /* Compat aliases */
    --color-text-primary:   var(--t1);
    --color-text-secondary: var(--t2);
    --color-text-inverse:   var(--t3);
    --color-surface-muted:  var(--bg-card);
    --color-surface-raised: var(--bg);
    --color-border-default: var(--border);
    --color-border-strong:  var(--border-strong);
    --color-accent:         var(--accent);
    --color-accent-hover:   var(--accent-hov);
    --color-accent-muted:   var(--accent-light);
    --color-danger:         var(--danger);
    --color-danger-muted:   #fef2f2;
    --color-info:           var(--info);
    --color-info-muted:     #eff6ff;
    --color-focus-ring:     var(--info);
    --shadow-1:             var(--sh-xs);
    --shadow-elevated:      var(--sh-md);
    --shadow-modal:         var(--sh-xl);
    --motion-fast:          var(--t-fast);
    --motion-slow:          var(--t-slow);
    --motion-slower:        var(--t-slow);
    --motion-ease:          var(--ease);
    --space-1:var(--s1); --space-2:var(--s3); --space-3:var(--s4);
    --space-4:var(--s5); --space-5:var(--s6); --space-6:var(--s7);
    --space-7:var(--s10);
    --radius-xs:var(--r2); --radius-sm:var(--r3); --radius-md:var(--r4);
    --radius-lg:var(--r5); --radius-full:var(--rf);
    --font-size-xs:12px; --font-size-sm:14px; --font-size-md:16px;
    --font-weight-base:400; --font-weight-medium:500; --font-weight-semibold:600;
    --line-height-base:20px; --line-height-body:1.7;
    --msg-pad-x: 24px;
  }

  /* ─── Premium Obsidian Dark Mode Overrides ─── */
  :root[data-theme="dark"] {
    --bg:            #0c0c0b; /* deep elegant warm obsidian black */
    --bg-sidebar:    #121210; /* obsidian sidebar */
    --bg-card:       #181816; /* warm dark card layers */
    --bg-hover:      rgba(240,240,235,0.06);
    --bg-active:     rgba(240,240,235,0.09);
    --bg-user-bubble: #22221f;

    --border:        rgba(235,230,215,0.08);
    --border-md:     rgba(235,230,215,0.13);
    --border-strong: rgba(235,230,215,0.22);

    --t1: #f2f2eb;   /* premium soft gold-white ink */
    --t2: #d3d2c8;   /* warm grey secondary text */
    --t3: #9b9a91;   /* muted tertiary text */
    --t4: #6a6962;   /* placeholder text */

    --accent:       #e28a6c; /* readibility-enhanced warm coral */
    --accent-hov:   #cc785c;
    --accent-light: rgba(226,138,108,0.12);

    --send-bg:      #f2f2eb;
    --send-hov:     #d3d2c8;

    --sh-xs: 0 1px 2px rgba(0,0,0,0.45);
    --sh-sm: 0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02);
    --sh-md: 0 4px 12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.03);
    --sh-lg: 0 12px 28px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04);
    --sh-xl: 0 24px 56px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05);
    --sh-composer: 0 -2px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03);
  }

  /* ─── Layout Density Modifiers ─── */
  :root[data-density="compact"] {
    --msg-pad-x: 12px;
    --s5: 8px;
    --s6: 10px;
    --s7: 16px;
    --r2: 6px;
    --r3: 8px;
    --r4: 12px;
    --line-height-body: 1.5;
  }
  :root[data-density="spacious"] {
    --msg-pad-x: 36px;
    --s5: 16px;
    --s6: 24px;
    --s7: 32px;
    --r3: 16px;
    --r4: 22px;
    --line-height-body: 1.85;
  }

  /* ─── Font Size Modifiers ─── */
  :root[data-font-size="small"] {
    font-size: 13.5px;
    --font-size-xs: 11px;
    --font-size-sm: 12px;
    --font-size-md: 14.5px;
  }
  :root[data-font-size="large"] {
    font-size: 16.5px;
    --font-size-xs: 13px;
    --font-size-sm: 15px;
    --font-size-md: 18px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--t1);
    font-family: var(--font);
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 200ms ease, color 200ms ease;
  }
  :focus { outline: none; }
  :focus-visible { outline: 2px solid var(--info); outline-offset: 2px; border-radius: var(--r2); }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(20,20,19,0.12); border-radius: var(--rf); }
  ::-webkit-scrollbar-thumb:hover { background: rgba(20,20,19,0.22); }

  :root[data-theme="dark"] ::-webkit-scrollbar-thumb { background: rgba(240,240,235,0.14); }
  :root[data-theme="dark"] ::-webkit-scrollbar-thumb:hover { background: rgba(240,240,235,0.25); }

  /* Premium Glassmorphic utilities */
  .oc-glass {
    backdrop-filter: blur(12px) saturate(120%);
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(120, 100, 75, 0.08);
  }
  :root[data-theme="dark"] .oc-glass {
    background: rgba(24, 24, 22, 0.65);
    border: 1px solid rgba(235, 230, 215, 0.07);
  }

  @keyframes oc-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes oc-dot { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-4px);opacity:1} }
  @keyframes oc-fadein { from{opacity:0} to{opacity:1} }
  @keyframes oc-slideup { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes oc-card-in { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .oc-cursor {
    display:inline-block; width:2px; height:14px;
    background:var(--accent); margin-left:1px;
    vertical-align:text-bottom;
    animation:oc-blink 1s step-end infinite;
  }
  .oc-dot {
    display:inline-block; width:6px; height:6px;
    border-radius:50%; background:var(--t4);
    animation:oc-dot 1.4s ease-in-out infinite;
  }

  /* Form elements legibility fixes for dark mode */
  :root[data-theme="dark"] select,
  :root[data-theme="dark"] option,
  :root[data-theme="dark"] input,
  :root[data-theme="dark"] textarea {
    background-color: var(--bg-card) !important;
    color: var(--t1) !important;
    border-color: var(--border-md) !important;
  }
  :root[data-theme="dark"] input::placeholder,
  :root[data-theme="dark"] textarea::placeholder {
    color: var(--t4) !important;
  }

  /* Prose / markdown output */
  .oc-prose { font-family: var(--font-serif); font-size:15.5px; line-height:1.68; color:var(--t2); }
  .oc-prose p { margin-bottom:10px; }
  .oc-prose p:last-child { margin-bottom:0; }
  .oc-prose h1 { font-size:21px; font-weight:600; color:var(--t1); margin:18px 0 10px; font-family: var(--font); }
  .oc-prose h2 { font-size:18px; font-weight:600; color:var(--t1); margin:16px 0 8px; font-family: var(--font); }
  .oc-prose h3 { font-size:15.5px; font-weight:600; color:var(--t1); margin:14px 0 6px; font-family: var(--font); }
  .oc-prose ul,.oc-prose ol { padding-left:22px; margin-bottom:10px; }
  .oc-prose li { margin-bottom:3px; }
  .oc-prose code { font-family:var(--font-mono); font-size:12.5px; background:rgba(20,20,19,0.06); color:var(--t1); padding:2px 6px; border-radius:var(--r1); }
  :root[data-theme="dark"] .oc-prose code { background:rgba(255,255,255,0.07); }
  .oc-prose pre { margin:10px 0; border-radius:var(--r2); overflow:hidden; }
  .oc-prose pre code { background:none; padding:0; font-size:13px; color:inherit; }
  .oc-prose blockquote { border-left:3px solid var(--border-md); padding-left:16px; color:var(--t3); margin:10px 0; font-style:italic; }
  .oc-prose table { width:100%; border-collapse:collapse; margin:10px 0; font-size:13px; }
  .oc-prose th { background:rgba(20,20,19,0.04); font-weight:600; color:var(--t1); padding:6px 12px; text-align:left; border-bottom:1px solid var(--border); }
  :root[data-theme="dark"] .oc-prose th { background:rgba(255,255,255,0.04); }
  .oc-prose td { padding:6px 12px; border-bottom:1px solid var(--border); color:var(--t2); }
  .oc-prose a { color:var(--accent); text-decoration:underline; text-underline-offset:2px; }
  .oc-prose strong { font-weight:600; color:var(--t1); }
  .oc-prose em { font-style:italic; }
  .oc-prose hr { border:none; border-top:1px solid var(--border); margin:14px 0; }

  @media (max-width: 768px) {
    :root {
      --msg-pad-x: 12px;
    }
  }
`;

export default function AppShell() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("apikeys");
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Core Appearance States
  const [theme, setTheme] = useState("system");
  const [density, setDensity] = useState("comfortable");
  const [fontSize, setFontSize] = useState("default");

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("omnichat-theme") || "system";
      const storedDensity = localStorage.getItem("omnichat-density") || "comfortable";
      const storedFontSize = localStorage.getItem("omnichat-font-size") || "default";
      setTheme(storedTheme);
      setDensity(storedDensity);
      setFontSize(storedFontSize);
    }
  }, []);

  // Sync theme changes with DOM attributes + media queries
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("omnichat-theme", theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const actual = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.setAttribute("data-theme", actual);
    };

    applyTheme();

    if (theme === "system") {
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  // Sync density changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("omnichat-density", density);
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  // Sync font size changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("omnichat-font-size", fontSize);
    document.documentElement.setAttribute("data-font-size", fontSize);
  }, [fontSize]);

  // Handle mobile screen resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true); // Close drawer on mobile by default
      } else {
        setSidebarCollapsed(false); // Open sidebar on desktop by default
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === "k") {
        e.preventDefault();
        document.querySelector('[placeholder="Search chats..."]')?.focus();
      }
      if (meta && e.key === "n") {
        e.preventDefault();
        setActiveSessionId(null);
        setCompareOpen(false);
      }
      if (meta && e.key === ",") {
        e.preventDefault();
        setSettingsTab("apikeys");
        setSettingsOpen((v) => !v);
      }
      if (meta && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Tauri desktop integration
  useEffect(() => {
    if (typeof window.__TAURI__ === "undefined") return;
    const tauri = window.__TAURI__;
    document.body.setAttribute("data-tauri", "true");

    // Expose functions for tray menu
    window.__tauriNewChat = () => {
      setActiveSessionId(null);
      setCompareOpen(false);
    };
    window.__tauriOpenSettings = () => {
      setSettingsTab("apikeys");
      setSettingsOpen(true);
    };

    // Apply native window drag region to sidebar header
    const style = document.createElement("style");
    style.textContent = `
      [data-tauri] .tauri-drag { -webkit-app-region: drag; app-region: drag; }
      [data-tauri] .tauri-no-drag { -webkit-app-region: no-drag; }
    `;
    document.head.appendChild(style);

    // Load API keys from keychain on mount
    (async () => {
      try {
        const providers = await fetch("/api/providers").then(r => r.json());
        for (const p of providers.providers || []) {
          if (!p.key_id) continue;
          const stored = await tauri.core.invoke("keychain_get", {
            service: "omniclaude",
            key: `api_key_${p.id}`,
          });
          if (stored && !p.key_preview) {
            // Save key to backend if not present
            await fetch(`/api/providers/${p.id}/key`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ full_key: stored }),
            });
          }
        }
      } catch (e) {
        console.warn("Tauri keychain load failed:", e);
      }
    })();

    return () => {
      delete window.__tauriNewChat;
      delete window.__tauriOpenSettings;
    };
  }, []);

  const { data: modelsData } = useQuery({
    queryKey: ["models", "all"],
    queryFn: async () => {
      const r = await fetch("/api/models");
      if (!r.ok) return { models: [] };
      return r.json();
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const r = await fetch("/api/settings");
      if (!r.ok) return { settings: {} };
      return r.json();
    },
  });

  useEffect(() => {
    if (!selectedModel && modelsData?.models?.length > 0) {
      const defId = settingsData?.settings?.default_model;
      const byId = defId
          ? modelsData.models.find((m) => m.model_id === defId)
          : null;
      const connNonBuiltin = modelsData.models.find(
          (m) => m.is_connected && m.provider_slug !== "builtin",
      );
      const conn = modelsData.models.find((m) => m.is_connected);
      setSelectedModel(byId || connNonBuiltin || conn || modelsData.models[0]);
    }
  }, [modelsData, settingsData, selectedModel]);

  const openSettings = (tab) => {
    setSettingsTab(tab || "apikeys");
    setSettingsOpen(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: "var(--bg)",
          position: "relative",
        }}
      >
        {/* Mobile drawer overlay backdrop */}
        {isMobile && !sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(true)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(3px)",
              zIndex: 40,
              animation: "oc-fadein 200ms ease",
            }}
          />
        )}

        {/* Sidebar container (absolute on mobile overlay, static on desktop) */}
        <div
          style={{
            position: isMobile ? "absolute" : "static",
            top: 0,
            left: 0,
            bottom: 0,
            width: sidebarCollapsed ? 0 : 280,
            zIndex: 50,
            transition: "width 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            transform: isMobile && sidebarCollapsed ? "translateX(-100%)" : "translateX(0)",
            display: isMobile && sidebarCollapsed ? "none" : "flex",
            height: "100%",
            background: "var(--bg-sidebar)",
            boxShadow: isMobile && !sidebarCollapsed ? "4px 0 24px rgba(0,0,0,0.2)" : "none",
          }}
        >
          <Sidebar
            activeSessionId={activeSessionId}
            onSessionSelect={(id) => {
              setActiveSessionId(id);
              setCompareOpen(false);
              if (isMobile) setSidebarCollapsed(true);
            }}
            onNewChat={() => {
              setActiveSessionId(null);
              setCompareOpen(false);
              if (isMobile) setSidebarCollapsed(true);
            }}
            onSettingsOpen={(tab) => {
              openSettings(tab);
              if (isMobile) setSidebarCollapsed(true);
            }}
            onCompareOpen={() => {
              setCompareOpen((v) => !v);
              if (isMobile) setSidebarCollapsed(true);
            }}
            compareOpen={compareOpen}
            collapsed={isMobile ? false : sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* Mobile top header bar */}
          {isMobile && (
            <div
              className="oc-glass"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 52,
                padding: "0 16px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                zIndex: 10,
              }}
            >
              <button
                onClick={() => setSidebarCollapsed(false)}
                aria-label="Open sidebar"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--t2)",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <span
                style={{
                  fontSize: 16.5,
                  fontWeight: 600,
                  fontFamily: "var(--font)",
                  letterSpacing: "-0.02em",
                  color: "var(--t1)",
                }}
              >
                OmniChat
              </span>

              <button
                onClick={() => {
                  setActiveSessionId(null);
                  setCompareOpen(false);
                }}
                aria-label="New chat"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--t2)",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}

          {compareOpen ? (
            <CompareView />
          ) : (
            <ChatWorkspace
              sessionId={activeSessionId}
              onSessionCreate={setActiveSessionId}
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
              onOpenSettings={openSettings}
              isMobile={isMobile}
            />
          )}
        </main>

        {settingsOpen && (
          <SettingsModal
            initialTab={settingsTab}
            onClose={() => setSettingsOpen(false)}
            theme={theme}
            setTheme={setTheme}
            density={density}
            setDensity={setDensity}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        )}
      </div>
    </>
  );
}
