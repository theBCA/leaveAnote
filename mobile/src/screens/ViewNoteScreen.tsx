import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { useNote } from '../hooks/useNote';
import { useCountdown } from '../hooks/useCountdown';
import { updateNoteStatus } from '../services/noteService';
import { formatDateTime } from '../utils/helpers';
import CountdownTimer from '../components/CountdownTimer';
import MediaGallery from '../components/MediaGallery';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ViewNote'>;

export default function ViewNoteScreen({ route, navigation }: Props) {
  const { noteId } = route.params;
  const { note, loading, error } = useNote(noteId);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasTriggeredReveal, setHasTriggeredReveal] = useState(false);

  const unlockTime = note?.unlockTime?.toDate();
  const countdown = useCountdown(unlockTime);

  useEffect(() => {
    if (!note) return;

    if (countdown.isExpired && !hasTriggeredReveal) {
      setHasTriggeredReveal(true);

      if (note.status === 'pending') {
        updateNoteStatus(noteId, 'revealed').catch(console.error);
      }

      setTimeout(() => setIsRevealed(true), 500);
    } else if (note.status === 'revealed' || note.status === 'read') {
      setIsRevealed(true);
      setHasTriggeredReveal(true);
    }
  }, [note, countdown, noteId, hasTriggeredReveal]);

  useEffect(() => {
    if (isRevealed && note && note.status === 'revealed') {
      updateNoteStatus(noteId, 'read').catch(console.error);
    }
  }, [isRevealed, note, noteId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading note...</Text>
      </View>
    );
  }

  if (error || !note) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorEmoji}>✕</Text>
        </View>
        <Text style={styles.errorTitle}>Note Not Found</Text>
        <Text style={styles.errorDesc}>
          This note doesn't exist or has been deleted.
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateNote', {})}
        >
          <Text style={styles.actionButtonText}>Create Your Own Note</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isRevealed) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.envelopeIcon}>
            <Text style={styles.envelopeEmoji}>✉️</Text>
          </View>
          <Text style={styles.teaserTitle}>
            Someone Left You a Special Note
          </Text>
          <Text style={styles.teaserSubtitle}>
            Your message will be revealed soon...
          </Text>

          <CountdownTimer countdown={countdown} timezone={note.timezone} />

          <Text style={styles.unlockInfo}>
            Unlocks on:{' '}
            <Text style={styles.unlockDate}>
              {unlockTime && formatDateTime(unlockTime, note.timezone)}
            </Text>
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.revealIcon}>
          <Text style={{ fontSize: 28 }}>✨</Text>
        </View>
        <Text style={styles.revealTitle}>Your Message Has Arrived!</Text>
        <Text style={styles.revealDate}>
          Created {note.createdAt && formatDateTime(note.createdAt.toDate())}
        </Text>

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{note.message}</Text>
        </View>

        {note.mediaUrls && note.mediaUrls.length > 0 && (
          <MediaGallery mediaUrls={note.mediaUrls} />
        )}

        <View style={styles.revealActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('CreateNote', {
                isReply: true,
                replyTo: noteId,
              })
            }
          >
            <Text style={styles.actionButtonText}>Leave a Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => navigation.navigate('CreateNote', {})}
          >
            <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
              Create Your Own
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 16 },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  errorEmoji: { fontSize: 28, color: colors.error, fontWeight: '700' },
  errorTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  errorDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  envelopeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  envelopeEmoji: { fontSize: 32 },
  teaserTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  teaserSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  unlockInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  unlockDate: { fontWeight: '600', color: colors.text },
  revealIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  revealTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  revealDate: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  messageBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  messageText: {
    fontSize: 17,
    color: colors.text,
    lineHeight: 26,
  },
  revealActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  secondaryAction: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: { color: colors.text },
});
