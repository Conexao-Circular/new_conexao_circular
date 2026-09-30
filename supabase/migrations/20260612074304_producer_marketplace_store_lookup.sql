-- Limited, public-safe lookup of producer "store" identity for the Marketplace,
-- restricted to producers that currently have at least one published listing.
create or replace function public.get_producer_stores()
returns table (
  id uuid,
  name text,
  store_name text,
  store_description text,
  store_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.store_name, p.store_description, p.store_image_url
  from public.profiles p
  where p.role = 'produtor'
    and exists (
      select 1 from public.products pr
      where pr.partner_id = p.id and pr.status = 'active' and pr.approved = true
    )
  order by p.name;
$$;

create or replace function public.get_producer_store(p_id uuid)
returns table (
  id uuid,
  name text,
  store_name text,
  store_description text,
  store_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.store_name, p.store_description, p.store_image_url
  from public.profiles p
  where p.id = p_id and p.role = 'produtor'
    and exists (
      select 1 from public.products pr
      where pr.partner_id = p.id and pr.status = 'active' and pr.approved = true
    );
$$;
