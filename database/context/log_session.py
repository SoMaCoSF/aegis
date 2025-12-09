# ==============================================================================
# file_id: SOM-SCR-0002-v1.0.0
# name: log_session.py
# description: CLI tool for logging agent activity to context database
# project_id: SOMACOSF-CORE
# category: script
# tags: [database, logging, agent-activity, cli]
# created: 2025-12-09
# modified: 2025-12-09
# version: 1.0.0
# agent_id: AGENT-PRIME-002
# execution: python log_session.py <command> [args]
# ==============================================================================

"""
Agent session logging CLI.

Usage:
    python log_session.py start <agent_id> <summary>     # Start new session, returns window_id
    python log_session.py action <window_id> <type> <summary> [target] [result]
    python log_session.py snapshot <window_id> <current_task>
    python log_session.py end <window_id> <summary>
    python log_session.py status [agent_id]              # Show active sessions
    python log_session.py recover [agent_id]             # Get recovery info for interrupted sessions
"""

import sqlite3
import sys
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "agent_context.db"


def get_conn():
    return sqlite3.connect(DB_PATH)


def start_session(agent_id: str, summary: str) -> int:
    """Start a new activity window, return window_id."""
    conn = get_conn()
    cur = conn.cursor()

    # Update agent last_active
    cur.execute("""
        UPDATE agents SET last_active_at = datetime('now')
        WHERE id = ?
    """, (agent_id,))

    # Create activity window
    cur.execute("""
        INSERT INTO activity_windows (agent_id, session_summary, status)
        VALUES (?, ?, 'active')
    """, (agent_id, summary))

    window_id = cur.lastrowid
    conn.commit()
    conn.close()

    print(f"Session started: window_id={window_id}")
    return window_id


def log_action(window_id: int, action_type: str, summary: str, target: str = None, result: str = "success", context: str = None):
    """Log an action to the current session."""
    conn = get_conn()
    cur = conn.cursor()

    # Get agent_id from window
    cur.execute("SELECT agent_id FROM activity_windows WHERE id = ?", (window_id,))
    row = cur.fetchone()
    if not row:
        print(f"Error: Window {window_id} not found")
        return
    agent_id = row[0]

    cur.execute("""
        INSERT INTO action_log (window_id, agent_id, action_type, action_summary, target, result, context)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (window_id, agent_id, action_type, summary, target, result, context))

    action_id = cur.lastrowid
    conn.commit()
    conn.close()

    print(f"Action logged: id={action_id}")


def create_snapshot(window_id: int, current_task: str, pending: list = None, files: list = None,
                    decisions: list = None, blockers: list = None, next_steps: list = None):
    """Create a context snapshot."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT agent_id FROM activity_windows WHERE id = ?", (window_id,))
    row = cur.fetchone()
    if not row:
        print(f"Error: Window {window_id} not found")
        return
    agent_id = row[0]

    cur.execute("""
        INSERT INTO context_snapshots
        (window_id, agent_id, current_task, pending_items, files_modified, decisions_made, blockers, next_steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        window_id, agent_id, current_task,
        json.dumps(pending or []),
        json.dumps(files or []),
        json.dumps(decisions or []),
        json.dumps(blockers or []),
        json.dumps(next_steps or [])
    ))

    snapshot_id = cur.lastrowid
    conn.commit()
    conn.close()

    print(f"Snapshot created: id={snapshot_id}")


def end_session(window_id: int, summary: str):
    """End an activity window."""
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE activity_windows
        SET ended_at = datetime('now'),
            status = 'completed',
            session_summary = ?
        WHERE id = ?
    """, (summary, window_id))

    conn.commit()
    conn.close()
    print(f"Session ended: window_id={window_id}")


