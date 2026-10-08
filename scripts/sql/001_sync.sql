create table if not exists snapshots (
  key_hash   text primary key,
  data       jsonb not null,
  version    integer not null default 1,
  size_bytes integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists snapshots_updated_at_idx on snapshots (updated_at);

create table if not exists rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);
