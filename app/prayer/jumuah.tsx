import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { getJumuahTimes } from '@/lib/jumuahData';
import type { JumuahTimeRow } from '@/lib/database.types';

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function JumuahScreen() {
  const [times, setTimes] = useState<JumuahTimeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJumuahTimes()
      .then(setTimes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: "Jumu'ah" }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Official Jumu'ah khutbah and iqamah times as entered by WIC administrators.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
        ) : times.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Jumu'ah times have not been published yet. Please check back soon.</Text>
          </Card>
        ) : (
          times.map((jt) => (
            <Card key={jt.id} style={styles.jumuahCard}>
              <Text style={styles.jumuahLabel}>Jumu'ah {jt.jumuah_number}</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Khutbah</Text>
                  <Text style={styles.timeValue}>{formatTime(jt.khutbah_time)}</Text>
                </View>
                {jt.iqamah_time ? (
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Iqamah</Text>
                    <Text style={[styles.timeValue, styles.iqamahValue]}>{formatTime(jt.iqamah_time)}</Text>
                  </View>
                ) : null}
              </View>
              {jt.notice ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{jt.notice}</Text>
                </View>
              ) : null}
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
  intro: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  jumuahCard: { gap: spacing.sm },
  jumuahLabel: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  timeBlock: {},
  timeLabel: {
    fontSize: typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  iqamahValue: {
    color: colors.goldDark,
  },
  noticeBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  noticeText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
