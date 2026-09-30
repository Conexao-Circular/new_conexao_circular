-- Sprint 8 — medição de parceiro e impacto agregado por cooperativa.
--
-- Duas RPCs de leitura. Nenhuma concede selo nem grava nada: a decisão de
-- quando o tier passa a valer fica em src/lib/partner-tier.ts, e o critério só
-- destrava quando a rede tiver amostra (hoje são 3 produtores e 1 pedido).

-- ---------------------------------------------------------------------------
-- 1. Métricas por parceiro verificado.
--
-- Os três sinais do sprint, cada um de onde já é registrado:
--   * volume de vendas real  -> order_shipments entregues + receita dos itens
--   * nota média             -> order_reviews
--   * tempo ativo            -> producer_applications.reviewed_at
--
-- Admin-only. São números de desempenho de terceiros: o produtor vê os dele
-- pelo próprio painel (get_partner_sales_summary), não os do vizinho.
--
-- LIMITAÇÃO CONHECIDA: a avaliação é por pedido, não por parceiro. Um pedido
-- com itens de dois produtores conta a mesma nota para os dois. Enquanto o
-- carrinho misturar produtores, a nota mede a experiência do pedido — separar
-- exige avaliação por remessa, que não existe hoje.
-- ---------------------------------------------------------------------------
create or replace function public.get_partner_tier_metrics()
returns table(
  partner_id uuid,
  name text,
  store_name text,
  verified_at timestamptz,
  active_days integer,
  delivered_orders bigint,
  gmv_cents bigint,
  reviews_count bigint,
  avg_rating numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    p.id,
    p.name,
    p.store_name,
    a.reviewed_at,
    -- Cai para submitted_at quando a aprovação é anterior ao carimbo de
    -- revisão: sem isso o parceiro ficaria com tempo ativo nulo para sempre.
    greatest(0, extract(day from now() - coalesce(a.reviewed_at, a.submitted_at))::integer) as active_days,
    coalesce((
      select count(distinct s.order_id)
      from order_shipments s
      where s.partner_id = p.id and s.status = 'delivered'
    ), 0) as delivered_orders,
    coalesce((
      select sum(oi.unit_price_cents::bigint * oi.quantity)
      from order_items oi
      join products pr on pr.id = oi.product_id
      join orders o on o.id = oi.order_id
      where pr.partner_id = p.id and o.status = 'approved'
    ), 0) as gmv_cents,
    coalesce(r.reviews_count, 0) as reviews_count,
    r.avg_rating
  from profiles p
  join producer_applications a on a.profile_id = p.id and a.status = 'approved'
  left join lateral (
    select count(*)::bigint as reviews_count, round(avg(rev.rating), 2) as avg_rating
    from order_reviews rev
    where exists (
      select 1
      from order_items oi
      join products pr on pr.id = oi.product_id
      where oi.order_id = rev.order_id and pr.partner_id = p.id
    )
  ) r on true
  order by p.name;
end;
$$;

revoke execute on function public.get_partner_tier_metrics() from public, anon;
grant execute on function public.get_partner_tier_metrics() to authenticated;

-- Tamanho da rede, para a trava de ativação do tier. Os pedidos entregues são
-- contados uma vez cada, e não uma vez por parceiro na remessa — somar as
-- linhas da RPC acima contaria em dobro um pedido com dois produtores.
create or replace function public.get_partner_tier_network_sample()
returns table(
  verified_partners bigint,
  delivered_orders bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    (select count(*)::bigint from producer_applications where status = 'approved'),
    (select count(distinct s.order_id)::bigint from order_shipments s where s.status = 'delivered');
end;
$$;

revoke execute on function public.get_partner_tier_network_sample() from public, anon;
grant execute on function public.get_partner_tier_network_sample() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Impacto agregado de uma cooperativa.
--
-- Só o que a operação realmente registra: coleta confirmada, peso pesado na
-- confirmação, tipo de resíduo, quantos produtores diferentes atendeu e desde
-- quando. Nada de fator de conversão aqui — a estimativa de CO₂ é da aplicação
-- (src/lib/impact.ts), que a exibe rotulada como estimativa.
--
-- `unweighed_collections` existe para a tela não mentir por omissão: coleta
-- confirmada sem pesagem entra na contagem mas não no peso, e o consumidor
-- precisa saber que o kg exibido cobre só parte das coletas.
--
-- Security definer porque a RLS de collection_requests só deixa o solicitante,
-- a própria cooperativa e o admin lerem as linhas. Aqui não sai linha nenhuma:
-- só contagens e somas, sem identificar quem solicitou.
-- ---------------------------------------------------------------------------
create or replace function public.get_cooperative_impact(p_cooperative_id uuid)
returns table(
  confirmed_collections bigint,
  unweighed_collections bigint,
  total_kg numeric,
  organic_kg numeric,
  solid_kg numeric,
  mixed_kg numeric,
  producers_served bigint,
  first_collection_at timestamptz,
  last_collection_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint,
    count(*) filter (where c.confirmed_weight_kg is null)::bigint,
    coalesce(sum(c.confirmed_weight_kg), 0),
    coalesce(sum(c.confirmed_weight_kg) filter (where c.waste_type = 'organic'), 0),
    coalesce(sum(c.confirmed_weight_kg) filter (where c.waste_type = 'solid'), 0),
    coalesce(sum(c.confirmed_weight_kg) filter (where c.waste_type = 'both'), 0),
    count(distinct c.requester_id)::bigint,
    min(coalesce(c.confirmed_at, c.created_at)),
    max(coalesce(c.confirmed_at, c.created_at))
  from collection_requests c
  join cooperatives co on co.id = c.cooperative_id
  where c.cooperative_id = p_cooperative_id
    and c.status = 'confirmed'
    and co.status = 'active';
$$;

revoke execute on function public.get_cooperative_impact(uuid) from public;
grant execute on function public.get_cooperative_impact(uuid) to anon, authenticated;
