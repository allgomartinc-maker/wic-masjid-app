import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { MASJID_INFO } from '@/constants/masjid';
import { openDirections } from '@/lib/directions';

export default function ContactScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Contact & About' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.masjidName}>{MASJID_INFO.name}</Text>
        <Text style={styles.aboutText}>
          The Woodlands Islamic Center serves as a spiritual, educational, and community hub
          for Muslims in The Woodlands, Texas and surrounding areas. We are dedicated to prayer,
          education, and building a strong, connected community.
        </Text>

        <Card style={styles.infoCard}>
          <InfoRow icon="location" label="Address" value={MASJID_INFO.address} />
          <InfoRow icon="call" label="Phone" value={MASJID_INFO.phone} onPress={() => Linking.openURL(`tel:${MASJID_INFO.phone}`)} />
          <InfoRow icon="mail" label="Email" value={MASJID_INFO.email} onPress={() => Linking.openURL(`mailto:${MASJID_INFO.email}`)} />
          <InfoRow icon="globe" label="Website" value={MASJID_INFO.website} onPress={() => Linking.openURL(MASJID_INFO.website)} />
          <InfoRow icon="time" label="Office Hours" value={MASJID_INFO.officeHours} last />
        </Card>

        <Button
          label="Get Directions"
          onPress={() => openDirections(MASJID_INFO.address, MASJID_INFO.name)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={22} color={colors.navy} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, onPress && styles.linkValue]}
          onPress={onPress}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  masjidName: { fontSize: typography.h1, fontWeight: fontWeight.bold, color: colors.navy, textAlign: 'center' },
  aboutText: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 24, textAlign: 'center' },
  infoCard: { gap: 0 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: typography.tiny, color: colors.textMuted, textTransform: 'uppercase' },
  infoValue: { fontSize: typography.body, color: colors.textPrimary, marginTop: 2 },
  linkValue: { color: colors.goldDark, fontWeight: fontWeight.semibold },
});
