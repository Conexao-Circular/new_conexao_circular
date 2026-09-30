-- Curadoria de parceiros (Sprint 2): business-profile intake for producers,
-- separate from the account-access gate on profiles.approval_status. A
-- produtor can already use the app once their account is approved; this
-- governs whether their store/products are considered vetted.
--
-- Reuses public.profile_approval_status (pending/approved/rejected) instead
-- of a new enum since the values are identical.

create table public.producer_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  cnpj text not null,
  razao_social text not null,
  responsavel_nome text not null,
  responsavel_telefone text,
  contato_email text,
  sustainability_description text not null,
  material_origin text not null,
  operation_description text not null,
  status public.profile_approval_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index producer_applications_status_idx on public.producer_applications (status);

create table public.producer_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.producer_applications(id) on delete cascade,
  document_type text not null check (document_type in ('certificacao', 'licenca', 'foto_operacao', 'outro')),
  file_path text not null,
  label text,
  created_at timestamptz not null default now()
);

create index producer_application_documents_application_id_idx on public.producer_application_documents (application_id);

create trigger set_updated_at_producer_applications
  before update on public.producer_applications
  for each row execute function public.set_updated_at();

-- Same pattern as products_protect_approved: a non-admin can never set
-- status to 'approved' themselves. They CAN move it back to 'pending' (a
-- resubmission after edits/rejection), which auto-clears the prior review —
-- but only an admin's update can set 'approved' or leave a rejection_reason.
create or replace function public.producer_applications_protect_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status = 'approved' then
      new.status = old.status;
    end if;

    if new.status <> old.status then
      new.reviewed_by = null;
      new.reviewed_at = null;
      new.rejection_reason = null;
    else
      new.reviewed_by = old.reviewed_by;
      new.reviewed_at = old.reviewed_at;
      new.rejection_reason = old.rejection_reason;
    end if;
  end if;
  return new;
end;
$$;

create trigger producer_applications_protect_review
  before update on public.producer_applications
  for each row execute function public.producer_applications_protect_review();

alter table public.producer_applications enable row level security;
alter table public.producer_application_documents enable row level security;

create policy "producer_applications_select_own_or_admin"
  on public.producer_applications for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "producer_applications_insert_own"
  on public.producer_applications for insert
  with check (profile_id = auth.uid());

create policy "producer_applications_update_own_or_admin"
  on public.producer_applications for update
  using (profile_id = auth.uid() or public.is_admin());

create policy "producer_application_documents_select_own_or_admin"
  on public.producer_application_documents for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.producer_applications pa
      where pa.id = application_id and pa.profile_id = auth.uid()
    )
  );

create policy "producer_application_documents_insert_own"
  on public.producer_application_documents for insert
  with check (
    exists (
      select 1 from public.producer_applications pa
      where pa.id = application_id and pa.profile_id = auth.uid()
    )
  );

create policy "producer_application_documents_delete_own"
  on public.producer_application_documents for delete
  using (
    exists (
      select 1 from public.producer_applications pa
      where pa.id = application_id and pa.profile_id = auth.uid()
    )
  );

-- Private bucket: {profile_id}/{filename}, same shape as collection-proofs.
insert into storage.buckets (id, name, public) values ('producer-documents', 'producer-documents', false);

create policy "producer_documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'producer-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "producer_documents_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'producer-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "producer_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'producer-documents' and (storage.foldername(name))[1] = auth.uid()::text);
