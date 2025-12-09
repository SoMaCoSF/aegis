-- ==============================================================================
-- file_id: SOM-DTA-0001-v1.0.0
-- name: schema.sql
-- description: SQLite schema for agent context and activity logging
-- project_id: SOMACOSF-CORE
-- category: data
-- tags: [schema, sqlite, agent-logging, context]
-- created: 2025-12-09
-- modified: 2025-12-09
-- version: 1.0.0
-- agent_id: AGENT-PRIME-002
-- execution: sqlite3 agent_context.db < schema.sql
-- ==============================================================================

-- ============================================================================
-- AGENT CONTEXT DATABASE (agent_context.db)
-- Tracks all agent sessions, activity windows, and context for crash recovery
-- ============================================================================

-- Registered agents in the workspace
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,                    -- AGENT-PRIME-002, AGENT-WORKER-001, etc.
    name TEXT NOT NULL,                     -- Human-readable: agent_prime, worker_alpha
    model TEXT NOT NULL,                    -- claude-opus-4-5-20251101
    role TEXT,                              -- Primary role description
    registered_at TEXT DEFAULT (datetime('now')),
    last_active_at TEXT,
    status TEXT DEFAULT 'active',           -- active, inactive, deprecated
    metadata TEXT                           -- JSON for extra data
);

-- Activity windows - tracks continuous work periods by an agent
CREATE TABLE IF NOT EXISTS activity_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT NOT NULL,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,                          -- NULL = still active
    session_summary TEXT,                   -- Brief description of work done
    status TEXT DEFAULT 'active',           -- active, completed, interrupted, crashed
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Sequential action log - every significant action taken
CREATE TABLE IF NOT EXISTS action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    action_type TEXT NOT NULL,              -- read_file, edit_file, bash_command, search, decision, thought, error
    action_summary TEXT NOT NULL,           -- What was done
    target TEXT,                            -- File path, command, or target of action
    result TEXT,                            -- success, failure, partial
    context TEXT,                           -- JSON: reasoning, error messages, related data
    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Context snapshots - periodic state captures for recovery
CREATE TABLE IF NOT EXISTS context_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    current_task TEXT,                      -- What the agent is working on
    pending_items TEXT,                     -- JSON array of pending work
    files_modified TEXT,                    -- JSON array of files touched
    decisions_made TEXT,                    -- JSON array of key decisions
    blockers TEXT,                          -- JSON array of issues encountered
    next_steps TEXT,                        -- JSON array of planned next actions
    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Agent handoff messages - for multi-agent coordination
CREATE TABLE IF NOT EXISTS handoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent TEXT NOT NULL,
    to_agent TEXT,                          -- NULL = broadcast to all
    timestamp TEXT DEFAULT (datetime('now')),
    window_id INTEGER,
    message_type TEXT NOT NULL,             -- status_update, task_delegation, error_report, context_share
    message TEXT NOT NULL,
    acknowledged_at TEXT,
    FOREIGN KEY (from_agent) REFERENCES agents(id),
    FOREIGN KEY (to_agent) REFERENCES agents(id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_action_log_window ON action_log(window_id);
CREATE INDEX IF NOT EXISTS idx_action_log_agent ON action_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_action_log_timestamp ON action_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_windows_agent ON activity_windows(agent_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_window ON context_snapshots(window_id);

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- Current state of all agents
CREATE VIEW IF NOT EXISTS v_agent_status AS
SELECT
    a.id,
    a.name,
    a.model,
    a.status,
    a.last_active_at,
    (SELECT COUNT(*) FROM activity_windows aw WHERE aw.agent_id = a.id) as total_sessions,
    (SELECT COUNT(*) FROM action_log al WHERE al.agent_id = a.id) as total_actions
FROM agents a;

-- Active work sessions
CREATE VIEW IF NOT EXISTS v_active_sessions AS
SELECT
    aw.id as window_id,
    a.id as agent_id,
    a.name as agent_name,
    aw.started_at,
    aw.session_summary,
    (SELECT COUNT(*) FROM action_log al WHERE al.window_id = aw.id) as action_count
FROM activity_windows aw
JOIN agents a ON aw.agent_id = a.id
WHERE aw.status = 'active';

-- Recent actions (last 100)
CREATE VIEW IF NOT EXISTS v_recent_actions AS
SELECT
    al.id,
    al.agent_id,
    a.name as agent_name,
    al.timestamp,
    al.action_type,
    al.action_summary,
    al.target,
    al.result
FROM action_log al
JOIN agents a ON al.agent_id = a.id
ORDER BY al.timestamp DESC
LIMIT 100;
