-- Product view counter: cheap proprietary signal (feeds the partner sales
-- dashboard's conversion rate later) without standing up a full events table.

alter table public.products
  add column if not exists view_count integer not null default 0,
  add column if not exists last_viewed_at timestamptz;

create or replace function public.increment_product_view(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update products
    set view_count = view_count + 1,
        last_viewed_at = now()
  where id = p_product_id
    and status = 'active'
    and approved = true;
end;
$$;

revoke execute on function public.increment_product_view(uuid) from public, anon;
grant execute on function public.increment_product_view(uuid) to authenticated;
