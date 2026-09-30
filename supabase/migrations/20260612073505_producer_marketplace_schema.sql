-- Store identity fields for producer profiles
alter table public.profiles
  add column store_name text,
  add column store_description text,
  add column store_image_url text;

-- Marketplace listing approval flag
alter table public.products
  add column approved boolean not null default false;

-- Backfill: existing seed products stay visible
update public.products set approved = true;

-- Public can only see active + approved listings; owner/admin see all
drop policy if exists products_select_active_or_own_or_admin on public.products;
create policy products_select_active_or_own_or_admin
  on public.products
  for select
  using (
    (status = 'active' and approved = true)
    or (partner_id = auth.uid())
    or is_admin()
  );

-- Only an admin may change the approval flag, even though owners can update their own products
create or replace function public.products_protect_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.approved is distinct from old.approved and not is_admin() then
    new.approved := old.approved;
  end if;
  return new;
end;
$$;

drop trigger if exists products_protect_approved on public.products;
create trigger products_protect_approved
  before update on public.products
  for each row
  execute function public.products_protect_approved();
