/**
 * Prayer time calculation using Adhan.js (open-source, MIT licensed).
 * https://github.com/batoulapps/adhan-js
 *
 * IMPORTANT: These are mathematically CALCULATED times based on sun position.
 * They are only used as a fallback / reference. The official WIC iqamah
 * schedule (entered by admins in Supabase) always takes priority for display
 * and must never be confused with these calculated times.
 */
import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
  SunnahTimes,
} from 'adhan';
import { MASJID_INFO, DEFAULT_PRAYER_SETTINGS } from '@/constants/masjid';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface CalculatedPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface PrayerCalculationSettings {
  calculationMethod: keyof typeof CalculationMethod;
  madhab: 'Shafi' | 'Hanafi';
}

const coordinates = new Coordinates(MASJID_INFO.latitude, MASJID_INFO.longitude);

function buildParams(settings: PrayerCalculationSettings) {
  const methodFn = CalculationMethod[settings.calculationMethod] as () => ReturnType<typeof CalculationMethod.MoonsightingCommittee>;
  const params = typeof methodFn === 'function' ? methodFn() : CalculationMethod.MoonsightingCommittee();
  params.madhab = settings.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

/** Calculate today's (or any date's) prayer times for WIC's coordinates. */
export function calculatePrayerTimes(
  date: Date = new Date(),
  settings: PrayerCalculationSettings = DEFAULT_PRAYER_SETTINGS
): CalculatedPrayerTimes {
  const params = buildParams(settings);
  const times = new PrayerTimes(coordinates, date, params);
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/** Get Sunnah times (last third of night, midnight) — useful for Ramadan / Tahajjud info. */
export function calculateSunnahTimes(date: Date = new Date(), settings?: PrayerCalculationSettings) {
  const params = buildParams(settings ?? DEFAULT_PRAYER_SETTINGS);
  const times = new PrayerTimes(coordinates, date, params);
  return new SunnahTimes(times);
}

/** Local Qibla direction (degrees from true north) — no external API needed. */
export function calculateQiblaDirection(
  latitude: number = MASJID_INFO.latitude,
  longitude: number = MASJID_INFO.longitude
): number {
  return Qibla(new Coordinates(latitude, longitude));
}

const PRAYER_ORDER: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface NextPrayerInfo {
  name: PrayerName;
  time: Date;
  msRemaining: number;
}

/**
 * Determine the next prayer (excluding sunrise from "next prayer" countdown
 * targeting, since sunrise has no iqamah) given a set of prayer times for
 * today AND tomorrow (to roll over after Isha).
 */
export function getNextPrayer(
  todayTimes: CalculatedPrayerTimes,
  tomorrowTimes: CalculatedPrayerTimes,
  now: Date = new Date(),
  includeSunrise = false
): NextPrayerInfo {
  const candidates = includeSunrise ? PRAYER_ORDER : PRAYER_ORDER.filter((p) => p !== 'sunrise');

  for (const name of candidates) {
    const time = todayTimes[name];
    if (time.getTime() > now.getTime()) {
      return { name, time, msRemaining: time.getTime() - now.getTime() };
    }
  }

  // All of today's prayers have passed — next prayer is tomorrow's Fajr
  const time = tomorrowTimes.fajr;
  return { name: 'fajr', time, msRemaining: time.getTime() - now.getTime() };
}

export function formatCountdown(msRemaining: number): string {
  const totalMinutes = Math.max(0, Math.floor(msRemaining / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
}

export const PRAYER_DISPLAY_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};
