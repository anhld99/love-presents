create table if not exists comfort_replies (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references couples(id) on delete cascade,
  sent_by    uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists comfort_replies_couple_created_idx
  on comfort_replies (couple_id, created_at desc);

alter table comfort_replies disable row level security;
