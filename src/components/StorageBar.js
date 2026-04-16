import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function StorageBar({ used, total, percentage }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Storage</Text>
        <Text style={styles.values}>
          <Text style={styles.used}>{used}</Text>
          <Text style={styles.total}> / {total}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: Math.min(percentage, 1) }]} />
        <View style={{ flex: Math.max(1 - percentage, 0) }} />
      </View>
      <Text style={styles.hint}>{Math.round(percentage * 100)}% used</Text>
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    values: {
      fontSize: 13,
    },
    used: {
      color: colors.accent,
      fontWeight: '700',
    },
    total: {
      color: colors.textSecondary,
    },
    track: {
      height: 8,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 4,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    fill: {
      flex: 1,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 11,
    },
  });
}
