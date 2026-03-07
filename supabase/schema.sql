-- Run this in Supabase SQL Editor to set up the database

create table if not exists gifts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  budget_range text not null,
  desire_level text not null,
  sample_url   text not null default '',
  is_gifted    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gifts_updated_at on gifts;
create trigger gifts_updated_at
  before update on gifts
  for each row execute function update_updated_at();

-- Disable RLS (access controlled by API server with service_role key)
alter table gifts disable row level security;
