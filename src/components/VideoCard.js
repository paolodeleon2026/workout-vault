import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOVEMENT_TYPE_ORDER } from '../data/placeholderData';

export default function VideoCard({ video, onPress }) {
  // Sort movement types in canonical order: Breaking → Flexibility → Mobility
  const sortedTypes = (video.movementTypes ?? []).slice().sort(
    (a, b) => MOVEMENT_TYPE_ORDER.indexOf(a) - MOVEMENT_TYPE_ORDER.indexOf(b)
  );

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.thumbnailWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={40} color="#6C63FF" />
          </View>
        )}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.85)" />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{video.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color="#888" />
          <Text style={styles.meta}>{video.duration}</Text>
          <View style={styles.dot} />
          <Ionicons name="calendar-outline" size={13} color="#888" />
          <Text style={styles.meta}>{video.date}</Text>
        </View>

        {/* Movement types — dim italic, low visual priority */}
        {sortedTypes.length > 0 && (
          <Text style={styles.movementTypes} numberOfLines={1}>
            {sortedTypes.join(' · ')}
          </Text>
        )}

        {/* Movement tags */}
        {video.tags?.length > 0 && (
          <View style={styles.tags}>
            {video.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-vertical" size={18} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbnailWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF22',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    color: '#888',
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#555',
    marginHorizontal: 2,
  },
  movementTypes: {
    color: '#4A4A6A',
    fontSize: 11,
    fontStyle: 'italic',
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tagText: {
    color: '#AAA',
    fontSize: 11,
  },
  moreBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
