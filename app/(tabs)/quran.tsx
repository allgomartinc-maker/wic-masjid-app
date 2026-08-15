import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { getSurahList, SurahMeta } from '@/lib/quranApi';
import { getLastReadPosition, LastReadPosition } from '@/lib/quranBookmarks';
import { Card } from '@/components/Card';

export default function QuranScreen() {
  const router = useRouter();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);

  useEffect(() => {
    getSurahList().then((data) => {
      setSurahs(data);
      setLoading(false);
    });
    getLastReadPosition().then(setLastRead);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }, [search, surahs]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Quran</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah by name or number"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {lastRead && (
        <Pressable
          onPress={() =>
            router.push(`/quran/${lastRead.surahNumber}?ayah=${lastRead.ayahNumberInSurah}`)
          }
          style={styles.continueWrap}
        >
          <Card style={styles.continueCard}>
            <Ionicons name="bookmark" size={20} color={colors.goldDark} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.continueLabel}>Continue Reading</Text>
              <Text style={styles.continueText}>
                {lastRead.surahName} · Ayah {lastRead.ayahNumberInSurah}
              </Text>
            </View>
          </Card>
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.number.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.surahRow}
              onPress={() => router.push(`/quran/${item.number}`)}
              accessibilityRole="button"
              accessibilityLabel={`Surah ${item.englishName}`}
            >
              <View style={styles.surahNumberCircle}>
                <Text style={styles.surahNumberText}>{item.number}</Text>
              </View>
              <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{item.englishName}</Text>
                <Text style={styles.surahMeta}>
                  {item.englishNameTranslation} · {item.numberOfAyahs} Ayahs · {item.revelationType}
                </Text>
              </View>
              <Text style={styles.arabicName}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: typography.h1, fontWeight: fontWeight.bold, color: colors.navy },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    marginLeft: spacing.sm,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  continueWrap: { marginTop: spacing.md, marginHorizontal: spacing.lg },
  continueCard: { flexDirection: 'row', alignItems: 'center' },
  continueLabel: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: fontWeight.bold,
  },
  continueText: {
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  listContent: { padding: spacing.lg },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  surahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  surahNumberText: {
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  surahInfo: { flex: 1 },
  surahName: {
    fontSize: typography.bodyLarge,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  surahMeta: {
    fontSize: typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  arabicName: {
    fontSize: typography.h3,
    color: colors.navy,
  },
});
