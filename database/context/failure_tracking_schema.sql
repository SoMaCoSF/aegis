-- ==============================================================================
-- file_id: SOM-DTA-0003-v1.0.0
-- name: failure_tracking_schema.sql
-- description: Schema extensions for LLM failure archetype tracking and prevention
-- project_id: SOMACOSF-CORE
-- category: data
-- tags: [schema, sqlite, failure-tracking, llm-safety, recovery]
-- created: 2025-12-09
-- modified: 2025-12-09
-- version: 1.0.0
-- agent_id: AGENT-PRIME-002
-- execution: sqlite3 agent_context.db < failure_tracking_schema.sql
-- ==============================================================================

-- ============================================================================
-- FAILURE ARCHETYPE TRACKING (extends agent_context.db)
-- Based on "How Do LLMs Fail In Agentic Scenarios?" research paper
--
-- Four Failure Archetypes:
--   1. PREMATURE_ACTION - Acting without grounding (guessing vs inspecting)
--   2. OVER_HELPFUL - Substituting/inventing when requirements unclear
--   3. CONTEXT_POLLUTION - Errors from distractor information
--   4. FRAGILE_EXECUTION - Generation loops, coherence loss under load
-- ============================================================================

-- Grounding checks - mandatory verification before critical actions
-- This enforces "inspect before act" to prevent Archetype 1
CREATE TABLE IF NOT EXISTS grounding_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),

    -- What action is being grounded
    intended_action TEXT NOT NULL,         -- What agent plans to do
    action_category TEXT NOT NULL,         -- file_edit, db_query, api_call, schema_change
    target TEXT NOT NULL,                  -- File path, table name, endpoint

    -- Grounding verification
    verification_type TEXT NOT NULL,       -- schema_check, file_read, api_inspect, dependency_check
    verification_result TEXT,              -- JSON of what was found
    assumptions_validated TEXT,            -- JSON array of assumptions checked
    assumptions_failed TEXT,               -- JSON array of assumptions that failed

    -- Decision
    proceed_decision TEXT NOT NULL,        -- proceed, abort, modify
    reasoning TEXT,                        -- Why this decision

    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Failure incidents - track when failures occur
CREATE TABLE IF NOT EXISTS failure_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    related_action_id INTEGER,             -- Link to action_log entry that failed

    -- Failure classification (from paper)
    archetype TEXT NOT NULL,               -- PREMATURE_ACTION, OVER_HELPFUL, CONTEXT_POLLUTION, FRAGILE_EXECUTION
    severity TEXT NOT NULL,                -- critical, high, medium, low

    -- What happened
    error_description TEXT NOT NULL,
    expected_outcome TEXT,
    actual_outcome TEXT,
    root_cause TEXT,                       -- Analysis of why it happened

    -- Context at failure
    context_state TEXT,                    -- JSON snapshot of relevant context
    distractor_present INTEGER DEFAULT 0,  -- Was distractor info involved? (Archetype 3)
    load_factor TEXT,                      -- none, moderate, high (Archetype 4)

    -- Was grounding check done?
    grounding_check_id INTEGER,            -- Link to grounding_checks if one was done
    grounding_bypassed INTEGER DEFAULT 0,  -- Did agent skip verification?

    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (related_action_id) REFERENCES action_log(id),
    FOREIGN KEY (grounding_check_id) REFERENCES grounding_checks(id)
);

-- Recovery attempts - track how agent recovers (key success predictor)
CREATE TABLE IF NOT EXISTS recovery_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    failure_id INTEGER NOT NULL,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),
    attempt_number INTEGER NOT NULL,       -- 1st, 2nd, 3rd attempt etc.

    -- Recovery strategy
    strategy TEXT NOT NULL,                -- retry, backtrack, reread, ask_user, alternative_approach
    strategy_description TEXT,

    -- Result
    outcome TEXT NOT NULL,                 -- success, partial, failed
    outcome_description TEXT,

    -- Learning
    lesson_learned TEXT,                   -- What should be done differently
    added_to_checklist INTEGER DEFAULT 0,  -- Was this added to prevention checklist?

    FOREIGN KEY (failure_id) REFERENCES failure_incidents(id),
    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Context pollution markers - track when distractors enter context
