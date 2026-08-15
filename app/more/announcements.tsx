import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { getAnnouncements } from '@/lib/announcementsData';
import type { AnnouncementRow } from '@/lib/database.types';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements().then((data) => {
      setAnnouncements(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Announcements' }} />
      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Text style={{ height: spacing.md }} />}
          renderItem={({ item }) => <AnnouncementCard announcement={item} />}
          ListEmptyComponent={<Text style={styles.empty}>No announcements right now.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: typography.body },
});
