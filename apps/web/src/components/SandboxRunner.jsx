"use client";
import { useState, useRef, useCallback } from "react";

const WORKER_CODE = `
self.onmessage = function(e) {
  const { code, timeout } = e.data;
  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
  try {
    const result = eval(code);
    const resultStr = result === undefined ? undefined : typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
    self.postMessage({ type: 'done', result: resultStr, logs, error: null });
  } catch (err) {
    self.postMessage({ type: 'error', result: null, logs, error: err.message });
  }
  console.log = originalLog;
};
`;

export default function SandboxRunner({ code, language = "javascript", onResult }) {
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  const run = useCallback(() => {
    if (!code?.trim()) return;
    setRunning(true);
    setError(null);
    setOutput(null);

    if (language !== "javascript" && language !== "js") {
      setError(`Execution only supported for JavaScript. Got: ${language}`);
      setRunning(false);
      return;
    }

    try {
      const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      workerRef.current = new Worker(url);
      URL.revokeObjectURL(url);

      const timer = setTimeout(() => {
        workerRef.current?.terminate();
        setRunning(false);
        setError("Execution timed out after 5s");
      }, 5000);

      workerRef.current.onmessage = (e) => {
        clearTimeout(timer);
        setRunning(false);
        if (e.data.type === "done") {
          setOutput(e.data.logs.join("\n"));
          setError(null);
          onResult?.({ success: true, result: e.data.result, logs: e.data.logs });
        } else {
          setOutput(e.data.logs.join("\n"));
          setError(e.data.error);
          onResult?.({ success: false, error: e.data.error, logs: e.data.logs });
        }
        workerRef.current?.terminate();
      };

      workerRef.current.onerror = (e) => {
        clearTimeout(timer);
        setRunning(false);
        setError(e.message);
        workerRef.current?.terminate();
      };

      workerRef.current.postMessage({ code, timeout: 5000 });
    } catch (e) {
      setRunning(false);
      setError(e.message);
    }
  }, [code, language, onResult]);

  return (
    <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)" }}>Sandbox ⚡</span>
        <button
          onClick={run}
          disabled={running}
          style={{
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 500,
            background: running ? "var(--bg-hover)" : "var(--accent)",
            color: running ? "var(--t3)" : "#fff",
            border: "none",
            borderRadius: 6,
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "var(--font)",
            transition: "background 60ms",
          }}
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {running && (
        <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--t4)", fontFamily: '"SF Mono",monospace' }}>
          <span style={{ animation: "oc-pulse 1s infinite" }}>●</span> Executing...
        </div>
      )}

      {output && (
        <pre style={{ margin: 0, padding: "10px 14px", fontSize: 12, lineHeight: 1.5, color: "var(--t2)", background: "var(--bg)", overflow: "auto", maxHeight: 200, fontFamily: '"SF Mono",monospace' }}>
          {output}
        </pre>
      )}

      {error && (
        <pre style={{ margin: 0, padding: "10px 14px", fontSize: 12, lineHeight: 1.5, color: "#dc2626", background: "#fef2f2", overflow: "auto", maxHeight: 200, fontFamily: '"SF Mono",monospace' }}>
          ⚠ {error}
        </pre>
      )}

      {!running && !output && !error && (
        <div style={{ padding: "12px 14px", fontSize: 12, color: "var(--t4)", fontStyle: "italic" }}>
          Click "Run" to execute this code in a sandboxed Web Worker
        </div>
      )}
    </div>
  );
}
