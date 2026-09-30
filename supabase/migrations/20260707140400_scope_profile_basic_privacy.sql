-- Privacy: only return name+phone to callers with a legitimate relationship
-- (admin, self, or a cooperative<->requester link via a collection_request).
create or replace function public.get_profile_basic(p_id uuid)
returns table(id uuid, name text, phone text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.phone
  from public.profiles p
  where p.id = p_id and (
    public.is_admin()
    or p.id = auth.uid()
    or exists (
      select 1 from public.collection_requests cr
      join public.cooperatives c on c.id = cr.cooperative_id
      where cr.requester_id = p.id and c.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.collection_requests cr
      join public.cooperatives c on c.id = cr.cooperative_id
      where cr.requester_id = auth.uid() and c.profile_id = p.id
    )
  );
$$;

create or replace function public.get_profiles_basic(p_ids uuid[])
returns table(id uuid, name text, phone text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.phone
  from public.profiles p
  where p.id = any(p_ids) and (
    public.is_admin()
    or p.id = auth.uid()
    or exists (
      select 1 from public.collection_requests cr
      join public.cooperatives c on c.id = cr.cooperative_id
      where cr.requester_id = p.id and c.profile_id = auth.uid()
    )
    or exists (
      select 1 from public.collection_requests cr
      join public.cooperatives c on c.id = cr.cooperative_id
      where cr.requester_id = auth.uid() and c.profile_id = p.id
    )
  );
$$;
