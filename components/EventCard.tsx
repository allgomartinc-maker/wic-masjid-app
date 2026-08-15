import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import type { EventRow } from '@/lib/database.types';

interface EventCardProps {
  event: EventRow;
  onPress?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  community: colors.gold,
  youth: colors.info,
  sisters: '#B0578D',
  brothers: colors.navy,
  children: colors.success,
  education: colors.goldDark,
  fundraising: colors.warning,
  ramadan: colors.goldDark,
  eid: colors.success,
};

function formatEventDate(dateStr: string): { day: string; month: string; time: string } {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

export function EventCard({ event, onPress }: EventCardProps) {
  const { day, month, time } = formatEventDate(event.start_at);
  const catColor = CATEGORY_COLORS[event.category] ?? colors.info;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={event.title}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.dateBlock}>
            <Text style={styles.day}>{day}</Text>
            <Text style={styles.month}>{month}</Text>
          </View>
          <View style={styles.content}>
            <Badge label={event.category} color={catColor} />
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.meta}>{time}{event.location ? ` · ${event.location}` : ''}</Text>
          </View>
        </View>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    width: 60,
    height: 60,
  },
  day: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  month: {
    fontSize: typography.tiny,
    fontWeight: fontWeight.bold,
    color: colors.goldDark,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: spacing.md,
  },
});
