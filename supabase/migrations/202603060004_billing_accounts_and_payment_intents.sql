-- Billing model update:
-- - subscription plans: free / pro / business / app_admin
-- - platform-level admins for internal testing
-- - payment intents for bookings and subscriptions

do $$
begin
  create type public.subscription_plan_next as enum ('free', 'pro', 'business', 'app_admin');
exception
  when duplicate_object then null;
end
$$;

-- Drop old default first so Postgres can cast existing values safely
alter table public.subscriptions
  alter column plan drop default;

alter table public.subscriptions
  alter column plan type public.subscription_plan_next
  using (
    case plan::text
      when 'starter' then 'free'
      when 'pro' then 'pro'
      when 'growth' then 'business'
      when 'enterprise' then 'app_admin'
      when 'free' then 'free'
      when 'business' then 'business'
      when 'app_admin' then 'app_admin'
      else 'free'
    end::public.subscription_plan_next
  );

alter table public.subscriptions
  alter column plan set default 'free'::public.subscription_plan_next;

do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'subscription_plan'
  ) then
    drop type public.subscription_plan;
  end if;
exception
  when dependent_objects_still_exist then null;
end
$$;

alter type public.subscription_plan_next rename to subscription_plan;

-- free should never stay in trialing state
update public.subscriptions
set
  status = 'active',
  trial_ends_at = null,
  current_period_end = null
where plan = 'free';

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null
);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to anon, authenticated;

alter table public.platform_admins enable row level security;

grant select on public.platform_admins to authenticated;
grant insert, update, delete on public.platform_admins to authenticated;

drop policy if exists "platform_admins_self_read" on public.platform_admins;
create policy "platform_admins_self_read"
on public.platform_admins
for select
to authenticated
using (user_id = auth.uid() or public.is_platform_admin());

drop policy if exists "platform_admins_manage" on public.platform_admins;
create policy "platform_admins_manage"
on public.platform_admins
for all
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

