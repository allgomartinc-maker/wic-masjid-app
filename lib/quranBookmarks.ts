/**
 * Quran bookmarks and last-read position — stored locally on-device only.
 * This is private reading data; we do not sync it to any server or
 * associate it with a user identity, consistent with our privacy policy of
 * not tracking religious practice.
 */
import { cacheGet, cacheSet } from './offlineCache';

export interface Bookmark {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  createdAt: number;
}

export interface LastReadPosition {
  surahNumber: number;
  surahName: string;
  ayahNumberInSurah: number;
  updatedAt: number;
}

const BOOKMARKS_KEY = 'wic_quran_bookmarks_v1';
const LAST_READ_KEY = 'wic_quran_last_read_v1';

export async function getBookmarks(): Promise<Bookmark[]> {
  return (await cacheGet<Bookmark[]>(BOOKMARKS_KEY)) ?? [];
}

export async function addBookmark(bookmark: Omit<Bookmark, 'createdAt'>): Promise<Bookmark[]> {
  const current = await getBookmarks();
  const exists = current.some(
    (b) => b.surahNumber === bookmark.surahNumber && b.ayahNumberInSurah === bookmark.ayahNumberInSurah
  );
  if (exists) return current;
  const updated = [...current, { ...bookmark, createdAt: Date.now() }];
  await cacheSet(BOOKMARKS_KEY, updated);
  return updated;
}

export async function removeBookmark(surahNumber: number, ayahNumberInSurah: number): Promise<Bookmark[]> {
  const current = await getBookmarks();
  const updated = current.filter(
    (b) => !(b.surahNumber === surahNumber && b.ayahNumberInSurah === ayahNumberInSurah)
  );
  await cacheSet(BOOKMARKS_KEY, updated);
  return updated;
}

export async function getLastReadPosition(): Promise<LastReadPosition | null> {
  return cacheGet<LastReadPosition>(LAST_READ_KEY);
}

export async function saveLastReadPosition(position: Omit<LastReadPosition, 'updatedAt'>): Promise<void> {
  await cacheSet(LAST_READ_KEY, { ...position, updatedAt: Date.now() });
}
