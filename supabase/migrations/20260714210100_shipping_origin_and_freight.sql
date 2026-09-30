-- Producer origin CEP (where the parcel ships from — needed to quote freight
-- and generate labels) and order-level freight. Cashback is recomputed to
-- credit only on the goods, never on the freight.

alter table public.profiles
  add column if not exists origin_zip text;

alter table public.orders
  add column if not exists freight_cents integer not null default 0;

alter table public.orders
  add constraint orders_freight_nonneg check (freight_cents >= 0);

-- Credit cashback on the goods only: total minus freight minus cashback used.
create or replace function public.handle_order_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_cashback integer;
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.buyer_id, 'create', 'orders', new.id, null, to_jsonb(new));
    return new;
  end if;
  if TG_OP = 'UPDATE' then
    v_cashback := round(
      (new.total_cents - coalesce(new.freight_cents, 0) - coalesce(new.cashback_used_cents, 0)) * 0.03
    );
    if v_cashback < 0 then v_cashback := 0; end if;
    if new.status = 'approved' and old.status <> 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, new.total_points, 'Pedido aprovado na loja');
      update profiles set points_balance = points_balance + new.total_points,
        cashback_cents = cashback_cents + v_cashback where id = new.buyer_id;
    elsif new.status = 'canceled' and old.status = 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, -new.total_points, 'Estorno de pedido cancelado');
      update profiles set points_balance = points_balance - new.total_points,
        cashback_cents = greatest(cashback_cents - v_cashback, 0) where id = new.buyer_id;
    end if;
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', 'orders', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_order_change() from public, anon, authenticated;

-- Returns the shipping inputs for the buyer's own order, so the app can quote
-- freight without exposing other users' origin CEPs via direct table reads.
create or replace function public.get_order_shipping_items(p_order_id uuid)
returns table(
  partner_id uuid,
  origin_zip text,
  weight_grams integer,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  quantity integer,
  unit_price_cents integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.partner_id,
    prof.origin_zip,
    p.weight_grams,
    p.length_cm,
    p.width_cm,
    p.height_cm,
    oi.quantity,
    oi.unit_price_cents
  from orders o
  join order_items oi on oi.order_id = o.id
  join products p on p.id = oi.product_id
  join profiles prof on prof.id = p.partner_id
  where o.id = p_order_id
    and o.buyer_id = auth.uid();
$$;

revoke execute on function public.get_order_shipping_items(uuid) from public, anon;
grant execute on function public.get_order_shipping_items(uuid) to authenticated;
