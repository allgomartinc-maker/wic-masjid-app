import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getPrograms, groupProgramsByCategory, PROGRAM_CATEGORY_LABELS } from '@/lib/programsData';
import type { ProgramRow, ProgramCategory } from '@/lib/database.types';

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms().then((data) => {
      setPrograms(data);
      setLoading(false);
    });
  }, []);

  const grouped = groupProgramsByCategory(programs);
  const categories = Object.keys(grouped) as ProgramCategory[];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Programs' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
        ) : (
          categories.map((cat) =>
            grouped[cat].length > 0 ? (
              <View key={cat} style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>{PROGRAM_CATEGORY_LABELS[cat]}</Text>
                {grouped[cat].map((p) => (
                  <Card key={p.id} style={styles.programCard}>
                    <Text style={styles.programTitle}>{p.title}</Text>
                    {p.description ? <Text style={styles.programDescription}>{p.description}</Text> : null}
                    {p.schedule ? <Text style={styles.meta}>🕐 {p.schedule}</Text> : null}
                    {p.location ? <Text style={styles.meta}>📍 {p.location}</Text> : null}
                    {p.contact ? <Text style={styles.meta}>✉️ {p.contact}</Text> : null}
                    {p.registration_link ? (
                      <View style={{ marginTop: spacing.sm }}>
                        <Button
                          label="Register"
                          variant="outline"
                          onPress={() => Linking.openURL(p.registration_link!)}
                        />
                      </View>
                    ) : null}
                  </Card>
                ))}
              </View>
            ) : null
          )
        )}
        {!loading && programs.length === 0 && (
          <Text style={styles.empty}>No programs published yet. Please check back soon.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  categoryGroup: { marginBottom: spacing.xl },
  categoryTitle: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  programCard: { marginBottom: spacing.md, gap: spacing.xs },
  programTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  programDescription: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
