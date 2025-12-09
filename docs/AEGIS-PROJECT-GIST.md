# AEGIS Privacy Suite - Complete Project Documentation

> **Account & Enterprise Guardian Intelligence System**
>
> Your Digital Footprint, Finally Visible

[![GitHub](https://img.shields.io/badge/GitHub-SoMaCoSF/aegis-blue?logo=github)](https://github.com/SoMaCoSF/aegis)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## Table of Contents

1. [What is AEGIS?](#what-is-aegis)
2. [Architecture Overview](#architecture-overview)
3. [Components](#components)
4. [Agent Context Logging System](#agent-context-logging-system)
5. [LLM Failure Prevention Framework](#llm-failure-prevention-framework)
6. [Database Schemas](#database-schemas)
7. [Quick Start](#quick-start)
8. [API Reference](#api-reference)

---

## What is AEGIS?

Ever wonder how many accounts you've created over the years? Which ones have 2FA? How much you're spending on subscriptions?

**AEGIS is a local-first privacy dashboard that:**

- **Imports accounts** from Chrome/Firefox/Brave/password managers (never stores passwords - only metadata)
- **Tracks subscriptions** and monthly costs across all your services
- **Audits GitHub** OAuth apps, SSH keys, and deploy keys for suspicious access
- **Blocks trackers** at the network layer (entire ASNs, not just domains)
- **Visualizes** your digital footprint in an interactive 3D knowledge graph
- **Encrypted sync** for multi-machine setups (AES-256-GCM)
- **Agent context logging** for AI-assisted development with crash recovery

**All data stays local. No cloud. No telemetry.**

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["React Dashboard (localhost:4242)"]
        D[Dashboard Home]
        S[System Status]
        A[Accounts]
        N[Network/DMBT]
        P[Proxy/Ghost]
        G[Knowledge Graph]
        AI[AI Tracker]
    end

    subgraph Backend["Express API (localhost:4243)"]
        API[Unified REST API]
        PS[Prisma Service]
        DS[DMBT Service]
        GS[Ghost Service]
    end

    subgraph Databases["SQLite Databases"]
        AEGIS_DB[(AEGIS DB<br/>Accounts, Subscriptions)]
        DMBT_DB[(DMBT DB<br/>ASNs, IPs, Prefixes)]
        GHOST_DB[(Ghost DB<br/>Requests, Cookies)]
        CONTEXT_DB[(Agent Context DB<br/>Sessions, Actions)]
    end

    subgraph Agents["Privacy Agents"]
        DMBT_AGENT[DMBT Agent<br/>Go :8088]
        GHOST_PROXY[Ghost_Shell Proxy<br/>mitmproxy :8080]
    end

    Frontend --> API
    API --> PS --> AEGIS_DB
    API --> DS --> DMBT_DB
    API --> GS --> GHOST_DB
    DS --> DMBT_AGENT
    GS --> GHOST_PROXY

    style Frontend fill:#e1f5fe
    style Backend fill:#f3e5f5
    style Databases fill:#e8f5e9
    style Agents fill:#fff3e0
```

---

## Components

### Component Overview

```mermaid
mindmap
  root((AEGIS Privacy Suite))
    Dashboard
      15 Pages
      React + Vite
      Tailwind CSS
      Three.js 3D Graph
    DMBT
      Network Layer Blocking
      ASN Discovery
      Prefix Mapping
      Firewall Rules
    Ghost_Shell
      Application Layer
      Fingerprint Rotation
      Cookie Blocking
      Request Logging
    Agent System
      Context Logging
      Crash Recovery
      Failure Prevention
      Multi-Agent Coordination
```

### Dashboard Pages (15)

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

```mermaid
flowchart LR
    subgraph Input
        D[Domain List]
    end

    subgraph Collection
        DNS[DNS Resolution]
        CYMRU[Team Cymru<br/>ASN Lookup]
        RIPE[RIPEstat<br/>Prefix Discovery]
    end

    subgraph Storage
        DB[(DMBT Database)]
    end

    subgraph Output
        FW[Windows Firewall<br/>Rules]
        BL[Blocklist<br/>Export]
    end

    D --> DNS --> CYMRU --> RIPE --> DB
    DB --> FW
    DB --> BL
```

**Current Stats (Live System):**
- 17 domains tracked
- 38 IP mappings
- 5 ASNs discovered
- 25,242 prefixes mapped

### Ghost_Shell

Application-layer privacy protection:

```mermaid
flowchart TB
    subgraph Browser
        REQ[HTTP/S Request]
    end

    subgraph Ghost_Shell["Ghost_Shell Proxy (:8080)"]
        BLOCK[Traffic Blocker]
        FP[Fingerprint Randomizer]
        COOKIE[Cookie Interceptor]
    end

    subgraph Internet
        WEB[Website]
    end

    REQ --> BLOCK
    BLOCK -->|Not blocked| FP
    FP --> COOKIE
    COOKIE --> WEB

    BLOCK -->|Blocked| X[Blocked Response]

    style X fill:#ff6b6b
```

**Fingerprint Rotation Modes:**
1. **Static** - Fixed fingerprint per session
2. **Per-Domain** - Different fingerprint per domain
3. **Per-Request** - New fingerprint every request
4. **Timed** - Rotate every N minutes
5. **Random** - Random rotation timing

---

## Agent Context Logging System

AEGIS includes a comprehensive agent context logging system for AI-assisted development with crash recovery.

### System Architecture

```mermaid
erDiagram
    agents ||--o{ activity_windows : "has sessions"
    activity_windows ||--o{ action_log : "contains"
    activity_windows ||--o{ context_snapshots : "has snapshots"
    agents ||--o{ handoffs : "sends/receives"

    agents {
        text id PK "AGENT-PRIME-002"
        text name "agent_prime"
        text model "claude-opus-4-5"
        text role "Primary agent"
        text status "active"
    }

    activity_windows {
        int id PK
        text agent_id FK
        text started_at
        text ended_at
        text status "active|completed|crashed"
    }

    action_log {
        int id PK
        int window_id FK
        text action_type "read_file|edit_file|bash"
        text action_summary
        text target
        text result "success|failure"
    }

    context_snapshots {
        int id PK
        int window_id FK
        text current_task
        text pending_items "JSON array"
        text next_steps "JSON array"
    }

    handoffs {
        int id PK
        text from_agent FK
        text to_agent FK
        text message_type "task_delegation"
        text message
    }
```

### Agent Session Protocol

```mermaid
sequenceDiagram
    participant A as Agent
    participant DB as Context DB
    participant W as Activity Window

    A->>DB: Register/Update Agent
    DB-->>A: Agent ID confirmed

    A->>W: Create Activity Window
    W-->>A: window_id

    loop Every Action
        A->>DB: Log Action (type, summary, target)
    end

    loop Every 10-15 Actions
        A->>DB: Create Context Snapshot
    end

    A->>W: End Session (status=completed)
```

### Crash Recovery

```mermaid
flowchart TD
    START[New Session] --> CHECK{Check for<br/>interrupted sessions?}

    CHECK -->|Found| REVIEW[Review last snapshot<br/>& recent actions]
    CHECK -->|None| NORMAL[Start fresh session]

    REVIEW --> RESUME{Can resume?}
    RESUME -->|Yes| CONTINUE[Continue from checkpoint]
    RESUME -->|No| MARK[Mark as crashed, start fresh]

    CONTINUE --> WORK[Continue work]
    MARK --> NORMAL
    NORMAL --> WORK

    WORK --> LOG[Log actions continuously]
    LOG --> SNAP{Every 10-15<br/>actions?}
    SNAP -->|Yes| SNAPSHOT[Create snapshot]
    SNAP -->|No| LOG
    SNAPSHOT --> LOG
```

---

## LLM Failure Prevention Framework

Based on research from "How Do LLMs Fail In Agentic Scenarios?" (Kamiwaza AI, 2025).

> **"Recovery capability, not initial correctness, best predicts overall success."**

### The Four Failure Archetypes

```mermaid
mindmap
  root((LLM Agentic Failures))
    Premature Action
      Schema guessing
      No verification before act
      Assumed knowledge
    Over-Helpfulness
      Entity substitution
      Constraint relaxation
      Missing data invention
    Context Pollution
      Distractor confusion
      Similar name conflation
      Chekhov's Gun effect
    Fragile Execution
      Generation loops
      Coherence loss
      Tool call errors
```

### Archetype 1: Premature Action Without Grounding

```mermaid
flowchart TD
    A[Task Received] --> B{Verify First?}
    B -->|NO - Premature| C[Guess Schema/Structure]
    B -->|YES - Grounded| D[Inspect Schema Tool]

    C --> E[Execute with Assumptions]
    D --> F[Build Accurate Query]

    E --> G{Error?}
    G -->|Yes| H[Recovery Loop]
    G -->|No - Lucky| I[May Still Be Wrong]

    F --> J[Correct Execution]

    H --> K{Can Recover?}
    K -->|Yes| D
    K -->|No| L[FAILURE]

    style C fill:#ff6b6b
    style D fill:#51cf66
    style L fill:#ff0000
    style J fill:#00ff00
```

**Prevention:**
| Before... | ALWAYS... |
|-----------|-----------|
| SQL query | `PRAGMA table_info()` or schema read |
| File edit | Read file content first |
| API call | Check docs or test endpoint |
| Using entity name | Verify EXACT match |

### Archetype 2: Over-Helpfulness Under Uncertainty

```mermaid
flowchart TD
    A[Query for Entity X] --> B{Entity Exists?}
    B -->|Yes| C[Return Correct Data]
    B -->|No| D{How to Handle?}

    D -->|WRONG: Over-Helpful| E[Find Similar Entity Y]
    D -->|WRONG: Invent| F[Create Plausible Data]
    D -->|CORRECT| G[Return 0 or NULL]

    E --> H[Return Y's Data as X]
    F --> I[Return Invented Data]
    G --> J[Accurate Response]

    H --> K[SILENT FAILURE]
    I --> K
    J --> L[SUCCESS]

    style E fill:#ff6b6b
    style F fill:#ff6b6b
    style G fill:#51cf66
    style K fill:#ff0000
    style L fill:#00ff00
```

**Prevention:** If uncertain, ASK - do not substitute or invent.

### Archetype 3: Context Pollution (Chekhov's Gun Effect)

```mermaid
flowchart LR
    subgraph Context
        A[Relevant Table: ORDERS]
        B[Distractor: PRODUCTS]
        C[Distractor: BASE_PRICE]
    end

    subgraph Agent Reasoning
        D[Task: Sum ORDER_AMT]
        E{See BASE_PRICE in context}
        F[Thinks: Must use it!]
        G[Wrong: BASE_PRICE * ORDER_AMT]
    end

    A --> D
    B --> E
    C --> E
    E --> F
    F --> G

    style G fill:#ff0000
    style A fill:#51cf66
    style B fill:#ffec99
    style C fill:#ffec99
```

**Key Finding:** Even 671B parameter models are vulnerable. Size ≠ reliability.

### Archetype 4: Fragile Execution Under Load

```mermaid
sequenceDiagram
    participant A as Agent
    participant T as Tool
    participant C as Context

    A->>T: Execute Python (inline 100KB CSV)
    T-->>A: Success
    A->>C: Context now huge

    A->>T: Debug error
    T-->>A: Error message
    A->>A: Retry with fix

    loop Degradation Loop
        A->>T: Another attempt
        T-->>A: Another error
        A->>A: Context grows
        Note over A: Coherence decreasing
    end

    A->>A: Generation loop starts
    Note over A: Repeated similar output...

    A->>X: COHERENCE LOST
```

**Prevention:** Checkpoint every 3 actions for complex tasks.

### Recovery: The Key Differentiator

```mermaid
pie title Recovery Success Rate by Model
    "DeepSeek V3.1 (92%)" : 92
    "Llama 4 Maverick (75%)" : 75
    "Granite 4 Small (59%)" : 59
```

### Failure Tracking Schema

```mermaid
erDiagram
    grounding_checks ||--o{ failure_incidents : "may_prevent"
    failure_incidents ||--o{ recovery_attempts : "triggers"
    context_markers ||--o{ failure_incidents : "may_cause"
    prevention_checklist ||--o{ failure_incidents : "created_from"

    grounding_checks {
        int id PK
        int window_id FK
        string agent_id FK
        string intended_action
        string verification_type
        string verification_result
        string proceed_decision
    }

    failure_incidents {
        int id PK
        int window_id FK
        string agent_id FK
        string archetype
        string severity
        string error_description
        int grounding_bypassed
    }

    recovery_attempts {
        int id PK
        int failure_id FK
        int attempt_number
        string strategy
        string outcome
        string lesson_learned
    }

    context_markers {
        int id PK
        int window_id FK
        string marker_type
        string distractor_risk
        int contains_similar_names
    }

    prevention_checklist {
        int id PK
        string archetype
        string action_category
        string check_description
        int times_applied
        int times_prevented_failure
    }
```

### Quick Reference: Failure Prevention

| Archetype | Prevention | Detection |
|-----------|------------|-----------|
| **Premature Action** | `sqlite_get_schema` BEFORE query | Edit without prior read |
| **Over-Helpful** | Return 0 for missing, don't substitute | "instead of" in reasoning |
| **Context Pollution** | Curate aggressively, exact name match | Similar entity confusion |
| **Fragile Execution** | Checkpoint every 3 actions, no inlining | Repeated similar errors |

---

## Database Schemas

### AEGIS Main Database (Prisma)

15 models including:
- `Account` - Imported accounts from browsers
- `Subscription` - Recurring payments
- `GitHubIntegration` - OAuth apps, SSH keys
- `AIUsage` - AI usage tracking
- `KnowledgeNode` / `KnowledgeLink` - Graph visualization
- `SocialAccount`, `CloudStorage`, `FinancialAccount`

### Agent Context Database

```sql
-- Core tables
agents           -- Agent registry
activity_windows -- Session tracking
action_log       -- Sequential action log
context_snapshots-- Periodic state captures
handoffs         -- Multi-agent coordination

-- Failure tracking tables
grounding_checks     -- Pre-action verification
failure_incidents    -- Classified failures
recovery_attempts    -- Recovery tracking
context_markers      -- Context pollution risk
prevention_checklist -- Learned prevention
```

### DMBT Database

```sql
ip_mappings     -- domain → IP → ASN mappings
asns            -- ASN details with org names
prefix_mappings -- IP prefixes per ASN
blocklist       -- Blocked ASNs/IPs
```

### Ghost_Shell Database

```sql
requests           -- HTTP request log
cookies            -- Cookie traffic
fingerprints       -- Rotation history
tracking_domains   -- Known trackers
whitelist          -- Trusted domains
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Windows 10/11
- PowerShell 7+

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

### Access Points

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:4242 |
| API | http://localhost:4243 |
| Proxy | 127.0.0.1:8080 |

---

## API Reference

### Health & Status
```
GET /api/health          - Service health check
GET /api/status          - Full system status
GET /api/dashboard/stats - Dashboard statistics
```

### DMBT Endpoints
```
GET  /api/dmbt/stats           - Statistics
GET  /api/dmbt/ips             - IP mappings
GET  /api/dmbt/asns            - ASN list
GET  /api/dmbt/prefixes        - Prefix mappings
GET  /api/dmbt/blocklist       - Blocklist entries
POST /api/dmbt/blocklist       - Add to blocklist
```

### Ghost_Shell Endpoints
```
GET  /api/ghost/stats          - Statistics
GET  /api/ghost/domains        - Tracking domains
GET  /api/ghost/cookies        - Cookie traffic
GET  /api/ghost/fingerprints   - Fingerprints
GET  /api/ghost/requests       - Request log
POST /api/ghost/whitelist      - Add to whitelist
```

### Accounts & Integrations
```
GET  /api/accounts             - All accounts
GET  /api/subscriptions        - Subscriptions
GET  /api/github/integrations  - GitHub integrations
POST /api/github/scan          - Trigger audit
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Three.js |
| Backend | Express, Prisma, better-sqlite3 |
| Database | SQLite (5 databases) |
| Network | Go (DMBT agent), Python (collectors) |
| Proxy | mitmproxy, Python |
| Telemetry | OpenTelemetry |

---

## Links

- **GitHub**: [github.com/SoMaCoSF/aegis](https://github.com/SoMaCoSF/aegis)
- **Issues**: [Report bugs](https://github.com/SoMaCoSF/aegis/issues)

---

*AEGIS Privacy Suite - Because your digital life shouldn't be a mystery.*

Built with Claude Code
