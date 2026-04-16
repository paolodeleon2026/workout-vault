import React, { useState, useRef, useMemo } from 'react';
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
import { useTheme } from '../theme';

export default function TagInput({ selectedTags, onTagsChange, onFocus, onBlur, predefinedValues, placeholder }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState(predefinedValues ?? defaultTags);
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
                <Ionicons name="close" size={13} color={colors.accent} />
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
          placeholder={placeholder ?? 'Search movements...'}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {suggestions.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
              onPress={() => addTag(tag)}
            >
              <Text style={styles.dropdownText}>{tag}</Text>
            </TouchableOpacity>
          ))}
          {showAddOption && (
            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
              onPress={addCustomTag}
            >
              <Text style={[styles.dropdownText, { color: colors.warn }]}>
                Add "{query.trim()}"
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
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
      backgroundColor: colors.accentBg,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      gap: 5,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    chipText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '600',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      padding: 0,
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      zIndex: 100,
      overflow: 'hidden',
      shadowColor: colors.shadow,
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
    },
    dropdownText: {
      color: colors.text,
      fontSize: 14,
    },
  });
}
