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
