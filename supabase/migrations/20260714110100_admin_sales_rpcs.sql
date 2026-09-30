-- Admin metrics RPCs: GMV (marketplace sales) is kept separate from MRR
-- (recurring subscription revenue) — they are different numbers and the UI
-- must label them distinctly.

create or replace function public.admin_sales_summary(p_days integer default 30)
returns table(
  gmv_cents bigint,
  orders_count bigint,
  avg_ticket_cents numeric,
  mrr_cents bigint,
  prev_gmv_cents bigint,
  prev_orders_count bigint
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
  with current_period as (
    select
      coalesce(sum(o.total_cents), 0)::bigint as gmv_cents,
      count(*)::bigint as orders_count
    from orders o
    where o.status = 'approved'
      and o.created_at >= current_date - (greatest(p_days, 1) - 1)
  ),
  previous_period as (
    select coalesce(sum(o.total_cents), 0)::bigint as gmv_cents, count(*)::bigint as orders_count
    from orders o
    where o.status = 'approved'
      and o.created_at >= current_date - (2 * greatest(p_days, 1) - 1)
      and o.created_at < current_date - (greatest(p_days, 1) - 1)
  ),
  mrr as (
    select coalesce(sum(pl.price_cents), 0)::bigint as mrr_cents
    from subscriptions s
    join plans pl on pl.id = s.plan_id
    where s.status = 'active'
  )
  select
    c.gmv_cents,
    c.orders_count,
    case when c.orders_count > 0 then round(c.gmv_cents::numeric / c.orders_count, 2) else 0 end,
    m.mrr_cents,
    p.gmv_cents,
    p.orders_count
  from current_period c, previous_period p, mrr m;
end;
$$;

revoke execute on function public.admin_sales_summary(integer) from public, anon;
grant execute on function public.admin_sales_summary(integer) to authenticated;

create or replace function public.admin_sales_daily(p_days integer default 30)
returns table(day date, gmv_cents bigint, orders_count bigint)
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
  with days as (
    select generate_series(
      current_date - (greatest(p_days, 1) - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  sales as (
    select o.created_at::date as day, sum(o.total_cents)::bigint as gmv_cents, count(*)::bigint as orders_count
    from orders o
    where o.status = 'approved'
      and o.created_at >= current_date - (greatest(p_days, 1) - 1)
    group by o.created_at::date
  )
  select d.day, coalesce(s.gmv_cents, 0), coalesce(s.orders_count, 0)
  from days d
  left join sales s on s.day = d.day
  order by d.day;
end;
$$;

revoke execute on function public.admin_sales_daily(integer) from public, anon;
grant execute on function public.admin_sales_daily(integer) to authenticated;

create or replace function public.admin_top_products(p_days integer default 30, p_limit integer default 10)
returns table(product_id uuid, name text, partner_name text, units_sold bigint, gmv_cents bigint)
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
    coalesce(prof.store_name, prof.name) as partner_name,
    coalesce(sum(oi.quantity), 0)::bigint as units_sold,
    coalesce(sum(oi.quantity * oi.unit_price_cents), 0)::bigint as gmv_cents
  from products p
  join profiles prof on prof.id = p.partner_id
  left join order_items oi on oi.product_id = p.id
  left join orders o
    on o.id = oi.order_id
    and o.status = 'approved'
    and o.created_at >= current_date - (greatest(p_days, 1) - 1)
  group by p.id, p.name, prof.store_name, prof.name
  order by gmv_cents desc, units_sold desc
  limit greatest(p_limit, 1);
end;
$$;

revoke execute on function public.admin_top_products(integer, integer) from public, anon;
grant execute on function public.admin_top_products(integer, integer) to authenticated;
