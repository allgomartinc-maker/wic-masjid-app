import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { EventRow } from './database.types';

const CACHE_KEY = 'wic_events_cache_v1';

export async function getUpcomingEvents(): Promise<EventRow[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_at', { ascending: true });
    if (!error && data) {
      const now = Date.now();
      const upcoming = (data as EventRow[]).filter(
        (e) => new Date(e.end_at ?? e.start_at).getTime() >= now
      );
      await cacheSet(CACHE_KEY, upcoming);
      return upcoming;
    }
  } catch {
    // offline — fall through to cache
  }
  const cached = await cacheGet<EventRow[]>(CACHE_KEY);
  return cached ?? [];
}

export async function getEventById(id: string): Promise<EventRow | null> {
  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (!error && data) return data as EventRow;
  } catch {
    // ignore, try cache
  }
  const cached = await cacheGet<EventRow[]>(CACHE_KEY);
  return cached?.find((e) => e.id === id) ?? null;
}
