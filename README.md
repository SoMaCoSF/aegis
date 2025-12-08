# 🔐 AEGIS

**Account & Enterprise Guardian Intelligence System**

A comprehensive personal digital footprint management system that aggregates, analyzes, and helps you control your entire online presence.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Vision

> *"See everything. Control everything. Pay for nothing extra."*

AEGIS is your **unified command center** for managing your digital life across multiple dimensions:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AEGIS                                           │
│                                                                             │
│    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                  │
│    │   DISCOVER   │   │   ANALYZE    │   │   CONTROL    │                  │
│    │              │   │              │   │              │                  │
│    │ • Browser    │   │ • Costs      │   │ • Cancel     │                  │
│    │ • Emails     │   │ • Privacy    │   │ • Pause      │                  │
│    │ • GitHub     │   │ • Security   │   │ • Remove     │                  │
│    │ • Commerce   │   │ • Patterns   │   │ • Block      │                  │
│    └──────────────┘   └──────────────┘   └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 📊 **Account Inventory** | Extract accounts from all major browsers | ✅ Ready |
| 💳 **Subscription Tracker** | Monitor recurring payments & costs | ✅ Ready |
| 🐙 **GitHub Auditor** | Audit OAuth apps, SSH keys, integrations | ✅ Ready |
| 🕵️ **Privacy Manager** | Track data broker exposure | ✅ Ready |
| 🌐 **Network Protection** | DMBT + Ghost_Shell integration | ✅ Ready |
| 🤖 **AI Assistant** | Claude Code integration for live modifications | ✅ Ready |
| 📧 **Email Scanner** | Gmail/ProtonMail subscription discovery | 🔄 Planned |
| 🔐 **Breach Monitor** | HaveIBeenPwned integration | 🔄 Planned |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AEGIS PRIVACY STACK                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Dashboard (localhost:4242)                        │   │
│  │  React + Vite + Tailwind CSS + Recharts                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API Server (localhost:4243)                       │   │
│  │  Express + Prisma + SQLite                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ Browser Parser  │    │ GitHub Auditor  │    │ Privacy Manager │        │
│  │ CSV Import +    │    │ OAuth + SSH +   │    │ Data Broker     │        │
│  │ Encryption      │    │ Webhooks        │    │ Tracking        │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                         NETWORK LAYER (Optional)                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Ghost_Shell (Application Layer)                   │   │
│  │  • Fingerprint rotation (User-Agent, headers, language)             │   │
│  │  • Cookie interception & blocking                                   │   │
│  │  • Tracker pattern matching                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DMBT (Network Layer)                              │   │
│  │  • ASN/Prefix blocking via Windows Firewall                         │   │
│  │  • Team Cymru + RIPEstat intelligence                               │   │
│  │  • Block entire corporate infrastructures (Meta, etc.)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 9+
- Windows 10/11 (for browser password extraction)
- GitHub CLI (`gh`) for GitHub auditing

### Installation

```bash
# Clone the repository
git clone https://github.com/SoMaCoSF/aegis.git
cd aegis

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start the dashboard
npm run dashboard
```

Open **http://localhost:4242** in your browser.

---

## 📥 Importing Browser Passwords

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

**Option 1: Interactive TUI**
```bash
npm run browser:import
```

**Option 2: Direct CLI**
```bash
cd packages/browser-parser
npx tsx src/importer.ts
```

### Multi-Machine Sync (Encrypted)

For syncing across machines via Google Drive:

```bash
# On source machine - encrypt the CSV
npm run browser:import
# Select option 4: "Encrypt CSV for cloud sync"
# Upload .encrypted file to Google Drive

# On target machine - decrypt and import
npm run browser:import
# Select option 5: "Decrypt synced CSV"
# Select option 1: "Import from CSV file"
```

> ⚠️ **Security**: CSV files contain plaintext passwords. Always delete after import. Use encryption for any cloud storage.

---

## 📊 Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with stats, charts, and recent activity |
| **Accounts** | Searchable list with 2FA status and password strength |
| **Subscriptions** | Monthly/yearly spending with billing alerts |
| **GitHub** | OAuth apps, SSH keys with suspicious detection |
| **Privacy** | Data broker exposure tracking |
| **Network** | DMBT/Ghost_Shell integration status |
| **Assistant** | Claude Code chat interface for live modifications |

---

## 🔧 CLI Commands

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

## 🌐 Network Protection (Optional)

AEGIS integrates with the **DMBT** and **Ghost_Shell** projects for defense-in-depth privacy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              YOUR TRAFFIC                                │
│                                                                         │
│  Browser ──▶ Ghost_Shell Proxy ──▶ DMBT Firewall ──▶ Internet          │
│              (App Layer)           (Network Layer)                      │
│              • Fingerprints        • ASN blocking                       │
│              • Cookies             • Prefix rules                       │
│              • Trackers            • Corporate blocks                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

See the [Network Protection Guide](docs/network-protection.md) for setup instructions.

---

## 🔒 Security Considerations

### What AEGIS Stores

| Data | Storage | Encrypted |
|------|---------|-----------|
| Account domains | SQLite | No (public info) |
| Usernames/emails | SQLite | No |
| Password hashes | **Never** | N/A |
| 2FA status | SQLite | No |
| Subscription costs | SQLite | No |
| GitHub tokens | **Never** | N/A |

### What AEGIS Never Stores

- ❌ Actual passwords (only "has password" boolean)
- ❌ Authentication tokens
- ❌ Session cookies
- ❌ Private keys

### Data Location

All data is stored locally in `database/data/aegis.db`. No data is sent to external servers.

---

## 📁 Project Structure

```
aegis/
├── database/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── data/
│       └── aegis.db           # SQLite database
├── packages/
│   ├── core/                  # Shared types
│   ├── browser-parser/        # Browser CSV import
│   ├── github-auditor/        # GitHub security audit
│   ├── email-scanner/         # Email subscription discovery
│   ├── privacy-manager/       # Data broker tracking
│   ├── subscription-tracker/  # Cost tracking
│   └── dashboard/             # React dashboard
│       ├── src/
│       │   ├── pages/         # Route components
│       │   ├── components/    # Shared components
│       │   └── server/        # Express API
│       └── package.json
├── package.json               # Monorepo root
├── turbo.json                 # Build orchestration
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/aegis.git
cd aegis

# Install
npm install

# Start development
npm run dashboard
```

### Code Style

- TypeScript for all new code
- Prisma for database access
- React + Tailwind for UI
- ESLint + Prettier for formatting

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with Claude AI assistance
- Part of the SoMaCoSF privacy toolkit ecosystem
- Inspired by the need to control our digital footprints

---

## 📞 Links

- **GitHub**: [github.com/SoMaCoSF/aegis](https://github.com/SoMaCoSF/aegis)
- **Issues**: [Report bugs](https://github.com/SoMaCoSF/aegis/issues)
- **Discussions**: [Ask questions](https://github.com/SoMaCoSF/aegis/discussions)

---

*AEGIS - Because your digital life shouldn't be a mystery.* 🔐
