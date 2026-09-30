-- Carry the new professional-signup fields (birth_date, postal_code) from
-- auth signup metadata into the profile row, same pattern as name/phone.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role, marketing_opt_in, birth_date, postal_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'consumidor'),
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    new.raw_user_meta_data->>'postal_code'
  );

  insert into public.consent_records (profile_id, consent_type, version, granted, legal_basis, purpose)
  values
    (new.id, 'terms_of_use', coalesce(new.raw_user_meta_data->>'terms_version', 'unknown'), true,
     'Execução de contrato (art. 7º, V, LGPD)',
     'Aceite dos Termos de Uso da plataforma no cadastro'),
    (new.id, 'privacy_policy', coalesce(new.raw_user_meta_data->>'privacy_version', 'unknown'), true,
     'Execução de contrato e cumprimento de obrigação legal (art. 7º, V e II, LGPD)',
     'Ciência da Política de Privacidade e do tratamento de dados pessoais no cadastro'),
    (new.id, 'marketing_communications', 'n/a', coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
     'Consentimento (art. 7º, I, LGPD)',
     'Recebimento de comunicações de marketing e novidades por e-mail');

  return new;
end;
$$;
