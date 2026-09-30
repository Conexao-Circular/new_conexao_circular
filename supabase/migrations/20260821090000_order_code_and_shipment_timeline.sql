-- Sprint 4: "Compra e rastreio" — human-readable order code + 5-stage
-- shipment timeline (confirmado/preparando/coletado/em transporte/entregue).

-- Order code -----------------------------------------------------------

create sequence public.order_code_seq;

alter table public.orders add column order_code text;

create or replace function public.set_order_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_code is null then
    new.order_code := 'CC-' || lpad(nextval('public.order_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger set_order_code
  before insert on public.orders
  for each row execute function public.set_order_code();

-- Backfill any orders created before this migration.
update public.orders
set order_code = 'CC-' || lpad(nextval('public.order_code_seq')::text, 6, '0')
where order_code is null;

alter table public.orders alter column order_code set not null;
alter table public.orders add constraint orders_order_code_key unique (order_code);

revoke execute on function public.set_order_code() from public, anon, authenticated;

-- Shipment timeline ------------------------------------------------------
-- "confirmado" is implicit (orders.status = 'approved', which is when the
-- shipment row itself gets created — see create_order_shipments()).
-- "coletado" is a distinct manual step: the producer confirms hand-off to
-- the carrier before it's "em transporte" (still 'shipped' under the hood —
-- renamed at the UI layer, not worth a 6th enum value for the same meaning).

-- New enum value must be committed before it can be referenced by literal
-- (e.g. `when 'collected' then ...`) elsewhere — that follow-up lives in the
-- next migration file so it runs in its own transaction.
alter type public.shipment_status add value 'collected' after 'preparing';

alter table public.order_shipments add column collected_at timestamptz;
