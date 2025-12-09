# AEGIS v1.0.0 - Restart Instructions

> After restarting your terminal, follow these steps to get everything running.

## Prerequisites Verified

- [x] Node.js 20+ installed
- [x] npm packages installed
- [x] Dashboard scaffold complete
- [x] Tauri desktop scaffold complete
- [x] better-sqlite3 installed
- [x] DMBT database connected (17 domains, 38 IPs, 5 ASNs, 25,242 prefixes)
- [x] Ghost_Shell database connected
- [ ] Rust in PATH (needs terminal restart)

## Quick Start After Restart

### 1. Start the Web Dashboard (localhost:4242)

```powershell
cd D:\somacosf\aegis
npm run dashboard
```

This starts:
- **Frontend**: http://localhost:4242 (Vite + React)
- **API**: http://localhost:4243 (Express + Prisma + better-sqlite3)

### 2. Launch Tauri Desktop App

After confirming Rust is in PATH (`rustc --version`):

```powershell
cd D:\somacosf\aegis\packages\desktop
npm run dev
```

Or use the build script:

```powershell
cd D:\somacosf\aegis\packages\desktop
.\build-aegis-desktop.ps1 -Dev
```

### 3. Build Desktop Installer

```powershell
.\build-aegis-desktop.ps1 -Build
```

Output: `packages/desktop/src-tauri/target/release/bundle/`

## Project Structure

```
aegis/                          # PUBLIC repo (github.com/SoMaCoSF/aegis)
├── packages/
│   ├── dashboard/              # Web UI + API server
│   │   ├── src/                # React components
│   │   └── src/server/         # Express API
│   ├── desktop/                # Tauri native app
│   │   ├── src-tauri/          # Rust backend
│   │   └── build-aegis-desktop.ps1
│   ├── core/                   # Shared utilities
│   └── browser-parser/         # Browser CSV importer
├── DMBT/                       # Domain blocker (submodule)
├── Ghost_Shell/                # Privacy proxy (submodule)
└── database/                   # Prisma schema + SQLite

aegis-internal/                 # PRIVATE repo (github.com/SoMaCoSF/aegis-internal)
├── scripts/
│   └── setup-omen02-shares.ps1 # Network share setup for Omen-02
├── configs/
│   └── machines.json           # Machine inventory (IPs, hostnames)
└── README.md
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/status` | Full system status (DMBT, Ghost_Shell) |
| `GET /api/dmbt/stats` | DMBT blocking statistics |
| `GET /api/ghost/stats` | Ghost_Shell privacy stats |
| `GET /api/accounts` | Account list |
| `GET /api/subscriptions` | Subscription list |

## Verification Commands

```powershell
# Check Rust is available
rustc --version

# Check dashboard is running
Invoke-WebRequest -Uri 'http://localhost:4242' -UseBasicParsing

# Check API status
Invoke-WebRequest -Uri 'http://localhost:4243/api/status' -UseBasicParsing | Select-Object -ExpandProperty Content
```

## Database Locations

| Database | Path |
|----------|------|
| AEGIS | `database/data/aegis.db` |
| DMBT | `DMBT/DMBT_Agent/data/dmbt.db` |
| Ghost_Shell | `Ghost_Shell/data/ghost_shell.db` |

## Network Shares (Internal)

To access Omen-02 (192.168.1.180):
1. Copy `aegis-internal/scripts/setup-omen02-shares.ps1` to Omen-02
2. Run as Administrator on Omen-02
3. Access via `\\Omen-02\C` and `\\Omen-02\D`

## Gist & Documentation

- **Public Gist**: Contains `AEGIS-GIST.md` with full architecture
- **README**: Project overview and setup
- **Development Diary**: Session logs in `development_diary.md`

---

*AEGIS v1.0.0 - Privacy Suite with DMBT + Ghost_Shell Integration*
