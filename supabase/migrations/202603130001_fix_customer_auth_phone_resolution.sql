create or replace function public.resolve_customer_auth_user_id(p_customer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
  v_customer_phone text;
  v_normalized_customer_phone text;
  v_phone_match_count integer;
begin
  select cal.user_id
    into v_user_id
  from public.customer_auth_links cal
  where cal.customer_id = p_customer_id
  order by cal.verified_at desc nulls last, cal.created_at asc
  limit 1;

  if v_user_id is not null then
    update public.customer_auth_links
    set last_seen_at = now()
    where customer_id = p_customer_id
      and user_id = v_user_id;

    return v_user_id;
  end if;

  select
    lower(trim(c.email)),
    nullif(trim(c.phone), '')
    into v_email, v_customer_phone
  from public.customers c
  where c.id = p_customer_id
  limit 1;

  if v_email is not null and v_email <> '' then
    select u.id
      into v_user_id
    from auth.users u
    where lower(u.email) = v_email
    order by u.created_at asc
    limit 1;
  end if;

  if v_user_id is null and v_customer_phone is not null then
    v_normalized_customer_phone := nullif(regexp_replace(v_customer_phone, '\D', '', 'g'), '');

    if v_normalized_customer_phone is not null then
      select count(*)::integer
        into v_phone_match_count
      from public.user_profiles up
      where up.auth_user_id is not null
        and regexp_replace(coalesce(up.phone, ''), '\D', '', 'g') = v_normalized_customer_phone;

      if v_phone_match_count = 1 then
        select up.auth_user_id
          into v_user_id
        from public.user_profiles up
        where up.auth_user_id is not null
          and regexp_replace(coalesce(up.phone, ''), '\D', '', 'g') = v_normalized_customer_phone
        order by up.auth_user_id
        limit 1;
      end if;
    end if;
  end if;

  if v_user_id is null then
    return null;
  end if;

  insert into public.customer_auth_links (
    customer_id,
    user_id,
    source,
    verified_at,
    last_seen_at
  )
  values (
    p_customer_id,
    v_user_id,
    'email_backfill',
    now(),
    now()
  )
  on conflict (customer_id, user_id) do update
  set
    last_seen_at = excluded.last_seen_at,
    verified_at = coalesce(public.customer_auth_links.verified_at, excluded.verified_at);

  return v_user_id;
end;
$$;
