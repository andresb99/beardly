-- ============================================================
-- SECURITY: Fix SECURITY DEFINER view (Supabase Security Advisor CRITICAL)
-- ============================================================
-- The view public.courses_with_stats was created without security_invoker,
-- so it ran with the permissions of the view owner instead of the querying
-- user, bypassing Row-Level Security. Enabling security_invoker makes the
-- view respect the RLS policies of the user executing the query.
-- Only the security property is changed; the view's query/logic is untouched.

alter view public.courses_with_stats set (security_invoker = on);
