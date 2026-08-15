import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors, fontWeight, spacing, typography, categoryColors, priorityColors } from '@/constants/theme';
import type { AnnouncementRow } from '@/lib/database.types';

interface AnnouncementCardProps {
  announcement: AnnouncementRow;
  onPress?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  emergency: 'Emergency',
  janazah: 'Janazah',
  community: 'Community',
  weather: 'Weather Closure',
  program: 'Program Update',
  ramadan: 'Ramadan',
  eid: 'Eid',
  fundraising: 'Fundraising',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const isCritical = announcement.priority === 'critical';
  const catColor = categoryColors[announcement.category] ?? colors.info;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={announcement.title}>
      <Card style={isCritical ? styles.criticalCard : undefined}>
        <View style={styles.badgeRow}>
          <Badge label={CATEGORY_LABELS[announcement.category] ?? announcement.category} color={catColor} />
          {isCritical && <Badge label="Important" color={priorityColors.critical} />}
        </View>
        {announcement.image_url ? (
          <Image source={{ uri: announcement.image_url }} style={styles.image} resizeMode="cover" />
        ) : null}
        <Text style={styles.title}>{announcement.title}</Text>
        {announcement.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {announcement.description}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatDate(announcement.created_at)}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  criticalCard: {
    borderColor: colors.emergency,
    borderWidth: 1.5,
    backgroundColor: '#FFF7F5',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  date: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
