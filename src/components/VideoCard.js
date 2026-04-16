import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOVEMENT_TYPE_ORDER } from '../data/placeholderData';
import { useTheme } from '../theme';

export default function VideoCard({ video, onPress, onEdit, onDelete }) {
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const moreBtnRef = useRef(null);

  const styles = useMemo(() => getStyles(colors), [colors]);

  const sortedTypes = (video.movementTypes ?? []).slice().sort(
    (a, b) => MOVEMENT_TYPE_ORDER.indexOf(a) - MOVEMENT_TYPE_ORDER.indexOf(b)
  );

  function openMenu() {
    moreBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ x: x + width, y: y + height });
      setMenuVisible(true);
    });
  }

  function handleEdit() {
    setMenuVisible(false);
    onEdit?.(video);
  }

  function handleDelete() {
    setMenuVisible(false);
    onDelete?.(video);
  }

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.thumbnailWrap}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="play-circle" size={40} color={colors.accent} />
          </View>
        )}
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.85)" />
        </View>
      </View>

      <View style={styles.info}>
        {/* Group 1: title + meta (8px apart) */}
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>{video.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.meta}>{video.duration}</Text>
            <View style={styles.dot} />
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.meta}>{video.date}</Text>
          </View>
        </View>

        {/* Group 2: discipline label + skill chips (8px apart), 16px below group 1 */}
        {(sortedTypes.length > 0 || video.tags?.length > 0) && (
          <View style={styles.disciplineGroup}>
            {sortedTypes.length > 0 && (
              <Text style={styles.movementTypes} numberOfLines={1}>
                {sortedTypes.join(' · ')}
              </Text>
            )}
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
        )}
      </View>

      {/* Ellipsis button */}
      <TouchableOpacity
        ref={moreBtnRef}
        style={styles.moreBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={openMenu}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Ellipsis popover */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setMenuVisible(false)} />
        <View style={[styles.menu, { top: menuPos.y + 4, right: 16 }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.menuLabel}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={[styles.menuLabel, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 12,
      alignItems: 'flex-start',
      shadowColor: colors.shadow,
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
      backgroundColor: colors.accentBg,
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    info: {
      flex: 1,
      gap: 16,
    },
    titleGroup: {
      gap: 8,
    },
    disciplineGroup: {
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    movementTypes: {
      color: colors.subtle,
      fontSize: 11,
      fontStyle: 'italic',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
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
      gap: 4,
      flexWrap: 'wrap',
    },
    tag: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 20,
    },
    tagText: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    moreBtn: {
      padding: 4,
      marginLeft: 4,
      alignSelf: 'flex-start',
    },
    menu: {
      position: 'absolute',
      width: 140,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    menuLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });
}
