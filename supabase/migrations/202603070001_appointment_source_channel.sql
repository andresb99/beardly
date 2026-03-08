do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'appointment_source_channel'
  ) then
    create type public.appointment_source_channel as enum (
      'WEB',
      'WALK_IN',
      'ADMIN_CREATED',
      'WHATSAPP',
      'INSTAGRAM',
      'PHONE'
    );
  end if;
end;
$$;

alter table public.appointments
  add column if not exists source_channel public.appointment_source_channel;

alter table public.appointments
  alter column source_channel set default 'WEB'::public.appointment_source_channel;

update public.appointments
set source_channel = 'WEB'::public.appointment_source_channel
where source_channel is null;

alter table public.appointments
  alter column source_channel set not null;

create index if not exists appointments_shop_source_channel_start_idx
  on public.appointments (shop_id, source_channel, start_at desc);

drop policy if exists "public_create_appointments" on public.appointments;
create policy "public_create_appointments"
on public.appointments
for insert
to anon, authenticated
with check (
  status in ('pending', 'confirmed')
  and source_channel = 'WEB'::public.appointment_source_channel
  and public.shop_exists(shop_id)
  and public.active_service_in_shop(service_id, shop_id)
  and public.active_staff_in_shop(staff_id, shop_id)
);
