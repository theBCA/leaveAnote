import { CountdownTime } from '../types';

export function calculateCountdown(unlockTime: Date): CountdownTime {
  const now = new Date().getTime();
  const target = unlockTime.getTime();
  const difference = target - now;
  
  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isExpired) {
    return 'Time has arrived!';
  }
  
  const parts: string[] = [];
  
  if (countdown.days > 0) {
    parts.push(`${countdown.days} day${countdown.days !== 1 ? 's' : ''}`);
  }
  if (countdown.hours > 0) {
    parts.push(`${countdown.hours} hour${countdown.hours !== 1 ? 's' : ''}`);
  }
  if (countdown.minutes > 0) {
    parts.push(`${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}`);
  }
  if (countdown.seconds > 0 || parts.length === 0) {
    parts.push(`${countdown.seconds} second${countdown.seconds !== 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDateTime(date: Date, timezone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: timezone,
  }).format(date);
}

export function generateUniqueId(): string {
  return crypto.randomUUID();
}

export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function downloadQRCode(dataUrl: string, filename: string = 'note-qr-code.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function shareLink(url: string, title: string = 'LeaveANote') {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
      });
      return true;
    } catch (error) {
      // User cancelled or share failed
      return false;
    }
  }
  return false;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
