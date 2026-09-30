-- The forced first-access state belongs in app_metadata because authenticated
-- users can edit user_metadata. The acceptance RPC clears the protected flag
-- only after both legal-document records have been written.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('must_change_password', true)
where raw_app_meta_data ->> 'legacy_import_batch' = 'cadastrados-2026-09-27'
  and coalesce((raw_user_meta_data ->> 'must_change_password')::boolean, false);

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

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('must_change_password', false),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'must_change_password'
  where id = v_profile_id;
end;
$$;

revoke execute on function public.accept_legal_documents(text, text) from public, anon;
grant execute on function public.accept_legal_documents(text, text) to authenticated;
