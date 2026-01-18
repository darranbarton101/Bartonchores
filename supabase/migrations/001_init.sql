create extension if not exists "pgcrypto";

create type profile_role as enum ('adult', 'kid');
create type completion_status as enum ('pending', 'approved', 'denied');
create type ledger_type as enum ('earn', 'payout');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role profile_role not null,
  display_name text not null
);

create table chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  value_pence int not null,
  active boolean not null default true,
  created_by uuid references profiles (id) default auth.uid()
);

create table chore_schedules (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references chores (id) on delete cascade,
  days_of_week int[] not null default '{}',
  unique (chore_id)
);

create table kid_today_list (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  chore_id uuid not null references chores (id) on delete cascade,
  unique (kid_id, date, chore_id)
);

create table completion_requests (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references profiles (id) on delete cascade,
  chore_id uuid not null references chores (id) on delete cascade,
  date date not null,
  status completion_status not null default 'pending',
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  unique (kid_id, date, chore_id)
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  kid_id uuid not null references profiles (id) on delete cascade,
  type ledger_type not null,
  amount_pence int not null,
  note text,
  created_at timestamptz not null default now()
);
