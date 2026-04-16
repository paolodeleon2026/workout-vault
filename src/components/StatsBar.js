import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

function StatItem({ icon, value, label, color, styles }) {
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
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <StatItem icon="videocam" value={stats.totalVideos} label="Videos" color={colors.accent} styles={styles} />
      <View style={styles.divider} />
      <StatItem icon="time-outline" value={stats.totalDuration} label="Total" color={colors.danger} styles={styles} />
      <View style={styles.divider} />
      <StatItem icon="calendar-outline" value={stats.thisWeek} label="This week" color={colors.warn} styles={styles} />
      <View style={styles.divider} />
      <StatItem icon="server-outline" value={stats.totalStorage} label="Storage" color={colors.success} styles={styles} />
    </View>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 8,
      marginBottom: 20,
      shadowColor: colors.shadow,
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
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    divider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
  });
}