def show_status(agent_id: str = None):
    """Show active sessions."""
    conn = get_conn()
    cur = conn.cursor()

    if agent_id:
        cur.execute("""
            SELECT aw.id, aw.agent_id, aw.started_at, aw.session_summary,
                   (SELECT COUNT(*) FROM action_log WHERE window_id = aw.id) as actions
            FROM activity_windows aw
            WHERE aw.agent_id = ? AND aw.status = 'active'
        """, (agent_id,))
    else:
        cur.execute("""
            SELECT aw.id, aw.agent_id, aw.started_at, aw.session_summary,
                   (SELECT COUNT(*) FROM action_log WHERE window_id = aw.id) as actions
            FROM activity_windows aw
            WHERE aw.status = 'active'
        """)

    rows = cur.fetchall()
    conn.close()

    if not rows:
        print("No active sessions")
        return

    print(f"\n{'='*60}")
    print("ACTIVE SESSIONS")
    print(f"{'='*60}")
    for row in rows:
        print(f"\nWindow ID: {row[0]}")
        print(f"  Agent: {row[1]}")
        print(f"  Started: {row[2]}")
        print(f"  Summary: {row[3]}")
        print(f"  Actions: {row[4]}")


def recover_session(agent_id: str = None):
    """Get recovery info for interrupted sessions."""
    conn = get_conn()
    cur = conn.cursor()

    # Find active sessions
    if agent_id:
        cur.execute("""
            SELECT aw.id, aw.agent_id, aw.started_at, aw.session_summary
            FROM activity_windows aw
            WHERE aw.agent_id = ? AND aw.status = 'active'
            ORDER BY aw.started_at DESC
        """, (agent_id,))
    else:
        cur.execute("""
            SELECT aw.id, aw.agent_id, aw.started_at, aw.session_summary
            FROM activity_windows aw
            WHERE aw.status = 'active'
            ORDER BY aw.started_at DESC
        """)

    sessions = cur.fetchall()

    if not sessions:
        print("No interrupted sessions to recover")
        return

    print(f"\n{'='*60}")
    print("INTERRUPTED SESSIONS - RECOVERY INFO")
    print(f"{'='*60}")

    for session in sessions:
        window_id = session[0]
        print(f"\n[Window {window_id}] Agent: {session[1]}")
        print(f"Started: {session[2]}")
        print(f"Summary: {session[3]}")

        # Get last snapshot
        cur.execute("""
            SELECT current_task, pending_items, next_steps, timestamp
            FROM context_snapshots
            WHERE window_id = ?
            ORDER BY timestamp DESC LIMIT 1
        """, (window_id,))
        snapshot = cur.fetchone()

        if snapshot:
            print(f"\nLast Snapshot ({snapshot[3]}):")
            print(f"  Current Task: {snapshot[0]}")
            print(f"  Pending: {snapshot[1]}")
            print(f"  Next Steps: {snapshot[2]}")

        # Get last 5 actions
        cur.execute("""
            SELECT action_type, action_summary, target, timestamp
            FROM action_log
            WHERE window_id = ?
            ORDER BY timestamp DESC LIMIT 5
        """, (window_id,))
        actions = cur.fetchall()

        if actions:
            print("\nLast 5 Actions:")
            for action in actions:
                print(f"  [{action[0]}] {action[1]}")
                if action[2]:
                    print(f"    Target: {action[2]}")

    conn.close()


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1]

    if cmd == "start":
        if len(sys.argv) < 4:
            print("Usage: python log_session.py start <agent_id> <summary>")
            return
        start_session(sys.argv[2], sys.argv[3])

    elif cmd == "action":
        if len(sys.argv) < 5:
            print("Usage: python log_session.py action <window_id> <type> <summary> [target] [result]")
            return
        window_id = int(sys.argv[2])
        action_type = sys.argv[3]
        summary = sys.argv[4]
        target = sys.argv[5] if len(sys.argv) > 5 else None
        result = sys.argv[6] if len(sys.argv) > 6 else "success"
        log_action(window_id, action_type, summary, target, result)

    elif cmd == "snapshot":
        if len(sys.argv) < 4:
            print("Usage: python log_session.py snapshot <window_id> <current_task>")
            return
        create_snapshot(int(sys.argv[2]), sys.argv[3])

    elif cmd == "end":
        if len(sys.argv) < 4:
            print("Usage: python log_session.py end <window_id> <summary>")
            return
        end_session(int(sys.argv[2]), sys.argv[3])

    elif cmd == "status":
        agent_id = sys.argv[2] if len(sys.argv) > 2 else None
        show_status(agent_id)

    elif cmd == "recover":
        agent_id = sys.argv[2] if len(sys.argv) > 2 else None
        recover_session(agent_id)

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
