import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, shadows } from '../config/theme';
import { getUserTimezone } from '../utils/helpers';
import { validateMessage, validateUnlockTime, validatePickedFile } from '../utils/validation';
import { createNote } from '../services/noteService';
import ShareSheet from '../components/ShareSheet';
import type { PickedFile } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateNote'>;

export default function CreateNoteScreen({ route }: Props) {
  const isReply = route.params?.isReply ?? false;

  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<(PickedFile & { preview: string })[]>([]);
  const [unlockMode, setUnlockMode] = useState<'countdown' | 'datetime'>('countdown');
  const [countdownDays, setCountdownDays] = useState('0');
  const [countdownHours, setCountdownHours] = useState('1');
  const [unlockDate, setUnlockDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareVisible, setShareVisible] = useState(false);
  const [shareLinks, setShareLinks] = useState({ recipientLink: '', senderLink: '', noteId: '' });

  const timezone = getUserTimezone();
  const maxChars = 5000;

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your media library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const newFiles: (PickedFile & { preview: string })[] = [];
    for (const asset of result.assets) {
      const file: PickedFile & { preview: string } = {
        uri: asset.uri,
        name: asset.fileName || `media_${Date.now()}`,
        type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: asset.fileSize,
        preview: asset.uri,
      };

      const validation = validatePickedFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        continue;
      }
      newFiles.push(file);
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setError('');
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');

    const msgValidation = validateMessage(message);
    if (!msgValidation.isValid) {
      setError(msgValidation.error || 'Invalid message');
      return;
    }

    let unlockTime: Date;
    if (unlockMode === 'countdown') {
      const days = parseInt(countdownDays, 10) || 0;
      const hours = parseInt(countdownHours, 10) || 0;
      const totalMs = (days * 24 + hours) * 60 * 60 * 1000;
      unlockTime = new Date(Date.now() + totalMs);
    } else {
      unlockTime = unlockDate;
    }

    const timeValidation = validateUnlockTime(unlockTime);
    if (!timeValidation.isValid) {
      setError(timeValidation.error || 'Invalid unlock time');
      return;
    }

    setLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 15000),
    );

    try {
      const result = await Promise.race([
        createNote({ message, unlockTime, files, timezone }),
        timeout,
      ]);

      const baseUrl = 'https://leaveanote.web.app';
      setShareLinks({
        recipientLink: `${baseUrl}/note/${result.noteId}`,
        senderLink: `${baseUrl}/manage/${result.noteId}/${result.senderToken}`,
        noteId: result.noteId,
      });
      setShareVisible(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('Error creating note:', err);
      setError(`Failed to create note: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShare = () => {
    setShareVisible(false);
    setMessage('');
    setFiles([]);
    setCountdownDays('0');
    setCountdownHours('1');
    setError('');
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setUnlockDate(selectedDate);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isReply && (
          <View style={styles.replyBadge}>
            <Text style={styles.replyBadgeText}>💬 Replying to message</Text>
          </View>
        )}

        <Text style={styles.heading}>
          {isReply ? 'Send Your Reply' : 'LeaveANote'}
        </Text>
        <Text style={styles.subheading}>
          {isReply
            ? 'Create a time-locked reply'
            : 'Create a time-locked message for someone special'}
        </Text>

        {/* Message */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.label}>Your Message</Text>
          <TextInput
            style={styles.messageInput}
            multiline
            placeholder="Write your time-locked message here..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            maxLength={maxChars}
            editable={!loading}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {message.length} / {maxChars} characters
          </Text>
        </View>

        {/* Attachments */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.label}>Attachments (Optional)</Text>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickMedia}
            disabled={loading}
          >
            <Text style={styles.attachIcon}>📎</Text>
            <Text style={styles.attachText}>Add Photos or Videos</Text>
            <Text style={styles.attachHint}>Max 10MB per file</Text>
          </TouchableOpacity>

          {files.length > 0 && (
            <View style={styles.previewGrid}>
              {files.map((file, index) => (
                <View key={index} style={styles.previewItem}>
                  <Image
                    source={{ uri: file.preview }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Unlock Time */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.label}>When should this note unlock?</Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, unlockMode === 'countdown' && styles.modeActive]}
              onPress={() => setUnlockMode('countdown')}
            >
              <Text
                style={[styles.modeText, unlockMode === 'countdown' && styles.modeTextActive]}
              >
                Countdown
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, unlockMode === 'datetime' && styles.modeActive]}
              onPress={() => setUnlockMode('datetime')}
            >
              <Text
                style={[styles.modeText, unlockMode === 'datetime' && styles.modeTextActive]}
              >
                Date/Time
              </Text>
            </TouchableOpacity>
          </View>

          {unlockMode === 'countdown' ? (
            <View style={styles.countdownRow}>
              <View style={styles.countdownField}>
                <Text style={styles.countdownLabel}>Days</Text>
                <TextInput
                  style={styles.countdownInput}
                  keyboardType="number-pad"
                  value={countdownDays}
                  onChangeText={setCountdownDays}
                  editable={!loading}
                />
              </View>
              <View style={styles.countdownField}>
                <Text style={styles.countdownLabel}>Hours</Text>
                <TextInput
                  style={styles.countdownInput}
                  keyboardType="number-pad"
                  value={countdownHours}
                  onChangeText={setCountdownHours}
                  editable={!loading}
                />
              </View>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerText}>
                  {unlockDate.toLocaleString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={unlockDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              <Text style={styles.timezoneHint}>Your timezone: {timezone}</Text>
            </View>
          )}
        </View>

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, (!message.trim() || loading) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading || !message.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Create Note</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          Your message will be encrypted and stored securely.{'\n'}
          Only the recipient can view it after the unlock time.
        </Text>
      </ScrollView>

      <ShareSheet
        visible={shareVisible}
        onClose={handleCloseShare}
        recipientLink={shareLinks.recipientLink}
        senderLink={shareLinks.senderLink}
        noteId={shareLinks.noteId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  replyBadge: {
    alignSelf: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  replyBadgeText: { color: '#1E40AF', fontSize: 14, fontWeight: '600' },
  heading: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 160,
  },
  charCount: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  attachButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  attachIcon: { fontSize: 28, marginBottom: spacing.xs },
  attachText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  attachHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  previewItem: { width: 80, height: 80, borderRadius: borderRadius.sm, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.divider,
    borderRadius: borderRadius.sm,
    padding: 3,
    marginBottom: spacing.md,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.sm - 2,
    alignItems: 'center',
  },
  modeActive: { backgroundColor: colors.primary },
  modeText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modeTextActive: { color: '#FFF' },
  countdownRow: { flexDirection: 'row', gap: spacing.md },
  countdownField: { flex: 1 },
  countdownLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  countdownInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  datePickerText: { fontSize: 16, color: colors.text },
  timezoneHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14, fontWeight: '500' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  footer: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
