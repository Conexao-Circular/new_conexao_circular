-- Generate a referral code for every new signup and capture the referrer
-- from the `ref` signup metadata field.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
begin
  if new.raw_user_meta_data ? 'ref' then
    select id into v_referrer from public.profiles
      where referral_code = upper(new.raw_user_meta_data->>'ref') limit 1;
  end if;

  insert into public.profiles (id, name, email, phone, document, role, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'document',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'consumidor'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    v_referrer
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
