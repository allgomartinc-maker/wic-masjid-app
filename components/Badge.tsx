import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: 'solid' | 'outline';
}

export function Badge({ label, color = colors.info, variant = 'solid' }: BadgeProps) {
  const isSolid = variant === 'solid';
  return (
    <View
      style={[
        styles.badge,
        isSolid ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color },
      ]}
    >
      <Text style={[styles.label, { color: isSolid ? colors.white : color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: typography.tiny,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
