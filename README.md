# AEGIS - Privacy Suite v1.0

**Account & Enterprise Guardian Intelligence System**

A comprehensive digital footprint management and privacy protection suite for Windows.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## Overview

AEGIS combines three powerful privacy tools into one unified dashboard:

| Component | Purpose | Port |
|-----------|---------|------|
| **AEGIS Dashboard** | React web UI for monitoring and control | 4242 |
| **AEGIS API** | Express backend with Prisma ORM | 4243 |
| **DMBT** | Network-layer ASN/prefix blocking | 8088 |
| **Ghost_Shell** | Application-layer fingerprint/cookie protection | 8080 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AEGIS PRIVACY SUITE v1.0                                 │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 React Dashboard (localhost:4242)                         │   │
│  │  15 Pages: Dashboard, Status, Accounts, Network, Proxy, and more...    │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                             │
│                                   ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 Express API Server (localhost:4243)                      │   │
│  │  Unified access to all databases and services                           │   │
│  └────────────────────────────────┬────────────────────────────────────────┘   │
│                                   │                                             │
│           ┌───────────────────────┼───────────────────────┐                    │
│           │                       │                       │                    │
│           ▼                       ▼                       ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐            │
│  │   AEGIS DB      │    │    DMBT DB      │    │  Ghost_Shell DB │            │
│  │   (Prisma)      │    │    (SQLite)     │    │    (SQLite)     │            │
│  │  Accounts,      │    │  ASNs, IPs,     │    │  Requests,      │            │
│  │  Subscriptions  │    │  Prefixes,      │    │  Cookies,       │            │
│  │                 │    │  Blocklist      │    │  Fingerprints   │            │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘            │
│                                   │                       │                    │
│                                   ▼                       ▼                    │
│                        ┌─────────────────┐    ┌─────────────────┐             │
│                        │  DMBT Agent     │    │ Ghost_Shell     │             │
│                        │  (Go :8088)     │    │  Proxy (:8080)  │             │
│                        │  ASN blocking   │    │  mitmproxy      │             │
│                        └─────────────────┘    └─────────────────┘             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Dashboard Pages (15 total)

| Category | Page | Description |
|----------|------|-------------|
| **Core** | Dashboard | Overview with stats and charts |
| | System Status | All integrations health check |
| **Privacy Suite** | Network (DMBT) | ASN/prefix blocking, IP intelligence |
| | Proxy (Ghost) | Fingerprint rotation, cookie blocking |
| | Privacy Exposure | Data broker tracking |
| **Account Management** | Accounts | Imported accounts from browsers |
| | Subscriptions | Recurring payments tracking |
| | Discovery | Account discovery from browsing history |
| **Integrations** | GitHub | OAuth apps and SSH key auditing |
| | Social | Social media account tracker |
| | Finance | Financial/trading accounts |
| | Cloud Storage | Cloud service usage |
| **Tools** | Assistant | Claude Code integration |
| | Knowledge Graph | 3D relationship visualization |
| | AI Tracker | AI usage monitoring |

### DMBT (Delete Me | Block Them)

Network-layer privacy protection:
- Domain → IP → ASN → Prefix mapping
- Team Cymru whois integration
- RIPEstat API for prefix discovery
- Windows Firewall rule generation
- Blocklist management

### Ghost_Shell

Application-layer privacy protection:
- Browser fingerprint randomization (5 rotation modes)
- Cookie blocking with tracking patterns
- Request/response logging
- OpenTelemetry instrumentation
- Whitelist management

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Windows 10/11
- PowerShell 7+
- GitHub CLI (`gh`) for GitHub auditing

### Installation

```powershell
# Clone and install
git clone https://github.com/SoMaCoSF/aegis.git
cd aegis
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start dashboard
npm run dashboard
```

### Start All Services

```powershell
# Check status
.\scripts\start-aegis.ps1 -Status

# Start everything
.\scripts\start-aegis.ps1 -All

# Or individual services
.\scripts\start-aegis.ps1 -Dashboard
.\scripts\start-aegis.ps1 -DMBT
.\scripts\start-aegis.ps1 -Ghost
```

### Access

- **Dashboard**: http://localhost:4242
- **API**: http://localhost:4243
- **Proxy**: Configure browser to use 127.0.0.1:8080

---

## Importing Browser Passwords

### Export from Your Browser

<details>
<summary><b>Chrome / Edge / Brave</b></summary>

1. Open `chrome://settings/passwords` (or equivalent)
2. Click the ⋮ menu next to "Saved Passwords"
3. Select "Export passwords"
4. Authenticate with Windows credentials
5. Save the CSV file

</details>

<details>
<summary><b>Firefox</b></summary>

1. Open `about:logins`
2. Click ⋮ menu → "Export Logins..."
3. Authenticate and save CSV

</details>

<details>
<summary><b>Password Managers (Bitwarden, LastPass, 1Password)</b></summary>

Export from your vault settings as CSV format.

</details>

### Import to AEGIS

