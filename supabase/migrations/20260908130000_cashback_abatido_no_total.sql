-- Correção: o cashback era debitado do saldo mas não abatia a cobrança.
--
-- create_order_from_cart descontava cashback_cents do perfil e guardava o valor
-- em orders.cashback_used_cents, mas gravava total_cents com o preço cheio. E
-- total_cents é exatamente o valor cobrado no gateway
-- (src/lib/payments.ts, createAsaasCharge). Resultado: o comprador perdia o
-- saldo e pagava o preço inteiro. O checkout ainda mostrava o total já
-- descontado, então a tela prometia um desconto que a cobrança não dava.
--
-- Está assim desde 20260707140200, que introduziu o cashback no checkout.
--
-- ATENÇÃO — pedidos já cobrados a mais não são corrigidos aqui: quanto
-- devolver, e como, é decisão de negócio, não de migration. Para levantar quem
-- foi afetado:
--
--   select o.id, o.order_code, o.buyer_id, o.created_at, o.cashback_used_cents
--     from public.orders o
--    where o.cashback_used_cents > 0
--      and o.created_at < '2026-09-08'
--    order by o.created_at;
--
-- O valor devido a cada comprador é o próprio cashback_used_cents.

-- ---------------------------------------------------------------------------
-- A cobrança passa a sair líquida.
--
-- Ordem dos abatimentos: desconto de nível sai do subtotal, cashback abate o
-- que sobrou. O frete é somado depois, pela aplicação, e nunca é abatido por
-- cashback — é repasse à transportadora.
-- ---------------------------------------------------------------------------
create or replace function public.create_order_from_cart(
  p_delivery jsonb,
  p_payment text default 'pix',
  p_use_cashback boolean default false
)
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
  v_lifetime integer;
  v_level_discount integer := 0;
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

  select lifetime_points into v_lifetime from profiles where id = v_user;
  v_level_discount := level_discount_cents(v_total_cents, v_lifetime);
  v_total_cents := v_total_cents - v_level_discount;

  if p_use_cashback then
    select cashback_cents into v_cashback from profiles where id = v_user for update;
    v_discount := least(coalesce(v_cashback, 0), v_total_cents);
    if v_discount > 0 then
      update profiles set cashback_cents = cashback_cents - v_discount where id = v_user;
      v_total_cents := v_total_cents - v_discount;
    end if;
  end if;

  insert into orders (
    buyer_id, status, total_cents, total_points, payment_method, delivery_address,
    cashback_used_cents, level_discount_cents
  )
  values (
    v_user, 'pending', v_total_cents, v_total_points, v_method, p_delivery,
    v_discount, v_level_discount
  )
  returning id into v_order_id;

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

-- ---------------------------------------------------------------------------
-- O crédito de cashback para de descontar cashback_used_cents.
--
-- A regra sempre foi "3% do que o comprador pagou em dinheiro". Com total_cents
-- líquido, isso é total_cents - freight, e subtrair cashback_used_cents de novo
-- seria descontar duas vezes.
--
-- A fórmula nova também é a correta para os pedidos antigos: eles foram
-- cobrados pelo valor cheio, então total_cents - freight é de fato o que aquele
-- comprador pagou. A fórmula antiga creditava a menos.
-- ---------------------------------------------------------------------------
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
    v_cashback := round((new.total_cents - coalesce(new.freight_cents, 0)) * 0.03);
    if v_cashback < 0 then v_cashback := 0; end if;

    if new.status = 'approved' and old.status <> 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description, expires_at)
      values (new.buyer_id, 'purchase', new.id, new.total_points, 'Pedido aprovado na loja',
              now() + interval '12 months');

      update profiles
         set points_balance = points_balance + new.total_points,
             lifetime_points = lifetime_points + new.total_points,
             cashback_cents = cashback_cents + v_cashback
       where id = new.buyer_id;

      -- Bônus de primeira compra. O índice único garante uma vez por conta,
      -- então não é preciso consultar o histórico de pedidos.
      perform award_points(
        new.buyer_id, 'first_purchase', new.id,
        point_value('first_purchase'), 'Bônus de primeira compra'
      );

    elsif new.status = 'canceled' and old.status = 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, -new.total_points, 'Estorno de pedido cancelado');

      update profiles
         set points_balance = points_balance - new.total_points,
             cashback_cents = greatest(cashback_cents - v_cashback, 0)
       where id = new.buyer_id;
      -- lifetime_points não é estornado de propósito: é métrica de nível
      -- acumulado, não saldo gastável.
    end if;

    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', 'orders', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;

  return new;
end;
$$;
revoke execute on function public.handle_order_change() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pedido que o cashback zerou não tem o que cobrar.
--
-- Antes isso não acontecia, porque a cobrança ia cheia de qualquer jeito. Agora
-- o total pode chegar a zero, e o gateway recusa cobrança de zero — o pedido
-- ficaria pendente para sempre, com o cashback já debitado.
--
-- Função dedicada em vez de simulate_order_payment: esta só aprova o que já
-- está pago por definição (total zerado), enquanto a outra aprova qualquer
-- pedido pendente do comprador.
-- ---------------------------------------------------------------------------
create or replace function public.settle_fully_discounted_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_buyer uuid;
  v_total integer;
begin
  select buyer_id, total_cents into v_buyer, v_total from orders where id = p_order_id;
  if v_buyer is null then raise exception 'order_not_found'; end if;
  if v_buyer <> v_user then raise exception 'forbidden'; end if;
  if v_total > 0 then raise exception 'order_not_fully_discounted'; end if;

  update orders
     set payment_status = 'paid', status = 'approved'
   where id = p_order_id and status = 'pending' and total_cents <= 0;
end;
$$;
revoke execute on function public.settle_fully_discounted_order(uuid) from public, anon;
grant execute on function public.settle_fully_discounted_order(uuid) to authenticated;
