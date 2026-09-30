-- Sprint 7 — Clube de Benefícios.
--
-- Os níveis já existiam, mas só como enfeite: src/lib/gamification.ts calculava
-- o nome e a barra de progresso e nada mais acontecia. Esta migration dá
-- consequência a eles — desconto no pedido, frete por conta da plataforma e
-- acesso antecipado a parceiros novos.
--
-- Os três benefícios são decididos no banco, não no cliente: o desconto entra
-- dentro das RPCs que criam pedido (o navegador não escolhe quanto paga) e o
-- acesso antecipado entra na RLS (o parceiro escondido não volta nem por query
-- direta). O frete é o único que fica na aplicação, porque a cotação é uma
-- chamada HTTP externa — mas quem lê o nível lá é o servidor, não o formulário.
--
-- VALORES PROVISÓRIOS, como os de point_value(): escolhidos por julgamento, sem
-- margem observada para calibrar contra. Aqui o risco é maior que no sprint 6,
-- porque desconto e frete saem do caixa a cada pedido, não de um passivo futuro.
--
-- A duplicata em TypeScript vive em src/lib/gamification.ts. As duas mudam
-- juntas: o banco aplica, a UI promete.

-- ---------------------------------------------------------------------------
-- Níveis. Espelham LEVELS em src/lib/gamification.ts.
-- ---------------------------------------------------------------------------
create or replace function public.level_index(p_lifetime_points integer)
returns integer
language sql
immutable
as $$
  select case
    when coalesce(p_lifetime_points, 0) >= 20000 then 5  -- Guardião Circular
    when coalesce(p_lifetime_points, 0) >= 8000  then 4  -- Floresta
    when coalesce(p_lifetime_points, 0) >= 3000  then 3  -- Árvore
    when coalesce(p_lifetime_points, 0) >= 1000  then 2  -- Muda
    when coalesce(p_lifetime_points, 0) >= 300   then 1  -- Broto
    else 0                                              -- Semente
  end;
$$;

create or replace function public.level_discount_percent(p_level integer)
returns integer
language sql
immutable
as $$
  select case coalesce(p_level, 0)
    when 5 then 12
    when 4 then 10
    when 3 then 7
    when 2 then 5
    when 1 then 3
    else 0
  end;
$$;

-- Frete grátis e acesso antecipado começam no mesmo nível (Árvore). São duas
-- funções mesmo assim para poderem divergir na calibração sem virar um número
-- mágico repetido pelas policies.
create or replace function public.level_has_free_shipping(p_level integer)
returns boolean
language sql
immutable
as $$
  select coalesce(p_level, 0) >= 3;
$$;

create or replace function public.level_has_early_access(p_level integer)
returns boolean
language sql
immutable
as $$
  select coalesce(p_level, 0) >= 3;
$$;

-- Nível de quem está pedindo. Security definer pelo mesmo motivo de is_admin():
-- é usado dentro de policy e não pode depender da RLS de profiles.
create or replace function public.current_level_index()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select public.level_index(
    coalesce((select lifetime_points from public.profiles where id = auth.uid()), 0)
  );
$$;
revoke execute on function public.current_level_index() from public;
grant execute on function public.current_level_index() to anon, authenticated;

-- Desconto em centavos sobre o subtotal dos produtos.
--
-- Arredonda para baixo (o mesmo floor de levelDiscountCents no TypeScript) para
-- o valor exibido no checkout bater com o cobrado. O frete fica de fora de
-- propósito: tem benefício próprio e é repassado à transportadora.
create or replace function public.level_discount_cents(p_subtotal_cents integer, p_lifetime_points integer)
returns integer
language sql
immutable
as $$
  select greatest(
    floor(
      greatest(coalesce(p_subtotal_cents, 0), 0)
      * public.level_discount_percent(public.level_index(p_lifetime_points))
      / 100.0
    )::integer,
    0
  );
$$;

-- ---------------------------------------------------------------------------
-- Benefício 1: desconto no pedido.
--
-- Guardado em coluna própria para o pedido continuar explicando o próprio preço
-- depois — total_cents já entra líquido, então sem esta coluna não dá para
-- saber que houve desconto nem de quanto foi.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists level_discount_cents integer not null default 0;

-- Recria create_order_from_cart aplicando o desconto de nível antes do
-- cashback: o cashback abate o que sobrou, não o preço cheio.
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

