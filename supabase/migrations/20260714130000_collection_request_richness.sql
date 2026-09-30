-- Richer collection request: structured address (so the collector gets a
-- real, complete address instead of one free-text line), a time window,
-- explicit contact info, access instructions, estimated volumes, a
-- breakdown of dry materials, and a field for the cooperative to record
-- notes when executing the pickup. `address` is kept (not null) as the
-- formatted single-line composite, computed by the app, so every existing
-- read site keeps working unchanged.

alter table public.collection_requests
  add column if not exists address_zip text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_reference text,
  add column if not exists preferred_time_window text,
  add column if not exists contact_phone text,
  add column if not exists contact_name text,
  add column if not exists access_instructions text,
  add column if not exists estimated_volumes integer,
  add column if not exists dry_materials text[] not null default '{}',
  add column if not exists execution_notes text;

alter table public.collection_requests
  add constraint collection_requests_time_window_valid check (
    preferred_time_window is null or preferred_time_window in ('manha', 'tarde', 'noite', 'qualquer')
  ),
  add constraint collection_requests_volumes_nonneg check (
    estimated_volumes is null or estimated_volumes >= 0
  );
