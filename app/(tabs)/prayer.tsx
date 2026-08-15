import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { PrayerScheduleTable } from '@/components/PrayerScheduleTable';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { getDailyPrayerData, DailyPrayerData } from '@/lib/prayerData';
import { calculatePrayerTimes, getNextPrayer } from '@/lib/prayerTimes';
import { formatHijriDate } from '@/lib/hijriDate';
import { DEFAULT_PRAYER_SETTINGS } from '@/constants/masjid';

export default function PrayerScreen() {
  const router = useRouter();
  const [prayerData, setPrayerData] = useState<DailyPrayerData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getDailyPrayerData(new Date());
    setPrayerData(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const today = calculatePrayerTimes(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = calculatePrayerTimes(tomorrowDate);
  const next = getNextPrayer(today, tomorrow);
  const nextRow = prayerData?.rows.find((r) => r.name === next.name);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.hijriDate}>{formatHijriDate()} (calculated)</Text>
        </View>

        <NextPrayerCard
          nextPrayer={{ name: next.name, time: next.time }}
          iqamahTime={nextRow?.iqamah ?? null}
          isOfficialIqamah={nextRow?.isOfficial ?? false}
        />

        <View style={styles.section}>
          <SectionHeader title="Today's Schedule" />
          {prayerData ? <PrayerScheduleTable rows={prayerData.rows} /> : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Jumu'ah" actionLabel="View" onActionPress={() => router.push('/prayer/jumuah')} />
        </View>

        <View style={[styles.section, styles.infoSection]}>
          <Card>
            <Text style={styles.infoTitle}>Calculation Method</Text>
            <Text style={styles.infoBody}>
              Calculated ("Adhan") times use the {DEFAULT_PRAYER_SETTINGS.calculationMethod} method with{' '}
              {DEFAULT_PRAYER_SETTINGS.madhab} madhhab for Asr. These are estimates based on sun
              position at WIC's coordinates. The gold "Iqamah" times shown above are WIC's official
              congregation times, entered by masjid administrators, and always take priority.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.h1,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  hijriDate: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: { marginTop: spacing.xl },
  infoSection: { paddingHorizontal: spacing.lg },
  infoTitle: {
    fontSize: typography.h3,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoBody: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
