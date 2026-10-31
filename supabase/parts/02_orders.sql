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
