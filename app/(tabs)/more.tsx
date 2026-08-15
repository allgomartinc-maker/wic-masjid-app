import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Qibla Finder', icon: 'compass', route: '/more/qibla', description: 'Find the direction to the Kaaba' },
  { label: 'Islamic Calendar', icon: 'calendar-outline', route: '/more/islamic-calendar', description: 'Hijri dates & important days' },
  { label: 'Programs', icon: 'school', route: '/more/programs', description: 'Classes, youth, sisters & children' },
  { label: 'Ramadan', icon: 'moon-outline', route: '/more/ramadan', description: "This year's Ramadan schedule" },
  { label: 'Donations', icon: 'heart', route: '/more/donations', description: 'Support WIC and our community' },
  { label: 'Building Fund', icon: 'business', route: '/more/building-fund', description: 'New masjid project progress' },
  { label: 'Volunteer', icon: 'people', route: '/more/volunteer', description: 'Sign up to help the community' },
  { label: 'Announcements', icon: 'megaphone', route: '/more/announcements', description: 'All masjid announcements' },
  { label: 'Contact & About', icon: 'information-circle', route: '/more/contact', description: 'Address, hours & directions' },
  { label: 'Settings', icon: 'settings', route: '/more/settings', description: 'Notification preferences' },
];

export default function MoreScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>More</Text>
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={styles.item}
              onPress={() => router.push(item.route as any)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={26} color={colors.navy} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: {
    fontSize: typography.h1,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  grid: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemText: { flex: 1 },
  itemLabel: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemDescription: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
