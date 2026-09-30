-- Performance + security hardening (advisor fixes)

-- 1. Covering indexes for foreign keys flagged by the performance advisor
create index if not exists idx_cart_items_product on public.cart_items(product_id);
create index if not exists idx_order_items_product on public.order_items(product_id);
create index if not exists idx_cooperatives_profile on public.cooperatives(profile_id);
create index if not exists idx_subscriptions_plan on public.subscriptions(plan_id);
create index if not exists idx_partner_items_partner on public.partner_items(partner_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);

-- 2. Trigger functions must not be callable through the PostgREST RPC surface.
--    (mirrors the existing restrict_function_execute_grants migration for the
--     trigger functions added later.)
revoke execute on function public.handle_order_change() from public, anon, authenticated;
revoke execute on function public.products_protect_approved() from public, anon, authenticated;

-- 3. Promote the free-text payment columns on orders to enums for integrity.
create type public.payment_method as enum ('pix', 'credit_card', 'boleto');
create type public.payment_status as enum ('pending', 'awaiting_payment', 'paid', 'failed', 'refunded');

alter table public.orders
  alter column payment_method drop default,
  alter column payment_method type public.payment_method using payment_method::public.payment_method,
  alter column payment_method set default 'pix';

alter table public.orders
  alter column payment_status drop default,
  alter column payment_status type public.payment_status using payment_status::public.payment_status,
  alter column payment_status set default 'pending';
