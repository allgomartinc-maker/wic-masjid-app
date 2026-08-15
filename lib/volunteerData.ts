import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { VolunteerOpportunityRow } from './database.types';

const CACHE_KEY = 'wic_volunteer_cache_v1';

export async function getVolunteerOpportunities(): Promise<VolunteerOpportunityRow[]> {
  try {
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .select('*')
      .eq('is_active', true)
      .order('start_at', { ascending: true });
    if (!error && data) {
      await cacheSet(CACHE_KEY, data);
      return data as VolunteerOpportunityRow[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<VolunteerOpportunityRow[]>(CACHE_KEY);
  return cached ?? [];
}

export const VOLUNTEER_CATEGORY_LABELS: Record<string, string> = {
  events: 'Events',
  ramadan: 'Ramadan',
  parking: 'Parking',
  cleaning: 'Cleaning',
  food_service: 'Food Service',
  youth: 'Youth Programs',
  fundraising: 'Fundraising',
  outreach: 'Community Outreach',
};
