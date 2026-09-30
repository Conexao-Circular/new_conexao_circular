create type partner_category as enum ('restaurante', 'hotel', 'produtor_local', 'shopping', 'servico', 'outro');

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category partner_category not null,
  description text,
  address text not null,
  seal boolean not null default true,
  image_url text,
  status product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table partner_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table partners enable row level security;
alter table partner_items enable row level security;

create policy partners_select_active_or_admin on partners for select
  using (status = 'active' or is_admin());

create policy partners_modify_admin on partners for all
  using (is_admin()) with check (is_admin());

create policy partner_items_select_active_or_admin on partner_items for select
  using (
    exists (
      select 1 from partners p
      where p.id = partner_items.partner_id and (p.status = 'active' or is_admin())
    )
  );

create policy partner_items_modify_admin on partner_items for all
  using (is_admin()) with check (is_admin());

create trigger set_updated_at_partners before update on partners for each row execute function set_updated_at();
