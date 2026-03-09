alter table public.appointments
  add column if not exists customer_name_snapshot text,
  add column if not exists customer_phone_snapshot text,
  add column if not exists customer_email_snapshot text;

update public.appointments as a
set
  customer_name_snapshot = coalesce(
    a.customer_name_snapshot,
    nullif(pi.payload ->> 'customer_name', '')
  ),
  customer_phone_snapshot = coalesce(
    a.customer_phone_snapshot,
    nullif(pi.payload ->> 'customer_phone', '')
  ),
  customer_email_snapshot = coalesce(
    a.customer_email_snapshot,
    nullif(pi.payload ->> 'customer_email', '')
  )
from public.payment_intents as pi
where pi.id = a.payment_intent_id;

update public.appointments as a
set
  customer_name_snapshot = coalesce(a.customer_name_snapshot, c.name),
  customer_phone_snapshot = coalesce(a.customer_phone_snapshot, c.phone),
  customer_email_snapshot = coalesce(a.customer_email_snapshot, c.email)
from public.customers as c
where c.id = a.customer_id;

alter table public.appointments
  alter column customer_name_snapshot set not null;

alter table public.appointments
  alter column customer_phone_snapshot set not null;
