alter table public.orders add column if not exists cashback_used_cents integer not null default 0;

-- Credit cashback only on the portion actually paid (net of cashback used).
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
    v_cashback := round((new.total_cents - coalesce(new.cashback_used_cents, 0)) * 0.03);
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

-- Recreate create_order_from_cart with optional cashback usage.
drop function if exists public.create_order_from_cart(jsonb, text);
create or replace function public.create_order_from_cart(p_delivery jsonb, p_payment text default 'pix', p_use_cashback boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_total_cents integer := 0;
  v_total_points integer := 0;
  v_method payment_method := coalesce(nullif(p_payment, ''), 'pix')::payment_method;
  v_discount integer := 0;
  v_cashback integer;
  r record;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;
  if not exists (select 1 from subscriptions where profile_id = v_user and status = 'active') then
    raise exception 'no_active_subscription';
  end if;
  for r in
    select ci.product_id, ci.quantity, p.price_cents, p.points_value, p.stock, p.status, p.approved
    from cart_items ci join products p on p.id = ci.product_id
    where ci.user_id = v_user for update of p
  loop
    if r.status <> 'active' or not r.approved then raise exception 'product_unavailable'; end if;
    if r.stock < r.quantity then raise exception 'insufficient_stock'; end if;
    v_total_cents := v_total_cents + r.price_cents * r.quantity;
    v_total_points := v_total_points + r.points_value * r.quantity;
  end loop;
  if v_total_cents = 0 then raise exception 'empty_cart'; end if;

  if p_use_cashback then
    select cashback_cents into v_cashback from profiles where id = v_user for update;
    v_discount := least(coalesce(v_cashback, 0), v_total_cents);
    if v_discount > 0 then
      update profiles set cashback_cents = cashback_cents - v_discount where id = v_user;
    end if;
  end if;

  insert into orders (buyer_id, status, total_cents, total_points, payment_method, delivery_address, cashback_used_cents)
  values (v_user, 'pending', v_total_cents, v_total_points, v_method, p_delivery, v_discount) returning id into v_order_id;

  insert into order_items (order_id, product_id, quantity, unit_price_cents, points_value)
  select v_order_id, ci.product_id, ci.quantity, p.price_cents, p.points_value * ci.quantity
  from cart_items ci join products p on p.id = ci.product_id where ci.user_id = v_user;

  update products p set stock = p.stock - ci.quantity
  from cart_items ci where ci.product_id = p.id and ci.user_id = v_user;

  delete from cart_items where user_id = v_user;
  return v_order_id;
end;
$$;
revoke execute on function public.create_order_from_cart(jsonb, text, boolean) from public, anon;
grant execute on function public.create_order_from_cart(jsonb, text, boolean) to authenticated;
