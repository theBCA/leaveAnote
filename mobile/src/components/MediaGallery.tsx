import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius } from '../config/theme';

interface MediaGalleryProps {
  mediaUrls: string[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MediaGallery({ mediaUrls }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});

  if (mediaUrls.length === 0) return null;

  const isVideo = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);
  const numColumns = mediaUrls.length === 1 ? 1 : 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attachments</Text>
      <FlatList
        data={mediaUrls}
        numColumns={numColumns}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        renderItem={({ item: url, index }) => (
          <TouchableOpacity
            style={[styles.thumbnail, numColumns === 1 && styles.singleThumbnail]}
            onPress={() => setSelectedIndex(index)}
            activeOpacity={0.8}
          >
            {isVideo(url) ? (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.playIcon}>▶</Text>
                <Text style={styles.videoLabel}>Video</Text>
              </View>
            ) : (
              <>
                {loadingStates[index] && (
                  <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} />
                )}
                <Image
                  source={{ uri: url }}
                  style={styles.thumbnailImage}
                  onLoadStart={() =>
                    setLoadingStates((s) => ({ ...s, [index]: true }))
                  }
                  onLoadEnd={() =>
                    setLoadingStates((s) => ({ ...s, [index]: false }))
                  }
                />
              </>
            )}
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.lightbox}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setSelectedIndex(null)}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>

          {selectedIndex !== null && !isVideo(mediaUrls[selectedIndex]) && (
            <Image
              source={{ uri: mediaUrls[selectedIndex] }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          {selectedIndex !== null && isVideo(mediaUrls[selectedIndex]) && (
            <View style={styles.lightboxVideoPlaceholder}>
              <Text style={styles.lightboxVideoText}>
                Video playback requires a native video player
              </Text>
            </View>
          )}

          {mediaUrls.length > 1 && selectedIndex !== null && (
            <View style={styles.lightboxNav}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() =>
                  setSelectedIndex(
                    (selectedIndex - 1 + mediaUrls.length) % mediaUrls.length,
                  )
                }
              >
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.navCounter}>
                {selectedIndex + 1} / {mediaUrls.length}
              </Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() =>
                  setSelectedIndex((selectedIndex + 1) % mediaUrls.length)
                }
              >
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: { gap: spacing.sm },
  thumbnail: {
    flex: 1,
    height: 150,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },
  singleThumbnail: { height: 200 },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  playIcon: { fontSize: 36, color: '#FFF' },
  videoLabel: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  lightboxImage: {
    width: screenWidth - 32,
    height: screenHeight * 0.7,
  },
  lightboxVideoPlaceholder: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  lightboxVideoText: { color: '#94A3B8', fontSize: 16, textAlign: 'center' },
  lightboxNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    position: 'absolute',
    bottom: 60,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  navCounter: { color: '#FFF', fontSize: 15 },
});
