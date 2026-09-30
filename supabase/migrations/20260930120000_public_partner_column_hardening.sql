-- Public snapshot hardening: row-level policies do not restrict columns.
-- Anonymous and authenticated clients receive only directory-safe partner
-- fields. Administrative or operational data stays inaccessible through the
-- public Data API and must be handled by a privileged server path when needed.

revoke all on public.partners from anon, authenticated;

grant select (
  id,
  name,
  category,
  description,
  address,
  seal,
  image_url,
  status,
  city,
  state,
  participant_kind,
  imported_category,
  latitude,
  longitude,
  map_opt_in,
  early_access_min_level,
  early_access_until
)
on public.partners
to anon, authenticated;

comment on table public.partners is
  'Partner records; public clients receive only the explicitly granted directory columns.';

drop policy if exists partners_select_active_anon on public.partners;

create policy partners_select_public_anon
  on public.partners
  for select
  to anon
  using (status = 'active' and map_opt_in = true);
