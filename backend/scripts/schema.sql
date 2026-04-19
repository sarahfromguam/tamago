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

create table if not exists health_snapshots (
    id          uuid primary key default gen_random_uuid(),
    user_id     text not null references users(id) on delete cascade,
    source      text not null,
    raw_data    jsonb not null,
    dimensions  jsonb not null default '{"sleep":"grey","stress":"grey","meds":"grey"}',
    is_sleeping boolean not null default false,
    timestamp   timestamptz not null default now(),
    created_at  timestamptz default now()
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
