create table if not exists comfort_alerts (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples(id) on delete cascade,
  sent_by    uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists comfort_alerts_couple_created_idx
  on comfort_alerts (couple_id, created_at desc);

alter table comfort_alerts disable row level security;
