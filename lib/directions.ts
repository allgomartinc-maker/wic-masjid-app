/**
 * Open the user's preferred mapping application for directions.
 * Uses free platform URL schemes (Apple Maps on iOS, Google Maps on Android)
 * — no paid mapping API required.
 */
import { Linking, Platform } from 'react-native';

export function openDirections(address: string, label?: string): Promise<boolean> {
  const query = encodeURIComponent(address);
  const url = Platform.select({
    ios: `maps://?daddr=${query}${label ? `&q=${encodeURIComponent(label)}` : ''}`,
    android: `google.navigation:q=${query}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${query}`,
  });

  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return Linking.canOpenURL(url!)
    .then((supported) => Linking.openURL(supported ? url! : fallback))
    .then(() => true)
    .catch(() => Linking.openURL(fallback).then(() => true).catch(() => false));
}

export function openCoordinatesDirections(lat: number, lng: number, label?: string): Promise<boolean> {
  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lng}${label ? `&q=${encodeURIComponent(label)}` : ''}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  });
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return Linking.canOpenURL(url!)
    .then((supported) => Linking.openURL(supported ? url! : fallback))
    .then(() => true)
    .catch(() => Linking.openURL(fallback).then(() => true).catch(() => false));
}
