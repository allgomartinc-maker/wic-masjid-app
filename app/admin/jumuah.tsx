import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminAuth';
import type { JumuahTimeRow } from '@/lib/database.types';

interface EditableJumuah {
  id?: string;
  jumuah_number: number;
  khutbah_time: string;
  iqamah_time: string;
  notice: string;
}

export default function AdminJumuahScreen() {
  const [rows, setRows] = useState<EditableJumuah[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('jumuah_times')
      .select('*')
      .order('jumuah_number', { ascending: true })
      .then(({ data }) => {
        const existing = (data as JumuahTimeRow[]) ?? [];
        if (existing.length === 0) {
          setRows([{ jumuah_number: 1, khutbah_time: '', iqamah_time: '', notice: '' }]);
        } else {
          setRows(
            existing.map((r) => ({
              id: r.id,
              jumuah_number: r.jumuah_number,
              khutbah_time: r.khutbah_time?.slice(0, 5) ?? '',
              iqamah_time: r.iqamah_time?.slice(0, 5) ?? '',
              notice: r.notice ?? '',
            }))
          );
        }
      });
  }, []);

  const addJumuah = () => {
    setRows((prev) => [...prev, { jumuah_number: prev.length + 1, khutbah_time: '', iqamah_time: '', notice: '' }]);
  };

  const updateRow = (idx: number, field: keyof EditableJumuah, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows) {
      if (!row.khutbah_time) continue;
      const { error } = await supabase.from('jumuah_times').upsert(
        {
          id: row.id,
          jumuah_number: row.jumuah_number,
          khutbah_time: `${row.khutbah_time}:00`,
          iqamah_time: row.iqamah_time ? `${row.iqamah_time}:00` : null,
          notice: row.notice || null,
          is_active: true,
        },
        { onConflict: 'jumuah_number' }
      );
      if (error) {
        Alert.alert('Error', `Could not save Jumu'ah ${row.jumuah_number}.`);
        setSaving(false);
        return;
      }
    }
    await logAdminAction('update', 'jumuah_times', null, { count: rows.length });
    setSaving(false);
    Alert.alert('Saved', "Jumu'ah times have been updated.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: "Jumu'ah Times" }} />
      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row, idx) => (
          <Card key={idx} style={styles.card}>
            <Text style={styles.cardTitle}>Jumu'ah {row.jumuah_number}</Text>
            <TextInput
              style={styles.input}
              placeholder="Khutbah time (HH:MM)"
              placeholderTextColor={colors.textMuted}
              value={row.khutbah_time}
              onChangeText={(v) => updateRow(idx, 'khutbah_time', v)}
            />
            <TextInput
              style={styles.input}
              placeholder="Iqamah time (HH:MM, optional)"
              placeholderTextColor={colors.textMuted}
              value={row.iqamah_time}
              onChangeText={(v) => updateRow(idx, 'iqamah_time', v)}
            />
            <TextInput
              style={[styles.input, styles.noticeInput]}
              placeholder="Special notice (optional)"
              placeholderTextColor={colors.textMuted}
              value={row.notice}
              onChangeText={(v) => updateRow(idx, 'notice', v)}
              multiline
            />
          </Card>
        ))}
        <Button label="+ Add Another Jumu'ah" variant="outline" onPress={addJumuah} />
        <Button label="Save All" onPress={handleSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { gap: spacing.sm },
  cardTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  noticeInput: { minHeight: 60, textAlignVertical: 'top' },
});
