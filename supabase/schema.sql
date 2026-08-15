-- ============================================================================
-- WIC Masjid App — Supabase Database Schema
-- ============================================================================
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New Query) on a
-- FREE Supabase project. This creates all tables, indexes, and Row Level
-- Security (RLS) policies used by the mobile app + admin dashboard.
--
-- Security model:
--   * Public (anon) users can only SELECT active/published rows.
--   * Only authenticated admins (rows in admin_users) can INSERT/UPDATE/DELETE.
--   * Role checks (super_admin, masjid_admin, content_editor, events_manager)
--     are enforced in policies below.
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ADMIN USERS & ROLES
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','masjid_admin','content_editor','events_manager')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

-- Helper functions are defined BEFORE any policy uses them, and are marked
-- SECURITY DEFINER so that policies (including ones on admin_users itself)
-- do not cause "infinite recursion detected in policy" errors — this is the
-- standard, documented Supabase pattern for self-referencing RLS checks.
create or replace function is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

create or replace function is_super_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from admin_users where id = auth.uid() and role = 'super_admin');
$$;

create or replace function has_admin_role(roles text[]) returns boolean
language sql security definer stable as $$
  select exists (select 1 from admin_users where id = auth.uid() and role = any(roles));
$$;

-- Admins can read the admin list (needed for role checks client-side)
create policy "Admins can view admin_users"
  on admin_users for select
  using (is_admin());

-- Only super_admin can manage admin_users
create policy "Super admins manage admin_users"
  on admin_users for all
  using (is_super_admin())
  with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- AUDIT LOG
-- ----------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id) on delete set null,
  action text not null,               -- e.g. 'create', 'update', 'delete'
  table_name text not null,
  record_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "Admins can view audit_log"
  on audit_log for select
  using (is_admin());

create policy "Admins can insert audit_log"
  on audit_log for insert
  with check (is_admin());

-- ----------------------------------------------------------------------------
-- PRAYER TIMES (calculated + official WIC overrides, one row per date)
-- ----------------------------------------------------------------------------
create table if not exists prayer_times (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  fajr_calculated timestamptz,
  sunrise_calculated timestamptz,
  dhuhr_calculated timestamptz,
  asr_calculated timestamptz,
  maghrib_calculated timestamptz,
  isha_calculated timestamptz,
  fajr_iqamah timestamptz,
  dhuhr_iqamah timestamptz,
  asr_iqamah timestamptz,
  maghrib_iqamah timestamptz,
  isha_iqamah timestamptz,
  hijri_date_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table prayer_times enable row level security;

create policy "Public can view prayer_times"
  on prayer_times for select
  using (true);

create policy "Masjid admins manage prayer_times"
  on prayer_times for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- JUMU'AH TIMES (multiple khutbahs supported)
-- ----------------------------------------------------------------------------
create table if not exists jumuah_times (
  id uuid primary key default gen_random_uuid(),
  jumuah_number int not null,
  khutbah_time time not null,
  iqamah_time time,
  notice text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jumuah_number)
);

alter table jumuah_times enable row level security;

create policy "Public can view jumuah_times"
  on jumuah_times for select
  using (true);

create policy "Masjid admins manage jumuah_times"
  on jumuah_times for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- ANNOUNCEMENTS
