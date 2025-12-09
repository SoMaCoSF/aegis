-- ==============================================================================
-- file_id: SOM-DTA-0002-v1.0.0
-- name: tasks_schema.sql
-- description: SQLite schema for project tasks (CRUD, no delete - soft delete only)
-- project_id: SOMACOSF-CORE
-- category: data
-- tags: [schema, sqlite, tasks, project-management]
-- created: 2025-12-09
-- modified: 2025-12-09
-- version: 1.0.0
-- agent_id: AGENT-PRIME-002
-- execution: sqlite3 project_tasks.db < tasks_schema.sql
-- ==============================================================================

-- ============================================================================
-- PROJECT TASKS DATABASE (project_tasks.db)
-- Agents can CRUD tasks but NEVER delete - uses soft delete for history
-- ============================================================================

-- Projects table - groups tasks
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,                    -- AEGIS, GHOST_SHELL, DMBT, etc.
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,                        -- Agent ID who created
    status TEXT DEFAULT 'active',           -- active, completed, archived
    metadata TEXT                           -- JSON for extra data
);

-- Tasks table - the core work items
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',         -- critical, high, medium, low
    status TEXT DEFAULT 'pending',          -- pending, in_progress, blocked, completed, cancelled
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,                        -- Agent ID
    updated_at TEXT DEFAULT (datetime('now')),
    updated_by TEXT,                        -- Agent ID
    assigned_to TEXT,                       -- Agent ID who is working on it
    checked_out_at TEXT,                    -- When agent started working
    checked_out_by TEXT,                    -- Agent ID who checked out
    completed_at TEXT,
    completed_by TEXT,
    due_date TEXT,
    parent_task_id INTEGER,                 -- For subtasks
    tags TEXT,                              -- JSON array of tags
    is_deleted INTEGER DEFAULT 0,           -- Soft delete flag - NEVER actually delete
    deleted_at TEXT,
    deleted_by TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
);

-- Task history - every change logged
CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    action TEXT NOT NULL,                   -- created, updated, status_changed, checked_out, checked_in, assigned, completed, cancelled, deleted
    old_value TEXT,                         -- JSON of previous state
    new_value TEXT,                         -- JSON of new state
    comment TEXT,                           -- Agent's notes about the change
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Task comments/notes
CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    comment TEXT NOT NULL,
    comment_type TEXT DEFAULT 'note',       -- note, blocker, question, decision
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    depends_on_task_id INTEGER NOT NULL,
    dependency_type TEXT DEFAULT 'blocks',  -- blocks, requires, relates_to
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_checked_out ON tasks(checked_out_by);
CREATE INDEX IF NOT EXISTS idx_tasks_not_deleted ON tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- Active tasks (not deleted)
CREATE VIEW IF NOT EXISTS v_active_tasks AS
SELECT
    t.id,
    t.project_id,
    p.name as project_name,
    t.title,
    t.priority,
    t.status,
    t.assigned_to,
    t.checked_out_by,
    t.created_at,
    t.due_date
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.is_deleted = 0
ORDER BY
    CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    t.created_at;

-- Tasks available for checkout (not assigned, not completed)
CREATE VIEW IF NOT EXISTS v_available_tasks AS
SELECT *
FROM v_active_tasks
WHERE status = 'pending'
  AND (checked_out_by IS NULL OR checked_out_by = '');

-- Tasks by agent
CREATE VIEW IF NOT EXISTS v_my_tasks AS
SELECT
    t.*,
    (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) as comment_count
FROM tasks t
WHERE t.is_deleted = 0
ORDER BY t.checked_out_at DESC;

-- Task backlog with history
CREATE VIEW IF NOT EXISTS v_task_full AS
SELECT
    t.*,
    p.name as project_name,
    (SELECT COUNT(*) FROM task_history th WHERE th.task_id = t.id) as change_count,
    (SELECT MAX(timestamp) FROM task_history th WHERE th.task_id = t.id) as last_activity
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.is_deleted = 0;

-- ============================================================================
-- Triggers to maintain history automatically
-- ============================================================================

-- Log all updates to tasks
CREATE TRIGGER IF NOT EXISTS trg_task_update
AFTER UPDATE ON tasks
BEGIN
    INSERT INTO task_history (task_id, agent_id, action, old_value, new_value)
    VALUES (
        NEW.id,
        NEW.updated_by,
        CASE
            WHEN OLD.status != NEW.status THEN 'status_changed'
            WHEN OLD.checked_out_by IS NULL AND NEW.checked_out_by IS NOT NULL THEN 'checked_out'
            WHEN OLD.checked_out_by IS NOT NULL AND NEW.checked_out_by IS NULL THEN 'checked_in'
            WHEN OLD.is_deleted = 0 AND NEW.is_deleted = 1 THEN 'deleted'
            ELSE 'updated'
        END,
        json_object(
            'title', OLD.title,
            'status', OLD.status,
            'assigned_to', OLD.assigned_to,
            'checked_out_by', OLD.checked_out_by,
            'priority', OLD.priority
        ),
        json_object(
            'title', NEW.title,
            'status', NEW.status,
            'assigned_to', NEW.assigned_to,
            'checked_out_by', NEW.checked_out_by,
            'priority', NEW.priority
        )
    );
END;
