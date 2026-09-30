alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cooperatives enable row level security;
alter table public.collection_requests enable row level security;
alter table public.point_transactions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- plans: publicly readable (anon + authenticated), admin manages
create policy "plans_select_all"
  on public.plans for select
  to anon, authenticated
  using (true);

create policy "plans_modify_admin"
  on public.plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- subscriptions
create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (profile_id = auth.uid());

create policy "subscriptions_update_own_or_admin"
  on public.subscriptions for update
  using (profile_id = auth.uid() or public.is_admin());

-- cooperatives: visible to all authenticated users (to choose during collection request)
create policy "cooperatives_select_authenticated"
  on public.cooperatives for select
  to authenticated
  using (true);

create policy "cooperatives_modify_own_or_admin"
  on public.cooperatives for all
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- collection_requests
create policy "collection_requests_select"
  on public.collection_requests for select
  using (
    requester_id = auth.uid()
    or public.is_admin()
    or cooperative_id in (select id from public.cooperatives where profile_id = auth.uid())
  );

create policy "collection_requests_insert"
  on public.collection_requests for insert
  with check (requester_id = auth.uid());

create policy "collection_requests_update"
  on public.collection_requests for update
  using (
    requester_id = auth.uid()
    or public.is_admin()
    or cooperative_id in (select id from public.cooperatives where profile_id = auth.uid())
  );

-- point_transactions: read-only for owners, writes via security-definer trigger only
create policy "point_transactions_select_own_or_admin"
  on public.point_transactions for select
  using (profile_id = auth.uid() or public.is_admin());

-- products
create policy "products_select_active_or_own_or_admin"
  on public.products for select
  using (status = 'active' or partner_id = auth.uid() or public.is_admin());

create policy "products_modify_own_or_admin"
  on public.products for all
  using (partner_id = auth.uid() or public.is_admin())
  with check (partner_id = auth.uid() or public.is_admin());

-- orders
create policy "orders_select_own_or_admin"
  on public.orders for select
  using (buyer_id = auth.uid() or public.is_admin());

create policy "orders_insert_own"
  on public.orders for insert
  with check (buyer_id = auth.uid());

create policy "orders_update_admin"
  on public.orders for update
  using (public.is_admin());

-- order_items
create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (
    public.is_admin()
    or order_id in (select id from public.orders where buyer_id = auth.uid())
  );

create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    order_id in (select id from public.orders where buyer_id = auth.uid())
  );

-- audit_logs: admin only
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (public.is_admin());
