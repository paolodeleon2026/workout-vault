import React, { useEffect, useRef, useMemo } from 'react';
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
import { useTheme } from '../theme';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const VIDEO_HEIGHT = width * (9 / 16);

export default function VideoBottomSheet({ video, visible, onClose, onEdit, onDelete }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(null, () => {});

  useEffect(() => {
    if (!player) return;
    try {
      if (visible && video?.videoUri) {
        player.replace(video.videoUri);
        player.play();
      } else {
        player.pause();
      }
    } catch (_) {}
  }, [visible, video?.videoUri]);

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
        <View style={styles.backdrop} onStartShouldSetResponder={() => { onClose(); return true; }} />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <VideoView
            player={player}
            style={styles.player}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.info}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{video?.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{video?.date}</Text>
              {video?.size ? (
                <>
                  <View style={styles.dot} />
                  <Ionicons name="server-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{video.size}</Text>
                </>
              ) : null}
              {video?.duration && video.duration !== '0:00' ? (
                <>
                  <View style={styles.dot} />
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
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

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { onClose(); onEdit?.(video); }} activeOpacity={0.8}>
                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => { onClose(); onDelete?.(video); }} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      height: SHEET_HEIGHT,
      backgroundColor: colors.surface,
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
      backgroundColor: colors.border,
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
      color: colors.text,
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
      color: colors.textSecondary,
      fontSize: 13,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.textMuted,
      marginHorizontal: 2,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      backgroundColor: colors.accentBg,
      borderWidth: 1,
      borderColor: colors.accentBorder,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    tagText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: '600',
    },
    description: {
      color: colors.textSecondary,
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
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      paddingVertical: 12,
    },
    actionBtnDanger: {
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    actionText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
