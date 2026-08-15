import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { getVolunteerOpportunities, VOLUNTEER_CATEGORY_LABELS } from '@/lib/volunteerData';
import type { VolunteerOpportunityRow } from '@/lib/database.types';

export default function VolunteerScreen() {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');

  useEffect(() => {
    getVolunteerOpportunities().then((data) => {
      setOpportunities(data);
      setLoading(false);
    });
  }, []);

  const handleGeneralSignup = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing info', 'Please enter your name and email.');
      return;
    }
    const subject = encodeURIComponent('Volunteer Interest - The Woodlands Islamic Center');
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nArea of interest: ${interest || 'General'}\n`
    );
    Linking.openURL(`mailto:info@wicmasjid.org?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Volunteer' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          WIC relies on volunteers for nearly everything we do. Explore current opportunities
          below, or fill out the general interest form to be contacted.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.lg }} />
        ) : (
          opportunities.map((o) => (
            <Card key={o.id} style={styles.oppCard}>
              <Badge label={VOLUNTEER_CATEGORY_LABELS[o.category] ?? o.category} />
              <Text style={styles.oppTitle}>{o.title}</Text>
              {o.description ? <Text style={styles.oppDescription}>{o.description}</Text> : null}
              {o.location ? <Text style={styles.meta}>📍 {o.location}</Text> : null}
              {o.signup_form_url ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Button label="Sign Up" variant="outline" onPress={() => Linking.openURL(o.signup_form_url!)} />
                </View>
              ) : null}
            </Card>
          ))
        )}

        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>General Volunteer Interest</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Your email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Area of interest (optional)"
            placeholderTextColor={colors.textMuted}
            value={interest}
            onChangeText={setInterest}
          />
          <Button label="Submit Interest" onPress={handleGeneralSignup} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  intro: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  oppCard: { gap: spacing.xs },
  oppTitle: { fontSize: typography.h3, fontWeight: fontWeight.bold, color: colors.textPrimary },
  oppDescription: { fontSize: typography.body, color: colors.textSecondary, lineHeight: 22 },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  formCard: { gap: spacing.md, marginTop: spacing.md },
  formTitle: { fontSize: typography.h2, fontWeight: fontWeight.bold, color: colors.textPrimary },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
  },
});
