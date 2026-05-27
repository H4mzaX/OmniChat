"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ContextMenu from "./ContextMenu";

/* ─── SVG Icon Components (matching Claude.ai exactly) ──────── */
const Icon = ({ children, size = 18, ...p }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {children}
  </svg>
);

const NewChatIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const SearchIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Icon>
);

const ChatsIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Icon>
);

const ProjectsIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Icon>
);

const ArtifactsIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

const CodeIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Icon>
);

const CustomizeIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Icon>
);

const SidebarToggleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const MoreIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const ChevronUpDown = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 15l5 5 5-5" />
    <path d="M7 9l5-5 5 5" />
  </svg>
);

/* ── OmniClaude Logo (sparkle/asterisk style) ─────────────────── */
/* ── Claude blossom logo ──────────────────────────────────────── */
const BrandLogo = ({ size = 20, color = "var(--accent)" }) => (
  <svg height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" style={{ flex: "none" }}>
    <path
      d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 0 1-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
      fill={color}
      fillRule="nonzero"
    />
  </svg>
);

const InstallAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ── Utility helpers ──────────────────────────────────────────── */
function ago(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

/* ── Nav item ─────────────────────────────────────────────────── */
function NavItem({ icon, label, badge, onClick, active, disabled, collapsed }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: collapsed ? "10px" : "8px 12px",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active
          ? "var(--bg-active)"
          : hov && !disabled
            ? "var(--bg-hover)"
            : "transparent",
        border: "none",
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        color: active
          ? "var(--t1)"
          : disabled
            ? "var(--t4)"
            : hov
              ? "var(--t2)"
              : "var(--t3)",
        fontFamily: "var(--font)",
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        transition: "background 80ms, color 80ms",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      {!collapsed && (
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      {!collapsed && badge && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "1px 6px",
            borderRadius: 6,
            background: "rgba(99, 102, 241, 0.08)",
            color: "#4f46e5",
            border: "1px solid rgba(99, 102, 241, 0.15)",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Session row ─────────────────────────────────────────────── */
function SessionRow({ session, isActive, onClick, onDelete, onPin }) {
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const ctxItems = [
    { id: "rename", label: "Rename", onClick: () => {
      const name = prompt("Rename chat:", session.title || "");
      if (name && name !== session.title) onPin({ id: session.id, title: name });
    }, icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> },
    { id: "duplicate", label: "Duplicate", onClick: () => {}, icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> },
    { separator: true },
    { id: "pin", label: session.is_pinned ? "Unpin" : "Pin", onClick: () => onPin({ id: session.id, is_pinned: !session.is_pinned }), icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/></svg> },
    { separator: true },
    { id: "delete", label: "Delete", danger: true, onClick: () => onDelete(session.id), icon: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
  ];

  return (
    <ContextMenu id={`session-${session.id}`} items={ctxItems}>
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: "relative", borderRadius: 8 }}
    >
      <button
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 12px",
          background: isActive
            ? "var(--bg-active)"
            : hov
              ? "var(--bg-hover)"
              : "transparent",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font)",
          transition: "background 80ms",
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "var(--t1)" : "var(--t2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.4,
            }}
          >
            {session.title || "New Chat"}
          </span>
        </span>
      </button>

      {/* Context menu trigger */}
      {(hov || menuOpen) && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 6,
              background: menuOpen ? "var(--bg-active)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--t3)",
              transition: "background 80ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = menuOpen ? "var(--bg-active)" : "transparent"}
          >
            <MoreIcon size={14} />
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                right: 0,
                top: 28,
                width: 160,
                zIndex: 200,
                background: "var(--bg-card)",
                border: "1px solid var(--border-md)",
                borderRadius: 10,
                boxShadow: "var(--sh-lg)",
                overflow: "hidden",
                padding: "4px",
              }}
            >
              <MenuBtn
                label={session.is_pinned ? "Unpin" : "Pin"}
                onClick={() => {
                  onPin(session.id, !session.is_pinned);
                  setMenuOpen(false);
                }}
              />
              <MenuBtn
                label="Delete"
                danger
                onClick={() => {
                  onDelete(session.id);
                  setMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
    </ContextMenu>
  );
}

function MenuBtn({ label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "7px 10px",
        border: "none",
        cursor: "pointer",
        borderRadius: 6,
        background: hov
          ? danger
            ? "rgba(192,57,43,0.06)"
            : "var(--bg-hover)"
          : "transparent",
        color: danger && hov ? "var(--danger)" : "var(--t2)",
        fontSize: 13,
        fontFamily: "var(--font)",
        textAlign: "left",
        transition: "background 80ms, color 80ms",
      }}
    >
      {label}
    </button>
  );
}

