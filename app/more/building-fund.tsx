import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getBuildingFundCampaign, getBuildingFundUpdates, calculateProgress } from '@/lib/donationsData';
import type { DonationCampaignRow, BuildingFundUpdateRow } from '@/lib/database.types';

export default function BuildingFundScreen() {
  const [campaign, setCampaign] = useState<DonationCampaignRow | null>(null);
  const [updates, setUpdates] = useState<BuildingFundUpdateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBuildingFundCampaign(), getBuildingFundUpdates()]).then(([c, u]) => {
      setCampaign(c);
      setUpdates(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  const progress = campaign ? calculateProgress(campaign.raised_amount, campaign.goal_amount) : 0;
  const remaining =
    campaign?.goal_amount != null
      ? Math.max(0, campaign.goal_amount - (campaign.raised_amount ?? 0))
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Building Fund' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {campaign?.image_url ? (
          <Image source={{ uri: campaign.image_url }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        <Text style={styles.title}>{campaign?.title ?? 'New Masjid Building Project'}</Text>
        {campaign?.description ? <Text style={styles.description}>{campaign.description}</Text> : null}

        {campaign?.goal_amount ? (
          <Card style={styles.progressCard}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statValue}>${(campaign.raised_amount ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Raised</Text>
              </View>
              <View>
                <Text style={styles.statValue}>{progress}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
              <View>
                <Text style={styles.statValue}>${remaining?.toLocaleString() ?? '—'}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </Card>
        ) : null}

        {campaign ? (
          <View style={{ marginTop: spacing.md }}>
            <Button label="Donate to Building Fund" onPress={() => Linking.openURL(campaign.donation_url)} />
          </View>
        ) : (
          <Text style={styles.empty}>Building fund details have not been published yet.</Text>
        )}

        {updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>Project Updates</Text>
            {updates.map((u) => (
              <Card key={u.id} style={styles.updateCard}>
                {u.image_url ? (
                  <Image source={{ uri: u.image_url }} style={styles.updateImage} resizeMode="cover" />
                ) : null}
                <Text style={styles.updateTitle}>{u.title}</Text>
                {u.description ? <Text style={styles.updateDescription}>{u.description}</Text> : null}
                <Text style={styles.updateDate}>
                  {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  heroImage: { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: spacing.md },
  title: { fontSize: typography.h1, fontWeight: fontWeight.bold, color: colors.textPrimary },
  description: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.sm },
  progressCard: { marginTop: spacing.lg, gap: spacing.md },
  progressBarBg: { height: 14, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.goldDark, borderRadius: radius.pill },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.navy, textAlign: 'center' },
  statLabel: { fontSize: typography.tiny, color: colors.textMuted, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.lg },
  updatesSection: { marginTop: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: typography.h2, fontWeight: fontWeight.bold, color: colors.textPrimary },
  updateCard: { gap: spacing.xs },
  updateImage: { width: '100%', height: 160, borderRadius: radius.md },
  updateTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  updateDescription: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  updateDate: { fontSize: typography.tiny, color: colors.textMuted },
});
