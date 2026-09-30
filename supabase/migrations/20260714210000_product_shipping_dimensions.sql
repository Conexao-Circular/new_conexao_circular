-- Physical shipping attributes per product. Required to quote freight
-- (Correios/transportadoras charge by weight + dimensions). Nullable so
-- existing products keep working; the freight quote applies safe minimums
-- when a value is missing.

alter table public.products
  add column if not exists weight_grams integer,
  add column if not exists length_cm numeric,
  add column if not exists width_cm numeric,
  add column if not exists height_cm numeric;

alter table public.products
  add constraint products_weight_nonneg check (weight_grams is null or weight_grams >= 0),
  add constraint products_dimensions_nonneg check (
    (length_cm is null or length_cm >= 0)
    and (width_cm is null or width_cm >= 0)
    and (height_cm is null or height_cm >= 0)
  );
