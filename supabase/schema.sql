-- Initial schema snapshot for manual bootstrap/reference.
-- New schema changes should go in supabase/migrations/*.sql and be applied with Supabase CLI.

create table if not exists app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists couples (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists couple_members (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples(id) on delete cascade,
  user_id    uuid not null unique references app_users(id) on delete cascade,
  role       text not null check (role in ('anh', 'em')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, role)
);

create table if not exists couple_invites (
  id              uuid primary key default gen_random_uuid(),
  couple_id       uuid not null references couples(id) on delete cascade,
  inviter_user_id uuid not null references app_users(id) on delete cascade,
  invitee_email   text not null,
  token           text not null unique,
  status          text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at      timestamptz not null,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists couple_invites_one_pending_per_email
  on couple_invites (couple_id, lower(invitee_email))
  where status = 'pending';

create table if not exists gifts (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid references couples(id) on delete cascade,
  created_by   uuid references app_users(id) on delete set null,
  name         text not null,
  category     text not null,
  budget_range text not null,
  desire_level text not null,
  sample_url   text not null default '',
  is_gifted    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table gifts
  add column if not exists couple_id uuid references couples(id) on delete cascade;

alter table gifts
  add column if not exists created_by uuid references app_users(id) on delete set null;

create index if not exists gifts_couple_created_idx
  on gifts (couple_id, created_at desc);

create index if not exists gifts_couple_creator_idx
  on gifts (couple_id, created_by);

create table if not exists food_options (
  id                 uuid primary key default gen_random_uuid(),
  couple_id          uuid not null references couples(id) on delete cascade,
  created_by         uuid references app_users(id) on delete set null,
  name               text not null,
  restaurant_address text not null,
  price_level        text not null check (price_level in ('binh_dan', 'dat_do')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists food_options_couple_created_idx
  on food_options (couple_id, created_at desc);

create index if not exists food_options_couple_level_idx
  on food_options (couple_id, price_level);

create table if not exists food_spin_history (
  id                 uuid primary key default gen_random_uuid(),
  couple_id          uuid not null references couples(id) on delete cascade,
  food_option_id     uuid references food_options(id) on delete set null,
  spun_by            uuid references app_users(id) on delete set null,
  food_name          text not null,
  restaurant_address text not null,
  price_level        text not null check (price_level in ('binh_dan', 'dat_do')),
  created_at         timestamptz not null default now()
);

create index if not exists food_spin_history_couple_created_idx
  on food_spin_history (couple_id, created_at desc);

create index if not exists food_spin_history_couple_level_idx
  on food_spin_history (couple_id, price_level, created_at desc);

create table if not exists comfort_alerts (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples(id) on delete cascade,
  sent_by    uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists comfort_alerts_couple_created_idx
  on comfort_alerts (couple_id, created_at desc);

create table if not exists comfort_replies (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples(id) on delete cascade,
  sent_by    uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists comfort_replies_couple_created_idx
  on comfort_replies (couple_id, created_at desc);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_updated_at on app_users;
create trigger app_users_updated_at
  before update on app_users
  for each row execute function update_updated_at();

drop trigger if exists couples_updated_at on couples;
create trigger couples_updated_at
  before update on couples
  for each row execute function update_updated_at();

drop trigger if exists couple_members_updated_at on couple_members;
create trigger couple_members_updated_at
  before update on couple_members
  for each row execute function update_updated_at();

drop trigger if exists couple_invites_updated_at on couple_invites;
create trigger couple_invites_updated_at
  before update on couple_invites
  for each row execute function update_updated_at();

drop trigger if exists gifts_updated_at on gifts;
create trigger gifts_updated_at
  before update on gifts
  for each row execute function update_updated_at();

drop trigger if exists food_options_updated_at on food_options;
create trigger food_options_updated_at
  before update on food_options
  for each row execute function update_updated_at();

-- Disable RLS (access controlled by API server with service_role key)
alter table app_users disable row level security;
alter table couples disable row level security;
alter table couple_members disable row level security;
alter table couple_invites disable row level security;
alter table gifts disable row level security;
alter table food_options disable row level security;
alter table food_spin_history disable row level security;
alter table comfort_alerts disable row level security;
alter table comfort_replies disable row level security;
