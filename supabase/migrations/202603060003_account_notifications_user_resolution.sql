update public.customers
set email = nullif(lower(btrim(email)), '')
where email is not null
  and email is distinct from nullif(lower(btrim(email)), '');

create or replace function public.notify_customer_on_appointment_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_shop_name text;
  v_shop_timezone text;
  v_service_name text;
  v_staff_name text;
  v_start_label text;
  v_status_type text;
  v_status_title text;
  v_status_message text;
  v_customer_email text;
  v_customer_phone text;
  v_normalized_customer_phone text;
  v_phone_match_count integer;
  v_phone_user_id uuid;
begin
  select
    nullif(lower(btrim(c.email)), ''),
    nullif(btrim(c.phone), '')
    into v_customer_email, v_customer_phone
  from public.customers c
  where c.id = new.customer_id
  limit 1;

  if v_customer_email is not null then
    select u.id
      into v_user_id
    from auth.users u
    where nullif(lower(btrim(u.email)), '') = v_customer_email
    order by u.created_at asc
    limit 1;
  end if;

  if v_user_id is null and v_customer_phone is not null then
    v_normalized_customer_phone := nullif(regexp_replace(v_customer_phone, '\D', '', 'g'), '');

    if v_normalized_customer_phone is not null then
      select count(*)::integer, max(up.auth_user_id)
        into v_phone_match_count, v_phone_user_id
      from public.user_profiles up
      where up.auth_user_id is not null
        and regexp_replace(coalesce(up.phone, ''), '\D', '', 'g') = v_normalized_customer_phone;

      if v_phone_match_count = 1 then
        v_user_id := v_phone_user_id;
      end if;
    end if;
  end if;

  if v_user_id is null then
    return new;
  end if;

  select
    coalesce(sh.name, 'Barberia'),
    coalesce(sh.timezone, 'UTC'),
    coalesce(sv.name, 'servicio'),
    coalesce(st.name, 'tu barbero')
    into v_shop_name, v_shop_timezone, v_service_name, v_staff_name
  from public.shops sh
  left join public.services sv
    on sv.id = new.service_id
  left join public.staff st
    on st.id = new.staff_id
  where sh.id = new.shop_id
  limit 1;

  v_start_label := to_char(new.start_at at time zone v_shop_timezone, 'DD/MM/YYYY HH24:MI');

  if new.status is distinct from old.status then
    if new.status = 'confirmed' then
      v_status_type := 'appointment_confirmed';
      v_status_title := 'Tu cita fue confirmada';
      v_status_message := format(
        '%s confirmo tu %s para %s con %s.',
        v_shop_name,
        v_service_name,
        v_start_label,
        v_staff_name
      );
    elsif new.status = 'cancelled' then
      v_status_type := 'appointment_cancelled';
      v_status_title := 'Tu cita fue cancelada';
      v_status_message := format(
        '%s marco como cancelada tu cita de %s (%s).',
        v_shop_name,
        v_service_name,
        v_start_label
      );
    elsif new.status = 'done' then
      v_status_type := 'appointment_completed';
      v_status_title := 'Tu cita fue finalizada';
      v_status_message := format(
        'Tu cita de %s en %s (%s) se marco como realizada.',
        v_service_name,
        v_shop_name,
        v_start_label
      );
    elsif new.status = 'no_show' then
      v_status_type := 'appointment_no_show';
      v_status_title := 'Tu cita fue marcada como no asistida';
      v_status_message := format(
        '%s marco tu cita de %s (%s) como no asistida.',
        v_shop_name,
        v_service_name,
        v_start_label
      );
    end if;

    if v_status_type is not null then
      insert into public.account_notifications (
        user_id,
        shop_id,
        appointment_id,
        notification_type,
        title,
        message,
        action_url,
        metadata
      )
      values (
        v_user_id,
        new.shop_id,
        new.id,
        v_status_type,
        v_status_title,
        v_status_message,
        '/cuenta',
        jsonb_build_object(
          'shop_name', v_shop_name,
          'service_name', v_service_name,
          'staff_name', v_staff_name,
          'start_at', new.start_at,
          'status', new.status
        )
      )
      on conflict (user_id, appointment_id, notification_type) do nothing;
    end if;
  end if;

  if (
    (new.status = 'done' and old.status is distinct from 'done')
    or (old.review_request_sent_at is null and new.review_request_sent_at is not null)
  ) then
    insert into public.account_notifications (
      user_id,
      shop_id,
      appointment_id,
      notification_type,
      title,
      message,
      action_url,
      metadata
    )
    values (
      v_user_id,
      new.shop_id,
      new.id,
      'review_requested',
      'Dejanos tu resena',
      format(
        'Contanos como te fue en %s con %s (%s).',
        v_shop_name,
        v_staff_name,
        v_start_label
      ),
      format('/cuenta/resenas/%s', new.id),
      jsonb_build_object(
        'shop_name', v_shop_name,
        'service_name', v_service_name,
        'staff_name', v_staff_name,
        'start_at', new.start_at,
        'status', new.status
      )
    )
    on conflict (user_id, appointment_id, notification_type) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_notify_customer_changes on public.appointments;
create trigger appointments_notify_customer_changes
after update of status, review_request_sent_at on public.appointments
for each row
execute function public.notify_customer_on_appointment_changes();
