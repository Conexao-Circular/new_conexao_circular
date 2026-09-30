-- Manual approval gate + 7-day free trial (from approval), and a plan for cooperativas.
create type public.profile_approval_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column approval_status public.profile_approval_status not null default 'pending',
  add column approved_at timestamptz,
  add column access_override boolean not null default false;

-- Grandfather every account that already exists: nobody currently using the
-- app gets retroactively locked out by this new gate.
update public.profiles
  set access_override = true,
      approval_status = 'approved',
      approved_at = coalesce(approved_at, created_at);

insert into public.plans (audience, slug, name, price_cents, description, benefits, highlighted, sort_order) values
('cooperativa', 'cooperativa-parceira', 'Parceria Cooperativa', null,
  'Plano de parceria para cooperativas na rede Conexão Circular.',
  '["Recebimento de solicitações de coleta da rede", "Selo Cooperativa Parceira", "Visibilidade no app"]'::jsonb,
  false, 1);
