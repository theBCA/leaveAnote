import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { Share, Platform } from 'react-native';
import type { CountdownTime } from '../types';

export function calculateCountdown(unlockTime: Date): CountdownTime {
  const now = new Date().getTime();
  const target = unlockTime.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isExpired) {
    return 'Time has arrived!';
  }

  const parts: string[] = [];
  if (countdown.days > 0) parts.push(`${countdown.days}d`);
  if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`);
  if (countdown.seconds > 0 || parts.length === 0) parts.push(`${countdown.seconds}s`);

  return parts.join(' ');
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDateTime(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}

export function generateUniqueId(): string {
  return Crypto.randomUUID();
}

export function generateToken(): string {
  const array = Crypto.getRandomBytes(32);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function shareLink(url: string, title: string = 'LeaveANote'): Promise<boolean> {
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url, title }
        : { message: `${title}: ${url}`, title },
    );
    return true;
  } catch {
    return false;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
