-- Asaas payment gateway fields. `orders.payment_intent_id` and the
-- `payment_status` enum (with 'awaiting_payment') already exist from the
-- gateway-ready groundwork; this only adds the hosted-checkout URL and a
-- cached Asaas customer id per buyer.

alter table public.orders
  add column if not exists payment_url text;

alter table public.profiles
  add column if not exists asaas_customer_id text;
