create table if not exists public.marketplace_models (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  phone text not null check (char_length(phone) between 7 and 30),
  email text null check (email is null or char_length(email) between 5 and 255),
  instagram text null check (instagram is null or char_length(instagram) <= 120),
  attributes jsonb not null default '{}'::jsonb,
  photo_paths text[] not null default '{}',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_models_created_idx
  on public.marketplace_models (created_at desc);

create index if not exists marketplace_models_phone_idx
  on public.marketplace_models (phone);

create index if not exists marketplace_models_email_idx
  on public.marketplace_models (email);

drop trigger if exists marketplace_models_set_updated_at on public.marketplace_models;
create trigger marketplace_models_set_updated_at
before update on public.marketplace_models
for each row
execute procedure public.set_updated_at();

alter table public.marketplace_models enable row level security;
