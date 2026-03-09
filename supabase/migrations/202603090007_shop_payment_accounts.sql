create table if not exists public.shop_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  provider text not null default 'mercado_pago',
  provider_user_id bigint not null,
  provider_nickname text null,
  provider_email text null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  access_token_expires_at timestamptz null,
  token_scope text null,
  status text not null default 'connected',
  is_active boolean not null default true,
  connected_by_user_id uuid null references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  last_checked_at timestamptz null,
  last_refreshed_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_payment_accounts_provider_check check (provider in ('mercado_pago')),
  constraint shop_payment_accounts_status_check check (status in ('connected', 'disconnected', 'error'))
);

create unique index if not exists shop_payment_accounts_active_provider_idx
  on public.shop_payment_accounts (shop_id, provider)
  where is_active = true;

create index if not exists shop_payment_accounts_shop_idx
  on public.shop_payment_accounts (shop_id, created_at desc);

create index if not exists shop_payment_accounts_provider_user_idx
  on public.shop_payment_accounts (provider, provider_user_id);

drop trigger if exists shop_payment_accounts_touch_updated_at on public.shop_payment_accounts;
create trigger shop_payment_accounts_touch_updated_at
before update on public.shop_payment_accounts
for each row
execute function public.touch_updated_at_columns();

alter table public.shop_payment_accounts enable row level security;

revoke all on public.shop_payment_accounts from anon, authenticated;

alter table public.payment_intents
  add column if not exists shop_payment_account_id uuid null
  references public.shop_payment_accounts(id) on delete set null;

create index if not exists payment_intents_shop_payment_account_idx
  on public.payment_intents (shop_payment_account_id);