```bash
# Interactive TUI
npm run browser:import

# Direct CLI
cd packages/browser-parser
npx tsx src/importer.ts
```

### Multi-Machine Sync (Encrypted)

```bash
# On source machine - encrypt the CSV
npm run browser:import
# Select option 4: "Encrypt CSV for cloud sync"

# On target machine - decrypt and import
npm run browser:import
# Select option 5: "Decrypt synced CSV"
```

> **Security**: CSV files contain plaintext passwords. Always delete after import. Use encryption for any cloud storage.

---

## API Endpoints

### Core
- `GET /api/health` - Health check with service status
- `GET /api/status` - Full system status
- `GET /api/dashboard/stats` - Dashboard statistics

### DMBT
- `GET /api/dmbt/stats` - DMBT statistics
- `GET /api/dmbt/ips` - IP mappings
- `GET /api/dmbt/asns` - ASN list
- `GET /api/dmbt/prefixes` - Prefix mappings
- `GET /api/dmbt/blocklist` - Blocklist entries

### Ghost_Shell
- `GET /api/ghost/stats` - Ghost_Shell statistics
- `GET /api/ghost/domains` - Tracking domains
- `GET /api/ghost/cookies` - Cookie traffic
- `GET /api/ghost/fingerprints` - Fingerprint rotations
- `GET /api/ghost/requests` - Request log

### Accounts
- `GET /api/accounts` - All accounts
- `GET /api/subscriptions` - Subscriptions
- `GET /api/github/integrations` - GitHub integrations

---

## CLI Commands

```bash
# Dashboard
npm run dashboard         # Start dashboard on localhost:4242

# Database
npm run db:generate       # Regenerate Prisma client
npm run db:push           # Push schema changes
npm run db:studio         # Open Prisma Studio GUI

# Tools
npm run github:audit      # Run GitHub security audit
npm run browser:import    # Import browser passwords (TUI)
npm run browser:scan      # Scan browser locations

# Development
npm run dev               # Start all packages in dev mode
npm run build             # Build all packages
```

---

## Project Structure

```
aegis/
├── packages/
│   ├── dashboard/         # React + Vite + Tailwind frontend
│   │   ├── src/
│   │   │   ├── pages/     # 15 dashboard pages
│   │   │   ├── components/
│   │   │   └── server/    # Express API + services
│   │   └── package.json
│   ├── browser-parser/    # Browser CSV importer
│   ├── github-auditor/    # GitHub OAuth/SSH auditor
│   └── core/              # Shared utilities and logger
├── database/
│   ├── prisma/
│   │   └── schema.prisma  # 15 Prisma models
│   └── data/
│       └── aegis.db       # SQLite database
├── DMBT/                  # Network blocking toolkit
│   ├── collector/         # Domain→IP→ASN collector
│   ├── tools/             # TUI and CLI
│   └── data/
│       └── dmbt.sqlite    # DMBT database
├── Ghost_Shell/           # Proxy protection suite
│   ├── ghost_shell/
│   │   ├── proxy/         # mitmproxy addons
│   │   └── intel/         # Intelligence collector
│   └── data/
│       └── ghost.db       # Ghost_Shell database
├── scripts/
│   └── start-aegis.ps1    # Unified launcher
└── docs/                  # Documentation
```

---

## Security Considerations

### What AEGIS Stores

| Data | Storage | Notes |
|------|---------|-------|
| Account domains | SQLite | Public info |
| Usernames/emails | SQLite | For identification |
| Password hashes | **Never** | Only boolean "has password" |
| 2FA status | SQLite | Security tracking |
| Network intelligence | SQLite | ASNs, IPs, prefixes |

### What AEGIS Never Stores

- Actual passwords (only "has password" boolean)
- Authentication tokens
- Session cookies
- Private keys

### Data Location

All data is stored locally. No data is sent to external servers.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Three.js |
| Backend | Express, Prisma, better-sqlite3 |
| Database | SQLite (3 databases) |
| Network | Go (DMBT agent), Python (collectors) |
| Proxy | mitmproxy, Python |
| Telemetry | OpenTelemetry |

---

## Version History

- **v1.0.0** (2025-12-08): Full DMBT + Ghost_Shell integration, 15 pages, unified API
- **v0.2.0** (2025-12-08): Added 6 new pages, knowledge graph
- **v0.1.0** (2025-01-15): Initial scaffold

---

## Future Roadmap

- [ ] CopyParty file sharing integration
- [ ] VoidTools Everything (es.exe) for fast file search
- [ ] Claude Agent SDK for autonomous privacy tasks
- [ ] HaveIBeenPwned breach monitoring
- [ ] Gmail/ProtonMail subscription discovery

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- **GitHub**: [github.com/SoMaCoSF/aegis](https://github.com/SoMaCoSF/aegis)
- **Issues**: [Report bugs](https://github.com/SoMaCoSF/aegis/issues)

---

*AEGIS - Because your digital life shouldn't be a mystery.*

Built with Claude Code
