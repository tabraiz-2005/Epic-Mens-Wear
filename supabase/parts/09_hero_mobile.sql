-- ---------------------------------------------------------------------------
-- Phone-friendly homepage hero: an optional tall photo for phones, and which
-- part of the wide photo phones should keep. Safe to run more than once.
-- ---------------------------------------------------------------------------
alter table public.store_settings add column if not exists hero_image_mobile_url text;
alter table public.store_settings add column if not exists hero_focus text not null default 'center';
alter table public.store_settings drop constraint if exists store_settings_hero_focus_check;
alter table public.store_settings add constraint store_settings_hero_focus_check
  check (hero_focus in ('left', 'center', 'right'));

notify pgrst, 'reload schema';
