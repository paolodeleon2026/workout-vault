import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.8;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;
const CLOSE_THRESHOLD = DEFAULT_HEIGHT * 0.6;
const SNAP_MIDPOINT = (DEFAULT_HEIGHT + EXPANDED_HEIGHT) / 2;

export default function FilterSheet({
  visible,
  onClose,
  availableDisciplines,
  availableSkills,
  disciplineCounts,
  skillCounts,
  activeDisciplines,
  activeSkills,
  onApply,
}) {
  const [localDisciplines, setLocalDisciplines] = useState(activeDisciplines);
  const [localSkills, setLocalSkills] = useState(activeSkills);
  const [query, setQuery] = useState('');

  const sheetHeight = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const currentHeight = useRef(DEFAULT_HEIGHT);
  const isExpanded = useRef(false);

  useEffect(() => {
    if (visible) {
      setLocalDisciplines(activeDisciplines);
      setLocalSkills(activeSkills);
      setQuery('');
      currentHeight.current = DEFAULT_HEIGHT;
      isExpanded.current = false;
      sheetHeight.setValue(DEFAULT_HEIGHT);
    }
  }, [visible]);

  function snapTo(height) {
    currentHeight.current = height;
    isExpanded.current = height === EXPANDED_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue: height,
      useNativeDriver: false,
      tension: 65,
      friction: 11,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 3,
      onPanResponderMove: (_, g) => {
        const next = Math.max(80, Math.min(EXPANDED_HEIGHT, currentHeight.current - g.dy));
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const projected = currentHeight.current - g.dy;
        const fastDown = g.vy > 0.5;
        const fastUp = g.vy < -0.5;

        if (fastDown) {
          if (isExpanded.current) {
            snapTo(DEFAULT_HEIGHT);
          } else {
            onClose();
          }
        } else if (fastUp) {
          snapTo(EXPANDED_HEIGHT);
        } else if (projected < CLOSE_THRESHOLD) {
          onClose();
        } else if (projected < SNAP_MIDPOINT) {
          snapTo(DEFAULT_HEIGHT);
        } else {
          snapTo(EXPANDED_HEIGHT);
        }
      },
    })
  ).current;

  const q = query.toLowerCase();
  const filteredDisciplines = availableDisciplines.filter((d) => d.toLowerCase().includes(q));
  const filteredSkills = availableSkills.filter((s) => s.toLowerCase().includes(q));

  function toggleDiscipline(d) {
    setLocalDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleSkill(s) {
    setLocalSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleReset() {
    setLocalDisciplines([]);
    setLocalSkills([]);
    setQuery('');
  }

  function handleApply() {
    onApply(localDisciplines, localSkills);
    onClose();
  }

  const totalActive = localDisciplines.length + localSkills.length;
  const hasContent = filteredDisciplines.length > 0 || filteredSkills.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          {/* Draggable handle */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
              <Text style={[styles.resetText, totalActive === 0 && styles.resetTextDim]}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color="#555" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search disciplines or skills..."
              placeholderTextColor="#555"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>

          {/* Lists */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredDisciplines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Discipline</Text>
                {filteredDisciplines.map((d, idx) => {
                  const active = localDisciplines.includes(d);
                  const count = disciplineCounts?.[d] ?? 0;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.listItem,
                        idx < filteredDisciplines.length - 1 && styles.listItemBorder,
                      ]}
                      onPress={() => toggleDiscipline(d)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                        {active && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </View>
                      <Text style={[styles.listItemText, active && styles.listItemTextActive]}>
                        {d}
                      </Text>
                      <Text style={styles.listItemCount}>({count})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {filteredSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Skills</Text>
                {filteredSkills.map((s, idx) => {
                  const active = localSkills.includes(s);
                  const count = skillCounts?.[s] ?? 0;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.listItem,
                        idx < filteredSkills.length - 1 && styles.listItemBorder,
                      ]}
                      onPress={() => toggleSkill(s)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>
                        {active && <Ionicons name="checkmark" size={12} color="#FFF" />}
                      </View>
                      <Text style={[styles.listItemText, active && styles.listItemTextActive]}>
                        {s}
                      </Text>
                      <Text style={styles.listItemCount}>({count})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {query.length > 0 && !hasContent && (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No matches for "{query}"</Text>
              </View>
            )}

            {availableDisciplines.length === 0 && availableSkills.length === 0 && query.length === 0 && (
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>Upload videos to see filter options.</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1E1E2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A2A3E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  title: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  resetText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  resetTextDim: {
    color: '#444',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    gap: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  listItemText: {
    flex: 1,
    color: '#CCC',
    fontSize: 15,
  },
  listItemTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  listItemCount: {
    color: '#444',
    fontSize: 13,
  },
  emptySearch: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    color: '#555',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  applyBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  applyText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
