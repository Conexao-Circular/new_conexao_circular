-- Sprint 6 — fundação da pontuação.
--
-- O histórico (point_transactions), o saldo (profiles.points_balance) e a
-- expiração (expire_points + cron diário) já existiam. Esta migration adiciona
-- só o que faltava: as três ações geradoras do sprint, um teto para o passivo
-- que o parceiro pode criar, e a correção de duas regressões.

-- ---------------------------------------------------------------------------
-- Valores. Espelham src/lib/points.ts — as duas cópias mudam juntas.
--
-- PROVISÓRIOS: escolhidos por julgamento, não calibrados. Não há custo nem
-- margem no banco para calibrar contra. Refazer antes de abrir o resgate.
-- ---------------------------------------------------------------------------
create or replace function public.point_value(p_action text)
returns integer
language sql
immutable
as $$
  select case p_action
    when 'signup_complete' then 50
    when 'first_purchase'  then 100
    when 'order_review'    then 25
    else 0
  end;
$$;

-- ---------------------------------------------------------------------------
-- Idempotência: a garantia de "uma vez só" fica no banco, não na aplicação.
-- Uma trigger pode disparar de novo por um caminho que ninguém previu; um
-- índice único não deixa conceder duas vezes de jeito nenhum.
-- ---------------------------------------------------------------------------
create unique index if not exists point_transactions_once_per_profile
  on public.point_transactions (profile_id, source_type)
  where source_type in ('signup_complete', 'first_purchase');

create unique index if not exists point_transactions_review_once_per_order
  on public.point_transactions (profile_id, source_id)
  where source_type = 'order_review';

-- ---------------------------------------------------------------------------
-- Concessão. Devolve quantos pontos realmente entraram: 0 quando já tinha sido
-- concedido antes. Mantém saldo e lifetime_points em sincronia com o histórico
-- — os três num lugar só, para não divergirem como já divergiram.
--
-- Expiração de 12 meses, o mesmo prazo que a coleta já usa.
-- ---------------------------------------------------------------------------
create or replace function public.award_points(
  p_profile uuid,
  p_source public.point_source_type,
  p_source_id uuid,
  p_points integer,
  p_description text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  if p_points is null or p_points <= 0 then
    return 0;
  end if;

  insert into point_transactions (profile_id, source_type, source_id, points, description, expires_at)
  values (p_profile, p_source, p_source_id, p_points, p_description, now() + interval '12 months')
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    return 0;
  end if;

  update profiles
     set points_balance = points_balance + p_points,
         lifetime_points = lifetime_points + p_points
   where id = p_profile;

  return p_points;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ação 1: cadastro completo. Telefone e CEP são opcionais no cadastro — o
-- ponto premia quem volta e preenche.
--
-- A trigger é `update of phone, postal_code` de propósito: award_points escreve
-- em profiles (saldo), e sem essa restrição de colunas a escrita re-dispararia
-- a própria trigger.
-- ---------------------------------------------------------------------------
create or replace function public.handle_profile_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.phone, '') <> '' and coalesce(new.postal_code, '') <> '' then
    perform award_points(
      new.id, 'signup_complete', new.id,
      point_value('signup_complete'), 'Cadastro completo'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_award_signup_complete on public.profiles;
create trigger profiles_award_signup_complete
  after insert or update of phone, postal_code on public.profiles
  for each row execute function public.handle_profile_completion();

-- ---------------------------------------------------------------------------
-- Ação 2: primeira compra — bônus somado aos pontos dos produtos.
--
-- Redefine handle_order_change, restaurando duas coisas que a migration
-- 20260714210100 (frete) apagou sem querer, ao recriar a função a partir de uma
-- cópia anterior às migrations de expiração e gamificação:
--   * expires_at de 12 meses nos pontos de compra, que 20260707140300 tinha
--     definido — sem ele os pontos de compra nunca expiravam;
--   * lifetime_points, que 20260708180000 tinha adicionado — sem ele o nível
--     do usuário nunca subia com compras (só com coleta).
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
    v_cashback := round(
      (new.total_cents - coalesce(new.freight_cents, 0) - coalesce(new.cashback_used_cents, 0)) * 0.03
    );
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

-- ---------------------------------------------------------------------------
-- Ação 3: avaliação de pedido. A RLS de order_reviews já garante uma avaliação
-- por pedido e só após a entrega; aqui é uma vez por pedido, via source_id.
-- ---------------------------------------------------------------------------
create or replace function public.handle_order_review_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform award_points(
    new.buyer_id, 'order_review', new.order_id,
    point_value('order_review'), 'Avaliação de pedido'
  );
  return new;
end;
$$;

drop trigger if exists order_reviews_award_points on public.order_reviews;
create trigger order_reviews_award_points
  after insert on public.order_reviews
  for each row execute function public.handle_order_review_points();

-- ---------------------------------------------------------------------------
-- Teto de pontos por produto.
--
-- O produtor define points_value livremente, e quem paga o resgate é a
-- plataforma: sem teto, o parceiro decide sozinho o tamanho do passivo. 1 ponto
-- por real é conservador — a maior razão entre os 14 produtos atuais é 0,71.
-- O mesmo limite é validado no servidor (src/lib/points.ts) para o produtor
-- receber uma mensagem em vez de um erro de banco.
-- ---------------------------------------------------------------------------
alter table public.products
  drop constraint if exists products_points_value_within_cap;

alter table public.products
  add constraint products_points_value_within_cap
  check (points_value <= floor(price_cents / 100.0));

-- ---------------------------------------------------------------------------
-- Correção do histórico: lifetime_points foi zerado para quem comprou enquanto
-- a regressão estava no ar. Recalcula a partir do histórico, que é a fonte de
-- verdade — soma de tudo que foi concedido, sem descontar gasto nem estorno.
-- ---------------------------------------------------------------------------
update public.profiles p
   set lifetime_points = coalesce((
     select sum(pt.points)
       from public.point_transactions pt
      where pt.profile_id = p.id
        and pt.points > 0
        and pt.source_type <> 'redemption'
   ), 0)
 where lifetime_points < coalesce((
     select sum(pt.points)
       from public.point_transactions pt
      where pt.profile_id = p.id
        and pt.points > 0
        and pt.source_type <> 'redemption'
   ), 0);
