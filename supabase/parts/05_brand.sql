-- ---------------------------------------------------------------------------
-- Epic Menswear store details: address, phones, hours, Google Maps.
-- Only fills empty values, so it never overwrites edits made in Admin -> Store settings.
-- PLACEHOLDERS: add the store phone, Instagram and opening hours in the admin.
-- ---------------------------------------------------------------------------
alter table public.store_settings add column if not exists address text;
alter table public.store_settings add column if not exists contact_phone_2 text;
alter table public.store_settings add column if not exists opening_hours text;
alter table public.store_settings add column if not exists google_maps_url text;

update public.store_settings
   set address = coalesce(nullif(address, ''), '2200 Eastridge Loop Ste 2066, San Jose, CA 95122, United States')
 where id = 1;

notify pgrst, 'reload schema';
