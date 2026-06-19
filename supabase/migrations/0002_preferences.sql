-- Trine — per-user shopping preferences (one row per user).
-- Feeds the curate engine for personalized shortlists. RLS-scoped to the user.

create table if not exists public.preferences (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  budget_max       int,
  preferred_brands text[] not null default '{}',
  quality_tier     text not null default 'mid' check (quality_tier in ('budget','mid','premium')),
  min_review_score numeric(2,1) not null default 0,
  updated_at       timestamptz not null default now()
);

alter table public.preferences enable row level security;

drop policy if exists "own prefs: select" on public.preferences;
create policy "own prefs: select" on public.preferences for select using (auth.uid() = user_id);

drop policy if exists "own prefs: insert" on public.preferences;
create policy "own prefs: insert" on public.preferences for insert with check (auth.uid() = user_id);

drop policy if exists "own prefs: update" on public.preferences;
create policy "own prefs: update" on public.preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
