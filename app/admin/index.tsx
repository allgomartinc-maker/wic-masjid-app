import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { getCurrentAdminSession, sendAdminMagicLink, signOutAdmin, AdminSession } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';

const ADMIN_SECTIONS = [
  { label: 'Prayer & Iqamah Times', route: '/admin/prayer-times', icon: 'moon' as const },
  { label: "Jumu'ah Times", route: '/admin/jumuah', icon: 'time' as const },
  { label: 'Announcements', route: '/admin/announcements', icon: 'megaphone' as const },
  { label: 'Events', route: '/admin/events', icon: 'calendar' as const },
  { label: 'Donation Campaigns', route: '/admin/donations', icon: 'heart' as const },
  { label: 'Volunteer Opportunities', route: '/admin/volunteer', icon: 'people' as const },
  { label: 'Audit Log', route: '/admin/audit-log', icon: 'document-text' as const },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const s = await getCurrentAdminSession();
    setSession(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadSession]);

  const handleSendLink = async () => {
    if (!email.trim()) {
      Alert.alert('Enter email', 'Please enter your admin email address.');
      return;
    }
    setSending(true);
    const result = await sendAdminMagicLink(email);
    setSending(false);
    if (result.success) {
      setLinkSent(true);
    } else {
      Alert.alert('Error', result.error ?? 'Could not send sign-in link.');
    }
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setSession(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.loginContent}>
          <Text style={styles.title}>WIC Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Sign in with your authorized admin email to manage prayer times, announcements,
            events, and more.
          </Text>
          <Card style={styles.loginCard}>
            {linkSent ? (
              <Text style={styles.sentText}>
                A sign-in link has been sent to {email}. Open it on this device to continue.
              </Text>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="admin@wicmasjid.org"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Button label="Send Sign-In Link" onPress={handleSendLink} loading={sending} />
              </>
            )}
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome, {session.displayName ?? session.email}</Text>
            <Text style={styles.roleText}>Role: {session.role.replace('_', ' ')}</Text>
          </View>
          <Pressable onPress={handleSignOut}>
            <Text style={styles.signOut}>Sign Out</Text>
          </Pressable>
        </View>

        {ADMIN_SECTIONS.map((section) => (
          <Pressable
            key={section.route}
            style={styles.sectionRow}
            onPress={() => router.push(section.route as any)}
          >
            <Ionicons name={section.icon} size={24} color={colors.navy} style={{ marginRight: spacing.md }} />
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loginContent: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: typography.h1, fontWeight: fontWeight.bold, color: colors.navy, textAlign: 'center' },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  loginCard: { gap: spacing.md },
  sentText: { fontSize: typography.body, color: colors.textSecondary, textAlign: 'center' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  content: { padding: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  roleText: { fontSize: typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
  signOut: { fontSize: typography.body, color: colors.danger, fontWeight: fontWeight.semibold },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: { flex: 1, fontSize: typography.bodyLarge, fontWeight: fontWeight.semibold, color: colors.textPrimary },
});
