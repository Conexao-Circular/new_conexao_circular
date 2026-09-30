-- "Produtor Circular" restructure: one signup category covers both product
-- sellers and waste-collection cooperatives, sharing the same curation
-- pipeline (producer_applications) instead of cooperativas being a
-- disconnected, admin-only directory with no self-service path at all.
--
-- Also: professional-grade signup — birth date + CEP for consumers, and a
-- fuller cadastral/business profile for producer-circular applicants
-- (address, business size, founding year, site, state registration; plus
-- cooperativa-specific waste type/capacity/service area).

-- 1) Consumer signup: professional-grade fields -------------------------
alter table public.profiles add column birth_date date;
alter table public.profiles add column postal_code text;

-- 2) producer_applications: applicant type + fuller cadastral profile ---
create type public.applicant_type as enum ('produtor', 'cooperativa');

alter table public.producer_applications
  add column applicant_type public.applicant_type not null default 'produtor';

alter table public.producer_applications add column business_address jsonb;
alter table public.producer_applications add column business_size text;
alter table public.producer_applications add column founded_year integer;
alter table public.producer_applications add column website_url text;
alter table public.producer_applications add column state_registration text;
alter table public.producer_applications add column partner_terms_accepted_at timestamptz;

-- Cooperativa-specific fields (nullable — only required at the app layer
-- when applicant_type = 'cooperativa').
alter table public.producer_applications add column waste_type public.cooperative_type;
alter table public.producer_applications add column capacity_kg_day integer;
alter table public.producer_applications add column service_area text;

alter table public.producer_applications
  add constraint producer_applications_cooperativa_fields_check
  check (
    applicant_type <> 'cooperativa'
    or waste_type is not null
  );

-- 3) On curation approval of a cooperativa application, auto-provision (or
-- update) the applicant's own cooperatives row — this is what actually
-- fixes the gap: today a cooperativa signup never gets a usable
-- cooperatives row at all, so their whole dashboard silently stays empty.
create or replace function public.provision_cooperative_on_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.applicant_type = 'cooperativa' and new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.cooperatives (
      profile_id, name, type, status, document, contact_name, contact_phone,
      service_area, capacity_kg_day, collects_description, operation_description
    )
    values (
      new.profile_id, new.razao_social, coalesce(new.waste_type, 'both'), 'active', new.cnpj,
      new.responsavel_nome, new.responsavel_telefone,
      new.service_area, new.capacity_kg_day, new.sustainability_description, new.operation_description
    )
    on conflict (profile_id) where profile_id is not null do update set
      name = excluded.name,
      type = excluded.type,
      status = 'active',
      document = excluded.document,
      contact_name = excluded.contact_name,
      contact_phone = excluded.contact_phone,
      service_area = excluded.service_area,
      capacity_kg_day = excluded.capacity_kg_day,
      collects_description = excluded.collects_description,
      operation_description = excluded.operation_description;
  end if;
  return new;
end;
$$;

create unique index if not exists cooperatives_profile_id_key on public.cooperatives (profile_id) where profile_id is not null;

create trigger provision_cooperative_on_approval
  after update on public.producer_applications
  for each row execute function public.provision_cooperative_on_approval();