do $$
begin
  create type public.payment_intent_type as enum ('booking', 'subscription');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_intent_status as enum (
    'pending',
    'processing',
    'approved',
    'rejected',
    'cancelled',
    'refunded',
    'expired'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid null references public.shops(id) on delete cascade,
  intent_type public.payment_intent_type not null,
  status public.payment_intent_status not null default 'pending',
  provider text not null default 'mercado_pago',
  external_reference text not null unique,
  provider_preference_id text null,
  provider_payment_id text null,
  amount_cents integer not null check (amount_cents >= 0),
  currency_code text not null default 'UYU',
  payer_email text null,
  checkout_url text null,
  payload jsonb not null default '{}'::jsonb,
  failure_reason text null,
  approved_at timestamptz null,
  processed_at timestamptz null,
  created_by_user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  add column if not exists payment_intent_id uuid null references public.payment_intents(id) on delete set null;

create unique index if not exists appointments_payment_intent_unique_idx
  on public.appointments (payment_intent_id)
  where payment_intent_id is not null;

create index if not exists payment_intents_shop_status_idx
  on public.payment_intents (shop_id, status, created_at desc);

create index if not exists payment_intents_type_status_idx
  on public.payment_intents (intent_type, status, created_at desc);

create index if not exists payment_intents_provider_payment_idx
  on public.payment_intents (provider_payment_id);

drop trigger if exists payment_intents_touch_updated_at on public.payment_intents;
create trigger payment_intents_touch_updated_at
before update on public.payment_intents
for each row
execute function public.touch_updated_at_columns();

alter table public.payment_intents enable row level security;

grant select, insert, update on public.payment_intents to authenticated;

drop policy if exists "shop_admins_manage_payment_intents" on public.payment_intents;
create policy "shop_admins_manage_payment_intents"
on public.payment_intents
for all
to authenticated
using (
  public.is_platform_admin()
  or (
    shop_id is not null
    and public.is_shop_admin(shop_id)
  )
  or (
    created_by_user_id is not null
    and created_by_user_id = auth.uid()
  )
)
with check (
  public.is_platform_admin()
  or (
    shop_id is not null
    and public.is_shop_admin(shop_id)
  )
  or (
    created_by_user_id is not null
    and created_by_user_id = auth.uid()
  )
);

drop policy if exists "admins_manage_subscriptions" on public.subscriptions;
create policy "admins_manage_subscriptions"
on public.subscriptions
for all
to authenticated
using (public.is_shop_admin(shop_id) or public.is_platform_admin())
with check (public.is_shop_admin(shop_id) or public.is_platform_admin());

create or replace function public.bootstrap_shop_owner(
  p_shop_name text,
  p_shop_slug text,
  p_timezone text,
  p_owner_name text,
  p_contact_phone text default null,
  p_description text default null,
  p_location_label text default null,
  p_city text default null,
  p_region text default null,
  p_country_code text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns table (
  shop_id uuid,
  shop_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_shop_id uuid;
  v_slug text;
  v_timezone text;
  v_owner_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_slug := public.normalize_shop_slug(p_shop_slug);
  v_timezone := coalesce(nullif(trim(coalesce(p_timezone, '')), ''), 'UTC');
  v_owner_name := coalesce(nullif(trim(coalesce(p_owner_name, '')), ''), 'Shop owner');

  if nullif(trim(coalesce(p_shop_name, '')), '') is null then
    raise exception 'Shop name is required';
  end if;

  if v_slug is null then
    raise exception 'Shop slug is required';
  end if;

  if exists (
    select 1
    from public.shops sh
    where lower(sh.slug) = lower(v_slug)
  ) then
    raise exception 'The selected slug is already in use';
  end if;

  insert into public.shops (
    name,
    slug,
    timezone,
    description,
    status,
    owner_user_id,
    phone,
    is_verified,
    published_at
  )
  values (
    trim(p_shop_name),
    v_slug,
    v_timezone,
    nullif(trim(coalesce(p_description, '')), ''),
    'active',
    v_user_id,
    nullif(trim(coalesce(p_contact_phone, '')), ''),
    false,
    now()
  )
  returning id into v_shop_id;

  insert into public.shop_memberships (shop_id, user_id, role, membership_status)
  values (v_shop_id, v_user_id, 'owner', 'active');

  insert into public.subscriptions (
    shop_id,
    plan,
    status,
    seats_included,
    trial_ends_at,
    current_period_end
  )
  values (
    v_shop_id,
    'free',
    'active',
    3,
    null,
    null
  );

  if nullif(trim(coalesce(p_location_label, '')), '') is not null
     or nullif(trim(coalesce(p_city, '')), '') is not null
     or nullif(trim(coalesce(p_region, '')), '') is not null
     or nullif(trim(coalesce(p_country_code, '')), '') is not null
     or p_latitude is not null
     or p_longitude is not null then
    insert into public.shop_locations (
      shop_id,
      label,
      city,
      region,
      country_code,
      latitude,
      longitude
    )
    values (
      v_shop_id,
      nullif(trim(coalesce(p_location_label, '')), ''),
      nullif(trim(coalesce(p_city, '')), ''),
      nullif(trim(coalesce(p_region, '')), ''),
      nullif(trim(coalesce(p_country_code, '')), ''),
      p_latitude,
      p_longitude
    );
  end if;

  if not exists (
    select 1
    from public.staff s
    where s.shop_id = v_shop_id
      and s.auth_user_id = v_user_id
  ) then
    insert into public.staff (shop_id, auth_user_id, name, role, phone, is_active)
    values (
      v_shop_id,
      v_user_id,
      v_owner_name,
      'admin',
      coalesce(nullif(trim(coalesce(p_contact_phone, '')), ''), 'Pending'),
      true
    );
  end if;

  return query
  select v_shop_id, v_slug;
end;
$$;
