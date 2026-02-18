-- Migration: Add api_usage table for per-user token tracking
-- Run this in Supabase SQL Editor

create table if not exists api_usage (
  id                uuid         primary key default gen_random_uuid(),
  user_id           uuid         references profiles(id) on delete cascade not null,
  model             text         not null,
  prompt_tokens     int          not null default 0,
  completion_tokens int          not null default 0,
  total_tokens      int          not null default 0,
  endpoint          text,        -- 'chat' | 'task_gen' | 'verify' | 'regimen'
  created_at        timestamptz  default now() not null
);

create index if not exists api_usage_user_created_idx
  on api_usage(user_id, created_at desc);

-- RLS: users can read their own usage data
alter table api_usage enable row level security;

create policy "Users can read own api_usage"
  on api_usage for select
  using (auth.uid() = user_id);

-- Inserts come from server-side admin client (bypasses RLS automatically)
