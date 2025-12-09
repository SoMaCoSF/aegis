// ==============================================================================
// file_id: SOM-SCR-0060-v1.0.0
// name: main.rs
// description: AEGIS Desktop - Tauri main entry point
// project_id: AEGIS
// category: desktop
// tags: [tauri, rust, desktop]
// created: 2025-12-09
// modified: 2025-12-09
// version: 1.0.0
// ==============================================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State, WindowEvent,
};

// State to hold the API server process
struct ApiServerState {
    process: Mutex<Option<Child>>,
}

// Start the Express API server
fn start_api_server() -> Option<Child> {
    let project_root = std::env::current_dir()
        .ok()?
        .parent()?
        .parent()?
        .to_path_buf();

    let dashboard_path = project_root.join("packages").join("dashboard");

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "npm", "run", "dev:server"])
            .current_dir(&dashboard_path)
            .spawn()
            .ok()
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new("npm")
            .args(["run", "dev:server"])
            .current_dir(&dashboard_path)
            .spawn()
            .ok()
    }
}

// Stop the API server process
fn stop_api_server(state: &ApiServerState) {
    if let Ok(mut process_guard) = state.process.lock() {
        if let Some(mut process) = process_guard.take() {
            let _ = process.kill();
        }
    }
}

// Tauri command: Check if API is running
#[tauri::command]
async fn check_api_health() -> Result<bool, String> {
    match reqwest::get("http://localhost:4243/api/health").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

// Tauri command: Get system status
#[tauri::command]
async fn get_system_status() -> Result<String, String> {
    match reqwest::get("http://localhost:4243/api/status").await {
        Ok(response) => response.text().await.map_err(|e| e.to_string()),
        Err(e) => Err(e.to_string()),
    }
}

// Tauri command: Start API server manually
#[tauri::command]
fn start_api(state: State<ApiServerState>) -> Result<bool, String> {
    let mut process_guard = state.process.lock().map_err(|e| e.to_string())?;
    if process_guard.is_none() {
        *process_guard = start_api_server();
        Ok(process_guard.is_some())
    } else {
        Ok(true) // Already running
    }
}

// Tauri command: Stop API server
#[tauri::command]
fn stop_api(state: State<ApiServerState>) -> Result<(), String> {
    stop_api_server(&state);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .manage(ApiServerState {
            process: Mutex::new(None),
        })
        .setup(|app| {
            // Start API server on app launch
            let state = app.state::<ApiServerState>();
            if let Ok(mut process_guard) = state.process.lock() {
                *process_guard = start_api_server();
                if process_guard.is_some() {
                    println!("AEGIS API server started on localhost:4243");
                } else {
                    println!("Warning: Could not start API server automatically");
                }
            }

            // Create system tray menu
            let quit = MenuItem::with_id(app, "quit", "Quit AEGIS", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Dashboard", true, None::<&str>)?;
            let status = MenuItem::with_id(app, "status", "System Status", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show, &status, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("AEGIS Privacy Suite")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        // Stop API server before quitting
                        let state = app.state::<ApiServerState>();
                        stop_api_server(&state);
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "status" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.location.href = '/status'");
                        }
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

            Ok(())
        })
        .on_window_event(|window, event| {
            // Minimize to tray instead of closing
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            check_api_health,
            get_system_status,
            start_api,
            stop_api,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AEGIS desktop application");
}
