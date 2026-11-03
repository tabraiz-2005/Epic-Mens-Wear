-- ---------------------------------------------------------------------------
-- Newsletter sign-ups from the footer form. Safe to run more than once.
-- View them in Supabase -> Table Editor -> newsletter_subscribers.
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
revoke all on table public.newsletter_subscribers from anon, authenticated;
