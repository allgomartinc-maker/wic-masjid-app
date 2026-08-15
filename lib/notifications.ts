/**
 * Push notification setup using Expo Notifications (free, uses FCM/APNs
 * behind the scenes via Expo's push service — no Firebase project needed
 * for basic usage on Expo Go / EAS Build).
 *
 * Privacy: we only store the push token + the user's selected notification
 * categories. No personal profile or prayer-behavior tracking is created.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { cacheGet, cacheSet } from './offlineCache';
import { supabase } from './supabase';
import type { NotificationCategoryKey } from '@/constants/masjid';

const PREFS_CACHE_KEY = 'wic_notification_prefs_v1';

export type NotificationPreferences = Record<NotificationCategoryKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  prayers: false,
  jumuah: true,
  announcements: true,
  events: true,
  classes: false,
  fundraising: false,
  ramadan: true,
  eid: true,
  emergency: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const cached = await cacheGet<NotificationPreferences>(PREFS_CACHE_KEY);
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(cached ?? {}) };
}

export async function setNotificationPreference(
  key: NotificationCategoryKey,
  value: boolean
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences();
  const updated = { ...current, [key]: value };
  await cacheSet(PREFS_CACHE_KEY, updated);
  return updated;
}

/** Request permission and register for push notifications. Returns the Expo push token, or null if denied/unavailable. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'WIC Announcements',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;
  } catch {
    return null;
  }
}

/**
 * Save the device's push token + category preferences to Supabase so the
 * admin dashboard can target notifications by category. Silently no-ops if
 * offline (will retry next app open).
 */
export async function syncPushTokenToServer(
  token: string,
  preferences: NotificationPreferences
): Promise<void> {
  try {
    await supabase
      .from('device_push_tokens')
      .upsert(
        { token, preferences, updated_at: new Date().toISOString() },
        { onConflict: 'token' }
      );
  } catch {
    // Best-effort; safe to ignore if offline.
  }
}
