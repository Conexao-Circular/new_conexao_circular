-- Partner (produtor) sales dashboard RPCs. All use auth.uid() internally
-- instead of taking a partner id argument, and there is no RLS opening
-- orders/order_items to non-owners — this is the only way a partner can see
-- their own sales data.

create or replace function public.get_partner_sales_daily(p_days integer default 30)
returns table(day date, gmv_cents bigint, orders_count bigint, units_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(
      current_date - (greatest(p_days, 1) - 1),
      current_date,
      interval '1 day'
    )::date as day
  ),
  sales as (
    select
      o.created_at::date as day,
      sum(oi.quantity * oi.unit_price_cents) as gmv_cents,
      count(distinct o.id) as orders_count,
      sum(oi.quantity) as units_count
    from order_items oi
    join orders o on o.id = oi.order_id
    join products p on p.id = oi.product_id
    where p.partner_id = auth.uid()
      and o.status = 'approved'
      and o.created_at >= current_date - (greatest(p_days, 1) - 1)
    group by o.created_at::date
  )
  select
    d.day,
    coalesce(s.gmv_cents, 0)::bigint,
    coalesce(s.orders_count, 0)::bigint,
    coalesce(s.units_count, 0)::bigint
  from days d
  left join sales s on s.day = d.day
  order by d.day;
$$;

revoke execute on function public.get_partner_sales_daily(integer) from public, anon;
grant execute on function public.get_partner_sales_daily(integer) to authenticated;

create or replace function public.get_partner_sales_summary(p_days integer default 30)
returns table(
  gmv_cents bigint,
  orders_count bigint,
  units_count bigint,
  avg_ticket_cents numeric,
  prev_gmv_cents bigint,
  prev_orders_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with current_period as (
    select
      coalesce(sum(oi.quantity * oi.unit_price_cents), 0)::bigint as gmv_cents,
      count(distinct o.id)::bigint as orders_count,
      coalesce(sum(oi.quantity), 0)::bigint as units_count
    from order_items oi
    join orders o on o.id = oi.order_id
    join products p on p.id = oi.product_id
    where p.partner_id = auth.uid()
      and o.status = 'approved'
      and o.created_at >= current_date - (greatest(p_days, 1) - 1)
  ),
  previous_period as (
    select
      coalesce(sum(oi.quantity * oi.unit_price_cents), 0)::bigint as gmv_cents,
      count(distinct o.id)::bigint as orders_count
    from order_items oi
    join orders o on o.id = oi.order_id
    join products p on p.id = oi.product_id
    where p.partner_id = auth.uid()
      and o.status = 'approved'
      and o.created_at >= current_date - (2 * greatest(p_days, 1) - 1)
      and o.created_at < current_date - (greatest(p_days, 1) - 1)
  )
  select
    c.gmv_cents,
    c.orders_count,
    c.units_count,
    case when c.orders_count > 0 then round(c.gmv_cents::numeric / c.orders_count, 2) else 0 end,
    p.gmv_cents,
    p.orders_count
  from current_period c, previous_period p;
$$;

revoke execute on function public.get_partner_sales_summary(integer) from public, anon;
grant execute on function public.get_partner_sales_summary(integer) to authenticated;

create or replace function public.get_partner_top_products(p_days integer default 30, p_limit integer default 5)
returns table(
  product_id uuid,
  name text,
  image_url text,
  units_sold bigint,
  gmv_cents bigint,
  view_count integer,
  conversion_rate numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.image_url,
    coalesce(sum(oi.quantity), 0)::bigint,
    coalesce(sum(oi.quantity * oi.unit_price_cents), 0)::bigint,
    p.view_count,
    case when p.view_count > 0 then round(coalesce(sum(oi.quantity), 0)::numeric / p.view_count, 4) else 0 end
  from products p
  left join order_items oi on oi.product_id = p.id
  left join orders o
    on o.id = oi.order_id
    and o.status = 'approved'
    and o.created_at >= current_date - (greatest(p_days, 1) - 1)
  where p.partner_id = auth.uid()
  group by p.id, p.name, p.image_url, p.view_count
  order by 5 desc, 4 desc
  limit greatest(p_limit, 1);
$$;

revoke execute on function public.get_partner_top_products(integer, integer) from public, anon;
grant execute on function public.get_partner_top_products(integer, integer) to authenticated;
