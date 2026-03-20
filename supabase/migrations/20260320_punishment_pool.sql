create table if not exists punishment_pool (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  description    text not null,
  severity       int not null check (severity between 1 and 5),
  requires_proof boolean not null default true,
  is_custom      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, title, is_custom)
);

alter table punishment_pool enable row level security;

create policy "users own their pool"
  on punishment_pool for all using (auth.uid() = user_id);
