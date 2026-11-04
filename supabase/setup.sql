-- =============================================================================
--  EPIC MENSWEAR — database setup
--  For a NEW, empty Supabase project (separate from any other store).
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to run again later: it never overwrites products or settings you
--  create in the admin portal.
-- =============================================================================
begin;

-- ======== 01_catalog.sql ========
-- Automatically maintains updated_at timestamps.
create or replace function public.set_updated_at() returns trigger language plpgsql
set search_path = '' as $$ begin new.updated_at = now();
return new;
end;
$$;
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    legacy_id text unique,
    slug text not null unique,
    name text not null,
    gender text not null default 'all' check (gender in ('women', 'men', 'all')),
    description text,
    hero_image_url text,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create table if not exists public.collections (
    id uuid primary key default gen_random_uuid(),
    legacy_id text unique,
    slug text not null unique,
    name text not null,
    season text,
    description text,
    story_quote text,
    hero_image_url text,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    legacy_id text unique,
    sku text not null unique,
    slug text not null unique,
    title text not null,
    subtitle text,
    description text not null,
    price numeric(12, 2) not null check (price >= 0),
    compare_at_price numeric(12, 2) check (
        compare_at_price is null
        or compare_at_price >= price
    ),
    currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'JPY', 'AED')),
    category_id uuid references public.categories(id) on delete
    set null,
        collection_id uuid references public.collections(id) on delete
    set null,
        gender text not null check (gender in ('women', 'men', 'unisex')),
        material text,
        care_instructions text [] not null default '{}',
        craftsmanship_notes text,
        fit_info text,
        shipping_info text,
        seo_title text,
        seo_description text,
        is_new_arrival boolean not null default false,
        is_featured boolean not null default false,
        is_bestseller boolean not null default false,
        related_product_slugs text [] not null default '{}',
        complete_the_look_slugs text [] not null default '{}',
        status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
        published_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create table if not exists public.product_images (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    url text not null,
    alt_text text not null,
    width integer check (
        width is null
        or width > 0
    ),
    height integer check (
        height is null
        or height > 0
    ),
    position integer not null default 0,
    is_primary boolean not null default false,
    is_hover boolean not null default false,
    created_at timestamptz not null default now()
);
create table if not exists public.product_variants (
    id uuid primary key default gen_random_uuid(),
    legacy_id text unique,
    product_id uuid not null references public.products(id) on delete cascade,
    sku text not null unique,
    name text not null,
    color text not null,
    color_hex text not null,
    color_family text not null check (
        color_family in (
            'neutral',
            'brown',
            'black',
            'white',
            'blue',
            'grey'
        )
    ),
    size text not null,
    price numeric(12, 2) not null check (price >= 0),
    compare_at_price numeric(12, 2) check (
        compare_at_price is null
        or compare_at_price >= price
    ),
    inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
    is_active boolean not null default true,
    image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (product_id, color, size)
);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_collection_id_idx on public.products(collection_id);
create index if not exists products_gender_idx on public.products(gender);
create index if not exists products_status_idx on public.products(status);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before
update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at before
update on public.collections for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before
update on public.products for each row execute function public.set_updated_at();
drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at before
update on public.product_variants for each row execute function public.set_updated_at();
-- Secure every public table with Row Level Security.
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
-- Visitors can read catalog data but cannot modify it.
revoke all on table public.categories,
public.collections,
public.products,
public.product_images,
public.product_variants
from anon,
    authenticated;
grant select on table public.categories,
    public.collections,
    public.products,
    public.product_images,
    public.product_variants to anon,
    authenticated;
drop policy if exists "Public can view active categories" on public.categories;
create policy "Public can view active categories" on public.categories for
select to anon,
    authenticated using (is_active = true);
drop policy if exists "Public can view active collections" on public.collections;
create policy "Public can view active collections" on public.collections for
select to anon,
    authenticated using (is_active = true);
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for
select to anon,
    authenticated using (status = 'active');
drop policy if exists "Public can view active product images" on public.product_images;
create policy "Public can view active product images" on public.product_images for
select to anon,
    authenticated using (
        exists (
            select 1
            from public.products
            where products.id = product_images.product_id
                and products.status = 'active'
        )
    );
drop policy if exists "Public can view active product variants" on public.product_variants;
create policy "Public can view active product variants" on public.product_variants for
select to anon,
    authenticated using (
        is_active = true
        and exists (
            select 1
            from public.products
            where products.id = product_variants.product_id
                and products.status = 'active'
        )
    );

-- ======== 02_orders.sql ========
create sequence if not exists public.order_number_seq start with 100001 increment by 1;
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique default (
        'EM-' || lpad(nextval('public.order_number_seq')::text, 8, '0')
    ),
    customer_id uuid references auth.users(id) on delete
    set null,
        customer_email text not null,
        customer_first_name text not null,
        customer_last_name text not null,
        customer_phone text,
        shipping_address jsonb not null default '{}'::jsonb,
        billing_address jsonb,
        shipping_method text not null default 'express' check (shipping_method in ('express', 'same-day')),
        currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'JPY', 'AED')),
        subtotal_amount integer not null check (subtotal_amount >= 0),
        discount_amount integer not null default 0 check (discount_amount >= 0),
        shipping_amount integer not null default 0 check (shipping_amount >= 0),
        tax_amount integer not null default 0 check (tax_amount >= 0),
        total_amount integer not null check (total_amount >= 0),
        promo_code text,
        is_gift_wrapped boolean not null default false,
        gift_message text,
        status text not null default 'pending' check (
            status in (
                'pending',
                'confirmed',
                'cancelled',
                'refunded'
            )
        ),
        payment_status text not null default 'unpaid' check (
            payment_status in (
                'unpaid',
                'processing',
                'paid',
                'failed',
                'refunded',
                'partially_refunded'
            )
        ),
        fulfillment_status text not null default 'unfulfilled' check (
            fulfillment_status in (
                'unfulfilled',
                'processing',
                'shipped',
                'delivered',
                'returned',
                'cancelled'
            )
        ),
        stripe_checkout_session_id text,
        stripe_payment_intent_id text,
        stripe_customer_id text,
        expires_at timestamptz,
        paid_at timestamptz,
        cancelled_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        check (
            total_amount = greatest(
                0,
                subtotal_amount - discount_amount + shipping_amount + tax_amount
            )
        )
);
create unique index if not exists orders_stripe_session_unique on public.orders (stripe_checkout_session_id)
where stripe_checkout_session_id is not null;
create unique index if not exists orders_payment_intent_unique on public.orders (stripe_payment_intent_id)
where stripe_payment_intent_id is not null;
create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete
    set null,
        variant_id uuid references public.product_variants(id) on delete
    set null,
        sku text not null,
        product_slug text not null,
        title text not null,
        color text not null,
        size text not null,
        image_url text,
        unit_amount integer not null check (unit_amount >= 0),
        quantity integer not null check (
            quantity between 1 and 20
        ),
        line_total_amount integer generated always as (unit_amount * quantity) stored,
        created_at timestamptz not null default now(),
        unique (order_id, sku)
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_variant_id_idx on public.order_items (variant_id);
create table if not exists public.inventory_reservations (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    variant_id uuid not null references public.product_variants(id) on delete restrict,
    quantity integer not null check (quantity > 0),
    status text not null default 'active' check (status in ('active', 'converted', 'released')),
    expires_at timestamptz not null,
    converted_at timestamptz,
    released_at timestamptz,
    created_at timestamptz not null default now(),
    unique (order_id, variant_id)
);
create index if not exists inventory_reservations_active_idx on public.inventory_reservations (expires_at)
where status = 'active';
create table if not exists public.stripe_webhook_events (
    stripe_event_id text primary key,
    event_type text not null,
    object_id text,
    livemode boolean not null default false,
    processing_status text not null default 'processing' check (
        processing_status in ('processing', 'completed', 'failed')
    ),
    error_message text,
    received_at timestamptz not null default now(),
    processed_at timestamptz
);
create or replace function public.reserve_order_inventory(p_order_id uuid) returns void language plpgsql security definer
set search_path = '' as $$
declare order_record record;
item_record record;
begin
select id,
    status,
    expires_at into order_record
