import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { movementTags as defaultTags } from '../data/placeholderData';

export default function TagInput({ selectedTags, onTagsChange }) {
  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState(defaultTags);
  const inputRef = useRef(null);

  const suggestions = query.trim().length > 0
    ? allTags.filter(
        (t) =>
          t.toLowerCase().includes(query.toLowerCase()) &&
          !selectedTags.includes(t)
      )
    : [];

  const exactMatch = allTags.some(
    (t) => t.toLowerCase() === query.trim().toLowerCase()
  );
  const showAddOption =
    query.trim().length > 0 && !exactMatch && !selectedTags.includes(query.trim());

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setQuery('');
  }

  function addCustomTag() {
    const tag = query.trim();
    if (!tag) return;
    if (!allTags.includes(tag)) {
      setAllTags((prev) => [...prev, tag]);
    }
    addTag(tag);
  }

  function removeTag(tag) {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  }

  const showDropdown = suggestions.length > 0 || showAddOption;

  return (
    <View style={styles.wrapper}>
      {/* Selected chips */}
      {selectedTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContainer}
        >
          {selectedTags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
              <TouchableOpacity
                onPress={() => removeTag(tag)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close" size={13} color="#AAA" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search movements..."
          placeholderTextColor="#555"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {suggestions.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.dropdownItem}
              onPress={() => addTag(tag)}
            >
              <Ionicons name="fitness-outline" size={14} color="#6C63FF" style={styles.dropdownIcon} />
              <Text style={styles.dropdownText}>{tag}</Text>
            </TouchableOpacity>
          ))}
          {showAddOption && (
            <TouchableOpacity style={styles.dropdownItem} onPress={addCustomTag}>
              <Ionicons name="add-circle-outline" size={14} color="#FF9F43" style={styles.dropdownIcon} />
              <Text style={[styles.dropdownText, styles.addText]}>
                Add "{query.trim()}"
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  chipsScroll: {
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    borderWidth: 1,
    borderColor: '#6C63FF44',
  },
  chipText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12121E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    padding: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E1E2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    marginTop: 4,
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 14,
  },
  addText: {
    color: '#FF9F43',
  },
});
