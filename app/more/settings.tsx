import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { NOTIFICATION_CATEGORIES } from '@/constants/masjid';
import {
  getNotificationPreferences,
  setNotificationPreference,
  registerForPushNotificationsAsync,
  syncPushTokenToServer,
  NotificationPreferences,
} from '@/lib/notifications';
import { subscribeToNewsletter } from '@/lib/newsletter';

export default function SettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    getNotificationPreferences().then(setPreferences);
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const updated = await setNotificationPreference(key as any, value);
    setPreferences(updated);

    // Ensure we have push permission/token if any category is enabled
    const anyEnabled = Object.values(updated).some(Boolean);
    if (anyEnabled && !pushToken) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        await syncPushTokenToServer(token, updated);
      } else {
        Alert.alert(
          'Notifications disabled',
          'Please enable notification permissions in your device settings to receive push notifications.'
        );
      }
    } else if (pushToken) {
      await syncPushTokenToServer(pushToken, updated);
    }
  };

  const handleNewsletterSubscribe = async () => {
    setSubscribing(true);
    const result = await subscribeToNewsletter(newsletterEmail);
    setSubscribing(false);
    if (result.success) {
      Alert.alert('Subscribed!', "You're now subscribed to the WIC newsletter.");
      setNewsletterEmail('');
    } else {
      Alert.alert('Error', result.error ?? 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Newsletter</Text>
        <Text style={styles.hint}>Subscribe to receive WIC's email newsletter with community updates.</Text>
        <Card style={[styles.card, { padding: spacing.lg, marginBottom: spacing.xl }]}>
          <TextInput
            style={styles.emailInput}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={newsletterEmail}
            onChangeText={setNewsletterEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Button label="Subscribe" onPress={handleNewsletterSubscribe} loading={subscribing} />
        </Card>

        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.hint}>
          Choose exactly what you want to be notified about. You can change these anytime.
        </Text>
        <Card style={styles.card}>
          {NOTIFICATION_CATEGORIES.map((cat, idx) => (
            <View
              key={cat.key}
              style={[
                styles.row,
                idx === NOTIFICATION_CATEGORIES.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.rowLabel}>{cat.label}</Text>
              <Switch
                value={preferences?.[cat.key] ?? false}
                onValueChange={(v) => handleToggle(cat.key, v)}
                trackColor={{ false: colors.border, true: colors.goldDark }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </Card>

        <Text style={styles.privacyNote}>
          Privacy: We only use your notification preferences to decide what to send you. We do
          not track your prayer habits or build a profile of your religious practice.
        </Text>

        <View style={styles.adminLinkWrap}>
          <Text style={styles.adminLink} onPress={() => router.push('/admin')}>
            WIC Staff: Admin Dashboard →
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  sectionTitle: { fontSize: typography.h2, fontWeight: fontWeight.bold, color: colors.textPrimary },
  hint: { fontSize: typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  card: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontSize: typography.body, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
  emailInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  privacyNote: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  adminLinkWrap: { marginTop: spacing.xl, alignItems: 'center' },
  adminLink: { fontSize: typography.caption, color: colors.textMuted, textDecorationLine: 'underline' },
});
