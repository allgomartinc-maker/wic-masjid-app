import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminAuth';
import type { DonationCampaignRow } from '@/lib/database.types';

export default function AdminDonationsScreen() {
  const [items, setItems] = useState<DonationCampaignRow[]>([]);
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  const load = () => {
    supabase
      .from('donation_campaigns')
      .select('*')
      .order('is_featured', { ascending: false })
      .then(({ data }) => setItems((data as DonationCampaignRow[]) ?? []));
  };

  useEffect(load, []);

  const handleUpdateRaised = async (campaign: DonationCampaignRow) => {
    const raw = editingAmounts[campaign.id];
    if (raw === undefined) return;
    const amount = parseFloat(raw);
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('Invalid amount', 'Please enter a valid number.');
      return;
    }
    const { error } = await supabase
      .from('donation_campaigns')
      .update({ raised_amount: amount })
      .eq('id', campaign.id);
    if (error) {
      Alert.alert('Error', 'Could not update the raised amount.');
      return;
    }
    await logAdminAction('update', 'donation_campaigns', campaign.id, { raised_amount: amount });
    load();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Donation Campaigns' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              Goal: ${item.goal_amount?.toLocaleString() ?? '—'} · Raised: ${(item.raised_amount ?? 0).toLocaleString()}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Update raised amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={editingAmounts[item.id] ?? ''}
              onChangeText={(v) => setEditingAmounts((prev) => ({ ...prev, [item.id]: v }))}
            />
            <Button label="Update Progress" variant="outline" onPress={() => handleUpdateRaised(item)} />
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No donation campaigns yet. Add them directly in Supabase for now.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
