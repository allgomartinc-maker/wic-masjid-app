import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import { MASJID_INFO } from '@/constants/masjid';
import { NextPrayerCard } from '@/components/NextPrayerCard';
import { PrayerScheduleTable } from '@/components/PrayerScheduleTable';
import { SectionHeader } from '@/components/SectionHeader';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Card } from '@/components/Card';
import { getDailyPrayerData, DailyPrayerData } from '@/lib/prayerData';
import { getNextPrayer } from '@/lib/prayerTimes';
import { getAnnouncements } from '@/lib/announcementsData';
import { formatHijriDate } from '@/lib/hijriDate';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import type { AnnouncementRow } from '@/lib/database.types';

export default function HomeScreen() {
  const router = useRouter();
  const [prayerData, setPrayerData] = useState<DailyPrayerData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [daily, ann] = await Promise.all([getDailyPrayerData(today), getAnnouncements()]);
    setPrayerData(daily);
    setAnnouncements(ann.slice(0, 3));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const todayCalculated = calculatePrayerTimes(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowCalculated = calculatePrayerTimes(tomorrowDate);
  const next = getNextPrayer(todayCalculated, tomorrowCalculated);
  const nextRow = prayerData?.rows.find((r) => r.name === next.name);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.masjidName}>{MASJID_INFO.name}</Text>
          <Text style={styles.hijriDate}>{formatHijriDate()} (calculated)</Text>
        </View>

        <NextPrayerCard
          nextPrayer={{ name: next.name, time: next.time }}
          iqamahTime={nextRow?.iqamah ?? null}
          isOfficialIqamah={nextRow?.isOfficial ?? false}
        />

        {announcements.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Announcements"
              actionLabel="See all"
              onActionPress={() => router.push('/more/announcements')}
            />
            <View style={styles.announcementList}>
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader title="Today's Prayer Schedule" />
          {prayerData ? <PrayerScheduleTable rows={prayerData.rows} /> : null}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Jumu'ah"
            actionLabel="View details"
            onActionPress={() => router.push('/prayer/jumuah')}
          />
          <Card style={{ marginHorizontal: spacing.lg }}>
            <Text style={styles.jumuahHint}>
              Tap "View details" for this week's Jumu'ah khutbah &amp; iqamah times.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  masjidName: {
    fontSize: typography.h1,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    textAlign: 'center',
  },
  hijriDate: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  announcementList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  jumuahHint: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
});
