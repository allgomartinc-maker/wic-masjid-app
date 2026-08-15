import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { PRAYER_DISPLAY_NAMES, formatCountdown } from '@/lib/prayerTimes';
import type { PrayerRow } from '@/lib/prayerData';

interface NextPrayerCardProps {
  nextPrayer: { name: string; time: Date } | null;
  iqamahTime: Date | null;
  isOfficialIqamah: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function NextPrayerCard({ nextPrayer, iqamahTime, isOfficialIqamah }: NextPrayerCardProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!nextPrayer) {
    return null;
  }

  const msRemaining = nextPrayer.time.getTime() - now.getTime();
  const displayName = PRAYER_DISPLAY_NAMES[nextPrayer.name as keyof typeof PRAYER_DISPLAY_NAMES] ?? nextPrayer.name;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>NEXT PRAYER</Text>
      <Text style={styles.prayerName}>{displayName}</Text>
      <Text style={styles.time}>{formatTime(nextPrayer.time)}</Text>

      {iqamahTime ? (
        <View style={styles.iqamahRow}>
          <Text style={styles.iqamahLabel}>
            {isOfficialIqamah ? 'Official Iqamah' : 'Iqamah (estimated)'}
          </Text>
          <Text style={styles.iqamahTime}>{formatTime(iqamahTime)}</Text>
        </View>
      ) : null}

      <Text style={styles.countdown}>{formatCountdown(Math.max(0, msRemaining))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  label: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  prayerName: {
    color: colors.textOnDark,
    fontSize: typography.display,
    fontWeight: fontWeight.bold,
  },
  time: {
    color: colors.textOnDark,
    fontSize: typography.h1,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  iqamahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  iqamahLabel: {
    color: colors.textOnDarkMuted,
    fontSize: typography.caption,
    fontWeight: fontWeight.medium,
  },
  iqamahTime: {
    color: colors.goldLight,
    fontSize: typography.body,
    fontWeight: fontWeight.bold,
  },
  countdown: {
    color: colors.goldLight,
    fontSize: typography.bodyLarge,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
  },
});