-- "Comprar agora" é o outro caminho que cria pedido. Sem isto, o desconto
-- dependeria de o comprador ter passado pelo carrinho.
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
  v_subtotal integer;
  v_lifetime integer;
  v_level_discount integer;
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

  v_subtotal := p.price_cents * v_qty;
  select lifetime_points into v_lifetime from profiles where id = v_user;
  v_level_discount := level_discount_cents(v_subtotal, v_lifetime);

  insert into orders (
    buyer_id, status, total_cents, total_points, payment_method, delivery_address, level_discount_cents
  )
  values (
    v_user, 'pending', v_subtotal - v_level_discount, p.points_value * v_qty, v_method, p_delivery, v_level_discount
  )
  returning id into v_order_id;

  insert into order_items (order_id, product_id, quantity, unit_price_cents, points_value)
  values (v_order_id, p_product_id, v_qty, p.price_cents, p.points_value * v_qty);

  update products set stock = stock - v_qty where id = p_product_id;

  return v_order_id;
end;
$$;
revoke execute on function public.create_single_order(uuid, integer, jsonb, text) from public, anon;
grant execute on function public.create_single_order(uuid, integer, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Benefício 3: acesso antecipado a novos parceiros.
--
-- Uma data por parceiro em vez de "criado nos últimos N dias": o admin decide
-- quanto dura a exclusividade de cada estreia, e um parceiro antigo pode voltar
-- a ser exclusivo (relançamento) sem gambiarra em created_at.
--
-- early_access_min_level default 3 = Árvore, o mesmo de
-- level_has_early_access(). Fica como coluna para um parceiro poder ser mais
-- restrito que o padrão sem nova migration.
-- ---------------------------------------------------------------------------
alter table public.partners
  add column if not exists early_access_until timestamptz,
  add column if not exists early_access_min_level integer not null default 3;

comment on column public.partners.early_access_until is
  'Enquanto no futuro, só membros de nível >= early_access_min_level enxergam o parceiro. Null = visível para todos.';

create index if not exists idx_partners_early_access
  on public.partners (early_access_until)
  where early_access_until is not null;

-- A janela de exclusividade vale para o parceiro e para os benefícios dele: sem
-- a segunda policy, o item apareceria na lista de resgate do /pontos com o nome
-- do parceiro que deveria estar escondido.
drop policy if exists partners_select_active_or_admin on public.partners;
create policy "partners_select_visible_or_admin" on public.partners for select
  using (
    (select public.is_admin())
    or (
      status = 'active'
      and (
        early_access_until is null
        or early_access_until <= now()
        or (select public.current_level_index()) >= early_access_min_level
      )
    )
  );

drop policy if exists partner_items_select_active_or_admin on public.partner_items;
create policy "partner_items_select_visible_or_admin" on public.partner_items for select
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.partners p
      where p.id = partner_items.partner_id
        and p.status = 'active'
        and (
          p.early_access_until is null
          or p.early_access_until <= now()
          or (select public.current_level_index()) >= p.early_access_min_level
        )
    )
  );

-- redeem_partner_item resolve o item por conta própria (security definer), então
-- a policy acima não o alcança. Sem esta checagem, quem descobrisse o id de um
-- item em exclusividade resgataria o benefício antes da hora.
create or replace function public.redeem_partner_item(p_item_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer;
  v_balance integer;
  v_code text;
  v_early_until timestamptz;
  v_min_level integer;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;

  select pi.points_cost, p.early_access_until, p.early_access_min_level
    into v_cost, v_early_until, v_min_level
  from partner_items pi
  join partners p on p.id = pi.partner_id
  where pi.id = p_item_id and p.status = 'active';

  if v_cost is null then raise exception 'item_unavailable'; end if;
  if v_cost <= 0 then raise exception 'not_redeemable'; end if;

  if v_early_until is not null
     and v_early_until > now()
     and level_index(coalesce((select lifetime_points from profiles where id = v_user), 0)) < v_min_level
  then
    raise exception 'item_unavailable';
  end if;

  select points_balance into v_balance from profiles where id = v_user for update;
  if v_balance < v_cost then raise exception 'insufficient_points'; end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into redemptions (profile_id, partner_item_id, points_spent, code)
    values (v_user, p_item_id, v_cost, v_code);
  insert into point_transactions (profile_id, source_type, source_id, points, description)
    values (v_user, 'redemption', p_item_id, -v_cost, 'Resgate de benefício');
  update profiles set points_balance = points_balance - v_cost where id = v_user;
  perform award_achievement(v_user, 'first_redeem');
  return v_code;
end;
$$;
revoke execute on function public.redeem_partner_item(uuid) from public, anon;
grant execute on function public.redeem_partner_item(uuid) to authenticated;