CREATE TABLE IF NOT EXISTS context_markers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    agent_id TEXT NOT NULL,
    timestamp TEXT DEFAULT (datetime('now')),

    -- What kind of context
    marker_type TEXT NOT NULL,             -- user_input, file_content, search_result, api_response, prior_conversation
    source TEXT,                           -- Where it came from
    content_hash TEXT,                     -- Hash of content for tracking

    -- Pollution risk assessment
    relevance_score REAL,                  -- 0.0 to 1.0 - how relevant to current task
    distractor_risk TEXT,                  -- none, low, medium, high
    contains_similar_names INTEGER DEFAULT 0,  -- Similar entity names that could confuse

    -- If this led to an error
    caused_failure_id INTEGER,             -- Link to failure_incidents if this caused one

    FOREIGN KEY (window_id) REFERENCES activity_windows(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (caused_failure_id) REFERENCES failure_incidents(id)
);

-- Agent behavior checklist - learned prevention measures
CREATE TABLE IF NOT EXISTS prevention_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,                         -- NULL = applies to all agents
    created_at TEXT DEFAULT (datetime('now')),
    created_from_failure_id INTEGER,       -- Which failure taught this lesson

    -- The checklist item
    archetype TEXT NOT NULL,               -- Which archetype this prevents
    action_category TEXT NOT NULL,         -- When to apply this check
    check_description TEXT NOT NULL,       -- What to verify
    check_query TEXT,                      -- SQL/command to run for verification

    -- Status
    is_active INTEGER DEFAULT 1,
    times_applied INTEGER DEFAULT 0,       -- How often this check has been used
    times_prevented_failure INTEGER DEFAULT 0,  -- How often it caught a problem

    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (created_from_failure_id) REFERENCES failure_incidents(id)
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_grounding_checks_window ON grounding_checks(window_id);
CREATE INDEX IF NOT EXISTS idx_grounding_checks_agent ON grounding_checks(agent_id);
CREATE INDEX IF NOT EXISTS idx_failure_incidents_window ON failure_incidents(window_id);
CREATE INDEX IF NOT EXISTS idx_failure_incidents_archetype ON failure_incidents(archetype);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_failure ON recovery_attempts(failure_id);
CREATE INDEX IF NOT EXISTS idx_context_markers_window ON context_markers(window_id);
CREATE INDEX IF NOT EXISTS idx_prevention_checklist_archetype ON prevention_checklist(archetype);

-- ============================================================================
-- Views for analysis
-- ============================================================================

-- Failure patterns by archetype
CREATE VIEW IF NOT EXISTS v_failure_by_archetype AS
SELECT
    archetype,
    COUNT(*) as total_failures,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
    SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
    SUM(CASE WHEN grounding_bypassed = 1 THEN 1 ELSE 0 END) as grounding_skipped,
    AVG(CASE WHEN grounding_bypassed = 1 THEN 1.0 ELSE 0.0 END) as skip_rate
FROM failure_incidents
GROUP BY archetype;

-- Recovery success rate (key metric from paper)
CREATE VIEW IF NOT EXISTS v_recovery_success AS
SELECT
    fi.agent_id,
    fi.archetype,
    COUNT(DISTINCT fi.id) as total_failures,
    COUNT(ra.id) as recovery_attempts,
    SUM(CASE WHEN ra.outcome = 'success' THEN 1 ELSE 0 END) as successful_recoveries,
    ROUND(
        100.0 * SUM(CASE WHEN ra.outcome = 'success' THEN 1 ELSE 0 END) /
        NULLIF(COUNT(ra.id), 0),
        2
    ) as recovery_rate_pct
FROM failure_incidents fi
LEFT JOIN recovery_attempts ra ON fi.id = ra.failure_id
GROUP BY fi.agent_id, fi.archetype;

-- Context pollution incidents
CREATE VIEW IF NOT EXISTS v_context_pollution AS
SELECT
    cm.id,
    cm.window_id,
    cm.agent_id,
    cm.timestamp,
    cm.marker_type,
    cm.source,
    cm.distractor_risk,
    fi.error_description as caused_error,
    fi.archetype as error_archetype
