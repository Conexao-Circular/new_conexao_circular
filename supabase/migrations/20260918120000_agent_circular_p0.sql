-- Agent Circular P0 foundation.
-- Additive only: no existing rows, tables, policies, or storage objects are removed.

-- ---------------------------------------------------------------------------
-- Profile foundation
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists agent_status text,
  add column if not exists agent_code text,
  add column if not exists agent_slug text,
  add column if not exists agent_is_available boolean not null default false,
  add column if not exists agent_interests text[] not null default '{}'::text[],
  add column if not exists agent_neighborhood text,
  add column if not exists agent_city text,
  add column if not exists agent_terms_accepted_at timestamptz,
  add column if not exists agent_privacy_accepted_at timestamptz,
  add column if not exists agent_rules_accepted_at timestamptz,
  add column if not exists agent_rules_version text,
  add column if not exists agent_photo_url text,
  add column if not exists agent_bio text,
  add column if not exists agent_course text,
  add column if not exists agent_course_version text not null default '2026.1',
  add column if not exists agent_course_score integer not null default 0,
  add column if not exists agent_total_xp integer not null default 0,
  add column if not exists agent_practical_mission text,
  add column if not exists agent_practical_mission_status text not null default 'not_started',
  add column if not exists agent_practical_mission_feedback text,
  add column if not exists agent_practical_mission_reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists agent_practical_mission_reviewed_at timestamptz,
  add column if not exists agent_certificate_url text,
  add column if not exists agent_certificate_code text,
  add column if not exists agent_certificate_issued_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_agent_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_agent_status_check
      check (
        agent_status is null
        or agent_status in ('registered', 'training', 'evaluation_pending', 'approved', 'active', 'suspended', 'inactive', 'blocked')
      );
  end if;
end;
$$;

create unique index if not exists profiles_agent_code_key
  on public.profiles (agent_code)
  where agent_code is not null;

create unique index if not exists profiles_agent_slug_key
  on public.profiles (agent_slug)
  where agent_slug is not null;

create index if not exists profiles_agent_status_available_idx
  on public.profiles (agent_status, agent_is_available)
  where agent_status is not null;

create index if not exists profiles_agent_location_idx
  on public.profiles (agent_city, agent_neighborhood)
  where agent_status is not null;

-- ---------------------------------------------------------------------------
-- Agent-owned tables
-- ---------------------------------------------------------------------------

create table if not exists public.agent_course_progress (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  course_slug text not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent smallint not null default 0
    check (progress_percent between 0 and 100),
  quiz_score smallint not null default 0
    check (quiz_score between 0 and 100),
  quiz_attempts smallint not null default 0
    check (quiz_attempts between 0 and 99),
  quiz_passed boolean not null default false,
  xp_earned integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id, course_slug)
);

create table if not exists public.agent_referrals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  referral_code text,
  referred_user_id uuid references public.profiles(id) on delete set null,
  referred_email text,
  status text not null default 'pending'
    check (status in ('pending', 'registered', 'converted', 'canceled')),
  referred_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_referrals
  add column if not exists referral_type text,
  add column if not exists name text,
  add column if not exists responsible_name text,
  add column if not exists contact text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists reason text,
  add column if not exists observed_practice text,
  add column if not exists evidence_summary text,
  add column if not exists source text,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.agent_referrals drop constraint if exists agent_referrals_status_check;
alter table public.agent_referrals add constraint agent_referrals_status_check check (
  status in ('indicated', 'contacted', 'invited', 'started', 'completed', 'review', 'approved', 'rejected', 'published', 'pending', 'registered', 'converted', 'canceled')
);
alter table public.agent_referrals add constraint agent_referrals_type_check check (
  referral_type is null or referral_type in ('business', 'cooperative', 'organic_solution')
);

create table if not exists public.agent_evidences (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  evidence_type text not null default 'other'
    check (evidence_type in ('photo', 'document', 'mission', 'certificate', 'other')),
  file_path text not null,
  title text,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agent_evidences
  add column if not exists referral_id uuid references public.agent_referrals(id) on delete set null,
  add column if not exists object_key text,
  add column if not exists file_name text,
  add column if not exists content_type text,
  add column if not exists observation text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

alter table public.agent_evidences drop constraint if exists agent_evidences_status_check;
alter table public.agent_evidences add constraint agent_evidences_status_check check (
  status in ('uploaded', 'under_review', 'verified', 'rejected', 'pending', 'approved')
);

create table if not exists public.agent_analytics_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists agent_course_progress_agent_id_idx
  on public.agent_course_progress (agent_id);
create index if not exists agent_course_progress_agent_status_idx
  on public.agent_course_progress (agent_id, status);

create index if not exists agent_referrals_agent_id_idx
  on public.agent_referrals (agent_id);
create index if not exists agent_referrals_agent_created_at_idx
  on public.agent_referrals (agent_id, created_at desc);
create index if not exists agent_referrals_referred_user_id_idx
  on public.agent_referrals (referred_user_id);

create index if not exists agent_evidences_agent_id_idx
  on public.agent_evidences (agent_id);
create index if not exists agent_evidences_agent_status_idx
  on public.agent_evidences (agent_id, status);
create index if not exists agent_evidences_reviewed_by_idx
  on public.agent_evidences (reviewed_by);
create index if not exists agent_evidences_referral_id_idx
  on public.agent_evidences (referral_id);

create index if not exists agent_analytics_events_agent_occurred_at_idx
  on public.agent_analytics_events (agent_id, occurred_at desc);
create index if not exists agent_analytics_events_name_occurred_at_idx
  on public.agent_analytics_events (event_name, occurred_at desc);

drop trigger if exists agent_course_progress_set_updated_at on public.agent_course_progress;
create trigger agent_course_progress_set_updated_at
  before update on public.agent_course_progress
  for each row execute function public.set_updated_at();

drop trigger if exists agent_referrals_set_updated_at on public.agent_referrals;
create trigger agent_referrals_set_updated_at
  before update on public.agent_referrals
  for each row execute function public.set_updated_at();

drop trigger if exists agent_evidences_set_updated_at on public.agent_evidences;
create trigger agent_evidences_set_updated_at
  before update on public.agent_evidences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS and least-privilege grants
-- ---------------------------------------------------------------------------

create or replace function public.is_agent_circular()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'agent_circular'
  );
