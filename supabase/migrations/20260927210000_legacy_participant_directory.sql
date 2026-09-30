-- Import-ready partner directory with explicit publication consent and stored
-- coordinates. One profile may own more than one business.

alter table public.partners
  add column if not exists owner_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists participant_kind text,
  add column if not exists imported_category text,
  add column if not exists source_system text,
  add column if not exists source_record_id text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists public_phone text,
  add column if not exists instagram_url text,
  add column if not exists website_url text,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists map_opt_in boolean not null default false,
  add column if not exists geocode_label text,
  add column if not exists quality_status text,
  add column if not exists import_recommendation text,
  add column if not exists imported_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partners_participant_kind_check'
      and conrelid = 'public.partners'::regclass
  ) then
    alter table public.partners
      add constraint partners_participant_kind_check
      check (participant_kind is null or participant_kind in ('producer', 'service_provider'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'partners_latitude_check'
      and conrelid = 'public.partners'::regclass
  ) then
    alter table public.partners
      add constraint partners_latitude_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'partners_longitude_check'
      and conrelid = 'public.partners'::regclass
  ) then
    alter table public.partners
      add constraint partners_longitude_check
      check (longitude is null or longitude between -180 and 180);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'partners_map_coordinates_check'
      and conrelid = 'public.partners'::regclass
  ) then
    alter table public.partners
      add constraint partners_map_coordinates_check
      check (
        not map_opt_in
        or (latitude is not null and longitude is not null)
        or source_system is null
      );
  end if;
end $$;

create index if not exists partners_owner_profile_id_idx
  on public.partners (owner_profile_id);

create unique index if not exists partners_source_record_uidx
  on public.partners (source_system, source_record_id);

create index if not exists partners_public_map_idx
  on public.partners (status, map_opt_in)
  where map_opt_in = true;

-- Existing rows remain opt-out until a responsible operator confirms that the
-- participant authorized publication in the public directory. Having an
-- address is not evidence of publication consent.

drop policy if exists partners_update_owner on public.partners;
create policy partners_update_owner
  on public.partners
  for update
  to authenticated
  using (owner_profile_id = (select auth.uid()))
  with check (owner_profile_id = (select auth.uid()));

-- Records the first-login acceptance for accounts imported from the legacy
-- spreadsheet. The function derives the profile from the authenticated user.
create or replace function public.accept_legal_documents(
  p_terms_version text,
  p_privacy_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'not authenticated';
  end if;

  if nullif(trim(p_terms_version), '') is null or nullif(trim(p_privacy_version), '') is null then
    raise exception 'document version is required';
  end if;

  insert into public.consent_records (
    profile_id,
    consent_type,
    version,
    granted,
    legal_basis,
    purpose
  )
  values
    (
      v_profile_id,
      'terms_of_use',
      p_terms_version,
      true,
      'Execução de contrato (art. 7º, V, LGPD)',
      'Aceite dos Termos de Uso no primeiro acesso da conta importada'
    ),
    (
      v_profile_id,
      'privacy_policy',
      p_privacy_version,
      true,
      'Execução de contrato e cumprimento de obrigação legal (art. 7º, V e II, LGPD)',
      'Ciência da Política de Privacidade no primeiro acesso da conta importada'
    );
end;
$$;

revoke execute on function public.accept_legal_documents(text, text) from public, anon;
grant execute on function public.accept_legal_documents(text, text) to authenticated;
