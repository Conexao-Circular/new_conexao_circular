-- Atomic reorder of a product's photo gallery: rewrites sort_order to match
-- the given id order and recomputes the cover (products.image_url) from the
-- first id, instead of doing N separate client-side updates.

create or replace function public.reorder_product_images(
  p_product_id uuid,
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_cover text;
  v_id uuid;
  v_index integer := 0;
begin
  select partner_id into v_owner from products where id = p_product_id;

  if v_owner is null then
    raise exception 'product_not_found';
  end if;
  if v_owner <> auth.uid() and not is_admin() then
    raise exception 'forbidden';
  end if;

  foreach v_id in array p_ordered_ids loop
    update product_images
      set sort_order = v_index
    where id = v_id and product_id = p_product_id;
    v_index := v_index + 1;
  end loop;

  select url into v_cover
  from product_images
  where product_id = p_product_id
  order by sort_order asc
  limit 1;

  update products set image_url = v_cover where id = p_product_id;
end;
$$;

revoke execute on function public.reorder_product_images(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_product_images(uuid, uuid[]) to authenticated;
