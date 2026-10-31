-- ---------------------------------------------------------------------------
-- Store additions: admin portal, settings, discounts, storage, order fields
-- ---------------------------------------------------------------------------

-- Colour families used by the colour filters.
alter table public.product_variants drop constraint if exists product_variants_color_family_check;
alter table public.product_variants add constraint product_variants_color_family_check
  check (color_family in ('neutral','brown','black','white','blue','grey','green','red','beige'));

-- Inventory may be tracked without a hex colour.
alter table public.product_variants alter column color_hex set default '#1A1A1A';

-- Orders: fulfilment details managed from the admin portal.
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists admin_notes text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

alter table public.orders drop constraint if exists orders_shipping_method_check;
alter table public.orders add constraint orders_shipping_method_check
  check (shipping_method in ('standard', 'express', 'same-day'));
alter table public.orders alter column shipping_method set default 'standard';

-- Epic Menswear order numbers: EM-00100001
alter table public.orders alter column order_number
  set default ('EM-' || lpad(nextval('public.order_number_seq')::text, 8, '0'));

-- ---------------------------------------------------------------------------
-- Admin team (in addition to the owner emails in the ADMIN_EMAILS env var)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Store settings (single row, edited from Admin → Settings)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Epic Menswear',
  tagline text not null default 'Dressed for every occasion',
  announcement_enabled boolean not null default true,
  announcement_text text not null default 'Free shipping on US orders over $150 · Visit us at Eastridge Center, San Jose',
  hero_eyebrow text not null default 'Suits · Shirts · Shoes',
  hero_title text not null default 'Sharp Looks, Epic Moments',
  hero_subtitle text not null default 'Formal suits, dress shirts, formal and casual shoes, and the accessories that finish the look.',
  hero_image_url text,
  hero_cta_label text not null default 'Shop menswear',
  hero_cta_href text not null default '/men',
  -- amounts in cents: $8.99 standard, $19.99 express
  standard_shipping_amount integer not null default 899 check (standard_shipping_amount >= 0),
  express_shipping_amount integer not null default 1999 check (express_shipping_amount >= 0),
  free_shipping_threshold integer check (free_shipping_threshold is null or free_shipping_threshold >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  contact_email text not null default 'info@epicmenswear.com',
  contact_phone text,
  instagram_url text,
  tiktok_url text,
  updated_at timestamptz not null default now()
);
alter table public.store_settings add column if not exists free_shipping_threshold integer;
-- Free standard shipping over $150 (15000 cents).
insert into public.store_settings (id, free_shipping_threshold) values (1, 15000) on conflict (id) do nothing;

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from anon, authenticated;
grant select on table public.store_settings to anon, authenticated;
drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings" on public.store_settings
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Discount codes (Admin → Discounts)
-- ---------------------------------------------------------------------------
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{2,40}$'),
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value integer not null check (value > 0),          -- percent (1-100) or cents
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  times_used integer not null default 0 check (times_used >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 100)
);
drop trigger if exists discount_codes_set_updated_at on public.discount_codes;
create trigger discount_codes_set_updated_at before update on public.discount_codes
  for each row execute function public.set_updated_at();
alter table public.discount_codes enable row level security;
revoke all on table public.discount_codes from anon, authenticated;

insert into public.discount_codes (code, description, discount_type, value, min_subtotal)
values ('EPIC10', '10% off a first order', 'percent', 10, 0)
on conflict (code) do nothing;

-- Count a discount use when an order is paid.
create or replace function public.confirm_order_payment(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_stripe_customer_id text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_promo text;
begin
  perform 1 from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if exists (select 1 from public.orders where id = p_order_id and payment_status = 'paid') then
    return;
  end if;

  if not exists (
    select 1 from public.inventory_reservations where order_id = p_order_id and status = 'active'
  ) then
    raise exception 'No active inventory reservation';
  end if;

  update public.inventory_reservations
     set status = 'converted', converted_at = now()
   where order_id = p_order_id and status = 'active';

  update public.orders
     set status = 'confirmed',
         payment_status = 'paid',
         stripe_checkout_session_id = p_checkout_session_id,
         stripe_payment_intent_id = p_payment_intent_id,
         stripe_customer_id = p_stripe_customer_id,
         paid_at = now(),
         updated_at = now()
   where id = p_order_id
   returning promo_code into v_promo;

  if v_promo is not null then
    update public.discount_codes set times_used = times_used + 1 where code = v_promo;
  end if;
end;
$$;
revoke all on function public.confirm_order_payment(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.confirm_order_payment(uuid, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket for product / category / campaign images (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update set public = true;
