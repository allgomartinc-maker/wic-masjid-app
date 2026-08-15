/**
 * Static configuration for The Woodlands Islamic Center.
 * Update coordinates/contact info here if they ever change.
 * Prayer calculation settings can be overridden by admins in the database;
 * these are the fallback defaults used before any admin override is loaded.
 */

export const MASJID_INFO = {
  name: 'The Woodlands Islamic Center',
  shortName: 'WIC',
  address: '1520 Lake Front Cir, The Woodlands, TX 77380',
  phone: '+1 (281) 363-2400',
  email: 'info@wicmasjid.org',
  website: 'https://www.wicmasjid.org',
  officeHours: 'Mon–Fri: 9:00 AM – 5:00 PM',
  latitude: 30.1658,
  longitude: -95.4613,
  timezone: 'America/Chicago',
};

// Default calculation settings — can be overridden by admin-configured values
// fetched from Supabase (see lib/prayerSettings.ts).
export const DEFAULT_PRAYER_SETTINGS = {
  calculationMethod: 'MoonsightingCommittee' as const,
  madhab: 'Shafi' as const, // 'Shafi' (standard) or 'Hanafi' (later Asr)
};

export const NOTIFICATION_CATEGORIES = [
  { key: 'prayers', label: 'Prayer Reminders' },
  { key: 'jumuah', label: "Jumu'ah Reminders" },
  { key: 'announcements', label: 'General Announcements' },
  { key: 'events', label: 'Events' },
  { key: 'classes', label: 'Classes & Programs' },
  { key: 'fundraising', label: 'Fundraising' },
  { key: 'ramadan', label: 'Ramadan Updates' },
  { key: 'eid', label: 'Eid Updates' },
  { key: 'emergency', label: 'Emergency Announcements' },
] as const;

export type NotificationCategoryKey = (typeof NOTIFICATION_CATEGORIES)[number]['key'];
