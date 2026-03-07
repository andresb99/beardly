-- Add course enrollment payments and saved payment preferences on user profile.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typnamespace = 'public'::regnamespace
      and t.typname = 'payment_intent_type'
      and e.enumlabel = 'course_enrollment'
  ) then
    alter type public.payment_intent_type add value 'course_enrollment';
  end if;
end
$$;

alter table public.course_enrollments
  add column if not exists payment_intent_id uuid null references public.payment_intents(id) on delete set null;

create unique index if not exists course_enrollments_payment_intent_unique_idx
  on public.course_enrollments (payment_intent_id)
  where payment_intent_id is not null;

alter table public.user_profiles
  add column if not exists preferred_payment_method text null,
  add column if not exists preferred_card_brand text null,
  add column if not exists preferred_card_last4 text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_preferred_payment_method_check'
      and connamespace = 'public'::regnamespace
  ) then
    alter table public.user_profiles
      add constraint user_profiles_preferred_payment_method_check
      check (
        preferred_payment_method is null
        or preferred_payment_method in ('mercado_pago', 'card', 'cash')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_preferred_card_last4_check'
      and connamespace = 'public'::regnamespace
  ) then
    alter table public.user_profiles
      add constraint user_profiles_preferred_card_last4_check
      check (
        preferred_card_last4 is null
        or preferred_card_last4 ~ '^[0-9]{4}$'
      );
  end if;
end
$$;
