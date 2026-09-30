-- Enums
create type public.user_role as enum ('consumidor', 'produtor', 'cooperativa', 'admin');
create type public.plan_audience as enum ('consumidor', 'produtor');
create type public.subscription_status as enum ('pending', 'active', 'canceled');
create type public.cooperative_type as enum ('solid', 'organic', 'both');
create type public.cooperative_status as enum ('active', 'inactive');
create type public.waste_type as enum ('organic', 'solid', 'both');
create type public.collection_status as enum ('requested', 'confirmed', 'canceled');
create type public.point_source_type as enum ('collection', 'purchase', 'referral', 'challenge', 'manual');
create type public.product_status as enum ('active', 'inactive');
create type public.order_status as enum ('pending', 'approved', 'canceled');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  document text,
  role public.user_role not null default 'consumidor',
  points_balance integer not null default 0,
  cashback_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  audience public.plan_audience not null,
  slug text not null unique,
  name text not null,
  price_cents integer,
  description text,
  benefits jsonb not null default '[]'::jsonb,
  highlighted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'pending',
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_one_active_per_profile
  on public.subscriptions (profile_id)
  where status = 'active';

-- Cooperatives
create table public.cooperatives (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  name text not null,
  document text,
  type public.cooperative_type not null default 'both',
  service_area text,
  capacity_kg_day numeric,
  contact_name text,
  contact_phone text,
  status public.cooperative_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collection requests
create table public.collection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  cooperative_id uuid references public.cooperatives(id),
  waste_type public.waste_type not null,
  estimated_weight_kg numeric,
  confirmed_weight_kg numeric,
  address text not null,
  preferred_date date,
  status public.collection_status not null default 'requested',
  proof_image_url text,
  notes text,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Point transactions
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source_type public.point_source_type not null,
  source_id uuid,
  points integer not null,
  description text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id),
  name text not null,
  description text,
  price_cents integer not null,
  points_value integer not null default 0,
  category text,
  image_url text,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  total_cents integer not null default 0,
  total_points integer not null default 0,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1,
  unit_price_cents integer not null,
  points_value integer not null default 0
);

-- Audit logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index idx_collection_requests_requester on public.collection_requests(requester_id);
create index idx_collection_requests_cooperative on public.collection_requests(cooperative_id);
create index idx_point_transactions_profile on public.point_transactions(profile_id);
create index idx_products_partner on public.products(partner_id);
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_order_items_order on public.order_items(order_id);
create index idx_audit_logs_entity on public.audit_logs(entity, entity_id);
