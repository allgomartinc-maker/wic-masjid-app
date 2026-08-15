import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { AnnouncementRow } from './database.types';

const CACHE_KEY = 'wic_announcements_cache_v1';

export async function getAnnouncements(): Promise<AnnouncementRow[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) {
      const now = Date.now();
      const filtered = (data as AnnouncementRow[]).filter(
        (a) => !a.expires_at || new Date(a.expires_at).getTime() > now
      );
      await cacheSet(CACHE_KEY, filtered);
      return filtered;
    }
  } catch {
    // offline — fall through to cache
  }
  const cached = await cacheGet<AnnouncementRow[]>(CACHE_KEY);
  return cached ?? [];
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export function sortByPriority(items: AnnouncementRow[]): AnnouncementRow[] {
  return [...items].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
}
