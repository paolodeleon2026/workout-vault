import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTheme } from '../theme';

const { width } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { video } = route.params;

  const player = useVideoPlayer(video.videoUri, useCallback((p) => {
    p.play();
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{video.title}</Text>
          <Text style={styles.headerDate}>{video.date}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Video player */}
      <VideoView
        player={player}
        style={styles.player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
      />

      {/* Metadata */}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.metaText}>{video.duration}</Text>
          <View style={styles.dot} />
          <Ionicons name="server-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.metaText}>{video.size}</Text>
        </View>

        {video.tags && video.tags.length > 0 && (
          <View style={styles.tags}>
            {video.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {video.description ? (
          <Text style={styles.description}>{video.description}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    headerDate: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 1,
    },
    player: {
      width,
      height: width * (9 / 16),
      backgroundColor: '#000',
    },
    meta: {
      padding: 20,
      gap: 14,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      color: colors.textSecondary,
      fontSize: 14,
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
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    tagText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '600',
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
