import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { RamadanScheduleRow } from './database.types';
import { isRamadan } from './hijriDate';

const CACHE_KEY = 'wic_ramadan_schedule_cache_v1';

export async function getRamadanSchedule(): Promise<RamadanScheduleRow[]> {
  try {
    const { data, error } = await supabase
      .from('ramadan_schedule')
      .select('*')
      .order('date', { ascending: true });
    if (!error && data) {
      await cacheSet(CACHE_KEY, data);
      return data as RamadanScheduleRow[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<RamadanScheduleRow[]>(CACHE_KEY);
  return cached ?? [];
}

export async function getTodayRamadanSchedule(): Promise<RamadanScheduleRow | null> {
  const schedule = await getRamadanSchedule();
  const todayKey = new Date().toISOString().slice(0, 10);
  return schedule.find((s) => s.date === todayKey) ?? null;
}

/** Whether the Ramadan section should be automatically highlighted today. */
export function shouldShowRamadanMode(date: Date = new Date()): boolean {
  return isRamadan(date);
}
