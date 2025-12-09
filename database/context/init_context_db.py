# ==============================================================================
# file_id: SOM-SCR-0001-v1.0.0
# name: init_context_db.py
# description: Initialize agent context and project tasks databases
# project_id: SOMACOSF-CORE
# category: script
# tags: [database, initialization, agent-logging, sqlite]
# created: 2025-12-09
# modified: 2025-12-09
# version: 1.0.0
# agent_id: AGENT-PRIME-002
# execution: python init_context_db.py [--reset]
# ==============================================================================

"""
Initialize the agent context logging databases.

Creates:
- agent_context.db: Agent registry, activity windows, action log, context snapshots
- project_tasks.db: Task management with full history (no hard deletes)

Usage:
    python init_context_db.py           # Initialize if not exists
    python init_context_db.py --reset   # Drop and recreate all tables
"""

import sqlite3
import argparse
import os
from datetime import datetime
from pathlib import Path

# Database paths
SCRIPT_DIR = Path(__file__).parent
CONTEXT_DB = SCRIPT_DIR / "agent_context.db"
TASKS_DB = SCRIPT_DIR / "project_tasks.db"
CONTEXT_SCHEMA = SCRIPT_DIR / "schema.sql"
TASKS_SCHEMA = SCRIPT_DIR / "tasks_schema.sql"


def run_schema(db_path: Path, schema_path: Path, reset: bool = False):
    """Execute schema SQL against database."""
    if reset and db_path.exists():
        print(f"  Removing existing database: {db_path.name}")
        os.remove(db_path)

    print(f"  Creating/updating: {db_path.name}")

    with open(schema_path, 'r') as f:
        schema_sql = f.read()

    conn = sqlite3.connect(db_path)
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()


def seed_initial_data(db_path: Path):
    """Seed initial agent and project data."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if we're seeding context db or tasks db
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]

    if 'agents' in tables:
        # Seed agents table with AGENT-PRIME-002
        cursor.execute("""
            INSERT OR IGNORE INTO agents (id, name, model, role, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            'AGENT-PRIME-002',
            'agent_prime',
            'claude-opus-4-5-20251101',
            'Primary workspace architect and coordinator. Manages context logging, agent coordination, and development standards.',
            'active'
        ))
        print("  Seeded agent: AGENT-PRIME-002")

    if 'projects' in tables:
        # Seed initial projects
        projects = [
            ('AEGIS', 'AEGIS', 'Account & Enterprise Guardian Intelligence System - Digital footprint management'),
            ('GHOST_SHELL', 'Ghost Shell', 'HTTP Request Collector for capturing live traffic'),
            ('DMBT', 'DMBT', 'Domain and BGP Monitoring Tool'),
            ('SOMACOSF-CORE', 'Somacosf Core', 'Core workspace infrastructure and standards'),
        ]
        for project_id, name, description in projects:
            cursor.execute("""
                INSERT OR IGNORE INTO projects (id, name, description, created_by, status)
                VALUES (?, ?, ?, ?, ?)
            """, (project_id, name, description, 'AGENT-PRIME-002', 'active'))
        print(f"  Seeded {len(projects)} projects")

    conn.commit()
    conn.close()


def verify_databases():
    """Verify databases were created correctly."""
    print("\n[Verification]")

    for db_path, expected_tables in [
        (CONTEXT_DB, ['agents', 'activity_windows', 'action_log', 'context_snapshots', 'handoffs']),
        (TASKS_DB, ['projects', 'tasks', 'task_history', 'task_comments', 'task_dependencies'])
    ]:
        if not db_path.exists():
            print(f"  ERROR: {db_path.name} not created!")
            continue

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row[0] for row in cursor.fetchall()]

        missing = set(expected_tables) - set(tables)
        if missing:
            print(f"  WARNING: {db_path.name} missing tables: {missing}")
        else:
            print(f"  OK: {db_path.name} has all {len(expected_tables)} expected tables")

        conn.close()


def main():
    parser = argparse.ArgumentParser(description='Initialize agent context databases')
    parser.add_argument('--reset', action='store_true', help='Drop and recreate all tables')
    args = parser.parse_args()

    print("=" * 60)
    print("Agent Context Database Initialization")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)

    print("\n[Creating agent_context.db]")
    run_schema(CONTEXT_DB, CONTEXT_SCHEMA, args.reset)
    seed_initial_data(CONTEXT_DB)

    print("\n[Creating project_tasks.db]")
    run_schema(TASKS_DB, TASKS_SCHEMA, args.reset)
    seed_initial_data(TASKS_DB)

    verify_databases()

    print("\n" + "=" * 60)
    print("Initialization complete!")
    print(f"Context DB: {CONTEXT_DB}")
    print(f"Tasks DB:   {TASKS_DB}")
    print("=" * 60)


if __name__ == '__main__':
    main()
