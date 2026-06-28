-- Trine — public profiles mirrored from auth.users
-- Supabase stores authenticated users in auth.users (and OAuth provider details
-- in auth.identities), which aren't visible in the public schema. This table
-- gives a queryable public record of every signed-up user — email, name,
-- avatar, and auth provider — for BOTH magic-link (email) and OAuth
-- (Google/Apple). Rows are created automatically by a trigger on auth.users;
-- RLS limits each user to their own row.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  provider    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read and update only their own profile. Inserts are performed by
-- the SECURITY DEFINER trigger below (not by end users), so there is no insert
-- policy.
drop policy if exists "own profile: select" on public.profiles;
create policy "own profile: select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create a profile row whenever a new auth user is created. For email signup
-- this fires immediately when the OTP/magic link is requested; for OAuth it
-- fires after the provider callback. provider/name/avatar come from the auth
-- metadata Supabase populates.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile email in sync if the auth email changes (e.g. on confirm).
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set email = new.email, updated_at = now()
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_update();

-- These SECURITY DEFINER functions are triggers only — they must not be
-- callable directly through the REST RPC API. Triggers still fire because they
-- run as the table owner regardless of EXECUTE grants.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.handle_user_email_update() from anon, authenticated, public;

-- Backfill any auth users that already existed (idempotent).
insert into public.profiles (id, email, full_name, avatar_url, provider)
select u.id,
       u.email,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
       u.raw_user_meta_data ->> 'avatar_url',
       coalesce(u.raw_app_meta_data ->> 'provider', 'email')
from auth.users u
on conflict (id) do nothing;
