-- Real "select automatically" implementation. Today the UI offers this
-- option but nothing ever assigns cooperative_id, so the request becomes
-- invisible to every cooperative (RLS scopes by cooperative_id). Ranks
-- active cooperatives by whether their type matches the request's waste
-- type, then by current pending load — falling back to any active
-- cooperative if none match by type, so a request is only ever left
-- unassigned when there are no active cooperatives at all.

create or replace function public.match_cooperative_for_request(p_waste_type public.waste_type)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select
      c.id,
      (
        select count(*) from collection_requests cr
        where cr.cooperative_id = c.id and cr.status = 'requested'
      ) as pending_count,
      case when c.type = 'both' or c.type::text = p_waste_type::text then 0 else 1 end as type_rank
    from cooperatives c
    where c.status = 'active'
  )
  select id from eligible order by type_rank asc, pending_count asc, id asc limit 1;
$$;

revoke execute on function public.match_cooperative_for_request(public.waste_type) from public, anon;
grant execute on function public.match_cooperative_for_request(public.waste_type) to authenticated;
