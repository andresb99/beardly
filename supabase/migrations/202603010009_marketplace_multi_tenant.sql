do $$
begin
  create type public.shop_membership_role as enum ('owner', 'admin', 'staff');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.shop_status as enum ('draft', 'setup_in_progress', 'active', 'suspended');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_plan as enum ('starter', 'pro', 'growth', 'enterprise');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.normalize_shop_slug(input_value text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      both '-'
      from regexp_replace(
        lower(coalesce(input_value, '')),
        '[^a-z0-9]+',
        '-',
        'g'
      )
    ),
    ''
  );
$$;

alter table public.shops
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists status public.shop_status not null default 'active',
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists phone text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists logo_url text,
  add column if not exists cover_image_url text;

update public.shops
set
  slug = coalesce(slug, public.normalize_shop_slug(name || '-' || left(id::text, 8))),
  published_at = coalesce(published_at, created_at)
where slug is null
   or length(trim(slug)) = 0
   or published_at is null;

alter table public.shops
  alter column slug set not null;

create unique index if not exists shops_slug_unique_idx
  on public.shops (lower(slug));

create table if not exists public.shop_memberships (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.shop_membership_role not null,
  membership_status text not null default 'active'
    check (membership_status in ('invited', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists shop_memberships_user_idx
  on public.shop_memberships (user_id, membership_status);

create index if not exists shop_memberships_shop_idx
  on public.shop_memberships (shop_id, role, membership_status);

create table if not exists public.shop_locations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique references public.shops(id) on delete cascade,
  label text null,
  address_line_1 text null,
  address_line_2 text null,
  city text null,
  region text null,
  postal_code text null,
  country_code text null,
  latitude numeric(9, 6) null check (latitude between -90 and 90),
  longitude numeric(9, 6) null check (longitude between -180 and 180),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_locations_city_idx
  on public.shop_locations (city, region, country_code);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null unique references public.shops(id) on delete cascade,
  plan public.subscription_plan not null default 'starter',
  status public.subscription_status not null default 'trialing',
  seats_included integer not null default 3 check (seats_included > 0),
  trial_ends_at timestamptz null,
  current_period_end timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at_columns()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shop_memberships_touch_updated_at on public.shop_memberships;
create trigger shop_memberships_touch_updated_at
before update on public.shop_memberships
for each row
execute function public.touch_updated_at_columns();

drop trigger if exists shop_locations_touch_updated_at on public.shop_locations;
create trigger shop_locations_touch_updated_at
before update on public.shop_locations
for each row
execute function public.touch_updated_at_columns();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row
execute function public.touch_updated_at_columns();

create or replace function public.current_shop_membership_role(_shop_id uuid)
returns public.shop_membership_role
language sql
stable
security definer
set search_path = public
as $$
  select sm.role
  from public.shop_memberships sm
  where sm.shop_id = _shop_id
    and sm.user_id = auth.uid()
    and sm.membership_status = 'active'
  limit 1;
$$;

grant execute on function public.current_shop_membership_role(uuid) to anon, authenticated;

create or replace function public.is_shop_member(_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_memberships sm
    where sm.shop_id = _shop_id
      and sm.user_id = auth.uid()
      and sm.membership_status = 'active'
  )
  or exists (
    select 1
    from public.staff s
    where s.shop_id = _shop_id
      and s.auth_user_id = auth.uid()
      and s.is_active = true
  );
$$;

grant execute on function public.is_shop_member(uuid) to anon, authenticated;

create or replace function public.is_shop_admin(_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shops sh
    where sh.id = _shop_id
      and sh.owner_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.shop_memberships sm
    where sm.shop_id = _shop_id
      and sm.user_id = auth.uid()
      and sm.membership_status = 'active'
      and sm.role in ('owner', 'admin')
  )
  or exists (
    select 1
    from public.staff s
    where s.shop_id = _shop_id
      and s.auth_user_id = auth.uid()
      and s.is_active = true
      and s.role = 'admin'
  );
$$;

grant execute on function public.is_shop_admin(uuid) to anon, authenticated;

create or replace function public.is_admin(_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_shop_admin(_shop_id);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

create or replace function public.is_staff_member(_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_shop_member(_shop_id);
$$;

grant execute on function public.is_staff_member(uuid) to anon, authenticated;

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
    'starter',
    'trialing',
    3,
    now() + interval '14 days',
    now() + interval '14 days'
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

revoke all on function public.bootstrap_shop_owner(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric
) from public;

grant execute on function public.bootstrap_shop_owner(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric
) to authenticated;

alter table public.shop_memberships enable row level security;
alter table public.shop_locations enable row level security;
alter table public.subscriptions enable row level security;

grant select on public.shops to anon, authenticated;
grant select on public.shop_memberships to authenticated;
grant insert, update, delete on public.shop_memberships to authenticated;
grant select on public.shop_locations to anon, authenticated;
grant insert, update, delete on public.shop_locations to authenticated;
grant select on public.subscriptions to authenticated;
grant insert, update, delete on public.subscriptions to authenticated;
grant select on public.appointment_reviews to anon;

drop policy if exists "public_read_marketplace_shops" on public.shops;
create policy "public_read_marketplace_shops"
on public.shops
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "users_read_own_shop_memberships" on public.shop_memberships;
create policy "users_read_own_shop_memberships"
on public.shop_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins_manage_shop_memberships" on public.shop_memberships;
create policy "admins_manage_shop_memberships"
on public.shop_memberships
for all
to authenticated
using (public.is_shop_admin(shop_id))
with check (public.is_shop_admin(shop_id));

drop policy if exists "public_read_shop_locations" on public.shop_locations;
create policy "public_read_shop_locations"
on public.shop_locations
for select
to anon, authenticated
using (
  is_public = true
  and exists (
    select 1
    from public.shops sh
    where sh.id = shop_locations.shop_id
      and sh.status = 'active'
  )
);

drop policy if exists "admins_manage_shop_locations" on public.shop_locations;
create policy "admins_manage_shop_locations"
on public.shop_locations
for all
to authenticated
using (public.is_shop_admin(shop_id))
with check (public.is_shop_admin(shop_id));

drop policy if exists "admins_manage_subscriptions" on public.subscriptions;
create policy "admins_manage_subscriptions"
on public.subscriptions
for all
to authenticated
using (public.is_shop_admin(shop_id))
with check (public.is_shop_admin(shop_id));

drop policy if exists "public_read_published_appointment_reviews" on public.appointment_reviews;
create policy "public_read_published_appointment_reviews"
on public.appointment_reviews
for select
to anon, authenticated
using (
  status = 'published'
  and is_verified = true
  and exists (
    select 1
    from public.shops sh
    where sh.id = appointment_reviews.shop_id
      and sh.status = 'active'
  )
);
