-- ZAP production baseline: identity, outage intelligence, marketplace and impact.
-- Run with `supabase db push` after reviewing the policies for your organization.
create extension if not exists pgcrypto;

create type public.account_role as enum ('resident','provider','ngo','admin');
create type public.power_status as enum ('powered','outage','unstable','unknown');
create type public.verification_status as enum ('pending','verified','rejected','suspended');
create type public.request_status as enum ('draft','open','matched','in_progress','completed','cancelled','disputed');
create type public.order_status as enum ('pending','authorized','paid','in_progress','completed','refunded','disputed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role public.account_role not null default 'resident',
  home_district_id uuid,
  reputation_score integer not null default 50 check (reputation_score between 0 and 100),
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  organization_type text not null check (organization_type in ('business','ngo','community','government','donor')),
  registration_number text,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner','manager','member','viewer')),
  primary key (organization_id,user_id)
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  province text not null,
  population_estimate integer,
  centroid_lat numeric(9,6),
  centroid_lng numeric(9,6),
  boundary jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles add constraint profiles_home_district_fkey foreign key (home_district_id) references public.districts(id);

create table public.saved_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  district_id uuid references public.districts(id),
  label text not null,
  approximate_lat numeric(9,6),
  approximate_lng numeric(9,6),
  alert_outages boolean not null default true,
  alert_restorations boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.outage_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  district_id uuid not null references public.districts(id),
  area_label text,
  status public.power_status not null,
  description text check (char_length(description) <= 1000),
  approximate_lat numeric(9,6),
  approximate_lng numeric(9,6),
  source text not null default 'community' check (source in ('community','utility','partner','sensor','admin')),
  confidence_score numeric(4,3) not null default 0.500 check (confidence_score between 0 and 1),
  occurred_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours'),
  moderation_state text not null default 'published' check (moderation_state in ('pending','published','hidden','rejected')),
  created_at timestamptz not null default now()
);
create index outage_reports_district_time_idx on public.outage_reports(district_id,occurred_at desc);
create index outage_reports_active_idx on public.outage_reports(expires_at) where moderation_state='published';

create table public.report_confirmations (
  report_id uuid references public.outage_reports(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  agrees boolean not null,
  created_at timestamptz not null default now(),
  primary key(report_id,user_id)
);

create table public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  display_name text not null,
  bio text,
  service_districts uuid[] not null default '{}',
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  rating_average numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  response_time_minutes integer,
  payment_account_ref text,
  payment_account_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(user_id),
  title text not null,
  slug text not null unique,
  category text not null,
  description text not null,
  starting_price_minor bigint check (starting_price_minor >= 0),
  currency char(3) not null default 'ZMW',
  pricing_unit text,
  is_active boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_listings_search_idx on public.service_listings using gin(to_tsvector('english',title||' '||description));

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  district_id uuid references public.districts(id),
  category text not null,
  title text not null,
  description text not null,
  budget_min_minor bigint,
  budget_max_minor bigint,
  currency char(3) not null default 'ZMW',
  desired_by date,
  status public.request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id),
  scope text not null,
  price_minor bigint not null check (price_minor >= 0),
  currency char(3) not null default 'ZMW',
  estimated_days integer check (estimated_days > 0),
  status text not null default 'submitted' check (status in ('draft','submitted','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  unique(request_id,provider_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.service_requests(id),
  proposal_id uuid references public.proposals(id),
  customer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.provider_profiles(user_id),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  platform_fee_minor bigint not null default 0 check (platform_fee_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  currency char(3) not null default 'ZMW',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id),
  donation_id uuid,
  provider text not null check (provider in ('stripe','mobile_money','bank','manual')),
  external_reference text unique,
  amount_minor bigint not null check (amount_minor >= 0),
  currency char(3) not null,
  status text not null default 'pending' check (status in ('pending','authorized','paid','failed','refunded')),
  raw_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  reviewer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.provider_profiles(user_id),
  rating integer not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  moderation_state text not null default 'published',
  created_at timestamptz not null default now()
);

create table public.impact_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  district_id uuid references public.districts(id),
  title text not null,
  slug text not null unique,
  summary text not null,
  goal_minor bigint not null check (goal_minor > 0),
  raised_minor bigint not null default 0,
  currency char(3) not null default 'ZMW',
  beneficiaries_estimate integer,
  status text not null default 'draft' check (status in ('draft','fundraising','funded','implementing','completed','cancelled')),
  evidence jsonb not null default '[]',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.impact_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.impact_projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  milestone text not null,
  body text not null,
  evidence jsonb not null default '[]',
  published_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.impact_projects(id),
  donor_id uuid references public.profiles(id),
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null,
  anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);
alter table public.payments add constraint payments_donation_fkey foreign key (donation_id) references public.donations(id);

