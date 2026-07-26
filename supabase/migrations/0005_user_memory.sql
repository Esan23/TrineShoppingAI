-- Trine — extend per-user memory (Cognition Economy Ch.5, Floor 5).
-- Additive only: new nullable/defaulted columns on existing tables, so running
-- code is unaffected. Existing RLS on both tables continues to apply.

-- preferences: richer personalization signals for the curate engine.
alter table public.preferences
  add column if not exists blocked_brands text[] not null default '{}',
  add column if not exists categories     text[] not null default '{}',
  add column if not exists style_notes    text;

-- decisions: record the full trio shown (not just the chosen one) and the
-- query cache key, so we can analyze what Trine offered vs. what was picked.
alter table public.decisions
  add column if not exists picks_shown jsonb,
  add column if not exists query_key   text;
