-- Separate migration: references the 'collected' enum value added in the
-- previous file (must be a committed transaction before it can be used).
-- Return type's column list changed (collected_at inserted), so this must
-- be a drop + create rather than create or replace.

drop function if exists public.get_partner_shipments();

create function public.get_partner_shipments()
returns table(
  shipment_id uuid,
  order_id uuid,
  status public.shipment_status,
  carrier text,
  tracking_code text,
  collected_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz,
  buyer_name text,
  delivery_address jsonb,
  items jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.order_id,
    s.status,
    s.carrier,
    s.tracking_code,
    s.collected_at,
    s.shipped_at,
    s.delivered_at,
    o.created_at,
    coalesce(bp.name, 'Cliente'),
    o.delivery_address,
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', p.name,
        'quantity', oi.quantity,
        'image_url', p.image_url,
        'unit_price_cents', oi.unit_price_cents
      )), '[]'::jsonb)
      from order_items oi
      join products p on p.id = oi.product_id
      where oi.order_id = o.id and p.partner_id = auth.uid()
    )
  from order_shipments s
  join orders o on o.id = s.order_id
  join profiles bp on bp.id = o.buyer_id
  where s.partner_id = auth.uid()
  order by
    case s.status
      when 'preparing' then 0
      when 'collected' then 1
      when 'shipped' then 2
      else 3
    end,
    o.created_at desc;
$$;

revoke execute on function public.get_partner_shipments() from public, anon;
grant execute on function public.get_partner_shipments() to authenticated;
