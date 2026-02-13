-- Chit Fund tables (run this in your Supabase SQL editor if your project is different from the one linked to MCP)

-- Optional: profiles (for future use)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  full_name text,
  created_at timestamptz default now()
);

-- Chit summary / master
create table if not exists public.chits (
  id uuid primary key default gen_random_uuid(),
  chit_name text not null,
  member_name text not null,
  monthly_amount numeric not null,
  maturity_amount numeric,
  total_auctions int,
  interval_months int not null,
  start_month date,
  end_month date,
  notes text,
  created_at timestamptz default now()
);

-- Month-wise schedule
create table if not exists public.chit_schedule (
  id uuid primary key default gen_random_uuid(),
  chit_id uuid not null references public.chits(id) on delete cascade,
  s_no int not null,
  month_date date not null,
  invested numeric default 0,
  interest numeric default 0,
  mode text,
  reference text,
  created_at timestamptz default now(),
  unique(chit_id, s_no),
  unique(chit_id, month_date)
);

create index if not exists idx_chit_schedule_chit_id on public.chit_schedule(chit_id);
create index if not exists idx_chits_member_name on public.chits(member_name);
create index if not exists idx_chits_chit_name on public.chits(chit_name);

alter table public.chits enable row level security;
alter table public.chit_schedule enable row level security;
alter table public.profiles enable row level security;

create policy "Allow all on chits" on public.chits for all using (true) with check (true);
create policy "Allow all on chit_schedule" on public.chit_schedule for all using (true) with check (true);
create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
