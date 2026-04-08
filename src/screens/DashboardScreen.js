import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import VideoCard from '../components/VideoCard';
import VideoBottomSheet from '../components/VideoBottomSheet';
import FilterSheet from '../components/FilterSheet';

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
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':
      return sorted.sort((a, b) => Number(b.id) - Number(a.id));
    case 'oldest':
      return sorted.sort((a, b) => Number(a.id) - Number(b.id));
    case 'shortest':
      return sorted.sort((a, b) => durationToSecs(a.duration) - durationToSecs(b.duration));
    case 'longest':
      return sorted.sort((a, b) => durationToSecs(b.duration) - durationToSecs(a.duration));
    default:
      return sorted;
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
  const sortBtnRef = useRef(null);

  // Derive available filter options and counts from actual library content
  const availableDisciplines = [...new Set(videos.flatMap((v) => v.movementTypes ?? []))].sort();
  const availableSkills = [...new Set(videos.flatMap((v) => v.tags ?? []))].sort();

  const disciplineCounts = {};
  videos.forEach((v) => (v.movementTypes ?? []).forEach((d) => { disciplineCounts[d] = (disciplineCounts[d] || 0) + 1; }));
  const skillCounts = {};
  videos.forEach((v) => (v.tags ?? []).forEach((s) => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));

  const baseFiltered = videos.filter((v) => {
    const disciplineMatch =
      activeDisciplines.length === 0 ||
      activeDisciplines.some((d) => v.movementTypes?.includes(d));
    const skillMatch =
      activeSkills.length === 0 ||
      activeSkills.some((s) => v.tags?.includes(s));
    return disciplineMatch && skillMatch;
  });

  const filteredVideos = sortVideos(baseFiltered, sortKey);
  const activeSort = SORT_OPTIONS.find((o) => o.key === sortKey);
  const totalActiveFilters = activeDisciplines.length + activeSkills.length;

  function openVideo(video) {
    setSelectedVideo(video);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
  }

  function handleEdit(video) {
    navigation.navigate('Edit', {
      video,
      onSave: (updated) => setVideos((prev) => prev.map((v) => v.id === updated.id ? updated : v)),
    });
  }

  function handleDelete(video) {
    setDeleteTarget(video);
  }

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

  function selectSort(key) {
    setSortKey(key);
    setSortMenuVisible(false);
  }

  function removeFilter(type, value) {
    if (type === 'discipline') setActiveDisciplines((prev) => prev.filter((d) => d !== value));
    else setActiveSkills((prev) => prev.filter((s) => s !== value));
  }

  const sectionLabel = `All Videos${filteredVideos.length !== videos.length ? ` (${filteredVideos.length})` : ''}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Movement Log</Text>
        <View style={styles.betaTag}>
          <Text style={styles.betaText}>Beta</Text>
        </View>
      </View>


      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Section label + Filter + Sort */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionLabel}</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  style={[styles.filterBtn, totalActiveFilters > 0 && styles.filterBtnActive]}
                  onPress={() => setFilterSheetVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="options-outline" size={15} color={totalActiveFilters > 0 ? '#6C63FF' : '#888'} />
                  <Text style={[styles.filterBtnText, totalActiveFilters > 0 && styles.filterBtnTextActive]}>
                    Filter{totalActiveFilters > 0 ? ` (${totalActiveFilters})` : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  ref={sortBtnRef}
                  style={styles.sortBtn}
                  onPress={openSortMenu}
                  activeOpacity={0.7}
                >
                  <Ionicons name="swap-vertical-outline" size={15} color="#888" />
                  <Text style={styles.sortBtnText}>{activeSort.label}</Text>
                  <Ionicons name="chevron-down" size={13} color="#555" />
                </TouchableOpacity>
              </View>
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
                    <Ionicons name="close" size={12} color="#6C63FF" style={{ marginLeft: 4 }} />
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
                    <Ionicons name="close" size={12} color="#6C63FF" style={{ marginLeft: 4 }} />
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
            <Ionicons name="cloud-upload-outline" size={48} color="#2A2A3E" />
            <Text style={styles.emptyText}>Get started by uploading a video.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <VideoBottomSheet
        video={selectedVideo}
        visible={sheetVisible}
        onClose={closeSheet}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Floating upload button */}
      <TouchableOpacity
        style={[styles.fab, styles.fabExpanded]}
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
      <Modal
        visible={sortMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.popoverBackdrop}
          activeOpacity={1}
          onPress={() => setSortMenuVisible(false)}
        />
        <View
          style={[
            styles.popover,
            {
              top: sortBtnLayout.y + sortBtnLayout.height + 8,
              right: 16,
            },
          ]}
        >
          {SORT_OPTIONS.map((opt, idx) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.popoverItem,
                idx < SORT_OPTIONS.length - 1 && styles.popoverItemBorder,
              ]}
              onPress={() => selectSort(opt.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={sortKey === opt.key ? '#6C63FF' : '#888'}
              />
              <Text style={[styles.popoverLabel, sortKey === opt.key && styles.popoverLabelActive]}>
                {opt.label}
              </Text>
              {sortKey === opt.key && (
                <Ionicons name="checkmark" size={15} color="#6C63FF" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Delete confirmation dialog */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete video?</Text>
            <Text style={styles.dialogSubtitle} numberOfLines={2}>
              "{deleteTarget?.title}" will be permanently removed.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setDeleteTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnDelete]}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogBtnDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#12121E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: 30,
  },
  betaTag: {
    backgroundColor: '#6C63FF22',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#6C63FF55',
  },
  betaText: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabExpanded: {
    width: 'auto',
    paddingHorizontal: 20,
    gap: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  activeChipsScroll: {
    marginTop: 12,
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
    backgroundColor: '#6C63FF22',
    borderWidth: 1,
    borderColor: '#6C63FF44',
  },
  activeChipText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterBtnActive: {},
  filterBtnText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '400',
  },
  filterBtnTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sortBtnText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '400',
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
    color: '#555',
    fontSize: 15,
  },
  // Sort popover
  popoverBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  popover: {
    position: 'absolute',
    width: 200,
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    shadowColor: '#000',
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
  popoverItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  popoverLabel: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '400',
  },
  popoverLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  // Delete dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#1E1E2E',
    borderRadius: 18,
    padding: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dialogTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  dialogSubtitle: {
    color: '#888',
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
  dialogBtnCancel: {
    backgroundColor: '#2A2A3E',
  },
  dialogBtnCancelText: {
    color: '#CCC',
    fontSize: 15,
    fontWeight: '600',
  },
  dialogBtnDelete: {
    backgroundColor: '#FF658422',
    borderWidth: 1,
    borderColor: '#FF658455',
  },
  dialogBtnDeleteText: {
    color: '#FF6584',
    fontSize: 15,
    fontWeight: '700',
  },
});
