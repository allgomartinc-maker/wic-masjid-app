/**
 * Quran data source: AlQuran Cloud API (https://alquran.cloud/api)
 * A free, open REST API maintained by the Islamic Network project.
 *
 * SOURCE & LICENSING:
 *  - Arabic text: "quran-uthmani" edition — standard Uthmani script, the
 *    same text used across the vast majority of printed Mus'hafs.
 *  - English translation: "en.sahih" — Saheeh International (widely used,
 *    free-to-distribute translation).
 *  - Audio recitation: "ar.alafasy" — Sheikh Mishary Rashid Alafasy,
 *    served from the Islamic Network's free CDN (cdn.islamic.network).
 * We do NOT modify the Quran text in any way; text is displayed exactly as
 * returned by the API. No API key or payment is required for this service.
 * If the API becomes unavailable, the last-viewed surah is cached locally
 * for offline reading (see offlineCache.ts).
 */
import { cacheGet, cacheSet } from './offlineCache';

const BASE_URL = 'https://api.alquran.cloud/v1';
const ARABIC_EDITION = 'quran-uthmani';
const TRANSLATION_EDITION = 'en.sahih';
const AUDIO_EDITION = 'ar.alafasy';

export interface SurahMeta {
  number: number;
  name: string; // Arabic name
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number; // global ayah number
  numberInSurah: number;
  arabicText: string;
  translationText: string;
  audioUrl: string;
  page: number;
  juz: number;
}

export interface SurahDetail {
  meta: SurahMeta;
  ayahs: Ayah[];
}

const SURAH_LIST_CACHE_KEY = 'wic_quran_surah_list_v1';
const surahDetailCacheKey = (num: number) => `wic_quran_surah_${num}_v1`;

export async function getSurahList(): Promise<SurahMeta[]> {
  try {
    const res = await fetch(`${BASE_URL}/surah`);
    const json = await res.json();
    if (json.code === 200) {
      await cacheSet(SURAH_LIST_CACHE_KEY, json.data);
      return json.data as SurahMeta[];
    }
  } catch {
    // offline
  }
  const cached = await cacheGet<SurahMeta[]>(SURAH_LIST_CACHE_KEY);
  return cached ?? [];
}

export async function getSurah(number: number): Promise<SurahDetail | null> {
  const cacheKey = surahDetailCacheKey(number);
  try {
    const res = await fetch(
      `${BASE_URL}/surah/${number}/editions/${ARABIC_EDITION},${TRANSLATION_EDITION},${AUDIO_EDITION}`
    );
    const json = await res.json();
    if (json.code === 200) {
      const [arabic, translation, audio] = json.data;
      const ayahs: Ayah[] = arabic.ayahs.map((a: any, i: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        arabicText: a.text,
        translationText: translation.ayahs[i].text,
        audioUrl: audio.ayahs[i].audio,
        page: a.page,
        juz: a.juz,
      }));
      const result: SurahDetail = {
        meta: {
          number: arabic.number,
          name: arabic.name,
          englishName: arabic.englishName,
          englishNameTranslation: arabic.englishNameTranslation,
          numberOfAyahs: arabic.numberOfAyahs,
          revelationType: arabic.revelationType,
        },
        ayahs,
      };
      await cacheSet(cacheKey, result);
      return result;
    }
  } catch {
    // offline — fall through to cache
  }
  return cacheGet<SurahDetail>(cacheKey);
}

export async function searchQuran(query: string): Promise<{ surah: SurahMeta; ayah: Ayah }[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${BASE_URL}/search/${encodeURIComponent(query)}/all/${TRANSLATION_EDITION}`
    );
    const json = await res.json();
    if (json.code === 200) {
      return json.data.matches.map((m: any) => ({
        surah: m.surah,
        ayah: {
          number: m.number,
          numberInSurah: m.numberInSurah,
          arabicText: '',
          translationText: m.text,
          audioUrl: '',
          page: 0,
          juz: 0,
        },
      }));
    }
  } catch {
    // search requires network; no offline fallback
  }
  return [];
}

export const QURAN_SOURCE_INFO = {
  arabicSource: 'Uthmani script (quran-uthmani), via alquran.cloud',
  translationSource: 'Saheeh International (en.sahih), via alquran.cloud',
  audioSource: 'Sheikh Mishary Rashid Alafasy (ar.alafasy), via cdn.islamic.network',
  apiProvider: 'AlQuran Cloud / Islamic Network — free, open REST API',
  apiUrl: 'https://alquran.cloud/api',
};
