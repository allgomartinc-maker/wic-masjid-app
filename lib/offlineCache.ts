/**
 * Lightweight offline cache built on AsyncStorage.
 * Used to keep essential info (prayer times, masjid info, announcements)
 * available when the device has poor/no internet connectivity.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@wic_cache:';

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ value, cachedAt: Date.now() }));
  } catch {
    // Storage full or unavailable — fail silently, caching is best-effort
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: T; cachedAt: number };
    return parsed.value;
  } catch {
    return null;
  }
}

export async function cacheGetWithTimestamp<T>(
  key: string
): Promise<{ value: T; cachedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as { value: T; cachedAt: number };
  } catch {
    return null;
  }
}

export async function cacheClear(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
