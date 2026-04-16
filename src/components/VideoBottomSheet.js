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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { MOVEMENT_TYPE_ORDER } from '../data/placeholderData';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const VIDEO_HEIGHT = width * (9 / 16);
const DISMISS_THRESHOLD = SHEET_HEIGHT * 0.3;

export default function VideoBottomSheet({ video, visible, onClose, onEdit, onDelete }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const sortedTypes = (video?.movementTypes ?? []).slice().sort(
    (a, b) => MOVEMENT_TYPE_ORDER.indexOf(a) - MOVEMENT_TYPE_ORDER.indexOf(b)
  );

  const translateY = useRef(new Animated.Value(0)).current;

  // Reset position whenever the sheet opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  // Keep a ref to the latest dismiss/snapOpen so the PanResponder (created once)
  // always calls the current version and never holds a stale closure.
  const dismissRef = useRef(null);
  const snapOpenRef = useRef(null);

  function dismiss(afterAction) {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (typeof afterAction === 'function') afterAction();
    });
  }

  function snapOpen() {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }

  dismissRef.current = dismiss;
  snapOpenRef.current = snapOpen;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 3,
      onPanResponderMove: (_, { dy }) => {
        translateY.setValue(Math.max(0, dy));
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const fastFlick = vy > 0.5;
        const draggedFar = dy > DISMISS_THRESHOLD;
        if (fastFlick || draggedFar) {
          dismissRef.current();
        } else {
          snapOpenRef.current();
        }
      },
    })
  ).current;

  // Backdrop fades out as the sheet is dragged down
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const player = useVideoPlayer(video?.videoUri ? { uri: video.videoUri } : null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (visible && video?.videoUri) {
      let sub;
      try {
        sub = player.addListener('statusChange', ({ status }) => {
          if (status === 'readyToPlay') {
            try { player.play(); } catch (_) {}
          }
        });
        player.replace({ uri: video.videoUri });
        player.play();
      } catch (_) {}
      return () => { try { sub?.remove(); } catch (_) {} };
    } else {
      try { player.pause(); } catch (_) {}
    }
  }, [visible, video?.videoUri]);

  return (
    <Modal
      visible={visible && !!video}
      transparent
      animationType="slide"
      onRequestClose={() => dismiss()}
      statusBarTranslucent
    >
      {/* Animated background fade — pointerEvents none so it NEVER blocks touches */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="none"
      />

      <View style={styles.overlay}>
        {/* Dismiss tap target — only covers the area ABOVE the sheet, never overlaps it */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => dismiss()}
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle — full-width grab area */}
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
            {/* Group 1: title + meta */}
            <View style={styles.titleGroup}>
              <Text style={styles.title}>{video?.title}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{video?.date}</Text>
                {video?.duration && video.duration !== '0:00' ? (
                  <>
                    <View style={styles.dot} />
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{video.duration}</Text>
                  </>
                ) : null}
              </View>
            </View>

            {/* Group 2: discipline label + skill chips */}
            {(sortedTypes.length > 0 || video?.tags?.length > 0) && (
              <View style={styles.disciplineGroup}>
                {sortedTypes.length > 0 && (
                  <Text style={styles.movementTypes}>{sortedTypes.join(' · ')}</Text>
                )}
                {video?.tags?.length > 0 && (
                  <View style={styles.tags}>
                    {video.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {video?.description ? (
              <Text style={styles.description}>{video.description}</Text>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnEdit]}
                onPress={() => { onClose(); onEdit?.(video); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger]}
                onPress={() => { onClose(); onDelete?.(video); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionText, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
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
      paddingVertical: 12,
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
      gap: 8,
    },
    titleGroup: {
      gap: 4,
    },
    disciplineGroup: {
      gap: 4,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    movementTypes: {
      color: colors.subtle,
      fontSize: 13,
      fontStyle: 'italic',
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
      gap: 4,
    },
    tag: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 20,
    },
    tagText: {
      color: colors.textSecondary,
      fontSize: 12,
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
    actionBtnEdit: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
