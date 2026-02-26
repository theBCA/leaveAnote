import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { useNote } from '../hooks/useNote';
import { useCountdown } from '../hooks/useCountdown';
import {
  verifySenderToken,
  deleteNote,
  updateNoteContent,
} from '../services/noteService';
import {
  formatDateTime,
  formatCountdown,
  copyToClipboard,
  shareLink,
} from '../utils/helpers';
import { validateMessage } from '../utils/validation';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageNote'>;

export default function ManageNoteScreen({ route, navigation }: Props) {
  const { noteId, token } = route.params;
  const { note, loading, error } = useNote(noteId);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const unlockTime = note?.unlockTime?.toDate();
  const countdown = useCountdown(unlockTime);

  useEffect(() => {
    if (noteId && token) {
      verifySenderToken(noteId, token)
        .then((valid) => {
          setIsAuthorized(valid);
          setVerifying(false);
        })
        .catch(() => {
          setIsAuthorized(false);
          setVerifying(false);
        });
    }
  }, [noteId, token]);

  useEffect(() => {
    if (note) setEditMessage(note.message);
  }, [note]);

  const recipientLink = `https://leaveanote.web.app/note/${noteId}`;

  const handleDelete = () => {
    Alert.alert(
      'Delete Note?',
      'This will permanently delete your note and all attachments. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId, token);
              navigation.replace('CreateNote', {});
            } catch (err) {
              Alert.alert('Error', 'Failed to delete note.');
            }
          },
        },
      ],
    );
  };

  const handleSaveEdit = async () => {
    const validation = validateMessage(editMessage);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    try {
      await updateNoteContent(noteId, token, editMessage, []);
      setIsEditing(false);
      Alert.alert('Success', 'Note updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update note.');
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(recipientLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (verifying || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthorized || error || !note) {
    return (
      <View style={styles.centered}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockEmoji}>🔒</Text>
        </View>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorDesc}>Invalid control link or note not found.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateNote', {})}
        >
          <Text style={styles.primaryBtnText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canEdit = note.status === 'pending';

  const statusColor =
    note.status === 'pending'
      ? colors.statusPending
      : note.status === 'revealed'
        ? colors.statusRevealed
        : colors.statusRead;
  const statusBg =
    note.status === 'pending'
      ? colors.statusPendingBg
      : note.status === 'revealed'
        ? colors.statusRevealedBg
        : colors.statusReadBg;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {note.createdAt && formatDateTime(note.createdAt.toDate())}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Unlock Time</Text>
            <Text style={styles.infoValue}>
              {unlockTime && formatDateTime(unlockTime, note.timezone)}
            </Text>
          </View>
        </View>

        {note.status === 'pending' && !countdown.isExpired && (
          <View style={styles.countdownSection}>
            <Text style={styles.infoLabel}>Time Remaining</Text>
            <Text style={styles.countdownValue}>{formatCountdown(countdown)}</Text>
          </View>
        )}

        {note.revealedAt && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Revealed At</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(note.revealedAt.toDate())}
            </Text>
          </View>
        )}
        {note.readAt && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Read At</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(note.readAt.toDate())}
            </Text>
          </View>
        )}
      </View>

      {/* Share Card */}
      <View style={[styles.card, shadows.card]}>
        <Text style={styles.cardTitle}>Share</Text>
        <View style={styles.qrCenter}>
          <QRCode value={recipientLink} size={140} />
        </View>
        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
            {recipientLink}
          </Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLink}>
            <Text style={styles.copyBtnText}>{copied ? '✓' : 'Copy'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => shareLink(recipientLink, 'Someone left you a note!')}
        >
          <Text style={styles.shareBtnText}>Share Link</Text>
        </TouchableOpacity>
      </View>

      {/* Message Card */}
      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Message</Text>
          {canEdit && !isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View>
            <TextInput
              style={styles.editInput}
              multiline
              value={editMessage}
              onChangeText={setEditMessage}
              maxLength={5000}
              textAlignVertical="top"
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveEdit}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  setEditMessage(note.message);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.messagePreview}>
            <Text style={styles.messageText}>{note.message}</Text>
          </View>
        )}
      </View>

      {/* Danger Zone */}
      {canEdit && (
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDesc}>
            Delete this note permanently. This action cannot be undone.
          </Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Note</Text>
          </TouchableOpacity>
        </View>
      )}
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
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lockEmoji: { fontSize: 28 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  errorDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: 13, fontWeight: '600' },
  infoGrid: { gap: spacing.md },
  infoItem: { marginBottom: spacing.sm },
  infoLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  countdownSection: { marginTop: spacing.md },
  countdownValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  qrCenter: { alignItems: 'center', marginVertical: spacing.lg },
  linkRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  linkText: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
  },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  copyBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  shareBtn: {
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: { fontWeight: '600', color: colors.text, fontSize: 15 },
  editLink: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 160,
    marginBottom: spacing.md,
  },
  editActions: { flexDirection: 'row', gap: spacing.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  messagePreview: {
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    padding: spacing.lg,
  },
  messageText: { fontSize: 16, color: colors.text, lineHeight: 24 },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerTitle: { fontSize: 20, fontWeight: '700', color: '#991B1B', marginBottom: spacing.sm },
  dangerDesc: { fontSize: 14, color: '#B91C1C', marginBottom: spacing.md },
  deleteBtn: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
