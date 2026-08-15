/**
 * Hand-written TypeScript types mirroring supabase/schema.sql.
 * If you change the schema, update this file to match
 * (or generate with `npx supabase gen types typescript`).
 */

export type AdminRole = 'super_admin' | 'masjid_admin' | 'content_editor' | 'events_manager';

export type AnnouncementCategory =
  | 'general'
  | 'emergency'
  | 'janazah'
  | 'community'
  | 'weather'
  | 'program'
  | 'ramadan'
  | 'eid'
  | 'fundraising';

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';

export type EventCategory =
  | 'community'
  | 'youth'
  | 'sisters'
  | 'brothers'
  | 'children'
  | 'education'
  | 'fundraising'
  | 'ramadan'
  | 'eid';

export type ProgramCategory = 'quran_education' | 'youth' | 'sisters' | 'children';

export type DonationCategory =
  | 'general'
  | 'building_fund'
  | 'zakat'
  | 'sadaqah'
  | 'ramadan'
  | 'education'
  | 'community_assistance'
  | 'other';

export type VolunteerCategory =
  | 'events'
  | 'ramadan'
  | 'parking'
  | 'cleaning'
  | 'food_service'
  | 'youth'
  | 'fundraising'
  | 'outreach';

export type PrayerTimesRow = {
  id: string;
  date: string; // YYYY-MM-DD
  fajr_calculated: string | null;
  sunrise_calculated: string | null;
  dhuhr_calculated: string | null;
  asr_calculated: string | null;
  maghrib_calculated: string | null;
  isha_calculated: string | null;
  fajr_iqamah: string | null;
  dhuhr_iqamah: string | null;
  asr_iqamah: string | null;
  maghrib_iqamah: string | null;
  isha_iqamah: string | null;
  hijri_date_override: string | null;
  created_at: string;
  updated_at: string;
}

export type JumuahTimeRow = {
  id: string;
  jumuah_number: number;
  khutbah_time: string; // HH:MM:SS
  iqamah_time: string | null;
  notice: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AnnouncementRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  image_url: string | null;
  category: EventCategory;
  registration_link: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProgramRow = {
  id: string;
  title: string;
  category: ProgramCategory;
  description: string | null;
  schedule: string | null;
  location: string | null;
  contact: string | null;
  registration_link: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DonationCampaignRow = {
  id: string;
  title: string;
  description: string | null;
  category: DonationCategory;
  donation_url: string;
  goal_amount: number | null;
  raised_amount: number | null;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BuildingFundUpdateRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export type VolunteerOpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  category: VolunteerCategory;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  signup_form_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RamadanScheduleRow = {
  id: string;
  date: string;
  suhoor_end: string | null;
  fajr: string | null;
  iftar: string | null;
  taraweeh: string | null;
  program_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type IslamicCalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  hijri_date: string;
  gregorian_date: string;
  category: string;
  is_holy_day: boolean;
  created_at: string;
}

export type AdminUserRow = {
  id: string;
  role: AdminRole;
  display_name: string | null;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  admin_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  notification_preferences: Record<string, boolean>;
}

export type DevicePushTokenRow = {
  token: string;
  preferences: Record<string, boolean>;
  updated_at: string;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      device_push_tokens: Table<DevicePushTokenRow>;
      prayer_times: Table<PrayerTimesRow>;
      jumuah_times: Table<JumuahTimeRow>;
      announcements: Table<AnnouncementRow>;
      events: Table<EventRow>;
      programs: Table<ProgramRow>;
      donation_campaigns: Table<DonationCampaignRow>;
      building_fund_updates: Table<BuildingFundUpdateRow>;
      volunteer_opportunities: Table<VolunteerOpportunityRow>;
      ramadan_schedule: Table<RamadanScheduleRow>;
      islamic_calendar_events: Table<IslamicCalendarEventRow>;
      admin_users: Table<AdminUserRow>;
      audit_log: Table<AuditLogRow>;
      newsletter_subscribers: Table<NewsletterSubscriberRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}