from public.orders
where id = p_order_id for
update;
if not found then raise exception 'Order not found';
end if;
if order_record.status <> 'pending' then raise exception 'Order is not pending';
end if;
if exists (
    select 1
    from public.inventory_reservations
    where order_id = p_order_id
        and status = 'active'
) then return;
end if;
if not exists (
    select 1
    from public.order_items
    where order_id = p_order_id
) then raise exception 'Order has no items';
end if;
for item_record in
select variant_id,
    quantity
from public.order_items
where order_id = p_order_id
order by variant_id loop if item_record.variant_id is null then raise exception 'Order item has no active variant';
end if;
update public.product_variants
set inventory_quantity = inventory_quantity - item_record.quantity,
    updated_at = now()
where id = item_record.variant_id
    and is_active = true
    and inventory_quantity >= item_record.quantity;
if not found then raise exception 'Insufficient inventory for variant %',
item_record.variant_id;
end if;
insert into public.inventory_reservations (
        order_id,
        variant_id,
        quantity,
        expires_at
    )
values (
        p_order_id,
        item_record.variant_id,
        item_record.quantity,
        coalesce(
            order_record.expires_at,
            now() + interval '30 minutes'
        )
    );
end loop;
end;
$$;
create or replace function public.release_order_inventory(p_order_id uuid) returns void language plpgsql security definer
set search_path = '' as $$
declare reservation_record record;
begin for reservation_record in
select id,
    variant_id,
    quantity
from public.inventory_reservations
where order_id = p_order_id
    and status = 'active'
order by variant_id for
update loop
update public.product_variants
set inventory_quantity = inventory_quantity + reservation_record.quantity,
    updated_at = now()
where id = reservation_record.variant_id;
update public.inventory_reservations
set status = 'released',
    released_at = now()
where id = reservation_record.id;
end loop;
update public.orders
set status = 'cancelled',
    fulfillment_status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
where id = p_order_id
    and payment_status <> 'paid';
end;
$$;
create or replace function public.confirm_order_payment(
        p_order_id uuid,
        p_checkout_session_id text,
        p_payment_intent_id text,
        p_stripe_customer_id text default null
    ) returns void language plpgsql security definer
set search_path = '' as $$ begin perform 1
from public.orders
where id = p_order_id for
update;
if not found then raise exception 'Order not found';
end if;
if exists (
    select 1
    from public.orders
    where id = p_order_id
        and payment_status = 'paid'
) then return;
end if;
if not exists (
    select 1
    from public.inventory_reservations
    where order_id = p_order_id
        and status = 'active'
) then raise exception 'No active inventory reservation';
end if;
update public.inventory_reservations
set status = 'converted',
    converted_at = now()
where order_id = p_order_id
    and status = 'active';
update public.orders
set status = 'confirmed',
    payment_status = 'paid',
    stripe_checkout_session_id = p_checkout_session_id,
    stripe_payment_intent_id = p_payment_intent_id,
    stripe_customer_id = p_stripe_customer_id,
    paid_at = now(),
    updated_at = now()
where id = p_order_id;
end;
$$;
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before
update on public.orders for each row execute function public.set_updated_at();
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.stripe_webhook_events enable row level security;
revoke all on table public.orders
from anon,
    authenticated;
revoke all on table public.order_items
from anon,
    authenticated;
revoke all on table public.inventory_reservations
from anon,
    authenticated;
revoke all on table public.stripe_webhook_events
from anon,
    authenticated;
revoke all on sequence public.order_number_seq
from anon,
    authenticated;
revoke all on function public.reserve_order_inventory(uuid)
from public,
    anon,
    authenticated;
revoke all on function public.release_order_inventory(uuid)
from public,
    anon,
    authenticated;
revoke all on function public.confirm_order_payment(uuid, text, text, text)
from public,
    anon,
    authenticated;
grant execute on function public.reserve_order_inventory(uuid) to service_role;
grant execute on function public.release_order_inventory(uuid) to service_role;
grant execute on function public.confirm_order_payment(uuid, text, text, text) to service_role;

-- ======== 03_store.sql ========
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

-- ======== 04_payments.sql ========
-- ---------------------------------------------------------------------------
-- Payments: US dollars, card payments through Stripe Checkout.
-- Amounts on orders, settings and fixed discounts are stored in cents ($ x 100).
-- The Cash on Delivery functions below are not used by the online store; they are
-- kept so the admin's COD tools work if you ever add a pay-at-pickup option.
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

-- Currencies.
alter table public.products drop constraint if exists products_currency_check;
alter table public.products add constraint products_currency_check
  check (currency in ('USD', 'CAD', 'EUR', 'GBP'));
alter table public.products alter column currency set default 'USD';

alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check
  check (currency in ('USD', 'CAD', 'EUR', 'GBP'));
alter table public.orders alter column currency set default 'USD';

-- How the customer pays.
alter table public.orders add column if not exists payment_method text not null default 'card';
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('card', 'cod', 'pickup'));

-- The card checkout always collects an email; kept nullable for manual / in-store orders.
alter table public.orders alter column customer_email drop not null;

-- Has the shop confirmed a COD order with the customer (phone / WhatsApp)?
alter table public.orders add column if not exists confirmed_by_phone boolean not null default false;

-- Place a Cash on Delivery order: take the stock now and confirm the order.
create or replace function public.place_cod_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.reserve_order_inventory(p_order_id);
  update public.inventory_reservations
     set status = 'converted', converted_at = now()
   where order_id = p_order_id and status = 'active';
  update public.orders
     set status = 'confirmed', expires_at = null, updated_at = now()
   where id = p_order_id;
end;
$$;
revoke all on function public.place_cod_order(uuid) from public, anon, authenticated;
grant execute on function public.place_cod_order(uuid) to service_role;

-- Cancel a Cash on Delivery order before it's paid: put the stock back.
create or replace function public.cancel_cod_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform 1 from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if exists (select 1 from public.orders where id = p_order_id and payment_status = 'paid') then
    raise exception 'Order is already paid';
  end if;
  for r in select id, variant_id, quantity from public.inventory_reservations
            where order_id = p_order_id and status in ('active', 'converted') for update loop
    update public.product_variants set inventory_quantity = inventory_quantity + r.quantity, updated_at = now()
     where id = r.variant_id;
    update public.inventory_reservations set status = 'released', released_at = now() where id = r.id;
  end loop;
  update public.orders
     set status = 'cancelled', fulfillment_status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = p_order_id;
end;
$$;
revoke all on function public.cancel_cod_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_cod_order(uuid) to service_role;

-- Discount usage for COD orders is counted when the order is placed.
create or replace function public.count_discount_use(p_code text) returns void
language sql security definer set search_path = '' as $$
  update public.discount_codes set times_used = times_used + 1 where code = p_code;
$$;
revoke all on function public.count_discount_use(text) from public, anon, authenticated;
grant execute on function public.count_discount_use(text) to service_role;

-- Ask Supabase's API to pick up the new columns straight away.
notify pgrst, 'reload schema';

-- ======== 05_brand.sql ========
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

-- ======== 06_categories.sql ========
-- ---------------------------------------------------------------------------
-- Menu categories (Men). Safe to re-run: adds missing ones and sets the menu
-- order; names and descriptions you edit in Admin -> Categories are kept.
-- Keep in sync with src/lib/commerce/default-categories.ts and supabase/gen_seed.py.
-- ---------------------------------------------------------------------------
insert into public.categories (legacy_id, slug, name, gender, description, sort_order) values
  ('epic-cat-formal-suits',  'formal-suits',  'Formal Suits',  'men', 'Two-piece, three-piece, double-breasted and tuxedo suits.', 1),
  ('epic-cat-formal-shirts', 'formal-shirts', 'Formal Shirts', 'men', 'Dress shirts, French cuff and tuxedo shirts.', 2),
  ('epic-cat-formal-shoes',  'formal-shoes',  'Formal Shoes',  'men', 'Oxfords, loafers and patent tuxedo shoes.', 3),
  ('epic-cat-casual-shoes',  'casual-shoes',  'Casual Shoes',  'men', 'Leather sneakers, boots and driving loafers.', 4),
  ('epic-cat-accessories',   'accessories',   'Accessories',   'men', 'Ties, bow ties, belts, pocket squares and cufflinks.', 5)
