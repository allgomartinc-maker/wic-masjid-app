import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { formatHijriDate } from '@/lib/hijriDate';
import { supabase } from '@/lib/supabase';
import { cacheGet, cacheSet } from '@/lib/offlineCache';
import type { IslamicCalendarEventRow } from '@/lib/database.types';

const CACHE_KEY = 'wic_islamic_calendar_events_v1';

export default function IslamicCalendarScreen() {
  const [events, setEvents] = useState<IslamicCalendarEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('islamic_calendar_events')
          .select('*')
          .order('gregorian_date', { ascending: true });
        if (!error && data) {
          setEvents(data as IslamicCalendarEventRow[]);
          await cacheSet(CACHE_KEY, data);
        } else {
          const cached = await cacheGet<IslamicCalendarEventRow[]>(CACHE_KEY);
          setEvents(cached ?? []);
        }
      } catch {
        const cached = await cacheGet<IslamicCalendarEventRow[]>(CACHE_KEY);
        setEvents(cached ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date();
  const upcoming = events.filter((e) => new Date(e.gregorian_date) >= today);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Islamic Calendar' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.todayCard}>
          <Text style={styles.gregorianDate}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <Text style={styles.hijriDate}>{formatHijriDate(today)}</Text>
          <Text style={styles.disclaimer}>
            This Hijri date is calculated automatically and may differ by a day from WIC's
            officially announced local date, which depends on moon sighting.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Important Islamic Dates</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.lg }} />
        ) : upcoming.length === 0 ? (
          <Text style={styles.empty}>
            No confirmed dates have been published yet. WIC will announce Ramadan, Eid, and
            other important dates here once officially confirmed.
          </Text>
        ) : (
          upcoming.map((e) => (
            <Card key={e.id} style={styles.eventCard}>
              <View style={styles.eventHeaderRow}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                {e.is_holy_day && <Badge label="Holy Day" color={colors.goldDark} />}
              </View>
              <Text style={styles.eventDate}>
                {new Date(e.gregorian_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}
                {e.hijri_date}
              </Text>
              {e.description ? <Text style={styles.eventDescription}>{e.description}</Text> : null}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  todayCard: { alignItems: 'center', gap: spacing.xs },
  gregorianDate: { fontSize: typography.h3, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  hijriDate: { fontSize: typography.h1, fontWeight: fontWeight.bold, color: colors.navy },
  disclaimer: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  empty: { fontSize: typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  eventCard: { gap: spacing.xs },
  eventHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  eventDate: { fontSize: typography.caption, color: colors.goldDark, fontWeight: fontWeight.semibold },
  eventDescription: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
});
