import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { getSurah, SurahDetail, Ayah } from '@/lib/quranApi';
import { addBookmark, getBookmarks, removeBookmark, saveLastReadPosition, Bookmark } from '@/lib/quranBookmarks';

export default function SurahScreen() {
  const { surah: surahParam, ayah: ayahParam } = useLocalSearchParams<{ surah: string; ayah?: string }>();
  const surahNumber = Number(surahParam);
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);

  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    getSurah(surahNumber).then((data) => {
      setSurah(data);
      setLoading(false);
    });
    getBookmarks().then(setBookmarks);
  }, [surahNumber]);

  useEffect(() => {
    if (status?.didJustFinish) {
      setPlayingAyah(null);
    }
  }, [status?.didJustFinish]);

  const playAyah = (ayah: Ayah) => {
    if (playingAyah === ayah.numberInSurah && status?.playing) {
      player.pause();
      setPlayingAyah(null);
      return;
    }
    player.replace({ uri: ayah.audioUrl });
    player.play();
    setPlayingAyah(ayah.numberInSurah);
  };

  const isBookmarked = (ayahNum: number) =>
    bookmarks.some((b) => b.surahNumber === surahNumber && b.ayahNumberInSurah === ayahNum);

  const toggleBookmark = async (ayah: Ayah) => {
    if (!surah) return;
    if (isBookmarked(ayah.numberInSurah)) {
      const updated = await removeBookmark(surahNumber, ayah.numberInSurah);
      setBookmarks(updated);
    } else {
      const updated = await addBookmark({
        surahNumber,
        surahName: surah.meta.englishName,
        ayahNumberInSurah: ayah.numberInSurah,
      });
      setBookmarks(updated);
    }
  };

  const markAsLastRead = async (ayah: Ayah) => {
    if (!surah) return;
    await saveLastReadPosition({
      surahNumber,
      surahName: surah.meta.englishName,
      ayahNumberInSurah: ayah.numberInSurah,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (!surah) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: true, title: 'Surah' }} />
        <Text style={styles.notFound}>
          Could not load this surah. Please check your internet connection.
        </Text>
      </SafeAreaView>
    );
  }

  const initialIndex = ayahParam ? surah.ayahs.findIndex((a) => a.numberInSurah === Number(ayahParam)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: surah.meta.englishName }} />
      <View style={styles.surahHeader}>
        <Text style={styles.arabicSurahName}>{surah.meta.name}</Text>
        <Text style={styles.surahSubtitle}>
          {surah.meta.englishNameTranslation} · {surah.meta.revelationType}
        </Text>
      </View>
      <FlatList
        data={surah.ayahs}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        getItemLayout={(_, index) => ({ length: 160, offset: 160 * index, index })}
        onViewableItemsChanged={({ viewableItems }) => {
          const first = viewableItems[0]?.item as Ayah | undefined;
          if (first) markAsLastRead(first);
        }}
        renderItem={({ item }) => (
          <View style={styles.ayahCard}>
            <View style={styles.ayahHeaderRow}>
              <View style={styles.ayahNumberBadge}>
                <Text style={styles.ayahNumberText}>{item.numberInSurah}</Text>
              </View>
              <View style={styles.ayahActions}>
                <Pressable onPress={() => playAyah(item)} hitSlop={10} style={styles.iconButton}>
                  <Ionicons
                    name={playingAyah === item.numberInSurah && status?.playing ? 'pause-circle' : 'play-circle'}
                    size={28}
                    color={colors.goldDark}
                  />
                </Pressable>
                <Pressable onPress={() => toggleBookmark(item)} hitSlop={10} style={styles.iconButton}>
                  <Ionicons
                    name={isBookmarked(item.numberInSurah) ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={colors.navy}
                  />
                </Pressable>
              </View>
            </View>
            <Text style={styles.arabicText}>{item.arabicText}</Text>
            <Text style={styles.translationText}>{item.translationText}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  surahHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  arabicSurahName: { fontSize: typography.h1, color: colors.navy, fontWeight: fontWeight.bold },
  surahSubtitle: { fontSize: typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  listContent: { padding: spacing.lg },
  ayahCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ayahHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ayahNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: { fontSize: typography.tiny, fontWeight: fontWeight.bold, color: colors.navy },
  ayahActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { padding: 2 },
  arabicText: {
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'right',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  translationText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  notFound: { textAlign: 'center', marginTop: spacing.xl, color: colors.textMuted, padding: spacing.lg },
});
