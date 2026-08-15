import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { DonationCampaignRow, BuildingFundUpdateRow } from './database.types';

const CAMPAIGNS_CACHE_KEY = 'wic_donation_campaigns_cache_v1';
const BUILDING_FUND_CACHE_KEY = 'wic_building_fund_updates_cache_v1';

export async function getDonationCampaigns(): Promise<DonationCampaignRow[]> {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false });
    if (!error && data) {
      await cacheSet(CAMPAIGNS_CACHE_KEY, data);
      return data as DonationCampaignRow[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<DonationCampaignRow[]>(CAMPAIGNS_CACHE_KEY);
  return cached ?? [];
}

export async function getBuildingFundCampaign(): Promise<DonationCampaignRow | null> {
  const campaigns = await getDonationCampaigns();
  return campaigns.find((c) => c.category === 'building_fund') ?? null;
}

export async function getBuildingFundUpdates(): Promise<BuildingFundUpdateRow[]> {
  try {
    const { data, error } = await supabase
      .from('building_fund_updates')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      await cacheSet(BUILDING_FUND_CACHE_KEY, data);
      return data as BuildingFundUpdateRow[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<BuildingFundUpdateRow[]>(BUILDING_FUND_CACHE_KEY);
  return cached ?? [];
}

export function calculateProgress(raised: number | null, goal: number | null): number {
  if (!raised || !goal || goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export const DONATION_CATEGORY_LABELS: Record<string, string> = {
  general: 'General Donation',
  building_fund: 'Masjid Building Fund',
  zakat: 'Zakat',
  sadaqah: 'Sadaqah',
  ramadan: 'Ramadan',
  education: 'Education',
  community_assistance: 'Community Assistance',
  other: 'Other',
};
