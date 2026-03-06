create table if not exists public.account_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid null references public.shops(id) on delete set null,
  appointment_id uuid null references public.appointments(id) on delete set null,
  notification_type text not null check (
    notification_type in (
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_completed',
      'appointment_no_show',
      'review_requested'
    )
  ),
  title text not null,
  message text not null,
  action_url text null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists account_notifications_user_created_idx
  on public.account_notifications (user_id, created_at desc);

create index if not exists account_notifications_user_unread_idx
  on public.account_notifications (user_id, is_read, created_at desc);

create unique index if not exists account_notifications_user_appointment_type_uniq
  on public.account_notifications (user_id, appointment_id, notification_type)
  where appointment_id is not null;

alter table public.account_notifications enable row level security;

drop policy if exists "user_read_own_account_notifications" on public.account_notifications;
create policy "user_read_own_account_notifications"
on public.account_notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_update_own_account_notifications" on public.account_notifications;
create policy "user_update_own_account_notifications"
on public.account_notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, update on public.account_notifications to authenticated;

create or replace function public.notify_customer_on_appointment_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_shop_name text;
  v_service_name text;
  v_staff_name text;
  v_start_label text;
  v_status_type text;
  v_status_title text;
  v_status_message text;
begin
  select u.id
    into v_user_id
  from public.customers c
  join auth.users u
    on lower(u.email) = lower(c.email)
  where c.id = new.customer_id
    and c.email is not null
  order by u.created_at asc
  limit 1;

  if v_user_id is null then
    return new;
  end if;

  select
    coalesce(sh.name, 'Barberia'),
    coalesce(sv.name, 'servicio'),
    coalesce(st.name, 'tu barbero')
    into v_shop_name, v_service_name, v_staff_name
  from public.shops sh
  left join public.services sv
    on sv.id = new.service_id
  left join public.staff st
    on st.id = new.staff_id
  where sh.id = new.shop_id
  limit 1;

  v_start_label := to_char(new.start_at at time zone 'UTC', 'DD/MM/YYYY HH24:MI');

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
