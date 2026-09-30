-- Anonymous visitors can read active directory entries without evaluating the
-- administrator helper, which is intentionally unavailable to the anon role.
drop policy if exists partners_select_active_or_admin on public.partners;

create policy partners_select_active_anon
  on public.partners
  for select
  to anon
  using (status = 'active');

create policy partners_select_active_or_admin_authenticated
  on public.partners
  for select
  to authenticated
  using (
    status = 'active'
    or (select public.is_admin())
  );
