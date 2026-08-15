import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { JumuahTimeRow } from './database.types';

const CACHE_KEY = 'wic_jumuah_cache_v1';

export async function getJumuahTimes(): Promise<JumuahTimeRow[]> {
  try {
    const { data, error } = await supabase
      .from('jumuah_times')
      .select('*')
      .eq('is_active', true)
      .order('jumuah_number', { ascending: true });
    if (!error && data) {
      await cacheSet(CACHE_KEY, data);
      return data as JumuahTimeRow[];
    }
  } catch {
    // offline — fall through to cache
  }
  const cached = await cacheGet<JumuahTimeRow[]>(CACHE_KEY);
  return cached ?? [];
}
