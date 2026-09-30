insert into storage.buckets (id, name, public)
values ('collection-proofs', 'collection-proofs', false);

create policy "collection_proofs_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'collection-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "collection_proofs_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'collection-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'collection-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "collection_proofs_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'collection-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (
      select 1
      from public.collection_requests cr
      join public.cooperatives c on c.id = cr.cooperative_id
      where cr.id::text = (storage.foldername(name))[2]
        and c.profile_id = auth.uid()
    )
  )
);
