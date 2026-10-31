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
