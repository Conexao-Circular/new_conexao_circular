-- Per-seller shipments. A single order can contain products from several
-- producers; each producer ships (and is tracked) independently. One
-- shipment row per (order, producer) is created automatically when the order
-- is approved.

create type public.shipment_status as enum ('preparing', 'shipped', 'delivered', 'canceled');

create table public.order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  partner_id uuid not null references public.profiles(id),
  status public.shipment_status not null default 'preparing',
  carrier text,
  tracking_code text,
  freight_cents integer not null default 0,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, partner_id)
);

create index idx_order_shipments_order on public.order_shipments(order_id);
create index idx_order_shipments_partner on public.order_shipments(partner_id);

alter table public.order_shipments enable row level security;

-- Buyer of the order, the assigned producer, or an admin can read.
create policy "order_shipments_select" on public.order_shipments for select
  using (
    partner_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = (select auth.uid())
    )
  );

-- Only the assigned producer (or admin) can update the shipment (mark shipped /
-- delivered, set carrier + tracking). Column-level intent is enforced in the
-- server action; RLS guarantees row ownership.
create policy "order_shipments_update_own" on public.order_shipments for update
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

create trigger set_updated_at_order_shipments
  before update on public.order_shipments
  for each row execute function public.set_updated_at();

-- Fan out an approved order into one shipment per distinct producer.
create or replace function public.create_order_shipments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    insert into order_shipments (order_id, partner_id)
    select distinct new.id, p.partner_id
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = new.id
    on conflict (order_id, partner_id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.create_order_shipments() from public, anon, authenticated;

create trigger on_order_approved_create_shipments
  after update on public.orders
  for each row execute function public.create_order_shipments();

-- Everything a producer needs to fulfill their shipments: shipment + order
-- context + buyer name + delivery address + their own items. SECURITY DEFINER
-- because order_items/orders RLS is buyer-scoped; this scopes to the caller's
-- own shipments (partner_id = auth.uid()).
create or replace function public.get_partner_shipments()
returns table(
  shipment_id uuid,
  order_id uuid,
  status public.shipment_status,
  carrier text,
  tracking_code text,
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
    case s.status when 'preparing' then 0 when 'shipped' then 1 else 2 end,
    o.created_at desc;
$$;

revoke execute on function public.get_partner_shipments() from public, anon;
grant execute on function public.get_partner_shipments() to authenticated;
