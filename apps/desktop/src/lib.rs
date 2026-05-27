use serde_json::json;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent, WindowEvent,
};

mod docker;

/* ─── State ───────────────────────────────────────────────────── */
struct AppState {
    _keychain: Mutex<keyring::Entry>,
}

/* ─── Commands ─────────────────────────────────────────────────── */

// ── Window Management ──

#[tauri::command]
fn minimize_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
fn maximize_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn close_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }
}

#[tauri::command]
fn is_maximized(app: AppHandle) -> bool {
    app.get_webview_window("main")
        .and_then(|w| w.is_maximized().ok())
        .unwrap_or(false)
}

#[tauri::command]
fn set_title(title: String, app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(&title);
    }
}

// ── Keychain (secure credential storage via system keychain) ──

#[tauri::command]
fn keychain_set(service: String, key: String, value: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_get(service: String, key: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(&service, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(pwd) => Ok(Some(pwd)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn keychain_delete(service: String, key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(&service, &key).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_has(service: String, key: String) -> Result<bool, String> {
    let entry = keyring::Entry::new(&service, &key).map_err(|e| e.to_string())?;
    Ok(entry.get_password().is_ok())
}

// ── System information ──

#[tauri::command]
fn get_system_info() -> serde_json::Value {
    json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "hostname": whoami::fallible::hostname().unwrap_or_default(),
        "username": whoami::username(),
        "desktop": true,
        "version": env!("CARGO_PKG_VERSION"),
    })
}

// ── Docker sandbox (via bollard) ──

#[tauri::command]
async fn docker_check() -> Result<serde_json::Value, String> {
    docker::check_docker().await
}

#[tauri::command]
async fn docker_run_sandbox(
    image: String,
    code: String,
    language: String,
    timeout_secs: u64,
) -> Result<serde_json::Value, String> {
    docker::run_sandbox(&image, &code, &language, timeout_secs).await
}

#[tauri::command]
async fn docker_list_images() -> Result<Vec<serde_json::Value>, String> {
    docker::list_sandbox_images().await
}

#[tauri::command]
async fn docker_pull_image(image: String) -> Result<String, String> {
    docker::pull_image(&image).await
}

/* ─── App setup ────────────────────────────────────────────────── */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            _keychain: Mutex::new(
                keyring::Entry::new("omniclaude", "default")
                    .expect("Failed to init keychain"),
            ),
        })
        .setup(|app| {
            let show =
                MenuItem::with_id(app, "show", "Show OmniClaude", true, Some("CmdOrCtrl+Shift+O"))?;
            let hide = MenuItem::with_id(app, "hide", "Hide", true, Some("CmdOrCtrl+H"))?;
            let new_chat =
                MenuItem::with_id(app, "new_chat", "New Chat", true, Some("CmdOrCtrl+N"))?;
            let settings = MenuItem::with_id(
                app,
                "settings",
                "Settings...",
                true,
                Some("CmdOrCtrl+,"),
            )?;
            let quit = MenuItem::with_id(
                app,
                "quit",
                "Quit OmniClaude",
                true,
                Some("CmdOrCtrl+Q"),
            )?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &show,
                    &hide,
                    &PredefinedMenuItem::separator(app)?,
                    &new_chat,
                    &PredefinedMenuItem::separator(app)?,
                    &settings,
                    &PredefinedMenuItem::separator(app)?,
                    &quit,
                ],
            )?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("OmniClaude")
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "new_chat" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.__tauriNewChat?.()");
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("window.__tauriOpenSettings?.()");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Keep tray alive
            let _ = tray;

            // Auto-show main window on launch
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            minimize_window,
            maximize_window,
            close_window,
            is_maximized,
            set_title,
            keychain_set,
            keychain_get,
            keychain_delete,
            keychain_has,
            get_system_info,
            docker_check,
            docker_run_sandbox,
            docker_list_images,
            docker_pull_image,
        ])
        .build(tauri::generate_context!())
        .expect("Error building OmniClaude desktop app");

    app.run(|_app_handle, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            api.prevent_exit();
        }
    });
}
