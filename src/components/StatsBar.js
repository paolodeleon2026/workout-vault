import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function StatItem({ icon, value, label, color }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StatsBar({ stats }) {
  return (
    <View style={styles.container}>
      <StatItem icon="videocam" value={stats.totalVideos} label="Videos" color="#6C63FF" />
      <View style={styles.divider} />
      <StatItem icon="time-outline" value={stats.totalDuration} label="Total" color="#FF6584" />
      <View style={styles.divider} />
      <StatItem icon="calendar-outline" value={stats.thisWeek} label="This week" color="#FF9F43" />
      <View style={styles.divider} />
      <StatItem icon="server-outline" value={stats.totalStorage} label="Storage" color="#26de81" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
  },
  divider: {
    width: 1,
    backgroundColor: '#2A2A3E',
    marginVertical: 4,
  },
});
