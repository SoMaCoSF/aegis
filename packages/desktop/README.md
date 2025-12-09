# AEGIS Desktop (Tauri)

Native desktop application for AEGIS Privacy Suite built with Tauri v2.

## Features

- **Lightweight**: ~10MB installer (vs ~100MB for Electron)
- **System Tray**: Runs in background, click tray icon to show
- **Auto API**: Automatically starts the Express API server
- **Native**: Uses system WebView, not bundled Chromium

## Prerequisites

1. **Rust** (installed via rustup)
   ```powershell
   # Verify installation
   rustc --version
   cargo --version
   ```

2. **Node.js 20+** (for frontend build)

3. **Windows Build Tools** (for native dependencies)
   ```powershell
   # If you get build errors, run:
   npm install -g windows-build-tools
   ```

## Development

```powershell
# From aegis root
cd packages/desktop

# Install npm dependencies
npm install

# Run in dev mode (hot reload)
npm run dev
```

This will:
1. Start the Vite dev server for the React frontend
2. Launch the Tauri window pointing to localhost:4242
3. The API server runs independently (start with `npm run dashboard` from root)

## Building

```powershell
# Build release installer
npm run build
```

Output will be in `src-tauri/target/release/bundle/`:
- `nsis/AEGIS_1.0.0_x64-setup.exe` - NSIS installer
- `msi/AEGIS_1.0.0_x64_en-US.msi` - MSI installer

## Architecture

```
packages/desktop/
├── package.json          # npm scripts for tauri CLI
├── src-tauri/
│   ├── Cargo.toml        # Rust dependencies
│   ├── tauri.conf.json   # Tauri configuration
│   ├── capabilities/     # Permission definitions
│   └── src/
│       └── main.rs       # Rust entry point
└── README.md
```

### How It Works

1. **Frontend**: Reuses `packages/dashboard` React app
2. **Backend**: Express API server started as child process
3. **Window**: Tauri creates native window loading localhost:4242
4. **Tray**: Minimize to system tray, background operation

### Tauri Commands (callable from frontend)

```typescript
import { invoke } from '@tauri-apps/api/core';

// Check if API is healthy
const healthy = await invoke('check_api_health');

// Get full system status
const status = await invoke('get_system_status');

// Manually start/stop API
await invoke('start_api');
await invoke('stop_api');
```

## Configuration

Edit `src-tauri/tauri.conf.json`:

- `app.windows[0]` - Window size, title
- `bundle` - Installer settings, icons
- `build.devUrl` - Development server URL
- `app.security.csp` - Content Security Policy

## Icons

Replace placeholder icons in `src-tauri/icons/`:
- `icon.ico` - Windows icon
- `icon.png` - Tray icon (32x32 recommended)
- `128x128.png`, `128x128@2x.png` - App icons

Generate icons from a source image:
```powershell
# Install tauri-cli globally if needed
cargo install tauri-cli

# Generate all icon sizes from a source PNG
cargo tauri icon path/to/source-1024x1024.png
```

## Troubleshooting

### "Cannot find module" errors
```powershell
cd packages/desktop
npm install
cd ../dashboard
npm install
```

### Rust compilation errors
```powershell
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

### API not connecting
The desktop app expects the API on localhost:4243. Ensure:
1. API server is running: `npm run dashboard` from root
2. No firewall blocking localhost connections
3. Port 4243 not in use by another process

## Web App Still Works

The existing web dashboard is unchanged:
```powershell
# From aegis root - runs web version
npm run dashboard
# Open http://localhost:4242
```

The desktop app is an optional native wrapper around the same frontend.
