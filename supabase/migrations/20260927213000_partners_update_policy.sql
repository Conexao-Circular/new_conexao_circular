-- Keep a single UPDATE policy so Postgres evaluates one permissive branch per
-- row while retaining both administrator and record-owner access.
drop policy if exists partners_update_admin on public.partners;
drop policy if exists partners_update_owner on public.partners;

create policy partners_update_admin_or_owner
  on public.partners
  for update
  using (
    (select public.is_admin())
    or owner_profile_id = (select auth.uid())
  )
  with check (
    (select public.is_admin())
    or owner_profile_id = (select auth.uid())
  );
