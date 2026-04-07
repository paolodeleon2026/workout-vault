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
import StorageBar from '../components/StorageBar';
import VideoBottomSheet from '../components/VideoBottomSheet';
import { stats, categories } from '../data/placeholderData';

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
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sortKey, setSortKey] = useState('alpha');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBtnLayout, setSortBtnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const sortBtnRef = useRef(null);

  const baseFiltered =
    activeCategory === 'All'
      ? videos
      : videos.filter((v) => v.movementTypes?.includes(activeCategory));

  const filteredVideos = sortVideos(baseFiltered, sortKey);
  const activeSort = SORT_OPTIONS.find((o) => o.key === sortKey);

  function openVideo(video) {
    setSelectedVideo(video);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
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

  const sectionLabel = activeCategory === 'All' ? 'All Videos' : activeCategory;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning 👋</Text>
          <Text style={styles.title}>Workout Vault</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Upload', {
            onAdd: (video) => setVideos((v) => [video, ...v]),
          })}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
          <Text style={styles.uploadText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Storage */}
            <StorageBar
              used={stats.totalStorage}
              total="30 GB"
              percentage={stats.storageUsed}
            />

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
              style={styles.categoriesScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activeCategory === cat && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Section label + Sort */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{sectionLabel}</Text>

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
          </>
        }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={() => openVideo(item)}
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
  },
  greeting: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  categoriesScroll: {
    marginBottom: 4,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  chipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  chipText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFF',
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
});
