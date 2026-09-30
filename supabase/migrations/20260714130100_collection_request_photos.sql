-- Gallery of up to a few photos the requester submits with the pickup
-- request (separate from `proof_image_url`, which is the cooperative's own
-- confirmation photo). Reuses the existing `collection-proofs` bucket and
-- its storage policies unchanged — they already scope by
-- `{requesterId}/{requestId}/...`, which this table's `url` values follow.

create table public.collection_request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.collection_requests(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_collection_request_photos_request on public.collection_request_photos(request_id);

alter table public.collection_request_photos enable row level security;

create policy "collection_request_photos_select" on public.collection_request_photos for select
  using (
    exists (
      select 1
      from public.collection_requests cr
      left join public.cooperatives c on c.id = cr.cooperative_id
      where cr.id = request_id
        and (
          cr.requester_id = (select auth.uid())
          or c.profile_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

create policy "collection_request_photos_insert_own" on public.collection_request_photos for insert
  with check (
    exists (
      select 1 from public.collection_requests cr
      where cr.id = request_id and cr.requester_id = (select auth.uid())
    )
  );
