-- LGPD consent trail: records what each user accepted, when, which version of
-- the document, and the legal basis for each purpose (Lei 13.709/2018, art. 7º).
-- Immutable log: rows are only ever inserted, never updated/deleted, so it can
-- serve as evidence of consent if a data subject request or audit requires it.

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms_of_use', 'privacy_policy', 'marketing_communications')),
  version text not null,
  granted boolean not null default true,
  legal_basis text not null,
  purpose text not null,
  created_at timestamptz not null default now()
);

create index consent_records_profile_id_idx on public.consent_records (profile_id);

alter table public.consent_records enable row level security;

create policy "consent_records_select_own_or_admin"
  on public.consent_records for select
  using (profile_id = auth.uid() or public.is_admin());

-- No insert/update/delete policy for authenticated/anon: every row is written
-- by a security definer function (handle_new_user, set_marketing_consent)
-- so the trail can't be edited or backdated from the client.

-- Minimization: CPF/CNPJ no longer collected at signup, only at checkout
-- (src/app/(app)/loja/checkout). Track opt-in state on the profile for cheap
-- filtering (e.g. marketing sends) without replaying the full consent log.
alter table public.profiles add column marketing_opt_in boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marketing_opt_in boolean := coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false);
  v_terms_version text := coalesce(new.raw_user_meta_data->>'terms_version', 'unknown');
  v_privacy_version text := coalesce(new.raw_user_meta_data->>'privacy_version', 'unknown');
begin
  insert into public.profiles (id, name, email, phone, role, marketing_opt_in)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'consumidor'),
    v_marketing_opt_in
  );

  insert into public.consent_records (profile_id, consent_type, version, granted, legal_basis, purpose)
  values
    (new.id, 'terms_of_use', v_terms_version, true,
     'Execução de contrato (art. 7º, V, LGPD)',
     'Aceite dos Termos de Uso da plataforma no cadastro'),
    (new.id, 'privacy_policy', v_privacy_version, true,
     'Execução de contrato e cumprimento de obrigação legal (art. 7º, V e II, LGPD)',
     'Ciência da Política de Privacidade e do tratamento de dados pessoais no cadastro'),
    (new.id, 'marketing_communications', 'n/a', v_marketing_opt_in,
     'Consentimento (art. 7º, I, LGPD)',
     'Recebimento de comunicações de marketing e novidades por e-mail');

  return new;
end;
$$;

-- Lets a signed-in user change their own marketing opt-in later (e.g. from a
-- preferences screen) while keeping the change in the same audit trail.
create or replace function public.set_marketing_consent(p_granted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles set marketing_opt_in = p_granted where id = auth.uid();

  insert into public.consent_records (profile_id, consent_type, version, granted, legal_basis, purpose)
  values (
    auth.uid(), 'marketing_communications', 'n/a', p_granted,
    'Consentimento (art. 7º, I, LGPD)',
    'Alteração de preferência de comunicações de marketing e novidades por e-mail'
  );
end;
$$;

revoke execute on function public.set_marketing_consent(boolean) from public, anon;
grant execute on function public.set_marketing_consent(boolean) to authenticated;
