-- Gamification foundation: lifetime points (levels), streak, referral, achievements

alter table public.profiles
  add column if not exists lifetime_points integer not null default 0,
  add column if not exists streak_weeks integer not null default 0,
  add column if not exists last_collection_at timestamptz,
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id);

update public.profiles p set lifetime_points = coalesce((
  select sum(points) from public.point_transactions pt
  where pt.profile_id = p.id and pt.points > 0 and pt.source_type <> 'redemption'
), 0) where lifetime_points = 0;

update public.profiles set referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  where referral_code is null;

create table if not exists public.achievements (
  code text primary key,
  name text not null,
  description text not null,
  icon text not null,
  sort_order integer not null default 0
);

create table if not exists public.user_achievements (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  achievement_code text not null references public.achievements(code),
  earned_at timestamptz not null default now(),
  primary key (profile_id, achievement_code)
);
create index if not exists idx_user_achievements_profile on public.user_achievements(profile_id);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "achievements_select_all" on public.achievements for select
  to anon, authenticated using (true);
create policy "user_achievements_select_own_or_admin" on public.user_achievements for select
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

insert into public.achievements (code, name, description, icon, sort_order) values
  ('first_collection', 'Primeira Coleta', 'Você reciclou pela primeira vez.', 'sprout', 1),
  ('collections_10', 'Reciclador Dedicado', '10 coletas confirmadas.', 'recycle', 2),
  ('kg_100', '100kg Reciclados', 'Você desviou 100kg de resíduos do lixo.', 'scale', 3),
  ('streak_4', 'Constância', '4 semanas seguidas reciclando.', 'flame', 4),
  ('first_purchase', 'Consumo Consciente', 'Sua primeira compra na loja.', 'shopping-bag', 5),
  ('first_redeem', 'Recompensa Merecida', 'Resgatou seu primeiro benefício.', 'gift', 6)
on conflict (code) do nothing;

create or replace function public.award_achievement(p_profile uuid, p_code text)
returns void language sql security definer set search_path = public as $$
  insert into public.user_achievements (profile_id, achievement_code)
  values (p_profile, p_code)
  on conflict (profile_id, achievement_code) do nothing;
$$;
revoke execute on function public.award_achievement(uuid, text) from public, anon, authenticated;

-- Collection trigger now also updates lifetime points, streak and achievements.
create or replace function public.handle_collection_request_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_points integer;
  v_confirmed_count integer;
  v_total_kg numeric;
  v_streak integer;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.requester_id, 'create', 'collection_requests', new.id, null, to_jsonb(new));
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, entity, entity_id, before, after)
  values (coalesce(auth.uid(), new.requester_id), 'update', 'collection_requests', new.id, to_jsonb(old), to_jsonb(new));

  if old.status <> 'confirmed' and new.status = 'confirmed' then
    v_points := case new.waste_type when 'organic' then 50 when 'solid' then 30 when 'both' then 80 else 0 end;

    insert into public.point_transactions (profile_id, source_type, source_id, points, description, expires_at)
    values (new.requester_id, 'collection', new.id, v_points, 'Coleta confirmada (' || new.waste_type || ')', now() + interval '12 months');

    update public.profiles
      set points_balance = points_balance + v_points,
          lifetime_points = lifetime_points + v_points,
          streak_weeks = case when last_collection_at is not null and last_collection_at > now() - interval '8 days'
                              then streak_weeks + 1 else 1 end,
          last_collection_at = now()
    where id = new.requester_id
    returning streak_weeks into v_streak;

    if new.confirmed_at is null then new.confirmed_at = now(); end if;

    perform award_achievement(new.requester_id, 'first_collection');

    select count(*) + 1 into v_confirmed_count from public.collection_requests
      where requester_id = new.requester_id and status = 'confirmed';
    if v_confirmed_count >= 10 then perform award_achievement(new.requester_id, 'collections_10'); end if;

    select coalesce(sum(confirmed_weight_kg), 0) + coalesce(new.confirmed_weight_kg, 0) into v_total_kg
      from public.collection_requests where requester_id = new.requester_id and status = 'confirmed';
    if v_total_kg >= 100 then perform award_achievement(new.requester_id, 'kg_100'); end if;

    if v_streak >= 4 then perform award_achievement(new.requester_id, 'streak_4'); end if;
  end if;

  if old.status <> 'canceled' and new.status = 'canceled' and new.canceled_at is null then
    new.canceled_at = now();
  end if;

  return new;
end;
$$;
revoke execute on function public.handle_collection_request_change() from public, anon, authenticated;

-- Order trigger now also bumps lifetime points + first purchase achievement.
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
        lifetime_points = lifetime_points + new.total_points,
        cashback_cents = cashback_cents + v_cashback where id = new.buyer_id;
      perform award_achievement(new.buyer_id, 'first_purchase');
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

-- redeem_partner_item now awards the first_redeem achievement.
create or replace function public.redeem_partner_item(p_item_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_cost integer;
  v_balance integer;
  v_code text;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;
  select pi.points_cost into v_cost from partner_items pi
    join partners p on p.id = pi.partner_id
    where pi.id = p_item_id and p.status = 'active';
  if v_cost is null then raise exception 'item_unavailable'; end if;
  if v_cost <= 0 then raise exception 'not_redeemable'; end if;
  select points_balance into v_balance from profiles where id = v_user for update;
  if v_balance < v_cost then raise exception 'insufficient_points'; end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into redemptions (profile_id, partner_item_id, points_spent, code)
    values (v_user, p_item_id, v_cost, v_code);
  insert into point_transactions (profile_id, source_type, source_id, points, description)
    values (v_user, 'redemption', p_item_id, -v_cost, 'Resgate de benefício');
  update profiles set points_balance = points_balance - v_cost where id = v_user;
  perform award_achievement(v_user, 'first_redeem');
  return v_code;
end;
$$;
revoke execute on function public.redeem_partner_item(uuid) from public, anon;
grant execute on function public.redeem_partner_item(uuid) to authenticated;