-- ----------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  category text not null default 'general' check (category in
    ('general','emergency','janazah','community','weather','program','ramadan','eid','fundraising')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "Public can view active announcements"
  on announcements for select
  using (is_active = true and (expires_at is null or expires_at > now()));

create policy "Admins view all announcements"
  on announcements for select
  using (is_admin());

create policy "Editors manage announcements"
  on announcements for all
  using (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor']))
  with check (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor']));

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  image_url text,
  category text not null default 'community' check (category in
    ('community','youth','sisters','brothers','children','education','fundraising','ramadan','eid')),
  registration_link text,
  is_active boolean not null default true,
  created_by uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "Public can view active events"
  on events for select
  using (is_active = true);

create policy "Events managers manage events"
  on events for all
  using (has_admin_role(array['super_admin', 'masjid_admin', 'events_manager']))
  with check (has_admin_role(array['super_admin', 'masjid_admin', 'events_manager']));

-- ----------------------------------------------------------------------------
-- PROGRAMS (Quran & Education, Youth, Sisters, Children)
-- ----------------------------------------------------------------------------
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('quran_education','youth','sisters','children')),
  description text,
  schedule text,
  location text,
  contact text,
  registration_link text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table programs enable row level security;

create policy "Public can view active programs"
  on programs for select
  using (is_active = true);

create policy "Editors manage programs"
  on programs for all
  using (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor']))
  with check (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor']));

-- ----------------------------------------------------------------------------
-- DONATION CAMPAIGNS
-- Note: donation_url points to WIC's existing approved payment provider page.
-- We never process or store card data ourselves.
-- ----------------------------------------------------------------------------
create table if not exists donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'general' check (category in
    ('general','building_fund','zakat','sadaqah','ramadan','education','community_assistance','other')),
  donation_url text not null,
  goal_amount numeric(12,2),
  raised_amount numeric(12,2) default 0,
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table donation_campaigns enable row level security;

create policy "Public can view active donation_campaigns"
  on donation_campaigns for select
  using (is_active = true);

create policy "Masjid admins manage donation_campaigns"
  on donation_campaigns for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- BUILDING FUND UPDATES (progress posts/photos for the new masjid project)
-- ----------------------------------------------------------------------------
create table if not exists building_fund_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table building_fund_updates enable row level security;

create policy "Public can view building_fund_updates"
  on building_fund_updates for select
  using (true);

create policy "Masjid admins manage building_fund_updates"
  on building_fund_updates for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- VOLUNTEER OPPORTUNITIES
-- ----------------------------------------------------------------------------
create table if not exists volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'events' check (category in
    ('events','ramadan','parking','cleaning','food_service','youth','fundraising','outreach')),
  start_at timestamptz,
  end_at timestamptz,
  location text,
  signup_form_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table volunteer_opportunities enable row level security;

create policy "Public can view active volunteer_opportunities"
  on volunteer_opportunities for select
  using (is_active = true);

create policy "Editors manage volunteer_opportunities"
  on volunteer_opportunities for all
  using (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor', 'events_manager']))
  with check (has_admin_role(array['super_admin', 'masjid_admin', 'content_editor', 'events_manager']));

-- ----------------------------------------------------------------------------
-- RAMADAN SCHEDULE (official WIC schedule, one row per Ramadan date)
-- ----------------------------------------------------------------------------
create table if not exists ramadan_schedule (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  suhoor_end time,
  fajr time,
  iftar time,
  taraweeh time,
  program_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ramadan_schedule enable row level security;

create policy "Public can view ramadan_schedule"
  on ramadan_schedule for select
  using (true);

create policy "Masjid admins manage ramadan_schedule"
  on ramadan_schedule for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- ISLAMIC CALENDAR EVENTS (admin-confirmed important dates)
-- ----------------------------------------------------------------------------
create table if not exists islamic_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  hijri_date text not null,
  gregorian_date date not null,
  category text not null default 'religious',
  is_holy_day boolean not null default false,
  created_at timestamptz not null default now()
);

alter table islamic_calendar_events enable row level security;

create policy "Public can view islamic_calendar_events"
  on islamic_calendar_events for select
  using (true);

create policy "Masjid admins manage islamic_calendar_events"
  on islamic_calendar_events for all
  using (has_admin_role(array['super_admin', 'masjid_admin']))
  with check (has_admin_role(array['super_admin', 'masjid_admin']));

-- ----------------------------------------------------------------------------
-- NEWSLETTER SUBSCRIBERS
-- ----------------------------------------------------------------------------
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  is_active boolean not null default true,
  notification_preferences jsonb not null default '{"prayers":true,"announcements":true,"events":true,"ramadan":true,"eid":true,"fundraising":true,"emergency":true}'
);

alter table newsletter_subscribers enable row level security;

-- Anyone can subscribe (insert their own email); no one can read the list
-- publicly to protect subscriber privacy. Admins can view/manage all.
create policy "Anyone can subscribe to newsletter"
  on newsletter_subscribers for insert
  with check (true);

create policy "Admins manage newsletter_subscribers"
  on newsletter_subscribers for all
  using (is_admin())
  with check (is_admin());

-- ----------------------------------------------------------------------------
-- DEVICE PUSH TOKENS (Expo push tokens + category preferences)
-- No personal identity is linked — just a device token and category flags.
-- ----------------------------------------------------------------------------
create table if not exists device_push_tokens (
  token text primary key,
  preferences jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table device_push_tokens enable row level security;

-- Devices can upsert their own token (no read-back of other devices' tokens)
create policy "Anyone can register a push token"
  on device_push_tokens for insert
  with check (true);

create policy "Anyone can update their own push token"
  on device_push_tokens for update
  using (true)
  with check (true);

create policy "Admins can view push tokens to send notifications"
  on device_push_tokens for select
  using (is_admin());

-- ----------------------------------------------------------------------------
-- HELPFUL INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_announcements_active on announcements (is_active, priority, created_at desc);
create index if not exists idx_events_start on events (start_at) where is_active = true;
create index if not exists idx_prayer_times_date on prayer_times (date desc);
create index if not exists idx_ramadan_schedule_date on ramadan_schedule (date);

-- ============================================================================
-- END OF SCHEMA
-- Next steps:
--   1. Create your first super_admin: sign up via Supabase Auth (email magic
--      link), then run:
--        insert into admin_users (id, role, display_name)
--        values ('<the-auth-user-uuid>', 'super_admin', 'Your Name');
--   2. Seed jumuah_times with your current Jumu'ah schedule.
--   3. Seed donation_campaigns with your existing payment provider links.
-- ============================================================================
