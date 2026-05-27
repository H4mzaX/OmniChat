/**
 * Tauri Desktop bridge — provides IPC wrappers for native features.
 * Returns null/fallback when not running inside Tauri.
 */

let tauri = null;
try {
  tauri = window.__TAURI__;
} catch {}

export const isTauri = () => !!tauri;

// ── Window Management ──

export function minimize() {
  tauri?.core.invoke("minimize_window");
}

export function maximize() {
  tauri?.core.invoke("maximize_window");
}

export function closeWindow() {
  tauri?.core.invoke("close_window");
}

export function isMaximized() {
  return tauri?.core.invoke("is_maximized") ?? false;
}

export function setTitle(title) {
  tauri?.core.invoke("set_title", { title });
}

// ── Keychain ──

export async function keychainSet(service, key, value) {
  if (!tauri) return false;
  await tauri.core.invoke("keychain_set", { service, key, value });
  return true;
}

export async function keychainGet(service, key) {
  if (!tauri) return null;
  return tauri.core.invoke("keychain_get", { service, key });
}

export async function keychainDelete(service, key) {
  if (!tauri) return false;
  await tauri.core.invoke("keychain_delete", { service, key });
  return true;
}

export async function keychainHas(service, key) {
  if (!tauri) return false;
  return tauri.core.invoke("keychain_has", { service, key });
}

// ── Docker Sandbox (via Tauri backend) ──

export async function dockerCheck() {
  if (!tauri) return null;
  return tauri.core.invoke("docker_check");
}

export async function dockerRunSandbox({ image, code, language, timeoutSecs = 10 }) {
  if (!tauri) return null;
  return tauri.core.invoke("docker_run_sandbox", { image, code, language, timeout_secs: timeoutSecs });
}

export async function dockerListImages() {
  if (!tauri) return null;
  return tauri.core.invoke("docker_list_images");
}

export async function dockerPullImage(image) {
  if (!tauri) return null;
  return tauri.core.invoke("docker_pull_image", { image });
}

// ── System Info ──

export async function getSystemInfo() {
  if (!tauri) return { platform: "web", desktop: false };
  return tauri.core.invoke("get_system_info");
}

// ── Notifications ──

export function sendNotification(title, body) {
  if (!tauri) {
    // Fallback to web notification API
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }
  tauri.core.emit("notification", { title, body });
}

// ── Clipboard ──

export async function clipboardRead() {
  if (!tauri) return navigator.clipboard.readText();
  return tauri.core.invoke("plugin:clipboard-manager|read_text");
}

export async function clipboardWrite(text) {
  if (!tauri) return navigator.clipboard.writeText(text);
  return tauri.core.invoke("plugin:clipboard-manager|write_text", { text });
}
