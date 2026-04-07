import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StorageBar({ used, total, percentage }) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E2E',
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
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  values: {
    fontSize: 13,
  },
  used: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  total: {
    color: '#888',
  },
  track: {
    height: 8,
    backgroundColor: '#2A2A3E',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fill: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  hint: {
    color: '#555',
    fontSize: 11,
  },
});
