create table if not exists public.marketplace_job_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text not null check (char_length(email) between 5 and 255),
  instagram text null check (instagram is null or char_length(instagram) <= 120),
  experience_years integer not null check (experience_years between 0 and 60),
  availability text not null check (char_length(availability) between 2 and 1000),
  cv_path text not null check (char_length(cv_path) between 3 and 500),
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_job_profiles_created_idx
  on public.marketplace_job_profiles (created_at desc);

alter table public.marketplace_job_profiles enable row level security;
