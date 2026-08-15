import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import type { AuditLogRow } from '@/lib/database.types';

export default function AdminAuditLogScreen() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data as AuditLogRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Audit Log' }} />
      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.action}>
                {item.action.toUpperCase()} · {item.table_name}
              </Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
              {item.details ? <Text style={styles.details}>{JSON.stringify(item.details)}</Text> : null}
            </Card>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No admin actions recorded yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  card: { gap: 2, marginBottom: spacing.sm },
  action: { fontSize: typography.body, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  date: { fontSize: typography.tiny, color: colors.textMuted },
  details: { fontSize: typography.tiny, color: colors.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