FROM context_markers cm
LEFT JOIN failure_incidents fi ON cm.caused_failure_id = fi.id
WHERE cm.distractor_risk IN ('medium', 'high')
   OR cm.caused_failure_id IS NOT NULL;

-- Grounding compliance report
CREATE VIEW IF NOT EXISTS v_grounding_compliance AS
SELECT
    agent_id,
    action_category,
    COUNT(*) as total_checks,
    SUM(CASE WHEN proceed_decision = 'proceed' THEN 1 ELSE 0 END) as proceeded,
    SUM(CASE WHEN proceed_decision = 'abort' THEN 1 ELSE 0 END) as aborted,
    SUM(CASE WHEN proceed_decision = 'modify' THEN 1 ELSE 0 END) as modified,
    SUM(CASE WHEN assumptions_failed IS NOT NULL AND assumptions_failed != '[]' THEN 1 ELSE 0 END) as had_failed_assumptions
FROM grounding_checks
GROUP BY agent_id, action_category;

-- Agent reliability score (weighted by recovery capability)
CREATE VIEW IF NOT EXISTS v_agent_reliability AS
SELECT
    a.id as agent_id,
    a.name,
    COALESCE(f.total_failures, 0) as total_failures,
    COALESCE(r.successful_recoveries, 0) as successful_recoveries,
    COALESCE(g.total_checks, 0) as grounding_checks_performed,
    ROUND(
        CASE
            WHEN COALESCE(f.total_failures, 0) = 0 THEN 100.0
            ELSE 100.0 * COALESCE(r.successful_recoveries, 0) / f.total_failures
        END,
        2
    ) as reliability_score
FROM agents a
LEFT JOIN (
    SELECT agent_id, COUNT(*) as total_failures
    FROM failure_incidents GROUP BY agent_id
) f ON a.id = f.agent_id
LEFT JOIN (
    SELECT agent_id, SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as successful_recoveries
    FROM recovery_attempts GROUP BY agent_id
) r ON a.id = r.agent_id
LEFT JOIN (
    SELECT agent_id, COUNT(*) as total_checks
    FROM grounding_checks GROUP BY agent_id
) g ON a.id = g.agent_id;

-- ============================================================================
-- Seed initial prevention checklist items based on paper findings
-- ============================================================================

INSERT OR IGNORE INTO prevention_checklist (id, archetype, action_category, check_description, is_active)
VALUES
    -- Premature Action Prevention
    (1, 'PREMATURE_ACTION', 'db_query', 'ALWAYS inspect schema before writing queries - run PRAGMA table_info or SELECT * LIMIT 1', 1),
    (2, 'PREMATURE_ACTION', 'file_edit', 'ALWAYS read file content before editing - never assume structure', 1),
    (3, 'PREMATURE_ACTION', 'api_call', 'ALWAYS check API documentation or test endpoint before integration', 1),
    (4, 'PREMATURE_ACTION', 'schema_change', 'ALWAYS backup and read existing schema before modifications', 1),

    -- Over-Helpful Prevention
    (5, 'OVER_HELPFUL', 'user_request', 'If requirements are unclear, ASK - do not substitute or invent', 1),
    (6, 'OVER_HELPFUL', 'missing_entity', 'If expected file/table/endpoint missing, STOP and verify - do not create substitutes', 1),
    (7, 'OVER_HELPFUL', 'ambiguous_instruction', 'List specific ambiguities and get clarification before proceeding', 1),

    -- Context Pollution Prevention
    (8, 'CONTEXT_POLLUTION', 'search_results', 'Verify entity names match EXACTLY - similar names are high-risk distractors', 1),
    (9, 'CONTEXT_POLLUTION', 'file_content', 'When reading files, note any similar-named entities that could cause confusion', 1),
    (10, 'CONTEXT_POLLUTION', 'multi_step', 'At each step, re-verify you are operating on correct target', 1),

    -- Fragile Execution Prevention
    (11, 'FRAGILE_EXECUTION', 'complex_task', 'For tasks >5 steps, create checkpoint snapshots every 3 actions', 1),
    (12, 'FRAGILE_EXECUTION', 'generation', 'If generating similar content repeatedly, pause and verify pattern', 1),
    (13, 'FRAGILE_EXECUTION', 'long_session', 'Every 20 actions, create context snapshot and verify coherence', 1);