$$;

revoke execute on function public.is_agent_circular() from anon;
grant execute on function public.is_agent_circular() to authenticated;

alter table public.agent_course_progress enable row level security;
alter table public.agent_referrals enable row level security;
alter table public.agent_evidences enable row level security;
alter table public.agent_analytics_events enable row level security;

revoke all on table public.agent_course_progress from anon, authenticated;
revoke all on table public.agent_referrals from anon, authenticated;
revoke all on table public.agent_evidences from anon, authenticated;
revoke all on table public.agent_analytics_events from anon, authenticated;

grant select, insert, update, delete on table public.agent_course_progress to authenticated;
grant select, insert, update, delete on table public.agent_referrals to authenticated;
grant select, insert, update, delete on table public.agent_evidences to authenticated;
grant select, insert, update, delete on table public.agent_analytics_events to authenticated;

create policy "agent_course_progress_select_own_or_admin"
  on public.agent_course_progress for select
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_course_progress_insert_own_or_admin"
  on public.agent_course_progress for insert
  to authenticated
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_course_progress_update_own_or_admin"
  on public.agent_course_progress for update
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()))
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_course_progress_delete_own_or_admin"
  on public.agent_course_progress for delete
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_referrals_select_own_or_admin"
  on public.agent_referrals for select
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_referrals_insert_own_or_admin"
  on public.agent_referrals for insert
  to authenticated
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_referrals_update_own_or_admin"
  on public.agent_referrals for update
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()))
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_referrals_delete_own_or_admin"
  on public.agent_referrals for delete
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_evidences_select_own_or_admin"
  on public.agent_evidences for select
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_evidences_insert_own_or_admin"
  on public.agent_evidences for insert
  to authenticated
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_evidences_update_own_or_admin"
  on public.agent_evidences for update
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()))
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_evidences_delete_own_or_admin"
  on public.agent_evidences for delete
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_analytics_events_select_own_or_admin"
  on public.agent_analytics_events for select
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_analytics_events_insert_own_or_admin"
  on public.agent_analytics_events for insert
  to authenticated
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_analytics_events_update_own_or_admin"
  on public.agent_analytics_events for update
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()))
  with check ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

create policy "agent_analytics_events_delete_own_or_admin"
  on public.agent_analytics_events for delete
  to authenticated
  using ((agent_id = (select auth.uid()) and (select public.is_agent_circular())) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Private evidence storage: {agent_id}/{filename}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'agent-evidences',
  'agent-evidences',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "agent_evidences_storage_insert_own_or_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'agent-evidences'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_agent_circular()))
      or (select public.is_admin())
    )
  );

create policy "agent_evidences_storage_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'agent-evidences'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_agent_circular()))
      or (select public.is_admin())
    )
  );

create policy "agent_evidences_storage_update_own_or_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'agent-evidences'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_agent_circular()))
      or (select public.is_admin())
    )
  )
  with check (
    bucket_id = 'agent-evidences'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_agent_circular()))
      or (select public.is_admin())
    )
  );

