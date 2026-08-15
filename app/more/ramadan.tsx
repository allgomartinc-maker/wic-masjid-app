import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { getRamadanSchedule, shouldShowRamadanMode } from '@/lib/ramadanData';
import type { RamadanScheduleRow } from '@/lib/database.types';

function formatTime(timeStr: string | null): string {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function RamadanScreen() {
  const [schedule, setSchedule] = useState<RamadanScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isRamadanNow = shouldShowRamadanMode();

  useEffect(() => {
    getRamadanSchedule().then((data) => {
      setSchedule(data);
      setLoading(false);
    });
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Ramadan' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {isRamadanNow && (
          <Card style={styles.bannerCard}>
            <Text style={styles.bannerText}>🌙 Ramadan Mubarak! May this month bring peace and blessings.</Text>
          </Card>
        )}

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
        ) : schedule.length === 0 ? (
          <Text style={styles.empty}>
            The official WIC Ramadan schedule has not been published yet. Please check back closer
            to Ramadan.
          </Text>
        ) : (
          schedule.map((day) => (
            <Card
              key={day.id}
              style={[styles.dayCard, day.date === todayKey ? styles.todayCard : undefined]}
            >
              <Text style={styles.dayDate}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {day.date === todayKey ? '  (Today)' : ''}
              </Text>
              <View style={styles.timesRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Suhoor Ends</Text>
                  <Text style={styles.timeValue}>{formatTime(day.suhoor_end)}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Fajr</Text>
                  <Text style={styles.timeValue}>{formatTime(day.fajr)}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Iftar</Text>
                  <Text style={[styles.timeValue, styles.iftarValue]}>{formatTime(day.iftar)}</Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Taraweeh</Text>
                  <Text style={styles.timeValue}>{formatTime(day.taraweeh)}</Text>
                </View>
              </View>
              {day.program_notes ? <Text style={styles.notes}>{day.program_notes}</Text> : null}
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
  bannerCard: { backgroundColor: colors.navy },
  bannerText: { color: colors.textOnDark, fontSize: typography.body, fontWeight: fontWeight.semibold, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  dayCard: { gap: spacing.sm },
  todayCard: { borderColor: colors.goldDark, borderWidth: 2 },
  dayDate: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  timeBlock: { minWidth: 80 },
  timeLabel: { fontSize: typography.tiny, color: colors.textMuted, textTransform: 'uppercase' },
  timeValue: { fontSize: typography.body, fontWeight: fontWeight.bold, color: colors.textPrimary },
  iftarValue: { color: colors.goldDark },
  notes: { fontSize: typography.caption, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.xs },
});
