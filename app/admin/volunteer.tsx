import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminAuth';
import type { VolunteerOpportunityRow, VolunteerCategory } from '@/lib/database.types';

const CATEGORIES: VolunteerCategory[] = [
  'events', 'ramadan', 'parking', 'cleaning', 'food_service', 'youth', 'fundraising', 'outreach',
];

export default function AdminVolunteerScreen() {
  const [items, setItems] = useState<VolunteerOpportunityRow[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VolunteerCategory>('events');
  const [signupUrl, setSignupUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase
      .from('volunteer_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems((data as VolunteerOpportunityRow[]) ?? []));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('volunteer_opportunities')
      .insert({ title, description, category, signup_form_url: signupUrl || null, is_active: true })
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not create volunteer opportunity.');
      return;
    }
    await logAdminAction('create', 'volunteer_opportunities', data?.id ?? null, { title });
    setTitle('');
    setDescription('');
    setSignupUrl('');
    load();
  };

  const handleDeactivate = async (id: string) => {
    await supabase.from('volunteer_opportunities').update({ is_active: false }).eq('id', id);
    await logAdminAction('deactivate', 'volunteer_opportunities', id);
    load();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Volunteer Opportunities' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>New Opportunity</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <TextInput style={styles.input} placeholder="Signup form URL (optional)" placeholderTextColor={colors.textMuted} value={signupUrl} onChangeText={setSignupUrl} autoCapitalize="none" />
            <Text style={styles.selectLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Button label="Publish Opportunity" onPress={handleCreate} loading={saving} />
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.category} · {item.is_active ? 'Active' : 'Inactive'}</Text>
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
