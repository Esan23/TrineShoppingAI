-- Trine — decisions table
-- Stores each confirmed shopping decision so users never re-research the same
-- category twice. Row-Level Security ensures a user only ever sees their own.

create table if not exists public.decisions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  query         text not null,
  chosen_name   text not null,
  chosen_price  text,
  chosen_url    text,
  match_score   int,
  decided_in_ms int,
  created_at    timestamptz not null default now()
);

create index if not exists decisions_user_id_created_at_idx
  on public.decisions (user_id, created_at desc);

alter table public.decisions enable row level security;

-- A user can read/insert/delete only their own decisions.
drop policy if exists "own decisions: select" on public.decisions;
create policy "own decisions: select"
  on public.decisions for select
  using (auth.uid() = user_id);

drop policy if exists "own decisions: insert" on public.decisions;
create policy "own decisions: insert"
  on public.decisions for insert
  with check (auth.uid() = user_id);

drop policy if exists "own decisions: delete" on public.decisions;
create policy "own decisions: delete"
  on public.decisions for delete
  using (auth.uid() = user_id);
