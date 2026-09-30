-- Points sink: redeem partner_items with points.
alter table public.partner_items add column if not exists points_cost integer not null default 0;

-- Backfill a demo cost so existing benefits become redeemable.
update public.partner_items
  set points_cost = greatest(round(price_cents / 10.0)::int, 50)
  where points_cost = 0;

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  partner_item_id uuid not null references public.partner_items(id),
  points_spent integer not null,
  code text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_redemptions_profile on public.redemptions(profile_id);

alter table public.redemptions enable row level security;

create policy "redemptions_select_own_or_admin" on public.redemptions for select
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- Redeem a partner benefit with points (transactional, row-locked).
create or replace function public.redeem_partner_item(p_item_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cost integer;
  v_balance integer;
  v_code text;
begin
  if v_user is null then raise exception 'unauthenticated'; end if;

  select pi.points_cost into v_cost
  from partner_items pi
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

  return v_code;
end;
$$;

revoke execute on function public.redeem_partner_item(uuid) from public, anon;
grant execute on function public.redeem_partner_item(uuid) to authenticated;
