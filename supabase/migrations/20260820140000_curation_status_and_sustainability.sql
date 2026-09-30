-- Sprint 3: richer curation status + public-facing sustainability content.

-- producer_applications gets its own status enum (was borrowing
-- profile_approval_status) so it can express "Documentação pendente" — an
-- admin-only intermediate state distinct from the account-access gate.
create type public.producer_application_status as enum ('pending', 'docs_pending', 'approved', 'rejected');

alter table public.producer_applications
  alter column status drop default;

alter table public.producer_applications
  alter column status type public.producer_application_status
  using status::text::public.producer_application_status;

alter table public.producer_applications
  alter column status set default 'pending'::public.producer_application_status;

-- rejection_reason now doubles as the admin's note for "docs_pending" too.
alter table public.producer_applications rename column rejection_reason to review_note;

create or replace function public.producer_applications_protect_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    -- Only an admin decision can move an application into 'approved' or
    -- 'docs_pending' — a producer resubmitting can only send it back to
    -- 'pending' (or self-withdraw to 'rejected', which only hurts them).
    if new.status in ('approved', 'docs_pending') then
      new.status = old.status;
    end if;

    if new.status <> old.status then
      new.reviewed_by = null;
      new.reviewed_at = null;
      new.review_note = null;
    else
      new.reviewed_by = old.reviewed_by;
      new.reviewed_at = old.reviewed_at;
      new.review_note = old.review_note;
    end if;
  end if;
  return new;
end;
$$;

-- Product detail page: short, specific "why this is sustainable" blurb —
-- distinct from the general description, and from products.material_origin
-- (which is a checkbox-tag array, not narrative text).
alter table public.products add column sustainability_note text;

-- Public cooperative page content (Sprint 3 item 4) — admin-curated for now,
-- same as the rest of the cooperatives table.
alter table public.cooperatives add column collects_description text;
alter table public.cooperatives add column operation_description text;
