-- Richer product catalog fields: unit of measure, material/origin, production
-- technique and free-form tags. These are the fields a circular-economy /
-- handmade marketplace needs that a generic "name + price + category" form
-- doesn't capture.

alter table public.products
  add column if not exists unit text not null default 'un',
  add column if not exists material_origin text[] not null default '{}',
  add column if not exists production_technique text,
  add column if not exists tags text[] not null default '{}';

alter table public.products
  add constraint products_unit_valid check (
    unit in ('un', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'par', 'dz', 'pacote')
  );

create index if not exists idx_products_tags on public.products using gin (tags);
