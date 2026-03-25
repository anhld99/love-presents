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

alter table food_spin_history disable row level security;
