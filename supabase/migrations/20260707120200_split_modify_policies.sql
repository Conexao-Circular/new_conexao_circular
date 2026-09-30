-- Resolve "multiple_permissive_policies" advisor: the FOR ALL write policies
-- also registered as a second permissive SELECT policy alongside the dedicated
-- select policy. Split them into explicit INSERT/UPDATE/DELETE so SELECT is
-- served by a single policy. The select policies already cover owner/admin rows.

-- products
drop policy if exists "products_modify_own_or_admin" on public.products;
create policy "products_insert_own_or_admin" on public.products for insert
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));
create policy "products_update_own_or_admin" on public.products for update
  using (partner_id = (select auth.uid()) or (select public.is_admin()))
  with check (partner_id = (select auth.uid()) or (select public.is_admin()));
create policy "products_delete_own_or_admin" on public.products for delete
  using (partner_id = (select auth.uid()) or (select public.is_admin()));

-- cooperatives
drop policy if exists "cooperatives_modify_own_or_admin" on public.cooperatives;
create policy "cooperatives_insert_own_or_admin" on public.cooperatives for insert
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "cooperatives_update_own_or_admin" on public.cooperatives for update
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "cooperatives_delete_own_or_admin" on public.cooperatives for delete
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- partners (admin only)
drop policy if exists "partners_modify_admin" on public.partners;
create policy "partners_insert_admin" on public.partners for insert
  with check ((select public.is_admin()));
create policy "partners_update_admin" on public.partners for update
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "partners_delete_admin" on public.partners for delete
  using ((select public.is_admin()));

-- partner_items (admin only)
drop policy if exists "partner_items_modify_admin" on public.partner_items;
create policy "partner_items_insert_admin" on public.partner_items for insert
  with check ((select public.is_admin()));
create policy "partner_items_update_admin" on public.partner_items for update
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "partner_items_delete_admin" on public.partner_items for delete
  using ((select public.is_admin()));

-- plans (admin only)
drop policy if exists "plans_modify_admin" on public.plans;
create policy "plans_insert_admin" on public.plans for insert
  with check ((select public.is_admin()));
create policy "plans_update_admin" on public.plans for update
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "plans_delete_admin" on public.plans for delete
  using ((select public.is_admin()));