on conflict (slug) do update
  set sort_order = excluded.sort_order,
      is_active  = true;

-- ======== 07_seed.sql ========
-- Generated by supabase/gen_seed.py: Epic Menswear STARTER catalogue (placeholders, edit or delete in the admin)
insert into public.collections (legacy_id, slug, name, season, description, story_quote, sort_order) values ('epic-col-wedding', 'wedding-prom', 'Wedding & Prom', '2026', 'Tuxedos, suits, shoes and finishing touches for the big night.', 'Look the part on the day everyone remembers.', 1) on conflict do nothing;
insert into public.collections (legacy_id, slug, name, season, description, story_quote, sort_order) values ('epic-col-office', 'office-edit', 'The Office Edit', 'Core', 'Suits, shirts and shoes that work Monday to Friday.', 'Sharp every day, not just on special days.', 2) on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-01', 'EM-SU-01', 'classic-two-piece-suit', 'Classic Two-Piece Suit', 'Notch lapel, two-button', 'A versatile two-button suit with a notch lapel, flap pockets and a clean flat-front pant. The one suit that covers interviews, weddings and the office.', 299, null, 'USD',
  (select id from public.categories where slug = 'formal-suits'),
  (select id from public.collections where slug = 'office-edit'),
  'men', 'Wool-blend suiting. Fully lined jacket.', array['Dry clean only','Hang on a shaped hanger between wears','Steam to remove creases']::text[], 'Modern fit through the chest and waist. Pants come with an unfinished hem for tailoring.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Classic Two-Piece Suit | Epic Menswear', 'A versatile two-button suit with a notch lapel, flap pockets and a clean flat-front pant. The one suit that covers interviews, weddings and the office.', true, true, true, 'active', now() - interval '0 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-01-NAV-38R', 'EM-SU-01-NAV-38R', 'Navy / 38R', 'Navy', '#1E2A3F', 'blue', '38R', 299::numeric, null::numeric, 1),
  ('epic-01-NAV-40R', 'EM-SU-01-NAV-40R', 'Navy / 40R', 'Navy', '#1E2A3F', 'blue', '40R', 299::numeric, null::numeric, 4),
  ('epic-01-NAV-42R', 'EM-SU-01-NAV-42R', 'Navy / 42R', 'Navy', '#1E2A3F', 'blue', '42R', 299::numeric, null::numeric, 7),
  ('epic-01-NAV-44R', 'EM-SU-01-NAV-44R', 'Navy / 44R', 'Navy', '#1E2A3F', 'blue', '44R', 299::numeric, null::numeric, 2),
  ('epic-01-NAV-46R', 'EM-SU-01-NAV-46R', 'Navy / 46R', 'Navy', '#1E2A3F', 'blue', '46R', 299::numeric, null::numeric, 13),
  ('epic-01-CHA-38R', 'EM-SU-01-CHA-38R', 'Charcoal / 38R', 'Charcoal', '#3A3B3E', 'grey', '38R', 299::numeric, null::numeric, 6),
  ('epic-01-CHA-40R', 'EM-SU-01-CHA-40R', 'Charcoal / 40R', 'Charcoal', '#3A3B3E', 'grey', '40R', 299::numeric, null::numeric, 9),
  ('epic-01-CHA-42R', 'EM-SU-01-CHA-42R', 'Charcoal / 42R', 'Charcoal', '#3A3B3E', 'grey', '42R', 299::numeric, null::numeric, 12),
  ('epic-01-CHA-44R', 'EM-SU-01-CHA-44R', 'Charcoal / 44R', 'Charcoal', '#3A3B3E', 'grey', '44R', 299::numeric, null::numeric, 15),
  ('epic-01-CHA-46R', 'EM-SU-01-CHA-46R', 'Charcoal / 46R', 'Charcoal', '#3A3B3E', 'grey', '46R', 299::numeric, null::numeric, 3),
  ('epic-01-BLA-38R', 'EM-SU-01-BLA-38R', 'Black / 38R', 'Black', '#16171A', 'black', '38R', 299::numeric, null::numeric, 11),
  ('epic-01-BLA-40R', 'EM-SU-01-BLA-40R', 'Black / 40R', 'Black', '#16171A', 'black', '40R', 299::numeric, null::numeric, 0),
  ('epic-01-BLA-42R', 'EM-SU-01-BLA-42R', 'Black / 42R', 'Black', '#16171A', 'black', '42R', 299::numeric, null::numeric, 2),
  ('epic-01-BLA-44R', 'EM-SU-01-BLA-44R', 'Black / 44R', 'Black', '#16171A', 'black', '44R', 299::numeric, null::numeric, 2),
  ('epic-01-BLA-46R', 'EM-SU-01-BLA-46R', 'Black / 46R', 'Black', '#16171A', 'black', '46R', 299::numeric, null::numeric, 8)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-01'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-02', 'EM-SU-02', 'slim-fit-three-piece-suit', 'Slim-Fit Three-Piece Suit', 'Jacket, vest and pants', 'A slim three-piece with a matching five-button vest. Wear all three for a wedding, or the jacket alone with denim.', 349, 399, 'USD',
  (select id from public.categories where slug = 'formal-suits'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', 'Wool-blend suiting with stretch. Fully lined jacket and vest.', array['Dry clean only','Hang on a shaped hanger between wears','Steam to remove creases']::text[], 'Slim fit. If between sizes, size up.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Slim-Fit Three-Piece Suit | Epic Menswear', 'A slim three-piece with a matching five-button vest. Wear all three for a wedding, or the jacket alone with denim.', true, true, false, 'active', now() - interval '1 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-02-LG-38R', 'EM-SU-02-LG-38R', 'Light Grey / 38R', 'Light Grey', '#A7A9AC', 'grey', '38R', 349::numeric, 399::numeric, 8),
  ('epic-02-LG-40R', 'EM-SU-02-LG-40R', 'Light Grey / 40R', 'Light Grey', '#A7A9AC', 'grey', '40R', 349::numeric, 399::numeric, 11),
  ('epic-02-LG-42R', 'EM-SU-02-LG-42R', 'Light Grey / 42R', 'Light Grey', '#A7A9AC', 'grey', '42R', 349::numeric, 399::numeric, 0),
  ('epic-02-LG-44R', 'EM-SU-02-LG-44R', 'Light Grey / 44R', 'Light Grey', '#A7A9AC', 'grey', '44R', 349::numeric, 399::numeric, 2),
  ('epic-02-LG-46R', 'EM-SU-02-LG-46R', 'Light Grey / 46R', 'Light Grey', '#A7A9AC', 'grey', '46R', 349::numeric, 399::numeric, 2),
  ('epic-02-NAV-38R', 'EM-SU-02-NAV-38R', 'Navy / 38R', 'Navy', '#1E2A3F', 'blue', '38R', 349::numeric, 399::numeric, 13),
  ('epic-02-NAV-40R', 'EM-SU-02-NAV-40R', 'Navy / 40R', 'Navy', '#1E2A3F', 'blue', '40R', 349::numeric, 399::numeric, 1),
  ('epic-02-NAV-42R', 'EM-SU-02-NAV-42R', 'Navy / 42R', 'Navy', '#1E2A3F', 'blue', '42R', 349::numeric, 399::numeric, 4),
  ('epic-02-NAV-44R', 'EM-SU-02-NAV-44R', 'Navy / 44R', 'Navy', '#1E2A3F', 'blue', '44R', 349::numeric, 399::numeric, 7),
  ('epic-02-NAV-46R', 'EM-SU-02-NAV-46R', 'Navy / 46R', 'Navy', '#1E2A3F', 'blue', '46R', 349::numeric, 399::numeric, 2)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-02'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-03', 'EM-SU-03', 'modern-plaid-suit', 'Modern Plaid Suit', 'Windowpane check', 'A bold windowpane-check suit with peak lapels and a tapered pant, for when navy feels too safe.', 279, null, 'USD',
  (select id from public.categories where slug = 'formal-suits'),
  null,
  'men', 'Poly-viscose blend with stretch.', array['Dry clean only','Hang on a shaped hanger between wears','Steam to remove creases']::text[], 'Slim fit.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Modern Plaid Suit | Epic Menswear', 'A bold windowpane-check suit with peak lapels and a tapered pant, for when navy feels too safe.', false, false, false, 'active', now() - interval '2 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-03-BC-38R', 'EM-SU-03-BC-38R', 'Brown Check / 38R', 'Brown Check', '#6B4F3A', 'brown', '38R', 279::numeric, null::numeric, 15),
  ('epic-03-BC-40R', 'EM-SU-03-BC-40R', 'Brown Check / 40R', 'Brown Check', '#6B4F3A', 'brown', '40R', 279::numeric, null::numeric, 3),
  ('epic-03-BC-42R', 'EM-SU-03-BC-42R', 'Brown Check / 42R', 'Brown Check', '#6B4F3A', 'brown', '42R', 279::numeric, null::numeric, 6),
  ('epic-03-BC-44R', 'EM-SU-03-BC-44R', 'Brown Check / 44R', 'Brown Check', '#6B4F3A', 'brown', '44R', 279::numeric, null::numeric, 9),
  ('epic-03-BC-46R', 'EM-SU-03-BC-46R', 'Brown Check / 46R', 'Brown Check', '#6B4F3A', 'brown', '46R', 279::numeric, null::numeric, 12),
  ('epic-03-BC-38R', 'EM-SU-03-BC-38R', 'Blue Check / 38R', 'Blue Check', '#3E5A80', 'blue', '38R', 279::numeric, null::numeric, 2),
  ('epic-03-BC-40R', 'EM-SU-03-BC-40R', 'Blue Check / 40R', 'Blue Check', '#3E5A80', 'blue', '40R', 279::numeric, null::numeric, 8),
  ('epic-03-BC-42R', 'EM-SU-03-BC-42R', 'Blue Check / 42R', 'Blue Check', '#3E5A80', 'blue', '42R', 279::numeric, null::numeric, 11),
  ('epic-03-BC-44R', 'EM-SU-03-BC-44R', 'Blue Check / 44R', 'Blue Check', '#3E5A80', 'blue', '44R', 279::numeric, null::numeric, 0),
  ('epic-03-BC-46R', 'EM-SU-03-BC-46R', 'Blue Check / 46R', 'Blue Check', '#3E5A80', 'blue', '46R', 279::numeric, null::numeric, 2)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-03'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-04', 'EM-SU-04', 'double-breasted-suit', 'Double-Breasted Suit', 'Six-button, peak lapel', 'A six-button double-breasted suit with strong peak lapels: a confident choice for boardrooms and black-tie-optional events.', 379, null, 'USD',
  (select id from public.categories where slug = 'formal-suits'),
  (select id from public.collections where slug = 'office-edit'),
  'men', 'Wool-blend suiting. Fully lined.', array['Dry clean only','Hang on a shaped hanger between wears','Steam to remove creases']::text[], 'Tailored fit. Wear buttoned for the sharpest line.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Double-Breasted Suit | Epic Menswear', 'A six-button double-breasted suit with strong peak lapels: a confident choice for boardrooms and black-tie-optional events.', true, false, false, 'active', now() - interval '3 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-04-MN-38R', 'EM-SU-04-MN-38R', 'Midnight Navy / 38R', 'Midnight Navy', '#141C2E', 'blue', '38R', 379::numeric, null::numeric, 7),
  ('epic-04-MN-40R', 'EM-SU-04-MN-40R', 'Midnight Navy / 40R', 'Midnight Navy', '#141C2E', 'blue', '40R', 379::numeric, null::numeric, 2),
  ('epic-04-MN-42R', 'EM-SU-04-MN-42R', 'Midnight Navy / 42R', 'Midnight Navy', '#141C2E', 'blue', '42R', 379::numeric, null::numeric, 13),
  ('epic-04-MN-44R', 'EM-SU-04-MN-44R', 'Midnight Navy / 44R', 'Midnight Navy', '#141C2E', 'blue', '44R', 379::numeric, null::numeric, 1),
  ('epic-04-MN-46R', 'EM-SU-04-MN-46R', 'Midnight Navy / 46R', 'Midnight Navy', '#141C2E', 'blue', '46R', 379::numeric, null::numeric, 4),
  ('epic-04-CHA-38R', 'EM-SU-04-CHA-38R', 'Charcoal / 38R', 'Charcoal', '#3A3B3E', 'grey', '38R', 379::numeric, null::numeric, 12),
  ('epic-04-CHA-40R', 'EM-SU-04-CHA-40R', 'Charcoal / 40R', 'Charcoal', '#3A3B3E', 'grey', '40R', 379::numeric, null::numeric, 15),
  ('epic-04-CHA-42R', 'EM-SU-04-CHA-42R', 'Charcoal / 42R', 'Charcoal', '#3A3B3E', 'grey', '42R', 379::numeric, null::numeric, 3),
  ('epic-04-CHA-44R', 'EM-SU-04-CHA-44R', 'Charcoal / 44R', 'Charcoal', '#3A3B3E', 'grey', '44R', 379::numeric, null::numeric, 6),
  ('epic-04-CHA-46R', 'EM-SU-04-CHA-46R', 'Charcoal / 46R', 'Charcoal', '#3A3B3E', 'grey', '46R', 379::numeric, null::numeric, 9)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-04'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-05', 'EM-SU-05', 'black-tuxedo-suit', 'Black Tuxedo Suit', 'Satin peak lapel, one button', 'A one-button tuxedo with satin peak lapels, jetted pockets and matching striped pants. Black tie, done properly.', 399, null, 'USD',
  (select id from public.categories where slug = 'formal-suits'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', 'Wool-blend with satin lapel and trims.', array['Dry clean only','Hang on a shaped hanger between wears','Steam to remove creases']::text[], 'Modern fit. Pants have a satin side stripe.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Black Tuxedo Suit | Epic Menswear', 'A one-button tuxedo with satin peak lapels, jetted pockets and matching striped pants. Black tie, done properly.', false, true, true, 'active', now() - interval '4 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-05-BLA-38R', 'EM-SU-05-BLA-38R', 'Black / 38R', 'Black', '#16171A', 'black', '38R', 399::numeric, null::numeric, 0),
  ('epic-05-BLA-40R', 'EM-SU-05-BLA-40R', 'Black / 40R', 'Black', '#16171A', 'black', '40R', 399::numeric, null::numeric, 2),
  ('epic-05-BLA-42R', 'EM-SU-05-BLA-42R', 'Black / 42R', 'Black', '#16171A', 'black', '42R', 399::numeric, null::numeric, 2),
  ('epic-05-BLA-44R', 'EM-SU-05-BLA-44R', 'Black / 44R', 'Black', '#16171A', 'black', '44R', 399::numeric, null::numeric, 8),
  ('epic-05-BLA-46R', 'EM-SU-05-BLA-46R', 'Black / 46R', 'Black', '#16171A', 'black', '46R', 399::numeric, null::numeric, 11)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-05'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-06', 'EM-SH-01', 'slim-fit-stretch-dress-shirt', 'Slim-Fit Stretch Dress Shirt', 'Spread collar', 'A crisp spread-collar dress shirt with a little stretch, so it stays comfortable from the first meeting to the last dance.', 59, null, 'USD',
  (select id from public.categories where slug = 'formal-shirts'),
  (select id from public.collections where slug = 'office-edit'),
  'men', 'Cotton-blend with stretch. Easy care.', array['Machine wash cold','Tumble dry low or hang dry','Warm iron']::text[], 'Slim fit. Choose your usual size.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Slim-Fit Stretch Dress Shirt | Epic Menswear', 'A crisp spread-collar dress shirt with a little stretch, so it stays comfortable from the first meeting to the last dance.', false, true, true, 'active', now() - interval '5 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-06-WHI-S', 'EM-SH-01-WHI-S', 'White / S', 'White', '#F2F2EF', 'white', 'S', 59::numeric, null::numeric, 6),
  ('epic-06-WHI-M', 'EM-SH-01-WHI-M', 'White / M', 'White', '#F2F2EF', 'white', 'M', 59::numeric, null::numeric, 9),
  ('epic-06-WHI-L', 'EM-SH-01-WHI-L', 'White / L', 'White', '#F2F2EF', 'white', 'L', 59::numeric, null::numeric, 12),
  ('epic-06-WHI-XL', 'EM-SH-01-WHI-XL', 'White / XL', 'White', '#F2F2EF', 'white', 'XL', 59::numeric, null::numeric, 15),
  ('epic-06-WHI-XXL', 'EM-SH-01-WHI-XXL', 'White / XXL', 'White', '#F2F2EF', 'white', 'XXL', 59::numeric, null::numeric, 3),
  ('epic-06-LB-S', 'EM-SH-01-LB-S', 'Light Blue / S', 'Light Blue', '#BCD3EA', 'blue', 'S', 59::numeric, null::numeric, 11),
  ('epic-06-LB-M', 'EM-SH-01-LB-M', 'Light Blue / M', 'Light Blue', '#BCD3EA', 'blue', 'M', 59::numeric, null::numeric, 0),
  ('epic-06-LB-L', 'EM-SH-01-LB-L', 'Light Blue / L', 'Light Blue', '#BCD3EA', 'blue', 'L', 59::numeric, null::numeric, 2),
  ('epic-06-LB-XL', 'EM-SH-01-LB-XL', 'Light Blue / XL', 'Light Blue', '#BCD3EA', 'blue', 'XL', 59::numeric, null::numeric, 2),
  ('epic-06-LB-XXL', 'EM-SH-01-LB-XXL', 'Light Blue / XXL', 'Light Blue', '#BCD3EA', 'blue', 'XXL', 59::numeric, null::numeric, 8),
  ('epic-06-BLA-S', 'EM-SH-01-BLA-S', 'Black / S', 'Black', '#16171A', 'black', 'S', 59::numeric, null::numeric, 1),
  ('epic-06-BLA-M', 'EM-SH-01-BLA-M', 'Black / M', 'Black', '#16171A', 'black', 'M', 59::numeric, null::numeric, 4),
  ('epic-06-BLA-L', 'EM-SH-01-BLA-L', 'Black / L', 'Black', '#16171A', 'black', 'L', 59::numeric, null::numeric, 7),
  ('epic-06-BLA-XL', 'EM-SH-01-BLA-XL', 'Black / XL', 'Black', '#16171A', 'black', 'XL', 59::numeric, null::numeric, 2),
  ('epic-06-BLA-XXL', 'EM-SH-01-BLA-XXL', 'Black / XXL', 'Black', '#16171A', 'black', 'XXL', 59::numeric, null::numeric, 13)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-06'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-07', 'EM-SH-02', 'non-iron-twill-dress-shirt', 'Non-Iron Twill Dress Shirt', 'Wrinkle-resistant cotton', 'A smooth twill dress shirt with a non-iron finish that comes out of the wash ready to wear.', 69, null, 'USD',
  (select id from public.categories where slug = 'formal-shirts'),
  (select id from public.collections where slug = 'office-edit'),
  'men', '100% cotton twill, non-iron finish.', array['Machine wash cold','Tumble dry low or hang dry','Warm iron']::text[], 'Regular fit.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Non-Iron Twill Dress Shirt | Epic Menswear', 'A smooth twill dress shirt with a non-iron finish that comes out of the wash ready to wear.', true, false, false, 'active', now() - interval '6 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-07-WHI-S', 'EM-SH-02-WHI-S', 'White / S', 'White', '#F2F2EF', 'white', 'S', 69::numeric, null::numeric, 13),
  ('epic-07-WHI-M', 'EM-SH-02-WHI-M', 'White / M', 'White', '#F2F2EF', 'white', 'M', 69::numeric, null::numeric, 1),
  ('epic-07-WHI-L', 'EM-SH-02-WHI-L', 'White / L', 'White', '#F2F2EF', 'white', 'L', 69::numeric, null::numeric, 4),
  ('epic-07-WHI-XL', 'EM-SH-02-WHI-XL', 'White / XL', 'White', '#F2F2EF', 'white', 'XL', 69::numeric, null::numeric, 7),
  ('epic-07-WHI-XXL', 'EM-SH-02-WHI-XXL', 'White / XXL', 'White', '#F2F2EF', 'white', 'XXL', 69::numeric, null::numeric, 2),
  ('epic-07-PIN-S', 'EM-SH-02-PIN-S', 'Pink / S', 'Pink', '#E8C4C8', 'red', 'S', 69::numeric, null::numeric, 3),
  ('epic-07-PIN-M', 'EM-SH-02-PIN-M', 'Pink / M', 'Pink', '#E8C4C8', 'red', 'M', 69::numeric, null::numeric, 6),
  ('epic-07-PIN-L', 'EM-SH-02-PIN-L', 'Pink / L', 'Pink', '#E8C4C8', 'red', 'L', 69::numeric, null::numeric, 9),
  ('epic-07-PIN-XL', 'EM-SH-02-PIN-XL', 'Pink / XL', 'Pink', '#E8C4C8', 'red', 'XL', 69::numeric, null::numeric, 12),
  ('epic-07-PIN-XXL', 'EM-SH-02-PIN-XXL', 'Pink / XXL', 'Pink', '#E8C4C8', 'red', 'XXL', 69::numeric, null::numeric, 15),
  ('epic-07-LB-S', 'EM-SH-02-LB-S', 'Light Blue / S', 'Light Blue', '#BCD3EA', 'blue', 'S', 69::numeric, null::numeric, 8),
  ('epic-07-LB-M', 'EM-SH-02-LB-M', 'Light Blue / M', 'Light Blue', '#BCD3EA', 'blue', 'M', 69::numeric, null::numeric, 11),
  ('epic-07-LB-L', 'EM-SH-02-LB-L', 'Light Blue / L', 'Light Blue', '#BCD3EA', 'blue', 'L', 69::numeric, null::numeric, 0),
  ('epic-07-LB-XL', 'EM-SH-02-LB-XL', 'Light Blue / XL', 'Light Blue', '#BCD3EA', 'blue', 'XL', 69::numeric, null::numeric, 2),
  ('epic-07-LB-XXL', 'EM-SH-02-LB-XXL', 'Light Blue / XXL', 'Light Blue', '#BCD3EA', 'blue', 'XXL', 69::numeric, null::numeric, 2)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-07'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-08', 'EM-SH-03', 'french-cuff-dress-shirt', 'French Cuff Dress Shirt', 'Double cuffs for cufflinks', 'A sharp poplin shirt with French cuffs, made to be worn with cufflinks for weddings and formal events.', 75, 89, 'USD',
  (select id from public.categories where slug = 'formal-shirts'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', '100% cotton poplin.', array['Machine wash cold','Tumble dry low or hang dry','Warm iron']::text[], 'Slim fit.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'French Cuff Dress Shirt | Epic Menswear', 'A sharp poplin shirt with French cuffs, made to be worn with cufflinks for weddings and formal events.', false, false, false, 'active', now() - interval '7 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-08-WHI-S', 'EM-SH-03-WHI-S', 'White / S', 'White', '#F2F2EF', 'white', 'S', 75::numeric, 89::numeric, 2),
  ('epic-08-WHI-M', 'EM-SH-03-WHI-M', 'White / M', 'White', '#F2F2EF', 'white', 'M', 75::numeric, 89::numeric, 8),
  ('epic-08-WHI-L', 'EM-SH-03-WHI-L', 'White / L', 'White', '#F2F2EF', 'white', 'L', 75::numeric, 89::numeric, 11),
  ('epic-08-WHI-XL', 'EM-SH-03-WHI-XL', 'White / XL', 'White', '#F2F2EF', 'white', 'XL', 75::numeric, 89::numeric, 0),
  ('epic-08-WHI-XXL', 'EM-SH-03-WHI-XXL', 'White / XXL', 'White', '#F2F2EF', 'white', 'XXL', 75::numeric, 89::numeric, 2),
  ('epic-08-LB-S', 'EM-SH-03-LB-S', 'Light Blue / S', 'Light Blue', '#BCD3EA', 'blue', 'S', 75::numeric, 89::numeric, 2),
  ('epic-08-LB-M', 'EM-SH-03-LB-M', 'Light Blue / M', 'Light Blue', '#BCD3EA', 'blue', 'M', 75::numeric, 89::numeric, 13),
  ('epic-08-LB-L', 'EM-SH-03-LB-L', 'Light Blue / L', 'Light Blue', '#BCD3EA', 'blue', 'L', 75::numeric, 89::numeric, 1),
  ('epic-08-LB-XL', 'EM-SH-03-LB-XL', 'Light Blue / XL', 'Light Blue', '#BCD3EA', 'blue', 'XL', 75::numeric, 89::numeric, 4),
  ('epic-08-LB-XXL', 'EM-SH-03-LB-XXL', 'Light Blue / XXL', 'Light Blue', '#BCD3EA', 'blue', 'XXL', 75::numeric, 89::numeric, 7)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-08'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-09', 'EM-SH-04', 'pleated-tuxedo-shirt', 'Pleated Tuxedo Shirt', 'Pleated bib, French cuffs', 'A classic pleated-front tuxedo shirt with French cuffs, ready for studs, cufflinks and a bow tie.', 69, null, 'USD',
  (select id from public.categories where slug = 'formal-shirts'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', '100% cotton.', array['Machine wash cold','Tumble dry low or hang dry','Warm iron']::text[], 'Regular fit.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Pleated Tuxedo Shirt | Epic Menswear', 'A classic pleated-front tuxedo shirt with French cuffs, ready for studs, cufflinks and a bow tie.', false, false, false, 'active', now() - interval '8 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-09-WHI-S', 'EM-SH-04-WHI-S', 'White / S', 'White', '#F2F2EF', 'white', 'S', 69::numeric, null::numeric, 12),
  ('epic-09-WHI-M', 'EM-SH-04-WHI-M', 'White / M', 'White', '#F2F2EF', 'white', 'M', 69::numeric, null::numeric, 15),
  ('epic-09-WHI-L', 'EM-SH-04-WHI-L', 'White / L', 'White', '#F2F2EF', 'white', 'L', 69::numeric, null::numeric, 3),
  ('epic-09-WHI-XL', 'EM-SH-04-WHI-XL', 'White / XL', 'White', '#F2F2EF', 'white', 'XL', 69::numeric, null::numeric, 6),
  ('epic-09-WHI-XXL', 'EM-SH-04-WHI-XXL', 'White / XXL', 'White', '#F2F2EF', 'white', 'XXL', 69::numeric, null::numeric, 9)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-09'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-10', 'EM-FS-01', 'leather-oxford-shoes', 'Leather Oxford Shoes', 'Cap toe, closed lacing', 'A polished cap-toe oxford with closed lacing: the dress shoe that goes with every suit.', 149, null, 'USD',
  (select id from public.categories where slug = 'formal-shoes'),
  (select id from public.collections where slug = 'office-edit'),
  'men', 'Leather upper and lining. Rubber heel.', array['Wipe clean with a soft cloth','Polish or condition regularly','Use shoe trees to keep the shape']::text[], 'True to size. Half sizes: go up.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Leather Oxford Shoes | Epic Menswear', 'A polished cap-toe oxford with closed lacing: the dress shoe that goes with every suit.', true, true, true, 'active', now() - interval '9 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-10-BLA-8', 'EM-FS-01-BLA-8', 'Black / 8', 'Black', '#16171A', 'black', '8', 149::numeric, null::numeric, 4),
  ('epic-10-BLA-9', 'EM-FS-01-BLA-9', 'Black / 9', 'Black', '#16171A', 'black', '9', 149::numeric, null::numeric, 7),
  ('epic-10-BLA-10', 'EM-FS-01-BLA-10', 'Black / 10', 'Black', '#16171A', 'black', '10', 149::numeric, null::numeric, 2),
  ('epic-10-BLA-11', 'EM-FS-01-BLA-11', 'Black / 11', 'Black', '#16171A', 'black', '11', 149::numeric, null::numeric, 13),
  ('epic-10-BLA-12', 'EM-FS-01-BLA-12', 'Black / 12', 'Black', '#16171A', 'black', '12', 149::numeric, null::numeric, 1),
  ('epic-10-DB-8', 'EM-FS-01-DB-8', 'Dark Brown / 8', 'Dark Brown', '#3E2A1E', 'brown', '8', 149::numeric, null::numeric, 9),
  ('epic-10-DB-9', 'EM-FS-01-DB-9', 'Dark Brown / 9', 'Dark Brown', '#3E2A1E', 'brown', '9', 149::numeric, null::numeric, 12),
  ('epic-10-DB-10', 'EM-FS-01-DB-10', 'Dark Brown / 10', 'Dark Brown', '#3E2A1E', 'brown', '10', 149::numeric, null::numeric, 15),
  ('epic-10-DB-11', 'EM-FS-01-DB-11', 'Dark Brown / 11', 'Dark Brown', '#3E2A1E', 'brown', '11', 149::numeric, null::numeric, 3),
  ('epic-10-DB-12', 'EM-FS-01-DB-12', 'Dark Brown / 12', 'Dark Brown', '#3E2A1E', 'brown', '12', 149::numeric, null::numeric, 6)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-10'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-11', 'EM-FS-02', 'penny-loafers', 'Penny Loafers', 'Slip-on, moc toe', 'Classic penny loafers with a hand-stitched moc toe. Dress them up with a suit or down with chinos.', 129, null, 'USD',
  (select id from public.categories where slug = 'formal-shoes'),
  null,
  'men', 'Leather upper. Leather sole.', array['Wipe clean with a soft cloth','Polish or condition regularly','Use shoe trees to keep the shape']::text[], 'Fits snug at first and softens with wear.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Penny Loafers | Epic Menswear', 'Classic penny loafers with a hand-stitched moc toe. Dress them up with a suit or down with chinos.', false, false, false, 'active', now() - interval '10 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-11-BRO-8', 'EM-FS-02-BRO-8', 'Brown / 8', 'Brown', '#5A3B26', 'brown', '8', 129::numeric, null::numeric, 11),
  ('epic-11-BRO-9', 'EM-FS-02-BRO-9', 'Brown / 9', 'Brown', '#5A3B26', 'brown', '9', 129::numeric, null::numeric, 0),
  ('epic-11-BRO-10', 'EM-FS-02-BRO-10', 'Brown / 10', 'Brown', '#5A3B26', 'brown', '10', 129::numeric, null::numeric, 2),
  ('epic-11-BRO-11', 'EM-FS-02-BRO-11', 'Brown / 11', 'Brown', '#5A3B26', 'brown', '11', 129::numeric, null::numeric, 2),
  ('epic-11-BRO-12', 'EM-FS-02-BRO-12', 'Brown / 12', 'Brown', '#5A3B26', 'brown', '12', 129::numeric, null::numeric, 8),
  ('epic-11-BUR-8', 'EM-FS-02-BUR-8', 'Burgundy / 8', 'Burgundy', '#5B1F28', 'red', '8', 129::numeric, null::numeric, 1),
  ('epic-11-BUR-9', 'EM-FS-02-BUR-9', 'Burgundy / 9', 'Burgundy', '#5B1F28', 'red', '9', 129::numeric, null::numeric, 4),
  ('epic-11-BUR-10', 'EM-FS-02-BUR-10', 'Burgundy / 10', 'Burgundy', '#5B1F28', 'red', '10', 129::numeric, null::numeric, 7),
  ('epic-11-BUR-11', 'EM-FS-02-BUR-11', 'Burgundy / 11', 'Burgundy', '#5B1F28', 'red', '11', 129::numeric, null::numeric, 2),
  ('epic-11-BUR-12', 'EM-FS-02-BUR-12', 'Burgundy / 12', 'Burgundy', '#5B1F28', 'red', '12', 129::numeric, null::numeric, 13)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-11'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-12', 'EM-FS-03', 'patent-leather-tuxedo-shoes', 'Patent Leather Tuxedo Shoes', 'High-shine finish', 'High-shine patent oxfords made for tuxedos, weddings and prom night.', 139, 169, 'USD',
  (select id from public.categories where slug = 'formal-shoes'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', 'Patent leather upper.', array['Wipe with a soft dry cloth','Store in the dust bag']::text[], 'True to size.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Patent Leather Tuxedo Shoes | Epic Menswear', 'High-shine patent oxfords made for tuxedos, weddings and prom night.', false, true, false, 'active', now() - interval '11 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-12-BLA-8', 'EM-FS-03-BLA-8', 'Black / 8', 'Black', '#16171A', 'black', '8', 139::numeric, 169::numeric, 3),
  ('epic-12-BLA-9', 'EM-FS-03-BLA-9', 'Black / 9', 'Black', '#16171A', 'black', '9', 139::numeric, 169::numeric, 6),
  ('epic-12-BLA-10', 'EM-FS-03-BLA-10', 'Black / 10', 'Black', '#16171A', 'black', '10', 139::numeric, 169::numeric, 9),
  ('epic-12-BLA-11', 'EM-FS-03-BLA-11', 'Black / 11', 'Black', '#16171A', 'black', '11', 139::numeric, 169::numeric, 12),
  ('epic-12-BLA-12', 'EM-FS-03-BLA-12', 'Black / 12', 'Black', '#16171A', 'black', '12', 139::numeric, 169::numeric, 15)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-12'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-13', 'EM-CS-01', 'leather-sneakers', 'Leather Sneakers', 'Clean, minimal low-top', 'Minimal leather low-tops that work with jeans, chinos and even a relaxed suit.', 99, null, 'USD',
  (select id from public.categories where slug = 'casual-shoes'),
  null,
  'men', 'Leather upper. Rubber cup sole.', array['Wipe with a damp cloth','Air dry away from direct heat']::text[], 'True to size.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Leather Sneakers | Epic Menswear', 'Minimal leather low-tops that work with jeans, chinos and even a relaxed suit.', true, true, true, 'active', now() - interval '12 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-13-WHI-8', 'EM-CS-01-WHI-8', 'White / 8', 'White', '#F2F2EF', 'white', '8', 99::numeric, null::numeric, 2),
  ('epic-13-WHI-9', 'EM-CS-01-WHI-9', 'White / 9', 'White', '#F2F2EF', 'white', '9', 99::numeric, null::numeric, 13),
  ('epic-13-WHI-10', 'EM-CS-01-WHI-10', 'White / 10', 'White', '#F2F2EF', 'white', '10', 99::numeric, null::numeric, 1),
  ('epic-13-WHI-11', 'EM-CS-01-WHI-11', 'White / 11', 'White', '#F2F2EF', 'white', '11', 99::numeric, null::numeric, 4),
  ('epic-13-WHI-12', 'EM-CS-01-WHI-12', 'White / 12', 'White', '#F2F2EF', 'white', '12', 99::numeric, null::numeric, 7),
  ('epic-13-BLA-8', 'EM-CS-01-BLA-8', 'Black / 8', 'Black', '#16171A', 'black', '8', 99::numeric, null::numeric, 15),
  ('epic-13-BLA-9', 'EM-CS-01-BLA-9', 'Black / 9', 'Black', '#16171A', 'black', '9', 99::numeric, null::numeric, 3),
  ('epic-13-BLA-10', 'EM-CS-01-BLA-10', 'Black / 10', 'Black', '#16171A', 'black', '10', 99::numeric, null::numeric, 6),
  ('epic-13-BLA-11', 'EM-CS-01-BLA-11', 'Black / 11', 'Black', '#16171A', 'black', '11', 99::numeric, null::numeric, 9),
  ('epic-13-BLA-12', 'EM-CS-01-BLA-12', 'Black / 12', 'Black', '#16171A', 'black', '12', 99::numeric, null::numeric, 12)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-13'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-14', 'EM-CS-02', 'suede-chelsea-boots', 'Suede Chelsea Boots', 'Elastic sides, pull tab', 'Easy pull-on Chelsea boots in soft suede with elastic side panels.', 159, 189, 'USD',
  (select id from public.categories where slug = 'casual-shoes'),
  null,
  'men', 'Suede upper. Rubber sole.', array['Brush with a suede brush','Protect with a suede spray','Keep away from heavy rain']::text[], 'True to size.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Suede Chelsea Boots | Epic Menswear', 'Easy pull-on Chelsea boots in soft suede with elastic side panels.', true, false, false, 'active', now() - interval '13 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-14-TAN-8', 'EM-CS-02-TAN-8', 'Tan / 8', 'Tan', '#A8835A', 'brown', '8', 159::numeric, 189::numeric, 2),
  ('epic-14-TAN-9', 'EM-CS-02-TAN-9', 'Tan / 9', 'Tan', '#A8835A', 'brown', '9', 159::numeric, 189::numeric, 2),
  ('epic-14-TAN-10', 'EM-CS-02-TAN-10', 'Tan / 10', 'Tan', '#A8835A', 'brown', '10', 159::numeric, 189::numeric, 8),
  ('epic-14-TAN-11', 'EM-CS-02-TAN-11', 'Tan / 11', 'Tan', '#A8835A', 'brown', '11', 159::numeric, 189::numeric, 11),
  ('epic-14-TAN-12', 'EM-CS-02-TAN-12', 'Tan / 12', 'Tan', '#A8835A', 'brown', '12', 159::numeric, 189::numeric, 0),
  ('epic-14-BRO-8', 'EM-CS-02-BRO-8', 'Brown / 8', 'Brown', '#5A3B26', 'brown', '8', 159::numeric, 189::numeric, 7),
  ('epic-14-BRO-9', 'EM-CS-02-BRO-9', 'Brown / 9', 'Brown', '#5A3B26', 'brown', '9', 159::numeric, 189::numeric, 2),
  ('epic-14-BRO-10', 'EM-CS-02-BRO-10', 'Brown / 10', 'Brown', '#5A3B26', 'brown', '10', 159::numeric, 189::numeric, 13),
  ('epic-14-BRO-11', 'EM-CS-02-BRO-11', 'Brown / 11', 'Brown', '#5A3B26', 'brown', '11', 159::numeric, 189::numeric, 1),
  ('epic-14-BRO-12', 'EM-CS-02-BRO-12', 'Brown / 12', 'Brown', '#5A3B26', 'brown', '12', 159::numeric, 189::numeric, 4)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-14'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-15', 'EM-CS-03', 'suede-driving-loafers', 'Suede Driving Loafers', 'Flexible pebble sole', 'Soft suede drivers with a flexible pebble sole, made for weekends and warm days.', 109, null, 'USD',
  (select id from public.categories where slug = 'casual-shoes'),
  null,
  'men', 'Suede upper. Rubber pebble sole.', array['Brush with a suede brush','Protect with a suede spray','Keep away from heavy rain']::text[], 'Snug fit; they relax with wear.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Suede Driving Loafers | Epic Menswear', 'Soft suede drivers with a flexible pebble sole, made for weekends and warm days.', false, false, false, 'active', now() - interval '14 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-15-NAV-8', 'EM-CS-03-NAV-8', 'Navy / 8', 'Navy', '#1E2A3F', 'blue', '8', 109::numeric, null::numeric, 9),
  ('epic-15-NAV-9', 'EM-CS-03-NAV-9', 'Navy / 9', 'Navy', '#1E2A3F', 'blue', '9', 109::numeric, null::numeric, 12),
  ('epic-15-NAV-10', 'EM-CS-03-NAV-10', 'Navy / 10', 'Navy', '#1E2A3F', 'blue', '10', 109::numeric, null::numeric, 15),
  ('epic-15-NAV-11', 'EM-CS-03-NAV-11', 'Navy / 11', 'Navy', '#1E2A3F', 'blue', '11', 109::numeric, null::numeric, 3),
  ('epic-15-NAV-12', 'EM-CS-03-NAV-12', 'Navy / 12', 'Navy', '#1E2A3F', 'blue', '12', 109::numeric, null::numeric, 6),
  ('epic-15-TAN-8', 'EM-CS-03-TAN-8', 'Tan / 8', 'Tan', '#A8835A', 'brown', '8', 109::numeric, null::numeric, 0),
  ('epic-15-TAN-9', 'EM-CS-03-TAN-9', 'Tan / 9', 'Tan', '#A8835A', 'brown', '9', 109::numeric, null::numeric, 2),
  ('epic-15-TAN-10', 'EM-CS-03-TAN-10', 'Tan / 10', 'Tan', '#A8835A', 'brown', '10', 109::numeric, null::numeric, 2),
  ('epic-15-TAN-11', 'EM-CS-03-TAN-11', 'Tan / 11', 'Tan', '#A8835A', 'brown', '11', 109::numeric, null::numeric, 8),
  ('epic-15-TAN-12', 'EM-CS-03-TAN-12', 'Tan / 12', 'Tan', '#A8835A', 'brown', '12', 109::numeric, null::numeric, 11)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-15'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-16', 'EM-AC-01', 'silk-tie', 'Silk Tie', 'Classic 3-inch width', 'A smooth silk tie in a classic width. The easy way to change the whole look of a suit.', 39, null, 'USD',
  (select id from public.categories where slug = 'accessories'),
  (select id from public.collections where slug = 'office-edit'),
  'men', '100% silk.', array['Spot clean only','Store flat or rolled']::text[], 'Standard length, 3 in wide.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Silk Tie | Epic Menswear', 'A smooth silk tie in a classic width. The easy way to change the whole look of a suit.', false, false, true, 'active', now() - interval '15 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-16-NAV-OneSize', 'EM-AC-01-NAV-OneSize', 'Navy / One Size', 'Navy', '#1E2A3F', 'blue', 'One Size', 39::numeric, null::numeric, 1),
  ('epic-16-BUR-OneSize', 'EM-AC-01-BUR-OneSize', 'Burgundy / One Size', 'Burgundy', '#5B1F28', 'red', 'One Size', 39::numeric, null::numeric, 6),
  ('epic-16-SIL-OneSize', 'EM-AC-01-SIL-OneSize', 'Silver / One Size', 'Silver', '#B9BCC2', 'grey', 'One Size', 39::numeric, null::numeric, 11)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-16'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-17', 'EM-AC-02', 'pre-tied-bow-tie', 'Pre-Tied Bow Tie', 'Adjustable band', 'A pre-tied satin bow tie with an adjustable band, the finishing touch for any tuxedo.', 25, null, 'USD',
  (select id from public.categories where slug = 'accessories'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', 'Satin.', array['Spot clean only','Store flat or rolled']::text[], 'Adjustable to fit most neck sizes.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Pre-Tied Bow Tie | Epic Menswear', 'A pre-tied satin bow tie with an adjustable band, the finishing touch for any tuxedo.', false, false, false, 'active', now() - interval '16 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-17-BLA-OneSize', 'EM-AC-02-BLA-OneSize', 'Black / One Size', 'Black', '#16171A', 'black', 'One Size', 25::numeric, null::numeric, 8),
  ('epic-17-BUR-OneSize', 'EM-AC-02-BUR-OneSize', 'Burgundy / One Size', 'Burgundy', '#5B1F28', 'red', 'One Size', 25::numeric, null::numeric, 13)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-17'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-18', 'EM-AC-03', 'leather-dress-belt', 'Leather Dress Belt', 'Polished buckle', 'A slim leather dress belt with a polished buckle to match your shoes.', 49, null, 'USD',
  (select id from public.categories where slug = 'accessories'),
  null,
  'men', 'Genuine leather.', array['Wipe clean with a damp cloth','Condition occasionally']::text[], 'Order your pant waist size.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Leather Dress Belt | Epic Menswear', 'A slim leather dress belt with a polished buckle to match your shoes.', false, false, false, 'active', now() - interval '17 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-18-BLA-32', 'EM-AC-03-BLA-32', 'Black / 32', 'Black', '#16171A', 'black', '32', 49::numeric, null::numeric, 15),
  ('epic-18-BLA-34', 'EM-AC-03-BLA-34', 'Black / 34', 'Black', '#16171A', 'black', '34', 49::numeric, null::numeric, 3),
  ('epic-18-BLA-36', 'EM-AC-03-BLA-36', 'Black / 36', 'Black', '#16171A', 'black', '36', 49::numeric, null::numeric, 6),
  ('epic-18-BLA-38', 'EM-AC-03-BLA-38', 'Black / 38', 'Black', '#16171A', 'black', '38', 49::numeric, null::numeric, 9),
  ('epic-18-BLA-40', 'EM-AC-03-BLA-40', 'Black / 40', 'Black', '#16171A', 'black', '40', 49::numeric, null::numeric, 12),
  ('epic-18-BRO-32', 'EM-AC-03-BRO-32', 'Brown / 32', 'Brown', '#5A3B26', 'brown', '32', 49::numeric, null::numeric, 2),
  ('epic-18-BRO-34', 'EM-AC-03-BRO-34', 'Brown / 34', 'Brown', '#5A3B26', 'brown', '34', 49::numeric, null::numeric, 8),
  ('epic-18-BRO-36', 'EM-AC-03-BRO-36', 'Brown / 36', 'Brown', '#5A3B26', 'brown', '36', 49::numeric, null::numeric, 11),
  ('epic-18-BRO-38', 'EM-AC-03-BRO-38', 'Brown / 38', 'Brown', '#5A3B26', 'brown', '38', 49::numeric, null::numeric, 0),
  ('epic-18-BRO-40', 'EM-AC-03-BRO-40', 'Brown / 40', 'Brown', '#5A3B26', 'brown', '40', 49::numeric, null::numeric, 2)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-18'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-19', 'EM-AC-04', 'silk-pocket-square', 'Silk Pocket Square', 'Hand-rolled edges', 'A silk pocket square with hand-rolled edges: the small detail that finishes a suit.', 19, null, 'USD',
  (select id from public.categories where slug = 'accessories'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', '100% silk.', array['Spot clean only','Store flat or rolled']::text[], '12 x 12 in.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Silk Pocket Square | Epic Menswear', 'A silk pocket square with hand-rolled edges: the small detail that finishes a suit.', false, false, false, 'active', now() - interval '18 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-19-WHI-OneSize', 'EM-AC-04-WHI-OneSize', 'White / One Size', 'White', '#F2F2EF', 'white', 'One Size', 19::numeric, null::numeric, 7),
  ('epic-19-BUR-OneSize', 'EM-AC-04-BUR-OneSize', 'Burgundy / One Size', 'Burgundy', '#5B1F28', 'red', 'One Size', 19::numeric, null::numeric, 12),
  ('epic-19-NAV-OneSize', 'EM-AC-04-NAV-OneSize', 'Navy / One Size', 'Navy', '#1E2A3F', 'blue', 'One Size', 19::numeric, null::numeric, 2)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-19'
on conflict do nothing;

insert into public.products (legacy_id, sku, slug, title, subtitle, description, price, compare_at_price, currency,
  category_id, collection_id, gender, material, care_instructions, fit_info, shipping_info, seo_title, seo_description,
  is_new_arrival, is_featured, is_bestseller, status, published_at)
values ('epic-20', 'EM-AC-05', 'classic-cufflinks', 'Classic Cufflinks', 'Polished round face', 'Polished round cufflinks in a gift box, made for French cuff shirts.', 35, null, 'USD',
  (select id from public.categories where slug = 'accessories'),
  (select id from public.collections where slug = 'wedding-prom'),
  'men', 'Polished metal. Gift box included.', array['Wipe with a soft dry cloth','Store in the gift box']::text[], 'For French cuff shirts.', 'Tracked shipping anywhere in the US. Unworn items can be returned within 30 days.',
  'Classic Cufflinks | Epic Menswear', 'Polished round cufflinks in a gift box, made for French cuff shirts.', false, false, false, 'active', now() - interval '19 hours')
on conflict do nothing;
insert into public.product_variants (product_id, legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
select p.id, v.* from public.products p, (values
  ('epic-20-SIL-OneSize', 'EM-AC-05-SIL-OneSize', 'Silver / One Size', 'Silver', '#B9BCC2', 'grey', 'One Size', 35::numeric, null::numeric, 0),
  ('epic-20-GOL-OneSize', 'EM-AC-05-GOL-OneSize', 'Gold / One Size', 'Gold', '#C9A34E', 'beige', 'One Size', 35::numeric, null::numeric, 4)
) as v(legacy_id, sku, name, color, color_hex, color_family, size, price, compare_at_price, inventory_quantity)
where p.legacy_id = 'epic-20'
on conflict do nothing;

-- ======== 08_newsletter.sql ========
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

-- ======== 09_hero_mobile.sql ========
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

commit;
