import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function SettingsSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingsRow({ icon, iconColor, label, value, isLast, toggle, toggleValue, onToggle, chevron }) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: '#2A2A3E', true: '#6C63FF' }}
            thumbColor="#FFF"
          />
        ) : null}
        {chevron && !toggle ? (
          <Ionicons name="chevron-forward" size={16} color="#555" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [wifiOnly, setWifiOnly] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#12121E" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#6C63FF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileEmail}>alex@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Storage section */}
        <SettingsSection title="Storage">
          <SettingsRow
            icon="server-outline"
            iconColor="#6C63FF"
            label="Storage Location"
            value="iCloud"
            chevron
            isLast
          />
        </SettingsSection>

        {/* Upload section */}
        <SettingsSection title="Upload">
          <SettingsRow
            icon="wifi-outline"
            iconColor="#26de81"
            label="Wi-Fi Only"
            toggle
            toggleValue={wifiOnly}
            onToggle={setWifiOnly}
          />
          <SettingsRow
            icon="videocam-outline"
            iconColor="#6C63FF"
            label="Default Quality"
            value="1080p"
            chevron
            isLast
          />
        </SettingsSection>

        {/* Appearance section */}
        <SettingsSection title="Appearance">
          <SettingsRow
            icon="moon-outline"
            iconColor="#6C63FF"
            label="Dark Mode"
            toggle
            toggleValue={darkMode}
            onToggle={setDarkMode}
          />
          <SettingsRow
            icon="language-outline"
            iconColor="#FF9F43"
            label="Language"
            value="English"
            chevron
            isLast
          />
        </SettingsSection>

        {/* About section */}
        <SettingsSection title="About">
          <SettingsRow
            icon="information-circle-outline"
            iconColor="#6C63FF"
            label="Version"
            value="1.0.0"
          />
          <SettingsRow
            icon="document-text-outline"
            iconColor="#888"
            label="Privacy Policy"
            chevron
          />
          <SettingsRow
            icon="help-circle-outline"
            iconColor="#888"
            label="Help & Support"
            chevron
            isLast
          />
        </SettingsSection>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#FF6584" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#12121E',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    color: '#888',
    fontSize: 13,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#2A2A3E',
    borderRadius: 20,
  },
  editBtnText: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: '#FFF',
    fontSize: 15,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    color: '#888',
    fontSize: 14,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    backgroundColor: '#FF658422',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF658433',
  },
  signOutText: {
    color: '#FF6584',
    fontWeight: '700',
    fontSize: 15,
  },
});
