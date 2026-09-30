create or replace function public.handle_order_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (new.buyer_id, 'create', 'orders', new.id, null, to_jsonb(new));
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if new.status = 'approved' and old.status <> 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, new.total_points, 'Pedido aprovado na loja');

      update profiles set points_balance = points_balance + new.total_points where id = new.buyer_id;
    elsif new.status = 'canceled' and old.status = 'approved' then
      insert into point_transactions (profile_id, source_type, source_id, points, description)
      values (new.buyer_id, 'purchase', new.id, -new.total_points, 'Estorno de pedido cancelado');

      update profiles set points_balance = points_balance - new.total_points where id = new.buyer_id;
    end if;

    insert into audit_logs (actor_id, action, entity, entity_id, before, after)
    values (auth.uid(), 'update', 'orders', new.id, to_jsonb(old), to_jsonb(new));
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_insert on orders;
create trigger on_order_insert
  after insert on orders
  for each row execute function handle_order_change();

drop trigger if exists on_order_update on orders;
create trigger on_order_update
  after update on orders
  for each row execute function handle_order_change();
