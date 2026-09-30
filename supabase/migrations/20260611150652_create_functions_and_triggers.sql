-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger set_updated_at_cooperatives
  before update on public.cooperatives
  for each row execute function public.set_updated_at();

create trigger set_updated_at_collection_requests
  before update on public.collection_requests
  for each row execute function public.set_updated_at();

create trigger set_updated_at_products
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger set_updated_at_orders
  before update on public.orders
  for each row execute function public.set_updated_at();

-- is_admin helper (security definer to avoid RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- get requester display name (used by cooperatives to see basic info)
create or replace function public.get_profile_basic(p_id uuid)
returns table(id uuid, name text, phone text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, phone from public.profiles where id = p_id;
$$;

-- handle_new_user: create profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, document, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'document',
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'consumidor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- collection request: audit + points crediting on confirmation
create or replace function public.handle_collection_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.requester_id, 'create', 'collection_requests', new.id, null, to_jsonb(new));
    return new;
  end if;

  -- UPDATE
  insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
  values (coalesce(auth.uid(), new.requester_id), 'update', 'collection_requests', new.id, to_jsonb(old), to_jsonb(new));

  if old.status <> 'confirmed' and new.status = 'confirmed' then
    v_points := case new.waste_type
      when 'organic' then 50
      when 'solid' then 30
      when 'both' then 80
      else 0
    end;

    insert into public.point_transactions (profile_id, source_type, source_id, points, description)
    values (new.requester_id, 'collection', new.id, v_points, 'Coleta confirmada (' || new.waste_type || ')');

    update public.profiles
    set points_balance = points_balance + v_points
    where id = new.requester_id;

    if new.confirmed_at is null then
      new.confirmed_at = now();
    end if;
  end if;

  if old.status <> 'canceled' and new.status = 'canceled' and new.canceled_at is null then
    new.canceled_at = now();
  end if;

  return new;
end;
$$;

create trigger on_collection_request_insert
  after insert on public.collection_requests
  for each row execute function public.handle_collection_request_change();

create trigger on_collection_request_update
  before update on public.collection_requests
  for each row execute function public.handle_collection_request_change();
