"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export default function ContextMenu({ id, items, children, onOpenChange }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const onContext = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 160);
    setPos({ x, y });
    onOpenChange?.(true);
  }, [onOpenChange]);

  useEffect(() => {
    if (!pos) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setPos(null);
        onOpenChange?.(false);
      }
    };
    const onEsc = (e) => { if (e.key === "Escape") { setPos(null); onOpenChange?.(false); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", onEsc); };
  }, [pos, onOpenChange]);

  return (
    <>
      <div onContextMenu={onContext} style={{ cursor: "context-menu" }}>
        {children}
      </div>
      {pos && (
        <div
          ref={ref}
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            zIndex: 500,
            background: "var(--bg-card)",
            border: "1px solid var(--border-md)",
            borderRadius: 10,
            boxShadow: "0 8px 28px rgba(20,20,19,0.14), 0 0 0 1px rgba(20,20,19,0.04)",
            padding: "4px",
            minWidth: 170,
            animation: "oc-fadein 60ms ease-out",
          }}
        >
          {items.map((item, i) => (
            item.separator ? (
              <div key={i} style={{ margin: "3px 6px", borderTop: "1px solid var(--border)" }} />
            ) : (
              <button
                key={item.id || i}
                onClick={() => { item.onClick(); setPos(null); onOpenChange?.(false); }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "6px 10px",
                  border: "none", borderRadius: 7,
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  fontSize: 13,
                  color: item.danger ? "#d32f2f" : "var(--t1)",
                  textAlign: "left",
                  transition: "background 35ms",
                }}
              >
                {item.icon && (
                  <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.shortcut && (
                  <span style={{ fontSize: 11, color: "var(--t4)" }}>{item.shortcut}</span>
                )}
              </button>
            )
          ))}
        </div>
      )}
    </>
  );
}
