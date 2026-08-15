/**
 * Local Hijri (Islamic) calendar calculation — no external API required.
 *
 * Uses the standard tabular Islamic calendar algorithm (civil/arithmetic
 * calculation based on the Gregorian calendar), which is the same
 * approach used by most offline Islamic calendar tools.
 *
 * IMPORTANT: This is a CALCULATED estimate. The real Hijri date depends on
 * local moon sighting and can differ by 1 (occasionally 2) days from what
 * WIC officially announces. Always display the disclaimer in the UI, and
 * allow admins to override important dates (Ramadan start, Eid, etc.) once
 * officially confirmed — see islamic_calendar_events table.
 */

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

interface HijriDateResult {
  year: number;
  month: number; // 1-12
  day: number;
  monthName: string;
}

/** Convert a Gregorian Date to an estimated Hijri date (tabular algorithm). */
export function gregorianToHijri(date: Date): HijriDateResult {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Julian Day Number conversion
  let jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d -
    32075;

  // Islamic (Hijri) tabular calendar conversion from JD
  const l1 = jd - 1948440 + 10632;
  const n = Math.floor((l1 - 1) / 10631);
  let l2 = l1 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  l2 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hMonth = Math.floor((24 * l2) / 709);
  const hDay = l2 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthName: HIJRI_MONTHS[hMonth - 1] ?? '',
  };
}

export function formatHijriDate(date: Date = new Date()): string {
  const h = gregorianToHijri(date);
  return `${h.day} ${h.monthName} ${h.year} AH`;
}

/** True if the given Hijri month/day falls within Ramadan (month 9). */
export function isRamadan(date: Date = new Date()): boolean {
  return gregorianToHijri(date).month === 9;
}

export { HIJRI_MONTHS };