create table public.payment_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  primary key(provider,event_id)
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger providers_updated before update on public.provider_profiles for each row execute function public.set_updated_at();
create trigger listings_updated before update on public.service_listings for each row execute function public.set_updated_at();
create trigger requests_updated before update on public.service_requests for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.impact_projects for each row execute function public.set_updated_at();
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger security definer set search_path=public language plpgsql as $$
begin insert into public.profiles(id,full_name) values(new.id,new.raw_user_meta_data->>'full_name');return new;end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.districts enable row level security;
alter table public.saved_areas enable row level security;
alter table public.outage_reports enable row level security;
alter table public.report_confirmations enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.service_listings enable row level security;
alter table public.service_requests enable row level security;
alter table public.proposals enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.impact_projects enable row level security;
alter table public.impact_updates enable row level security;
alter table public.donations enable row level security;
alter table public.payment_events enable row level security;

create policy "public profiles are readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid()=id);
create policy "verified organizations are readable" on public.organizations for select using (verification_status='verified' or owner_id=auth.uid());
create policy "owners create organizations" on public.organizations for insert with check (owner_id=auth.uid());
create policy "owners update organizations" on public.organizations for update using (owner_id=auth.uid());
create policy "members read memberships" on public.organization_members for select using (user_id=auth.uid() or exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()));
create policy "owners manage memberships" on public.organization_members for all using (exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid())) with check (exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=auth.uid()));
create policy "public districts are readable" on public.districts for select using (true);
create policy "users manage saved areas" on public.saved_areas for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "published outage reports are readable" on public.outage_reports for select using (moderation_state='published');
create policy "authenticated users report" on public.outage_reports for insert to authenticated with check (auth.uid()=reporter_id);
create policy "reporters update fresh reports" on public.outage_reports for update using (auth.uid()=reporter_id and created_at>now()-interval '15 minutes');
create policy "confirmations are readable" on public.report_confirmations for select using (true);
create policy "users manage own confirmation" on public.report_confirmations for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "verified providers are readable" on public.provider_profiles for select using (verification_status='verified' or auth.uid()=user_id);
create policy "providers manage own profile" on public.provider_profiles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "active listings are readable" on public.service_listings for select using (is_active or auth.uid()=provider_id);
create policy "providers manage listings" on public.service_listings for all using (auth.uid()=provider_id) with check (auth.uid()=provider_id);
create policy "customers manage own requests" on public.service_requests for all using (auth.uid()=customer_id) with check (auth.uid()=customer_id);
create policy "verified providers see open requests" on public.service_requests for select using (status='open' and exists(select 1 from public.provider_profiles p where p.user_id=auth.uid() and p.verification_status='verified'));
create policy "proposal parties can read" on public.proposals for select using (auth.uid()=provider_id or exists(select 1 from public.service_requests r where r.id=request_id and r.customer_id=auth.uid()));
create policy "providers create proposals" on public.proposals for insert with check (auth.uid()=provider_id);
create policy "providers update proposals" on public.proposals for update using (auth.uid()=provider_id);
create policy "order parties can read" on public.orders for select using (auth.uid() in (customer_id,provider_id));
create policy "customers create orders" on public.orders for insert with check (auth.uid()=customer_id);
create policy "payment parties can read" on public.payments for select using (exists(select 1 from public.orders o where o.id=order_id and auth.uid() in (o.customer_id,o.provider_id)) or exists(select 1 from public.donations d where d.id=donation_id and d.donor_id=auth.uid()));
create policy "published reviews are readable" on public.reviews for select using (moderation_state='published');
create policy "customers review completed orders" on public.reviews for insert with check (auth.uid()=reviewer_id and exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid() and o.status='completed'));
create policy "published projects are readable" on public.impact_projects for select using (published_at is not null);
create policy "organization members manage projects" on public.impact_projects for all using (exists(select 1 from public.organization_members m where m.organization_id=impact_projects.organization_id and m.user_id=auth.uid() and m.member_role in ('owner','manager'))) with check (exists(select 1 from public.organization_members m where m.organization_id=impact_projects.organization_id and m.user_id=auth.uid() and m.member_role in ('owner','manager')));
create policy "published updates are readable" on public.impact_updates for select using (published_at<=now());
create policy "project organizations create updates" on public.impact_updates for insert with check (author_id=auth.uid() and exists(select 1 from public.impact_projects p join public.organization_members m on m.organization_id=p.organization_id where p.id=project_id and m.user_id=auth.uid() and m.member_role in ('owner','manager')));
create policy "donors read own donations" on public.donations for select using (auth.uid()=donor_id);
create policy "donors create donations" on public.donations for insert with check (auth.uid()=donor_id or donor_id is null);
-- payment_events intentionally has no client policies; service-role webhooks only.