/* ── Section header ───────────────────────────────────────────── */
function SectionHead({ label }) {
  return (
    <div
      style={{
        padding: "14px 10px 6px",
        fontSize: 11.5,
        fontWeight: 500,
        color: "var(--t4)",
        letterSpacing: "0.01em",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

/* ── Main Sidebar ─────────────────────────────────────────────── */
export default function Sidebar({
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onSettingsOpen,
  onCompareOpen,
  compareOpen,
  collapsed,
  onToggleCollapse,
}) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["sessions", search],
    queryFn: async () => {
      const url = search
        ? `/api/chat/sessions?search=${encodeURIComponent(search)}`
        : "/api/chat/sessions";
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      return r.json();
    },
    refetchInterval: 15000,
  });

  const deleteMut = useMutation({
    mutationFn: async (id) => {
      const r = await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const pinMut = useMutation({
    mutationFn: async ({ id, is_pinned }) => {
      const r = await fetch(`/api/chat/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned }),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const sessions = data?.sessions || [];
  const pinned = sessions.filter((s) => s.is_pinned);
  const recent = sessions.filter((s) => !s.is_pinned);
  const W = collapsed ? 72 : 300;

  return (
    <nav
      style={{
        width: W,
        flexShrink: 0,
        height: "100%",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: collapsed ? "none" : "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Top header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "16px 0" : "18px 16px 8px",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 20,
              fontWeight: 500,
              fontFamily: "'Newsreader', Georgia, serif",
              color: "var(--t1)",
              letterSpacing: "-0.01em",
            }}
          >
            Claude
          </span>
        )}
        {collapsed && <BrandLogo size={18} />}

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            title="Toggle sidebar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--t4)",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              transition: "color 80ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t4)")}
          >
            <SidebarToggleIcon size={16} />
          </button>
        )}
      </div>

      {/* ── Nav items ── */}
      <div style={{ padding: "2px 10px", flexShrink: 0 }}>
        {/* New Chat */}
        <NavItem
          collapsed={collapsed}
          label="New chat"
          onClick={onNewChat}
          icon={<NewChatIcon size={16} />}
        />

        {/* Search */}
        <NavItem
          collapsed={collapsed}
          label="Search"
          onClick={() => setShowSearch((v) => !v)}
          active={showSearch}
          icon={<SearchIcon size={16} />}
        />

        {/* Chats */}
        <NavItem
          collapsed={collapsed}
          label="Chats"
          onClick={() => {}}
          icon={<ChatsIcon size={16} />}
        />

        {/* Projects */}
        <NavItem
          collapsed={collapsed}
          label="Projects"
          onClick={() => {}}
          disabled
          icon={<ProjectsIcon size={16} />}
        />

        {/* Artifacts */}
        <NavItem
          collapsed={collapsed}
          label="Artifacts"
          onClick={() => {}}
          disabled
          icon={<ArtifactsIcon size={16} />}
        />

        {/* Code */}
        <NavItem
          collapsed={collapsed}
          label="Code"
          onClick={() => {}}
          disabled
          badge="Upgrade"
          icon={<CodeIcon size={16} />}
        />

        {/* Customize */}
        <NavItem
          collapsed={collapsed}
          label="Customize"
          onClick={() => onSettingsOpen("apikeys")}
          icon={<CustomizeIcon size={16} />}
        />
      </div>

      {/* ── Search box ── */}
      {showSearch && !collapsed && (
        <div style={{ padding: "4px 12px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            <SearchIcon size={13} style={{ color: "var(--t4)", flexShrink: 0 }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
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
                  padding: 0,
                  fontSize: 16,
                  lineHeight: 1,
                  display: "flex",
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Divider ── */}
      {!collapsed && (
      <div
        style={{
          margin: "4px 12px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      />
      )}

      {/* ── Session list ── */}
      {!collapsed && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
          {sessions.length === 0 ? (
            <div
              style={{
                padding: "24px 10px",
                textAlign: "center",
                color: "var(--t4)",
                fontSize: 13,
              }}
            >
              No conversations yet
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <SectionHead label="Pinned" />
                  {pinned.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      isActive={s.id === activeSessionId}
                      onClick={() => onSessionSelect(s.id)}
                      onDelete={(id) => deleteMut.mutate(id)}
                      onPin={(id, v) => pinMut.mutate({ id, is_pinned: v })}
                    />
                  ))}
                </>
              )}
              <SectionHead label="Recents" />
              {recent.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  isActive={s.id === activeSessionId}
                  onClick={() => onSessionSelect(s.id)}
                  onDelete={(id) => deleteMut.mutate(id)}
                  onPin={(id, v) => pinMut.mutate({ id, is_pinned: v })}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Bottom: user zone ── */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
          padding: collapsed ? "10px 0" : "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 12,
        }}
      >
        {!collapsed ? (
          <>
            <button
              onClick={() => onSettingsOpen("profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: 8,
                flex: 1,
                minWidth: 0,
                transition: "background 80ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#191919",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 600 }}>
                  AK
                </span>
              </div>
              <div style={{ minWidth: 0, textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "var(--t1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Ameer Khan
                </div>
                <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 1 }}>
                  Free plan
                </div>
              </div>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                title="Install Desktop App"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--t3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <InstallAppIcon size={14} />
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#3b82f6",
                    border: "1px solid var(--bg-sidebar)",
                  }}
                />
              </button>
              <ChevronUpDown size={14} style={{ color: "var(--t4)", flexShrink: 0 }} />
            </div>
          </>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--t3)",
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t1)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t3)")}
          >
            <SidebarToggleIcon size={16} />
          </button>
        )}
      </div>
    </nav>
  );
}
