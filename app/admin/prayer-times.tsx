import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminAuth';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminPrayerTimesScreen() {
  const [times, setTimes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const date = todayKey();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('prayer_times').select('*').eq('date', date).maybeSingle();
      if (data) {
        const initial: Record<string, string> = {};
        for (const p of PRAYERS) {
          const val = (data as any)[`${p}_iqamah`];
          if (val) {
            const d = new Date(val);
            initial[p] = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          }
        }
        setTimes(initial);
      }
      setLoading(false);
    })();
  }, [date]);

  const handleSave = async () => {
    setSaving(true);
    const update: Record<string, string | null> = { date };
    for (const p of PRAYERS) {
      const val = times[p];
      update[`${p}_iqamah`] = val ? `${date}T${val}:00` : null;
    }

    const { error } = await supabase.from('prayer_times').upsert(update, { onConflict: 'date' });
    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Could not save iqamah times. Make sure you are signed in as an authorized admin.');
      return;
    }

    await logAdminAction('update', 'prayer_times', date, { times });
    Alert.alert('Saved', "Today's official iqamah times have been updated.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Prayer & Iqamah Times' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Enter today's official iqamah times ({date}). These will override the calculated times
          shown to the community and always take priority. Leave blank to show only the
          calculated adhan time.
        </Text>

        <Card style={styles.card}>
          {PRAYERS.map((p) => (
            <View key={p} style={styles.row}>
              <Text style={styles.label}>{p.charAt(0).toUpperCase() + p.slice(1)} Iqamah</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM (24h)"
                placeholderTextColor={colors.textMuted}
                value={times[p] ?? ''}
                onChangeText={(v) => setTimes((prev) => ({ ...prev, [p]: v }))}
              />
            </View>
          ))}
        </Card>

        <Button label="Save Official Times" onPress={handleSave} loading={saving || loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  hint: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  card: { gap: spacing.md },
  row: { gap: spacing.xs },
  label: { fontSize: typography.caption, color: colors.textMuted, textTransform: 'uppercase', fontWeight: fontWeight.bold },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
});
