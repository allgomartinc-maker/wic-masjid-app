import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminAuth';
import type { EventRow, EventCategory } from '@/lib/database.types';

const CATEGORIES: EventCategory[] = [
  'community', 'youth', 'sisters', 'brothers', 'children', 'education', 'fundraising', 'ramadan', 'eid',
];

export default function AdminEventsScreen() {
  const [items, setItems] = useState<EventRow[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [category, setCategory] = useState<EventCategory>('community');
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase
      .from('events')
      .select('*')
      .order('start_at', { ascending: false })
      .then(({ data }) => setItems((data as EventRow[]) ?? []));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!title.trim() || !startDate || !startTime) {
      Alert.alert('Missing info', 'Please enter a title, date, and time.');
      return;
    }
    setSaving(true);
    const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        description,
        location,
        start_at: startAt,
        registration_link: registrationLink || null,
        category,
        is_active: true,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not create event.');
      return;
    }
    await logAdminAction('create', 'events', data?.id ?? null, { title });
    setTitle('');
    setDescription('');
    setLocation('');
    setStartDate('');
    setStartTime('');
    setRegistrationLink('');
    load();
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from('events').update({ is_active: false }).eq('id', id);
    await logAdminAction('deactivate', 'events', id);
    load();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Events' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>New Event</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} />
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.flex1]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.textMuted} value={startDate} onChangeText={setStartDate} />
              <TextInput style={[styles.input, styles.flex1]} placeholder="Time (HH:MM)" placeholderTextColor={colors.textMuted} value={startTime} onChangeText={setStartTime} />
            </View>
            <TextInput style={styles.input} placeholder="Registration link (optional)" placeholderTextColor={colors.textMuted} value={registrationLink} onChangeText={setRegistrationLink} autoCapitalize="none" />
            <Text style={styles.selectLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Publish Event" onPress={handleCreate} loading={saving} />
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {new Date(item.start_at).toLocaleString()} · {item.category} · {item.is_active ? 'Active' : 'Inactive'}
            </Text>
            {item.is_active && <Button label="Deactivate" variant="outline" onPress={() => handleDeactivate(item.id)} />}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  formCard: { gap: spacing.sm, marginBottom: spacing.lg },
  formTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  selectLabel: { fontSize: typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: typography.tiny, color: colors.textPrimary },
  chipTextActive: { color: colors.white },
  itemCard: { gap: spacing.xs, marginBottom: spacing.sm },
  itemTitle: { fontSize: typography.body, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  itemMeta: { fontSize: typography.tiny, color: colors.textMuted, textTransform: 'capitalize' },
});
