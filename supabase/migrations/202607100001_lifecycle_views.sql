-- ZAP lifecycle layer: keep public pages current while preserving history.
-- Run this after 202606280001_initial_platform.sql.

alter table public.outage_reports
  add column if not exists resolved_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.service_listings
  add column if not exists available_until timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.service_requests
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table public.impact_projects
  add column if not exists archived_at timestamptz;

create index if not exists outage_reports_public_active_idx
  on public.outage_reports(district_id, occurred_at desc)
  where moderation_state = 'published' and archived_at is null;

create index if not exists service_listings_public_active_idx
  on public.service_listings(updated_at desc)
  where is_active = true and archived_at is null;

create index if not exists service_requests_active_idx
  on public.service_requests(customer_id, updated_at desc)
  where archived_at is null;

create or replace view public.active_outage_reports
with (security_invoker = true) as
select
  r.id,
  r.district_id,
  d.name as district_name,
  d.province,
  r.area_label,
  r.status,
  r.description,
  r.source,
  r.confidence_score,
  r.occurred_at,
  r.expires_at,
  r.created_at
from public.outage_reports r
join public.districts d on d.id = r.district_id
where r.moderation_state = 'published'
  and r.archived_at is null
  and r.expires_at > now();

create or replace view public.current_district_power_status
with (security_invoker = true) as
with counts as (
  select
    d.id as district_id,
    d.name as district_name,
    d.province,
    count(r.id)::integer as total_reports,
    count(r.id) filter (where r.status = 'powered')::integer as powered_reports,
    count(r.id) filter (where r.status = 'outage')::integer as outage_reports,
    count(r.id) filter (where r.status = 'unstable')::integer as unstable_reports,
    max(r.occurred_at) as last_reported_at
  from public.districts d
  left join public.outage_reports r
    on r.district_id = d.id
    and r.moderation_state = 'published'
    and r.archived_at is null
    and r.expires_at > now()
  group by d.id, d.name, d.province
)
select
  district_id,
  district_name,
  province,
  case
    when total_reports = 0 then 'unknown'::public.power_status
    when outage_reports >= powered_reports and outage_reports >= unstable_reports then 'outage'::public.power_status
    when unstable_reports >= powered_reports then 'unstable'::public.power_status
    else 'powered'::public.power_status
  end as status,
  total_reports,
  powered_reports,
  outage_reports,
  unstable_reports,
  case
    when total_reports = 0 then 0::numeric(4,3)
    else round((greatest(powered_reports, outage_reports, unstable_reports)::numeric / total_reports)::numeric, 3)
  end as confidence_score,
  last_reported_at
from counts;

create or replace view public.available_service_listings
with (security_invoker = true) as
select
  l.id,
  l.provider_id,
  l.title,
  l.slug,
  l.category,
  l.description,
  l.starting_price_minor,
  l.currency,
  l.pricing_unit,
  l.tags,
  l.updated_at,
  l.available_until,
  p.display_name as provider_name,
  p.verification_status as provider_verification_status,
  p.rating_average,
  p.rating_count,
  p.response_time_minutes
from public.service_listings l
join public.provider_profiles p on p.user_id = l.provider_id
where l.is_active = true
  and l.archived_at is null
  and (l.available_until is null or l.available_until > now())
  and p.verification_status = 'verified';

create or replace view public.active_service_requests
with (security_invoker = true) as
select
  r.id,
  r.customer_id,
  r.district_id,
  d.name as district_name,
  r.category,
  r.title,
  r.description,
  r.budget_min_minor,
  r.budget_max_minor,
  r.currency,
  r.desired_by,
  r.status,
  r.created_at,
  r.updated_at
from public.service_requests r
left join public.districts d on d.id = r.district_id
where r.archived_at is null
  and r.status in ('open', 'matched', 'in_progress', 'disputed');

create or replace function public.archive_expired_records()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_reports integer := 0;
  archived_listings integer := 0;
  archived_requests integer := 0;
begin
  update public.outage_reports
     set archived_at = now()
   where archived_at is null
     and expires_at <= now();
  get diagnostics archived_reports = row_count;

  update public.service_listings
     set archived_at = now(),
         is_active = false,
         updated_at = now()
   where archived_at is null
     and available_until is not null
     and available_until <= now();
  get diagnostics archived_listings = row_count;

  update public.service_requests
     set archived_at = now(),
         completed_at = coalesce(completed_at, case when status = 'completed' then now() else completed_at end),
         updated_at = now()
   where archived_at is null
     and status in ('completed', 'cancelled');
  get diagnostics archived_requests = row_count;

  return jsonb_build_object(
    'archived_reports', archived_reports,
    'archived_listings', archived_listings,
    'archived_requests', archived_requests
  );
end;
$$;

grant select on public.active_outage_reports to anon, authenticated;
grant select on public.current_district_power_status to anon, authenticated;
grant select on public.available_service_listings to anon, authenticated;
grant select on public.active_service_requests to authenticated;

revoke all on function public.archive_expired_records() from anon, authenticated;
grant execute on function public.archive_expired_records() to service_role;
