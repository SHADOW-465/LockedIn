create table if not exists mood_checkins (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  session_id        uuid not null references sessions(id) on delete cascade,
  date              date not null,
  submission_depth  int not null check (submission_depth between 1 and 10),
  frustration_level int not null check (frustration_level between 1 and 10),
  headspace_tags    text[] not null default '{}',
  notes             text,
  created_at        timestamptz not null default now(),
  unique (user_id, date)
);

alter table mood_checkins enable row level security;

create policy "users own their checkins"
  on mood_checkins for all using (auth.uid() = user_id);
