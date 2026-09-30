-- Public bucket for marketplace product photos and store banners
insert into storage.buckets (id, name, public)
values ('marketplace', 'marketplace', true)
on conflict (id) do nothing;

create policy marketplace_public_read
  on storage.objects
  for select
  using (bucket_id = 'marketplace');

create policy marketplace_owner_insert
  on storage.objects
  for insert
  with check (
    bucket_id = 'marketplace'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy marketplace_owner_update
  on storage.objects
  for update
  using (
    bucket_id = 'marketplace'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy marketplace_owner_delete
  on storage.objects
  for delete
  using (
    bucket_id = 'marketplace'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
