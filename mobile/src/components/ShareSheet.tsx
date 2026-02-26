import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { copyToClipboard, shareLink } from '../utils/helpers';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  recipientLink: string;
  senderLink: string;
  noteId: string;
}

export default function ShareSheet({
  visible,
  onClose,
  recipientLink,
  senderLink,
}: ShareSheetProps) {
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const [copiedSender, setCopiedSender] = useState(false);

  const handleCopy = async (text: string, which: 'recipient' | 'sender') => {
    const ok = await copyToClipboard(text);
    if (ok) {
      if (which === 'recipient') {
        setCopiedRecipient(true);
        setTimeout(() => setCopiedRecipient(false), 2000);
      } else {
        setCopiedSender(true);
        setTimeout(() => setCopiedSender(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    const shared = await shareLink(recipientLink, 'Someone left you a note!');
    if (!shared) {
      await handleCopy(recipientLink, 'recipient');
      Alert.alert('Copied!', 'Link copied to clipboard.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.handle} />

        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✓</Text>
        </View>
        <Text style={styles.title}>Note Created!</Text>
        <Text style={styles.subtitle}>Share this note with your recipient</Text>

        <View style={[styles.qrContainer, shadows.card]}>
          <QRCode value={recipientLink} size={180} />
        </View>

        <View style={styles.linkSection}>
          <Text style={styles.linkLabel}>Share Link (for recipient)</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {recipientLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, copiedRecipient && styles.copyButtonDone]}
              onPress={() => handleCopy(recipientLink, 'recipient')}
            >
              <Text style={styles.copyButtonText}>
                {copiedRecipient ? '✓' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.linkSection}>
          <Text style={styles.linkLabel}>Your Control Link (save this!)</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {senderLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, styles.copyButtonSecondary, copiedSender && styles.copyButtonDone]}
              onPress={() => handleCopy(senderLink, 'sender')}
            >
              <Text style={styles.copyButtonText}>
                {copiedSender ? '✓' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.linkHint}>
            Keep this link to manage your note (edit or cancel before reveal)
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleShare}>
            <Text style={styles.primaryButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successEmoji: { fontSize: 28, color: colors.success, fontWeight: '700' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  qrContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  linkSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  linkText: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
  },
  copyButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primary,
  },
  copyButtonSecondary: {
    backgroundColor: colors.textSecondary,
  },
  copyButtonDone: {
    backgroundColor: colors.success,
  },
  copyButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  linkHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
});
