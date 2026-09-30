-- Multiple product photos (gallery) + inventory (stock)

-- Gallery: many images per product. products.image_url stays as the cover.
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product on public.product_images(product_id);

alter table public.product_images enable row level security;

create policy "product_images_select" on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (
          (p.status = 'active' and p.approved = true)
          or p.partner_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

create policy "product_images_insert_own_or_admin" on public.product_images for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.partner_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "product_images_delete_own_or_admin" on public.product_images for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and (p.partner_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- Inventory
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add constraint products_stock_nonneg check (stock >= 0);

-- Backfill existing (seed/demo) products with a reasonable stock so they remain buyable.
update public.products set stock = 100 where stock = 0;
