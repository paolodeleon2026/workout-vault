import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const VIDEO_HEIGHT = width * (9 / 16);

export default function VideoBottomSheet({ video, visible, onClose, onEdit, onDelete }) {
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(null, () => {});

  // When the sheet opens, replace the source and play from scratch.
  // This fixes the blank-video-with-audio bug caused by the VideoView
  // being unmounted while the player retains its internal state.
  useEffect(() => {
    if (!player) return;
    try {
      if (visible && video?.thumbnail) {
        player.replace(video.thumbnail);
        player.play();
      } else {
        player.pause();
      }
    } catch (_) {}
  }, [visible, video?.thumbnail]);

  // Swipe-down gesture on the handle to close the sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 5,
      onPanResponderRelease: (_, { dy }) => {
        if (dy > 50) onClose();
      },
    })
  ).current;

  return (
    <Modal
      visible={visible && !!video}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop — tap to close */}
        <View style={styles.backdrop} onStartShouldSetResponder={() => { onClose(); return true; }} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Handle — drag down to close */}
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Video */}
          <VideoView
            player={player}
            style={styles.player}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />

          {/* Info */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.info}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{video?.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#888" />
              <Text style={styles.metaText}>{video?.date}</Text>
              {video?.size ? (
                <>
                  <View style={styles.dot} />
                  <Ionicons name="server-outline" size={14} color="#888" />
                  <Text style={styles.metaText}>{video.size}</Text>
                </>
              ) : null}
              {video?.duration && video.duration !== '0:00' ? (
                <>
                  <View style={styles.dot} />
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.metaText}>{video.duration}</Text>
                </>
              ) : null}
            </View>

            {video?.tags?.length > 0 && (
              <View style={styles.tags}>
                {video.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {video?.description ? (
              <Text style={styles.description}>{video.description}</Text>
            ) : null}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { onClose(); onEdit?.(video); }} activeOpacity={0.8}>
                <Ionicons name="pencil-outline" size={16} color="#CCC" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => { onClose(); onDelete?.(video); }} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={16} color="#FF6584" />
                <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#12121E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  player: {
    width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  info: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaText: {
    color: '#888',
    fontSize: 13,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#444',
    marginHorizontal: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#6C63FF22',
    borderWidth: 1,
    borderColor: '#6C63FF44',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#888',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionBtnDanger: {
    backgroundColor: '#FF658418',
    borderWidth: 1,
    borderColor: '#FF658433',
  },
  actionText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '600',
  },
  actionTextDanger: {
    color: '#FF6584',
  },
});
