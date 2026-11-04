-- ---------------------------------------------------------------------------
-- Phone-friendly homepage hero: an optional tall photo for phones, and which
-- part of the wide photo phones should keep. Safe to run more than once.
-- ---------------------------------------------------------------------------
alter table public.store_settings add column if not exists hero_image_mobile_url text;
alter table public.store_settings add column if not exists hero_focus text not null default '50';
alter table public.store_settings drop constraint if exists store_settings_hero_focus_check;
-- 0-100 = percent from the photo's left edge (left/center/right still accepted).
alter table public.store_settings add constraint store_settings_hero_focus_check
  check (hero_focus ~ '^(left|center|right|[0-9]{1,2}|100)$');
-- Your current hero photo has the model on the right, so start phones there.
update public.store_settings set hero_focus = '78' where hero_focus in ('center', 'right');

notify pgrst, 'reload schema';
