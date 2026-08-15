import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { PRAYER_DISPLAY_NAMES } from '@/lib/prayerTimes';
import type { PrayerRow } from '@/lib/prayerData';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface PrayerScheduleTableProps {
  rows: PrayerRow[];
}

export function PrayerScheduleTable({ rows }: PrayerScheduleTableProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCol]}>Prayer</Text>
        <Text style={[styles.headerCell, styles.timeCol]}>Adhan</Text>
        <Text style={[styles.headerCell, styles.timeCol]}>Iqamah</Text>
      </View>
      {rows.map((row, idx) => (
        <View
          key={row.name}
          style={[styles.row, idx === rows.length - 1 && styles.lastRow]}
        >
          <Text style={[styles.cell, styles.nameCol, styles.nameText]}>
            {PRAYER_DISPLAY_NAMES[row.name]}
          </Text>
          <Text style={[styles.cell, styles.timeCol]}>{formatTime(row.adhan)}</Text>
          <Text
            style={[
              styles.cell,
              styles.timeCol,
              row.iqamah ? styles.officialTime : styles.noIqamah,
            ]}
          >
            {row.iqamah ? formatTime(row.iqamah) : '—'}
          </Text>
        </View>
      ))}
      <Text style={styles.footnote}>
        Adhan times are calculated. Iqamah times in gold are WIC's official schedule.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerCell: {
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    fontSize: typography.bodyLarge,
  },
  nameCol: {
    flex: 1.2,
  },
  timeCol: {
    flex: 1,
  },
  nameText: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  officialTime: {
    color: colors.goldDark,
    fontWeight: fontWeight.bold,
  },
  noIqamah: {
    color: colors.textMuted,
  },
  footnote: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    padding: spacing.md,
    fontStyle: 'italic',
  },
});
