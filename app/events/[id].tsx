import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Calendar from 'expo-calendar';
import { colors, fontWeight, spacing, typography } from '@/constants/theme';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { getEventById } from '@/lib/eventsData';
import { openDirections } from '@/lib/directions';
import type { EventRow } from '@/lib/database.types';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getEventById(id).then((e) => {
        setEvent(e);
        setLoading(false);
      });
    }
  }, [id]);

  const handleAddToCalendar = async () => {
    if (!event) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow calendar access to add this event.');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar =
        calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (!defaultCalendar) {
        Alert.alert('No calendar found', 'Could not find a calendar to add this event to.');
        return;
      }
      await Calendar.createEventAsync(defaultCalendar.id, {
        title: event.title,
        startDate: new Date(event.start_at),
        endDate: event.end_at ? new Date(event.end_at) : new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000),
        location: event.location ?? undefined,
        notes: event.description ?? undefined,
      });
      Alert.alert('Added!', 'This event has been added to your calendar.');
    } catch {
      Alert.alert('Error', 'Could not add event to your calendar.');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `${event.title}\n${formatDateTime(event.start_at)}${event.location ? `\n${event.location}` : ''}\n\n${event.description ?? ''}`,
      });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.xl }} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: true, title: 'Event' }} />
        <Text style={styles.notFound}>Event not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: event.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} resizeMode="cover" />
        ) : null}
        <Badge label={event.category} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.datetime}>{formatDateTime(event.start_at)}</Text>
        {event.location ? <Text style={styles.location}>📍 {event.location}</Text> : null}
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        <View style={styles.buttonGroup}>
          {event.registration_link ? (
            <Button
              label="Register"
              onPress={() => Linking.openURL(event.registration_link!)}
            />
          ) : null}
          <Button label="Add to Calendar" variant="secondary" onPress={handleAddToCalendar} />
          <Button label="Share" variant="outline" onPress={handleShare} />
          {event.location ? (
            <Button
              label="Get Directions"
              variant="outline"
              onPress={() => openDirections(event.location!, event.title)}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  datetime: {
    fontSize: typography.bodyLarge,
    color: colors.goldDark,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.sm,
  },
  location: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  buttonGroup: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  notFound: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
  },
});
