import { supabase } from './supabase';
import { cacheGet, cacheSet } from './offlineCache';
import type { ProgramRow, ProgramCategory } from './database.types';

const CACHE_KEY = 'wic_programs_cache_v1';

export async function getPrograms(): Promise<ProgramRow[]> {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });
    if (!error && data) {
      await cacheSet(CACHE_KEY, data);
      return data as ProgramRow[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<ProgramRow[]>(CACHE_KEY);
  return cached ?? [];
}

export function groupProgramsByCategory(
  programs: ProgramRow[]
): Record<ProgramCategory, ProgramRow[]> {
  const groups: Record<ProgramCategory, ProgramRow[]> = {
    quran_education: [],
    youth: [],
    sisters: [],
    children: [],
  };
  for (const p of programs) {
    groups[p.category]?.push(p);
  }
  return groups;
}

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  quran_education: 'Quran & Education',
  youth: 'Youth Programs',
  sisters: "Sisters' Programs",
  children: "Children's Programs",
};
