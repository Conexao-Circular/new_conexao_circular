alter table public.point_transactions add column if not exists expired boolean not null default false;

-- Collection credit now sets a 12-month expiry.
create or replace function public.handle_collection_request_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_points integer;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.requester_id, 'create', 'collection_requests', new.id, null, to_jsonb(new));
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
  values (coalesce(auth.uid(), new.requester_id), 'update', 'collection_requests', new.id, to_jsonb(old), to_jsonb(new));

  if old.status <> 'confirmed' and new.status = 'confirmed' then
    v_points := case new.waste_type
      when 'organic' then 50 when 'solid' then 30 when 'both' then 80 else 0 end;

    insert into public.point_transactions (profile_id, source_type, source_id, points, description, expires_at)
    values (new.requester_id, 'collection', new.id, v_points, 'Coleta confirmada (' || new.waste_type || ')', now() + interval '12 months');

    update public.profiles set points_balance = points_balance + v_points where id = new.requester_id;

    if new.confirmed_at is null then new.confirmed_at = now(); end if;
  end if;

  if old.status <> 'canceled' and new.status = 'canceled' and new.canceled_at is null then
    new.canceled_at = now();
  end if;

  return new;
end;
$$;
revoke execute on function public.handle_collection_request_change() from public, anon, authenticated;

-- Purchase credit now sets a 12-month expiry.
create or replace function public.handle_order_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_cashback integer;
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.buyer_id, 'create', 'orders', new.id, null, to_jsonb(new));
    return new;
  end if;
  if TG_OP = 'UPDATE' then
    v_cashback := round((new.total_cents - coalesce(new.cashback_used_cents, 0)) * 0.03);
    if new.status = 'approved' and old.status <> 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description, expires_at)
      values (new.buyer_id, 'purchase', new.id, new.total_points, 'Pedido aprovado na loja', now() + interval '12 months');
      update profiles set points_balance = points_balance + new.total_points,
        cashback_cents = cashback_cents + v_cashback where id = new.buyer_id;
    elsif new.status = 'canceled' and old.status = 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, -new.total_points, 'Estorno de pedido cancelado');
      update profiles set points_balance = points_balance - new.total_points,
        cashback_cents = greatest(cashback_cents - v_cashback, 0) where id = new.buyer_id;
    end if;
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', 'orders', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_order_change() from public, anon, authenticated;

-- Expire matured points (MVP: floored aggregate, marks processed rows).
create or replace function public.expire_points()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select profile_id, sum(points) as pts
    from point_transactions
    where points > 0 and expired = false and expires_at is not null and expires_at < now()
    group by profile_id
  loop
    update profiles set points_balance = greatest(points_balance - r.pts, 0) where id = r.profile_id;
    insert into point_transactions (profile_id, source_type, points, description, expired)
    values (r.profile_id, 'manual', -r.pts, 'Expiração de pontos', true);
  end loop;

  update point_transactions set expired = true
  where points > 0 and expired = false and expires_at is not null and expires_at < now();
end;
$$;
revoke execute on function public.expire_points() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('expire-points', '0 3 * * *', $$select public.expire_points();$$);
