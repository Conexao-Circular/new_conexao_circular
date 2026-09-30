-- Post-purchase review: one review per order, released to the buyer only
-- once every shipment in the order has been delivered.

create table public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_order_reviews_buyer on public.order_reviews(buyer_id);

alter table public.order_reviews enable row level security;

create policy "order_reviews_select_own" on public.order_reviews for select
  using (buyer_id = (select auth.uid()) or (select public.is_admin()));

-- Only insertable once every shipment for the order is delivered — this is
-- the DB-level gate behind "avaliação liberada só após confirmação de
-- entrega" (the UI also hides the form until then, but RLS is the real lock).
-- Every subquery below qualifies order_reviews.order_id explicitly: order_shipments
-- also has an order_id column, so a bare reference inside those subqueries would
-- bind to the inner order_shipments.order_id instead of the row being inserted,
-- silently turning the delivery gate into a no-op.
create policy "order_reviews_insert_after_delivery" on public.order_reviews for insert
  with check (
    buyer_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_reviews.order_id and o.buyer_id = (select auth.uid())
    )
    and exists (select 1 from public.order_shipments s where s.order_id = order_reviews.order_id)
    and not exists (
      select 1 from public.order_shipments s
      where s.order_id = order_reviews.order_id and s.status <> 'delivered'
    )
  );

create policy "order_reviews_update_own" on public.order_reviews for update
  using (buyer_id = (select auth.uid()))
  with check (buyer_id = (select auth.uid()));

create trigger set_updated_at_order_reviews
  before update on public.order_reviews
  for each row execute function public.set_updated_at();

-- Review photos: private bucket, one folder per buyer, mirrors
-- collection-proofs' access pattern.
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', false);

create policy "review_photos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "review_photos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'review-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "review_photos_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'review-photos'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
