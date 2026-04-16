import React, { useState, useRef, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import VideoCard from '../components/VideoCard';
import VideoBottomSheet from '../components/VideoBottomSheet';
import FilterSheet from '../components/FilterSheet';
import { useTheme } from '../theme';

const SORT_OPTIONS = [
  { key: 'alpha', label: 'Alphabetical', icon: 'text-outline' },
  { key: 'newest', label: 'Newest', icon: 'arrow-down-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'arrow-up-outline' },
  { key: 'shortest', label: 'Shortest', icon: 'timer-outline' },
  { key: 'longest', label: 'Longest', icon: 'hourglass-outline' },
];

function sortVideos(videos, sortKey) {
  const sorted = [...videos];
  switch (sortKey) {
    case 'alpha':   return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':  return sorted.sort((a, b) => Number(b.id) - Number(a.id));
    case 'oldest':  return sorted.sort((a, b) => Number(a.id) - Number(b.id));
    case 'shortest': return sorted.sort((a, b) => durationToSecs(a.duration) - durationToSecs(b.duration));
    case 'longest':  return sorted.sort((a, b) => durationToSecs(b.duration) - durationToSecs(a.duration));
    default: return sorted;
  }
}

function durationToSecs(dur) {
  if (!dur) return 0;
  const parts = dur.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [videos, setVideos] = useState([]);
  const [activeDisciplines, setActiveDisciplines] = useState([]);
  const [activeSkills, setActiveSkills] = useState([]);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortKey, setSortKey] = useState('alpha');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBtnLayout, setSortBtnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const sortBtnRef = useRef(null);
  const searchInputRef = useRef(null);
  const videosLoaded = useRef(false);

  // Load persisted videos on mount
  useEffect(() => {
    AsyncStorage.getItem('@workout_vault_videos').then((val) => {
      if (val) setVideos(JSON.parse(val));
      videosLoaded.current = true;
    }).catch(() => { videosLoaded.current = true; });
  }, []);

  // Save whenever videos change (but not before the initial load completes)
  useEffect(() => {
    if (!videosLoaded.current) return;
    AsyncStorage.setItem('@workout_vault_videos', JSON.stringify(videos)).catch(() => {});
  }, [videos]);

  const availableDisciplines = [...new Set(videos.flatMap((v) => v.movementTypes ?? []))].sort();
  const availableSkills = [...new Set(videos.flatMap((v) => v.tags ?? []))].sort();

  const disciplineCounts = {};
  videos.forEach((v) => (v.movementTypes ?? []).forEach((d) => { disciplineCounts[d] = (disciplineCounts[d] || 0) + 1; }));
  const skillCounts = {};
  videos.forEach((v) => (v.tags ?? []).forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));

  const baseFiltered = videos.filter((v) => {
    const disciplineMatch = activeDisciplines.length === 0 || activeDisciplines.some((d) => v.movementTypes?.includes(d));
    const skillMatch = activeSkills.length === 0 || activeSkills.some((s) => v.tags?.includes(s));
    return disciplineMatch && skillMatch;
  });

  const q = searchQuery.trim().toLowerCase();
  const searchFiltered = q
    ? baseFiltered.filter((v) =>
        v.title?.toLowerCase().includes(q) ||
        (v.movementTypes ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (v.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    : baseFiltered;

  const filteredVideos = sortVideos(searchFiltered, sortKey);
  const activeSort = SORT_OPTIONS.find((o) => o.key === sortKey);
  const totalActiveFilters = activeDisciplines.length + activeSkills.length;

  function openVideo(video) { setSelectedVideo(video); setSheetVisible(true); }
  function closeSheet() { setSheetVisible(false); }

  function handleEdit(video) {
    navigation.navigate('Edit', {
      video,
      onSave: (updated) => setVideos((prev) => prev.map((v) => v.id === updated.id ? updated : v)),
    });
  }

  function handleEditFromSheet(video) {
    navigation.navigate('Edit', {
      video,
      onSave: (updated) => {
        setVideos((prev) => prev.map((v) => v.id === updated.id ? updated : v));
        setSelectedVideo(updated);
        setSheetVisible(true);
      },
    });
  }

  function handleDelete(video) { setDeleteTarget(video); }

  function confirmDelete() {
    setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function openSortMenu() {
    sortBtnRef.current?.measureInWindow((x, y, width, height) => {
      setSortBtnLayout({ x, y, width, height });
      setSortMenuVisible(true);
    });
  }

  function selectSort(key) { setSortKey(key); setSortMenuVisible(false); }

  function removeFilter(type, value) {
    if (type === 'discipline') setActiveDisciplines((prev) => prev.filter((d) => d !== value));
    else setActiveSkills((prev) => prev.filter((s) => s !== value));
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchQuery('');
    setSearchOpen(false);
  }

  const sectionLabel = `All Videos${filteredVideos.length !== videos.length ? ` (${filteredVideos.length})` : ''}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Movement Log</Text>
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>Beta</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Row 1: "All Videos" + search icon  OR  search bar */}
            {searchOpen ? (
              <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search titles, disciplines, skills…"
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="search"
                  autoFocus
                />
                <TouchableOpacity onPress={closeSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{sectionLabel}</Text>
                <TouchableOpacity onPress={openSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Row 2: Filter + Sort */}
            <View style={styles.filterSortRow}>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setFilterSheetVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="options-outline" size={15} color={totalActiveFilters > 0 ? colors.accent : colors.textSecondary} />
                <Text style={[styles.filterBtnText, totalActiveFilters > 0 && { color: colors.accent, fontWeight: '600' }]}>
                  Filter{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                ref={sortBtnRef}
                style={styles.sortBtn}
                onPress={openSortMenu}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-vertical-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.sortBtnText}>{activeSort.label}</Text>
                <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Active filter chips */}
            {totalActiveFilters > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeChips}
                style={styles.activeChipsScroll}
              >
                {activeDisciplines.map((d) => (
                  <TouchableOpacity
                    key={`d-${d}`}
                    style={styles.activeChip}
                    onPress={() => removeFilter('discipline', d)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activeChipText}>{d}</Text>
                    <Ionicons name="close" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
                {activeSkills.map((s) => (
                  <TouchableOpacity
                    key={`s-${s}`}
                    style={styles.activeChip}
                    onPress={() => removeFilter('skill', s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.activeChipText}>{s}</Text>
                    <Ionicons name="close" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => openVideo(item)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.surfaceElevated} />
            <Text style={styles.emptyText}>Get started by uploading a video.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <VideoBottomSheet
        video={selectedVideo}
        visible={sheetVisible}
        onClose={closeSheet}
        onEdit={handleEditFromSheet}
        onDelete={handleDelete}
      />

      {/* Floating upload button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 8 }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Upload', {
          onAdd: (video) => setVideos((v) => [video, ...v]),
        })}
      >
        <Ionicons name="cloud-upload-outline" size={22} color="#FFF" />
        <Text style={styles.fabText}>Upload</Text>
      </TouchableOpacity>

      <FilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        availableDisciplines={availableDisciplines}
        availableSkills={availableSkills}
        disciplineCounts={disciplineCounts}
        skillCounts={skillCounts}
        activeDisciplines={activeDisciplines}
        activeSkills={activeSkills}
        onApply={(disciplines, skills) => {
          setActiveDisciplines(disciplines);
          setActiveSkills(skills);
        }}
      />

      {/* Sort popover */}
      <Modal visible={sortMenuVisible} transparent animationType="fade" onRequestClose={() => setSortMenuVisible(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSortMenuVisible(false)} />
        <View style={[styles.popover, { top: sortBtnLayout.y + sortBtnLayout.height + 8, right: 16 }]}>
          {SORT_OPTIONS.map((opt, idx) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.popoverItem, idx < SORT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => selectSort(opt.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={opt.icon} size={16} color={sortKey === opt.key ? colors.accent : colors.textSecondary} />
              <Text style={[styles.popoverLabel, sortKey === opt.key && { color: colors.accent, fontWeight: '600' }]}>
                {opt.label}
              </Text>
              {sortKey === opt.key && (
                <Ionicons name="checkmark" size={15} color={colors.accent} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Remove video?</Text>
            <Text style={styles.dialogSubtitle} numberOfLines={2}>
              "{deleteTarget?.title}" will be permanently removed.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} onPress={() => setDeleteTarget(null)} activeOpacity={0.8}>
                <Text style={[styles.dialogBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder }]} onPress={confirmDelete} activeOpacity={0.8}>
                <Text style={[styles.dialogBtnText, { color: colors.danger, fontWeight: '700' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      zIndex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 0.3,
      lineHeight: 30,
    },
    betaTag: {
      backgroundColor: colors.accentBg,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    betaText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      height: 40,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 0,
    },
    filterSortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 12,
      gap: 14,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    filterBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    sortBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    activeChipsScroll: {
      marginTop: 4,
    },
    activeChips: {
      paddingHorizontal: 16,
      gap: 8,
      paddingBottom: 4,
    },
    activeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.accentBg,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    activeChipText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '600',
    },
    listContent: {
      paddingBottom: 24,
      flexGrow: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      marginTop: -96,
      gap: 12,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 15,
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 'auto',
      paddingHorizontal: 20,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
    fabText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
    popover: {
      position: 'absolute',
      width: 200,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
      overflow: 'hidden',
    },
    popoverItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 10,
    },
    popoverLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    dialogOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    dialog: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 24,
      gap: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
    dialogTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    dialogSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    dialogActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    dialogBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 12,
    },
    dialogBtnText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
