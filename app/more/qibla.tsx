import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { colors, fontWeight, radius, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { calculateQiblaDirection } from '@/lib/prayerTimes';
import { MASJID_INFO } from '@/constants/masjid';

type PermissionState = 'unknown' | 'granted' | 'denied';

export default function QiblaScreen() {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;

  const requestAndStart = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermission('denied');
      return;
    }
    setPermission('granted');

    const location = await Location.getCurrentPositionAsync({});
    const direction = calculateQiblaDirection(location.coords.latitude, location.coords.longitude);
    setQiblaDirection(direction);

    await Location.watchHeadingAsync((headingData) => {
      const h = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
      setHeading(h);
    });
  };

  useEffect(() => {
    if (qiblaDirection === null) return;
    const rotateTo = qiblaDirection - heading;
    Animated.timing(rotation, {
      toValue: rotateTo,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [heading, qiblaDirection]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: true, title: 'Qibla' }} />
      <View style={styles.content}>
        <Text style={styles.intro}>
          The Qibla direction is calculated locally on your device using your GPS location —
          no external service is used.
        </Text>

        {permission !== 'granted' ? (
          <Card style={styles.permissionCard}>
            <Text style={styles.permissionText}>
              We need your location to calculate the Qibla direction accurately from where you
              are standing. Your location is used only for this calculation and is never stored
              or sent anywhere.
            </Text>
            <Button label="Enable Location" onPress={requestAndStart} />
            {permission === 'denied' && (
              <Text style={styles.deniedText}>
                Location permission was denied. Please enable it in your device settings to use
                the Qibla finder.
              </Text>
            )}
          </Card>
        ) : (
          <View style={styles.compassWrap}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Svg width={260} height={260} viewBox="0 0 260 260">
                <Circle cx={130} cy={130} r={120} stroke={colors.border} strokeWidth={2} fill={colors.surface} />
                <Circle cx={130} cy={130} r={4} fill={colors.navy} />
                <Line x1={130} y1={130} x2={130} y2={30} stroke={colors.goldDark} strokeWidth={4} />
                <Polygon points="130,20 118,45 142,45" fill={colors.goldDark} />
              </Svg>
            </Animated.View>
            <Text style={styles.degreeText}>
              {qiblaDirection !== null ? `${Math.round(qiblaDirection)}° from true north` : '—'}
            </Text>
            <Text style={styles.instructions}>
              Hold your phone flat and rotate until the gold arrow points up. That is the
              direction of the Kaaba in Makkah.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center' },
  intro: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  permissionCard: { gap: spacing.md, alignItems: 'center' },
  permissionText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  deniedText: {
    fontSize: typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  compassWrap: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.md },
  degreeText: {
    fontSize: typography.h2,
    fontWeight: fontWeight.bold,
    color: colors.navy,
  },
  instructions: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
