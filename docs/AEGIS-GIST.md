# 🔐 AEGIS Privacy Suite v1.0.0

> **Account & Enterprise Guardian Intelligence System**
>
> Your Digital Footprint, Finally Visible

**GitHub Repository**: [github.com/SoMaCoSF/aegis](https://github.com/SoMaCoSF/aegis)

---

## What is AEGIS?

Ever wonder how many accounts you've created over the years? Which ones have 2FA? How much you're spending on subscriptions?

**AEGIS is a local-first privacy dashboard that:**

- 📊 **Imports accounts** from Chrome/Firefox/Brave/password managers (never stores passwords - only metadata)
- 💳 **Tracks subscriptions** and monthly costs across all your services
- 🐙 **Audits GitHub** OAuth apps, SSH keys, and deploy keys for suspicious access
- 🛡️ **Blocks trackers** at the network layer (entire ASNs, not just domains)
- 🧠 **Visualizes** your digital footprint in an interactive 3D knowledge graph
- 🔐 **Encrypted sync** for multi-machine setups (AES-256-GCM)

**All data stays local. No cloud. No telemetry.**

### Why Contribute?

AEGIS is MIT licensed and built for privacy-conscious developers who want:
- Full visibility into their digital footprint
- Network-level blocking (block Meta, Google, or any company at the IP prefix level)
- A foundation for building privacy automation tools

**Looking for contributors interested in:** React/TypeScript, privacy tooling, network security (ASN/BGP), browser extensions, Python (mitmproxy), Go.

---

## 📋 Table of Contents

1. [What's New in v1.0.0](#whats-new-in-v100)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Dashboard Pages (15)](#dashboard-pages-15)
5. [API Endpoints](#api-endpoints)
6. [DMBT Integration](#dmbt-integration)
7. [Ghost_Shell Integration](#ghost_shell-integration)
8. [Browser Import](#browser-import)
9. [Security Model](#security-model)
10. [CLI Commands](#cli-commands)

---

## What's New in v1.0.0

### Full Privacy Suite Integration

AEGIS v1.0.0 combines three powerful privacy tools:

| Component | Purpose | Port | Status |
|-----------|---------|------|--------|
| **AEGIS Dashboard** | React web UI for monitoring | 4242 | ✅ Live |
| **AEGIS API** | Express backend with Prisma | 4243 | ✅ Live |
| **DMBT** | Network-layer ASN/prefix blocking | 8088 | Optional |
| **Ghost_Shell** | Application-layer fingerprint protection | 8080 | Optional |

### New Features

- ✅ **Unified API** - 50+ endpoints for DMBT and Ghost_Shell control
- ✅ **Real-time Database Access** - Direct SQLite queries to DMBT and Ghost_Shell DBs
- ✅ **System Status Page** - All integrations health check in one place
- ✅ **Network Protection Dashboard** - Live DMBT stats with ASN/IP/prefix management
- ✅ **Proxy Control Dashboard** - Ghost_Shell fingerprint rotation and cookie blocking
- ✅ **Collapsible Navigation** - 15 pages organized in 5 categories
- ✅ **Health Indicators** - Real-time service status in sidebar
- ✅ **Unified Launcher** - Single PowerShell script to start all services

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AEGIS PRIVACY SUITE v1.0.0                              │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 React Dashboard (localhost:4242)                         │   │
│  │  15 Pages: Dashboard, Status, Accounts, Network, Proxy, and more...     │   │
│  └────────────────────────────────────┬────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                 Express API Server (localhost:4243)                      │   │
│  │  Unified access to all databases and services                           │   │
│  └────────────────────────────────────┬────────────────────────────────────┘   │
│                                       │                                         │
│           ┌───────────────────────────┼───────────────────────┐                │
│           │                           │                       │                │
│           ▼                           ▼                       ▼                │
│  ┌─────────────────┐        ┌─────────────────┐    ┌─────────────────┐        │
│  │   AEGIS DB      │        │    DMBT DB      │    │  Ghost_Shell DB │        │
│  │   (Prisma)      │        │    (SQLite)     │    │    (SQLite)     │        │
│  │  Accounts,      │        │  ASNs, IPs,     │    │  Requests,      │        │
│  │  Subscriptions  │        │  Prefixes,      │    │  Cookies,       │        │
│  │                 │        │  Blocklist      │    │  Fingerprints   │        │
│  └─────────────────┘        └─────────────────┘    └─────────────────┘        │
│                                       │                       │                │
│                                       ▼                       ▼                │
│                            ┌─────────────────┐    ┌─────────────────┐         │
│                            │  DMBT Agent     │    │ Ghost_Shell     │         │
│                            │  (Go :8088)     │    │  Proxy (:8080)  │         │
│                            │  ASN blocking   │    │  mitmproxy      │         │
│                            └─────────────────┘    └─────────────────┘         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+ (for DMBT/Ghost_Shell)
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

### Using the Unified Launcher

```powershell
# Check status of all services
.\scripts\start-aegis.ps1 -Status

# Start everything
.\scripts\start-aegis.ps1 -All

# Or individual services
.\scripts\start-aegis.ps1 -Dashboard
.\scripts\start-aegis.ps1 -DMBT
.\scripts\start-aegis.ps1 -Ghost
```

### Access Points

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:4242 |
| API | http://localhost:4243 |
| Proxy | 127.0.0.1:8080 (configure browser) |

---

## Dashboard Pages (15)

### Core
| Page | Description |
|------|-------------|
| **Dashboard** | Overview with stats, charts, recent activity |
| **System Status** | All integrations health check, service status, quick actions |

### Privacy Suite
| Page | Description |
|------|-------------|
| **Network (DMBT)** | ASN/prefix blocking, IP intelligence, blocklist management |
| **Proxy (Ghost)** | Fingerprint rotation, cookie blocking, request logs |
| **Privacy Exposure** | Data broker tracking, removal status |

### Account Management
| Page | Description |
|------|-------------|
| **Accounts** | Imported accounts from browsers with 2FA status |
| **Subscriptions** | Recurring payments tracking with cost analysis |
| **Discovery** | Account discovery from browsing history |

### Integrations
| Page | Description |
|------|-------------|
| **GitHub** | OAuth apps and SSH key auditing |
| **Social** | Social media account tracker |
| **Finance** | Financial/trading accounts |
| **Cloud Storage** | Cloud service usage monitoring |

### Tools
| Page | Description |
|------|-------------|
| **Assistant** | Claude Code integration for live modifications |
| **Knowledge Graph** | 3D relationship visualization (Three.js) |
| **AI Tracker** | AI usage monitoring (Claude, ChatGPT, etc.) |

---

## API Endpoints

### Health & Status
```
GET /api/health          - Service health check
GET /api/status          - Full system status with all integrations
GET /api/dashboard/stats - Dashboard statistics
```

### DMBT Endpoints
```
GET  /api/dmbt/stats           - DMBT statistics (domains, IPs, ASNs, prefixes)
GET  /api/dmbt/ips             - IP mappings with ASN info
GET  /api/dmbt/asns            - ASN list with prefix counts
GET  /api/dmbt/asns/:asn       - Single ASN details
GET  /api/dmbt/prefixes        - Prefix mappings
GET  /api/dmbt/blocklist       - Blocklist entries
POST /api/dmbt/blocklist       - Add to blocklist
DELETE /api/dmbt/blocklist/:id - Remove from blocklist
POST /api/dmbt/agent/start     - Start DMBT agent
POST /api/dmbt/agent/stop      - Stop DMBT agent
```

### Ghost_Shell Endpoints
```
GET  /api/ghost/stats          - Ghost_Shell statistics
GET  /api/ghost/domains        - Tracking domains
GET  /api/ghost/cookies        - Cookie traffic
GET  /api/ghost/fingerprints   - Fingerprint rotations
GET  /api/ghost/requests       - Request log (paginated)
GET  /api/ghost/whitelist      - Whitelist entries
POST /api/ghost/whitelist      - Add to whitelist
DELETE /api/ghost/whitelist/:id - Remove from whitelist
POST /api/ghost/proxy/start    - Start Ghost_Shell proxy
POST /api/ghost/proxy/stop     - Stop Ghost_Shell proxy
```

### Legacy AEGIS Endpoints
```
GET  /api/accounts             - All accounts
GET  /api/subscriptions        - Subscriptions
GET  /api/github/integrations  - GitHub integrations
POST /api/github/scan          - Trigger GitHub audit
GET  /api/privacy/exposures    - Data broker exposures
POST /api/sync                 - Sync all data sources
```

---

## DMBT Integration

**DMBT (Delete Me | Block Them)** provides network-layer privacy protection:

### Features
- Domain → IP → ASN → Prefix mapping
- Team Cymru whois integration
- RIPEstat API for prefix discovery
- Windows Firewall rule generation
- Blocklist management

### Database Schema (dmbt.sqlite)
```sql
-- IP Mappings
ip_mappings (domain, ip, ip_version, asn, asn_name, source, seen_at)

-- ASN Details
asns (asn, org_name, rir, description, blocked)

-- Prefix Mappings
prefix_mappings (asn, prefix, ip_version, source)

-- Blocklist
blocklist (asn, reason, blocked_at)
```

### Example Data (from live system)
```json
{
  "totalDomains": 17,
  "totalIPs": 38,
  "totalASNs": 5,
  "totalPrefixes": 25242,
  "topASNs": [
    {"asn": "16509", "org_name": "Amazon", "ip_count": 17},
    {"asn": "54113", "org_name": "Fastly", "ip_count": 8},
    {"asn": "32934", "org_name": "Meta", "ip_count": 5},
    {"asn": "15169", "org_name": "Google", "ip_count": 3}
  ]
}
```

---

## Ghost_Shell Integration

**Ghost_Shell** provides application-layer privacy protection:

### Features
- Browser fingerprint randomization (5 rotation modes)
- Cookie blocking with tracking patterns
- Request/response logging
- OpenTelemetry instrumentation
- Whitelist management

### Fingerprint Rotation Modes
1. **Static** - Fixed fingerprint per session
2. **Per-Domain** - Different fingerprint per domain
3. **Per-Request** - New fingerprint every request
4. **Timed** - Rotate every N minutes
5. **Random** - Random rotation timing

### Database Schema (ghost.db)
```sql
-- Request Log
requests (id, timestamp, method, url, status_code, blocked, reason)

-- Cookie Traffic
cookies (id, domain, name, value, blocked, timestamp)

-- Fingerprints
fingerprints (id, timestamp, user_agent, accept_language, mode)

-- Tracking Domains
tracking_domains (domain, category, blocked)

-- Whitelist
whitelist (id, domain, reason, added_at)
```

---

## Browser Import

### Supported Sources
| Source | Status |
|--------|--------|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Brave | ✅ |
| Bitwarden | ✅ |
| LastPass | ✅ |
| 1Password | ✅ |

### Import Commands
```bash
# Interactive TUI
npm run browser:import

# Direct CLI
cd packages/browser-parser
npx tsx src/importer.ts
```

### Multi-Machine Sync (Encrypted)
```bash
# On source machine - encrypt
npm run browser:import
# Select: "Encrypt CSV for cloud sync"

# On target machine - decrypt
npm run browser:import
# Select: "Decrypt synced CSV"
```

**Encryption**: AES-256-GCM with scrypt key derivation.

---

## Security Model

### What AEGIS Stores

| Data | Storage | Notes |
|------|---------|-------|
| Account domains | SQLite | Public info |
| Usernames/emails | SQLite | For identification |
| Password hashes | **Never** | Only boolean "has password" |
| 2FA status | SQLite | Security tracking |
| Network intelligence | SQLite | ASNs, IPs, prefixes |

### What AEGIS Never Stores

- ❌ Actual passwords
- ❌ Authentication tokens
- ❌ Session cookies
- ❌ Private keys

### Data Location

All data is stored locally. No data is sent to external servers.

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

- **v1.0.0** (2025-12-09): Full DMBT + Ghost_Shell integration, 15 pages, unified API, 50+ endpoints
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

## Links

- **GitHub**: [github.com/SoMaCoSF/aegis](https://github.com/SoMaCoSF/aegis)
- **Issues**: [Report bugs](https://github.com/SoMaCoSF/aegis/issues)

---

*AEGIS Privacy Suite v1.0.0 - Because your digital life shouldn't be a mystery.*

Built with Claude Code 🤖
