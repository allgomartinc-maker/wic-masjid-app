/**
 * Combines locally-calculated prayer times (Adhan.js) with the official WIC
 * iqamah schedule stored in Supabase. The official schedule ALWAYS takes
 * priority for iqamah display; calculated times are only shown as the
 * "Adhan" (calculated) column and are never presented as official iqamah.
 */
import { supabase } from './supabase';
import { calculatePrayerTimes, PrayerName } from './prayerTimes';
import { cacheGet, cacheSet } from './offlineCache';

export interface PrayerRow {
  name: PrayerName;
  adhan: Date;
  iqamah: Date | null; // null = no official iqamah set (e.g. Sunrise, or not yet entered)
  isOfficial: boolean; // true if iqamah came from WIC admin override
}

export interface DailyPrayerData {
  date: string; // YYYY-MM-DD
  rows: PrayerRow[];
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function combineDateAndTime(dateKey: string, timeStr: string | null): Date | null {
  if (!timeStr) return null;
  // timeStr expected as ISO timestamp (timestamptz) already, or HH:MM:SS
  if (timeStr.includes('T') || timeStr.includes('Z')) {
    return new Date(timeStr);
  }
  return new Date(`${dateKey}T${timeStr}`);
}

const CACHE_KEY = 'wic_prayer_times_cache_v1';

/**
 * Fetch today's official iqamah overrides from Supabase (with offline cache
 * fallback), merged with calculated Adhan times.
 */
export async function getDailyPrayerData(date: Date = new Date()): Promise<DailyPrayerData> {
  const dateKey = toDateKey(date);
  const calculated = calculatePrayerTimes(date);

  let officialRow: Record<string, string | null> | null = null;
  try {
    const { data, error } = await supabase
      .from('prayer_times')
      .select('*')
      .eq('date', dateKey)
      .maybeSingle();
    if (!error && data) {
      officialRow = data as unknown as Record<string, string | null>;
      await cacheSet(CACHE_KEY, officialRow);
    }
  } catch {
    // Network/offline — fall back to cache below
  }

  if (!officialRow) {
    officialRow = await cacheGet<Record<string, string | null>>(CACHE_KEY);
  }

  const officialFor = (prayer: PrayerName): Date | null => {
    if (!officialRow) return null;
    const key = `${prayer}_iqamah`;
    // Only use cached official row if it matches today's date to avoid
    // showing yesterday's iqamah times as today's when offline too long.
    if (officialRow.date && officialRow.date !== dateKey) return null;
    return combineDateAndTime(dateKey, officialRow[key] ?? null);
  };

  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const rows: PrayerRow[] = order.map((name) => {
    const iqamah = name === 'sunrise' ? null : officialFor(name);
    return {
      name,
      adhan: calculated[name],
      iqamah,
      isOfficial: iqamah !== null,
    };
  });

  return { date: dateKey, rows };
}
