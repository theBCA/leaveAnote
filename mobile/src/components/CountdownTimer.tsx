import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import type { CountdownTime } from '../types';

interface CountdownTimerProps {
  countdown: CountdownTime;
  timezone: string;
}

interface TimeUnitProps {
  value: number;
  label: string;
  color: string;
}

function TimeUnit({ value, label, color }: TimeUnitProps) {
  return (
    <View style={[styles.unitContainer, shadows.card]}>
      <Text style={[styles.unitValue, { color }]}>
        {String(value).padStart(2, '0')}
      </Text>
      <Text style={styles.unitLabel}>{label}</Text>
    </View>
  );
}

export default function CountdownTimer({ countdown, timezone }: CountdownTimerProps) {
  if (countdown.isExpired) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Time Until Reveal</Text>
      <View style={styles.unitsRow}>
        <TimeUnit value={countdown.days} label="Days" color={colors.primary} />
        <TimeUnit value={countdown.hours} label="Hours" color={colors.secondary} />
        <TimeUnit value={countdown.minutes} label="Min" color={colors.accent} />
        <TimeUnit value={countdown.seconds} label="Sec" color={colors.primaryDark} />
      </View>
      <Text style={styles.timezone}>Timezone: {timezone}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  unitContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minWidth: 72,
  },
  unitValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  timezone: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
