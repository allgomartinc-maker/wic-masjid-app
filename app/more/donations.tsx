import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getDonationCampaigns, calculateProgress, DONATION_CATEGORY_LABELS } from '@/lib/donationsData';
import type { DonationCampaignRow } from '@/lib/database.types';

export default function DonationsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<DonationCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDonationCampaigns().then((data) => {
      setCampaigns(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Donations' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Support The Woodlands Islamic Center. Donations are securely processed by our approved
          payment provider — we never collect or store your card information.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.empty}>No donation campaigns are currently active.</Text>
        ) : (
          campaigns.map((c) => {
            const progress = calculateProgress(c.raised_amount, c.goal_amount);
            return (
              <Card key={c.id} style={styles.campaignCard}>
                <Text style={styles.categoryLabel}>{DONATION_CATEGORY_LABELS[c.category] ?? c.category}</Text>
                <Text style={styles.campaignTitle}>{c.title}</Text>
                {c.description ? <Text style={styles.campaignDescription}>{c.description}</Text> : null}

                {c.goal_amount ? (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      ${(c.raised_amount ?? 0).toLocaleString()} raised of ${c.goal_amount.toLocaleString()} ({progress}%)
                    </Text>
                  </View>
                ) : null}

                <View style={{ marginTop: spacing.sm }}>
                  {c.category === 'building_fund' ? (
                    <Button label="Learn More & Donate" onPress={() => router.push('/more/building-fund')} />
                  ) : (
                    <Button label="Donate Now" onPress={() => Linking.openURL(c.donation_url)} />
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  campaignCard: { gap: spacing.xs },
  categoryLabel: {
    fontSize: typography.tiny,
    color: colors.goldDark,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  campaignTitle: { fontSize: typography.h2, fontWeight: fontWeight.bold, color: colors.textPrimary },
  campaignDescription: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  progressSection: { marginTop: spacing.sm, gap: spacing.xs },
  progressBarBg: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.goldDark,
    borderRadius: radius.pill,
  },
  progressText: { fontSize: typography.caption, color: colors.textMuted },
});
