-- Order RPCs (transactional stock + simulated payment) + cashback crediting

-- Batch version of get_profile_basic to avoid N+1 in the cooperative queue.
create or replace function public.get_profiles_basic(p_ids uuid[])
returns table(id uuid, name text, phone text)
language sql
stable
security definer
set search_path = public
as $$
  select id, name, phone from public.profiles where id = any(p_ids);
$$;

revoke execute on function public.get_profiles_basic(uuid[]) from public, anon;
grant execute on function public.get_profiles_basic(uuid[]) to authenticated;

-- Credit points AND cashback on order approval; reverse on cancel.
create or replace function public.handle_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cashback integer;
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.buyer_id, 'create', 'orders', new.id, null, to_jsonb(new));
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    v_cashback := round(new.total_cents * 0.03);

    if new.status = 'approved' and old.status <> 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, new.total_points, 'Pedido aprovado na loja');

      update profiles
        set points_balance = points_balance + new.total_points,
            cashback_cents = cashback_cents + v_cashback
      where id = new.buyer_id;
    elsif new.status = 'canceled' and old.status = 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, -new.total_points, 'Estorno de pedido cancelado');

      update profiles
        set points_balance = points_balance - new.total_points,
            cashback_cents = greatest(cashback_cents - v_cashback, 0)
      where id = new.buyer_id;
    end if;

    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', 'orders', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_order_change() from public, anon, authenticated;

-- Transactional order from cart: validates subscription + stock, inserts order
-- and items, decrements stock (row-locked), clears cart. Returns the order id.
create or replace function public.create_order_from_cart(p_delivery jsonb, p_payment text default 'pix')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_total_cents integer := 0;
  v_total_points integer := 0;
  v_method payment_method := coalesce(nullif(p_payment, ''), 'pix')::payment_method;
  r record;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;

  if not exists (select 1 from subscriptions where profile_id = v_user and status = 'active') then
    raise exception 'no_active_subscription';
  end if;

  for r in
    select ci.product_id, ci.quantity, p.price_cents, p.points_value, p.stock, p.status, p.approved
    from cart_items ci
    join products p on p.id = ci.product_id
    where ci.user_id = v_user
    for update of p
  loop
    if r.status <> 'active' or not r.approved then
      raise exception 'product_unavailable';
    end if;
    if r.stock < r.quantity then
      raise exception 'insufficient_stock';
    end if;
    v_total_cents := v_total_cents + r.price_cents * r.quantity;
    v_total_points := v_total_points + r.points_value * r.quantity;
  end loop;

  if v_total_cents = 0 then raise exception 'empty_cart'; end if;

  insert into orders (buyer_id, status, total_cents, total_points, payment_method, delivery_address)
  values (v_user, 'pending', v_total_cents, v_total_points, v_method, p_delivery)
  returning id into v_order_id;

  insert into order_items (order_id, product_id, quantity, unit_price_cents, points_value)
  select v_order_id, ci.product_id, ci.quantity, p.price_cents, p.points_value * ci.quantity
  from cart_items ci
  join products p on p.id = ci.product_id
  where ci.user_id = v_user;

  update products p
    set stock = p.stock - ci.quantity
  from cart_items ci
  where ci.product_id = p.id and ci.user_id = v_user;

  delete from cart_items where user_id = v_user;

  return v_order_id;
end;
$$;

revoke execute on function public.create_order_from_cart(jsonb, text) from public, anon;
grant execute on function public.create_order_from_cart(jsonb, text) to authenticated;

-- Transactional single-product order ("comprar agora").
create or replace function public.create_single_order(
  p_product_id uuid,
  p_quantity integer,
  p_delivery jsonb default null,
  p_payment text default 'pix'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_qty integer := greatest(least(coalesce(p_quantity, 1), 99), 1);
  v_method payment_method := coalesce(nullif(p_payment, ''), 'pix')::payment_method;
  p record;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;

  if not exists (select 1 from subscriptions where profile_id = v_user and status = 'active') then
    raise exception 'no_active_subscription';
  end if;

  select price_cents, points_value, stock, status, approved into p
  from products where id = p_product_id for update;

  if p is null or p.status <> 'active' or not p.approved then
    raise exception 'product_unavailable';
  end if;
  if p.stock < v_qty then raise exception 'insufficient_stock'; end if;

  insert into orders (buyer_id, status, total_cents, total_points, payment_method, delivery_address)
  values (v_user, 'pending', p.price_cents * v_qty, p.points_value * v_qty, v_method, p_delivery)
  returning id into v_order_id;

  insert into order_items (order_id, product_id, quantity, unit_price_cents, points_value)
  values (v_order_id, p_product_id, v_qty, p.price_cents, p.points_value * v_qty);

  update products set stock = stock - v_qty where id = p_product_id;

  return v_order_id;
end;
$$;

revoke execute on function public.create_single_order(uuid, integer, jsonb, text) from public, anon;
grant execute on function public.create_single_order(uuid, integer, jsonb, text) to authenticated;

-- Simulated instant payment: buyer marks their own pending order as paid+approved,
-- which fires handle_order_change (points + cashback). Bypasses admin-only RLS
-- safely inside a SECURITY DEFINER function that checks ownership.
create or replace function public.simulate_order_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_buyer uuid;
begin
  select buyer_id into v_buyer from orders where id = p_order_id;
  if v_buyer is null then raise exception 'order_not_found'; end if;
  if v_buyer <> v_user then raise exception 'forbidden'; end if;

  update orders
    set payment_status = 'paid', status = 'approved'
  where id = p_order_id and status = 'pending';
end;
$$;

revoke execute on function public.simulate_order_payment(uuid) from public, anon;
grant execute on function public.simulate_order_payment(uuid) to authenticated;
