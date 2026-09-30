-- Optimize RLS policies flagged by the "auth_rls_initplan" advisor:
-- wrap auth.uid() and is_admin() in a scalar subquery so Postgres evaluates
-- them once per statement instead of once per row. Semantics are unchanged.

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = (select auth.uid()) or (select public.is_admin()));

-- subscriptions
drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (profile_id = (select auth.uid()));

drop policy if exists "subscriptions_update_own_or_admin" on public.subscriptions;
create policy "subscriptions_update_own_or_admin"
  on public.subscriptions for update
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- cooperatives
drop policy if exists "cooperatives_modify_own_or_admin" on public.cooperatives;
create policy "cooperatives_modify_own_or_admin"
  on public.cooperatives for all
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

-- collection_requests
drop policy if exists "collection_requests_select" on public.collection_requests;
create policy "collection_requests_select"
  on public.collection_requests for select
  using (
    requester_id = (select auth.uid())
    or (select public.is_admin())
    or cooperative_id in (select id from public.cooperatives where profile_id = (select auth.uid()))
  );

drop policy if exists "collection_requests_insert" on public.collection_requests;
create policy "collection_requests_insert"
  on public.collection_requests for insert
  with check (requester_id = (select auth.uid()));

drop policy if exists "collection_requests_update" on public.collection_requests;
create policy "collection_requests_update"
  on public.collection_requests for update
  using (
    requester_id = (select auth.uid())
    or (select public.is_admin())
    or cooperative_id in (select id from public.cooperatives where profile_id = (select auth.uid()))
  );

-- point_transactions
drop policy if exists "point_transactions_select_own_or_admin" on public.point_transactions;
create policy "point_transactions_select_own_or_admin"
  on public.point_transactions for select
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- products
drop policy if exists "products_select_active_or_own_or_admin" on public.products;
create policy "products_select_active_or_own_or_admin"
  on public.products for select
  using (
    (status = 'active' and approved = true)
    or partner_id = (select auth.uid())
    or (select public.is_admin())
  );

drop policy if exists "products_modify_own_or_admin" on public.products;
create policy "products_modify_own_or_admin"
  on public.products for all
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));

-- orders
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
  on public.orders for select
  using (buyer_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (buyer_id = (select auth.uid()));

-- order_items
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (
    (select public.is_admin())
    or order_id in (select id from public.orders where buyer_id = (select auth.uid()))
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    order_id in (select id from public.orders where buyer_id = (select auth.uid()))
  );

-- cart_items
drop policy if exists "cart_items_user_own" on public.cart_items;
create policy "cart_items_user_own"
  on public.cart_items for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
