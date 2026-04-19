#!/usr/bin/env python3
"""Run SQL migrations against Supabase. Use --recreate to drop and recreate all tables."""

import argparse
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

DROP_SQL = """
drop table if exists medication_logs cascade;
drop table if exists medication_schedule cascade;
drop table if exists users cascade;
"""

MIGRATION_SQL = """
create table if not exists users (
    id          text primary key,
    name        text,
    email       text,
    phone       text,
    created_at  timestamptz default now()
);

create table if not exists medication_schedule (
    id                  uuid primary key default gen_random_uuid(),
    uid                 text not null references users(id) on delete cascade,
    medication_name     text not null,
    dose                text not null,
    unit                text,
    frequency           text not null,
    scheduled_times     text[] not null default '{}',
    start_date          date,
    end_date            date,
    reminders_enabled   boolean not null default true,
    created_at          timestamptz default now()
);

create table if not exists medication_logs (
    id                  uuid primary key default gen_random_uuid(),
    uid                 text not null references users(id) on delete cascade,
    date                date not null,
    medication_name     text not null,
    dose                text,
    unit                text,
    taken_at            timestamptz,
    source              text not null default 'manual',
    conversation_id     text,
    confidence_score    float,
    notes               text,
    created_at          timestamptz default now()
);
"""


def main():
    parser = argparse.ArgumentParser(description="Run Supabase migrations")
    parser.add_argument("--recreate", action="store_true", help="Drop and recreate all tables")
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env", file=sys.stderr)
        sys.exit(1)

    client = create_client(url, key)
    print(f"Connecting to Supabase at {url}\n")

    if args.recreate:
        print("Dropping tables...")
        client.rpc("exec_sql", {"query": DROP_SQL}).execute()
        print("  dropped medication_logs, medication_schedule, users\n")

    print("Running migrations...")
    client.rpc("exec_sql", {"query": MIGRATION_SQL}).execute()
    print("  created users")
    print("  created medication_schedule")
    print("  created medication_logs")
    print("\nDone.")


if __name__ == "__main__":
    main()