create policy "agent_evidences_storage_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'agent-evidences'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_agent_circular()))
      or (select public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- Signup trigger: preserve the existing profile + LGPD consent behavior and
-- hydrate the Agent Circular fields when the requested role is agent_circular.
-- Admin is only accepted from app_metadata, not user-editable user_metadata.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_is_agent boolean;
  v_marketing_opt_in boolean;
  v_agent_terms_granted boolean;
  v_agent_privacy_granted boolean;
  v_agent_rules_granted boolean;
  v_agent_interests text[];
begin
  v_role := case
    when new.raw_app_meta_data->>'role' = 'admin' then 'admin'::public.user_role
    when new.raw_user_meta_data->>'role' = 'produtor' then 'produtor'::public.user_role
    when new.raw_user_meta_data->>'role' = 'cooperativa' then 'cooperativa'::public.user_role
    when new.raw_user_meta_data->>'role' = 'agent_circular' then 'agent_circular'::public.user_role
    else 'consumidor'::public.user_role
  end;

  v_is_agent := v_role = 'agent_circular'::public.user_role;
  v_marketing_opt_in := lower(coalesce(new.raw_user_meta_data->>'marketing_opt_in', 'false'))
    in ('true', '1', 'yes');
  v_agent_terms_granted := lower(coalesce(
    new.raw_user_meta_data->>'agent_terms_accepted',
    new.raw_user_meta_data->>'terms_accepted',
    'true'
  )) not in ('false', '0', 'no');
  v_agent_privacy_granted := lower(coalesce(
    new.raw_user_meta_data->>'agent_privacy_accepted',
    new.raw_user_meta_data->>'privacy_accepted',
    'true'
  )) not in ('false', '0', 'no');
  v_agent_rules_granted := lower(coalesce(
    new.raw_user_meta_data->>'agent_rules_accepted',
    'false'
  )) not in ('false', '0', 'no');

  if jsonb_typeof(new.raw_user_meta_data->'agent_interests') = 'array' then
    v_agent_interests := array(
      select value
      from jsonb_array_elements_text(new.raw_user_meta_data->'agent_interests') as interests(value)
    );
  else
    v_agent_interests := '{}'::text[];
  end if;

  insert into public.profiles (
    id,
    name,
    email,
    phone,
    role,
    marketing_opt_in,
    birth_date,
    postal_code,
    agent_status,
    agent_code,
    agent_slug,
    agent_is_available,
    agent_interests,
    agent_neighborhood,
    agent_city,
    agent_terms_accepted_at,
    agent_privacy_accepted_at,
    agent_rules_accepted_at,
    agent_rules_version,
    agent_photo_url,
    agent_bio,
    agent_course,
    agent_course_version,
    agent_course_score,
    agent_total_xp,
    agent_practical_mission,
    agent_practical_mission_status,
    agent_certificate_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone',
    v_role,
    v_marketing_opt_in,
    nullif(new.raw_user_meta_data->>'birth_date', '')::date,
    new.raw_user_meta_data->>'postal_code',
    case
      when v_is_agent then case
        when new.raw_user_meta_data->>'agent_status'
          in ('registered', 'training', 'evaluation_pending', 'approved', 'active', 'suspended', 'inactive', 'blocked')
          then new.raw_user_meta_data->>'agent_status'
        else 'registered'
      end
      else null
    end,
    case
      when v_is_agent then coalesce(
        nullif(new.raw_user_meta_data->>'agent_code', ''),
        'AC-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
      )
      else null
    end,
    case
      when v_is_agent then coalesce(
        nullif(lower(new.raw_user_meta_data->>'agent_slug'), ''),
        'agent-' || lower(substr(replace(new.id::text, '-', ''), 1, 12))
      )
      else null
    end,
    case
      when v_is_agent and lower(coalesce(new.raw_user_meta_data->>'agent_is_available', 'false'))
        in ('true', '1', 'yes') then true
      else false
    end,
    case when v_is_agent then v_agent_interests else '{}'::text[] end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_neighborhood' else null end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_city' else null end,
    case when v_is_agent and v_agent_terms_granted then now() else null end,
    case when v_is_agent and v_agent_privacy_granted then now() else null end,
    case when v_is_agent and v_agent_rules_granted then now() else null end,
    case when v_is_agent then coalesce(new.raw_user_meta_data->>'agent_rules_version', '2026.1') else null end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_photo_url' else null end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_bio' else null end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_course' else null end,
    case when v_is_agent then coalesce(new.raw_user_meta_data->>'agent_course_version', '2026.1') else '2026.1' end,
    0,
    0,
    case when v_is_agent then new.raw_user_meta_data->>'agent_practical_mission' else null end,
    case when v_is_agent then 'not_started' else 'not_started' end,
    case when v_is_agent then new.raw_user_meta_data->>'agent_certificate_url' else null end
  );

  insert into public.consent_records (
    profile_id,
    consent_type,
    version,
    granted,
    legal_basis,
    purpose
  )
  values
    (
      new.id,
      'terms_of_use',
      coalesce(
        new.raw_user_meta_data->>'agent_terms_version',
        new.raw_user_meta_data->>'terms_version',
        'unknown'
      ),
      v_agent_terms_granted,
      'Execução de contrato (art. 7º, V, LGPD)',
      'Aceite dos Termos de Uso da plataforma no cadastro'
    ),
    (
      new.id,
      'privacy_policy',
      coalesce(
        new.raw_user_meta_data->>'agent_privacy_version',
        new.raw_user_meta_data->>'privacy_version',
        'unknown'
      ),
      v_agent_privacy_granted,
      'Execução de contrato e cumprimento de obrigação legal (art. 7º, V e II, LGPD)',
      'Ciência da Política de Privacidade e do tratamento de dados pessoais no cadastro'
    ),
    (
      new.id,
      'marketing_communications',
      'n/a',
      v_marketing_opt_in,
      'Consentimento (art. 7º, I, LGPD)',
      'Recebimento de comunicações de marketing e novidades por e-mail'
    );

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
