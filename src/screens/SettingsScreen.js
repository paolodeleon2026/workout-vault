import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { PRIVACY_POLICY } from '../data/privacyPolicy';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.5;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;

function SettingsSection({ title, children, colors, isDark }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowOpacity: isDark ? 0.06 : 0, elevation: isDark ? 2 : 0 }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({ icon, iconColor, label, isLast, toggle, toggleValue, onToggle, onPress, chevron, colors }) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      activeOpacity={toggle ? 1 : 0.7}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
            thumbColor="#FFF"
          />
        ) : null}
        {chevron && !toggle ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, setDark, wifiOnly, setWifiOnly } = useTheme();
  const insets = useSafeAreaInsets();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const sheetHeight = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const lastHeight = useRef(DEFAULT_HEIGHT);

  useEffect(() => {
    if (privacyVisible) {
      sheetHeight.setValue(DEFAULT_HEIGHT);
      lastHeight.current = DEFAULT_HEIGHT;
    }
  }, [privacyVisible]);

  function snapTo(height) {
    lastHeight.current = height;
    Animated.spring(sheetHeight, {
      toValue: height,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        const next = lastHeight.current - g.dy;
        sheetHeight.setValue(Math.min(EXPANDED_HEIGHT, Math.max(120, next)));
      },
      onPanResponderRelease: (_, g) => {
        const cur = lastHeight.current - g.dy;
        const mid = (DEFAULT_HEIGHT + EXPANDED_HEIGHT) / 2;
        if (g.dy < -40 || cur > mid) {
          snapTo(EXPANDED_HEIGHT);
        } else if (g.dy > 40 || cur < mid) {
          snapTo(DEFAULT_HEIGHT);
        } else {
          snapTo(lastHeight.current);
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Upload section */}
        <SettingsSection title="Upload" colors={colors} isDark={isDark}>
          <SettingsRow
            icon="wifi-outline"
            iconColor={colors.success}
            label="Wi-Fi Only"
            toggle
            toggleValue={wifiOnly}
            onToggle={setWifiOnly}
            isLast
            colors={colors}
          />
        </SettingsSection>

        {/* Appearance section */}
        <SettingsSection title="Appearance" colors={colors} isDark={isDark}>
          <SettingsRow
            icon="moon-outline"
            iconColor={colors.accent}
            label="Dark Mode"
            toggle
            toggleValue={isDark}
            onToggle={setDark}
            isLast
            colors={colors}
          />
        </SettingsSection>

        {/* About section */}
        <SettingsSection title="About" colors={colors} isDark={isDark}>
          <SettingsRow
            icon="information-circle-outline"
            iconColor={colors.accent}
            label="Version"
            colors={colors}
          />
          <SettingsRow
            icon="document-text-outline"
            iconColor={colors.textSecondary}
            label="Privacy Policy"
            chevron
            onPress={() => setPrivacyVisible(true)}
            isLast
            colors={colors}
          />
        </SettingsSection>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Privacy Policy bottom sheet */}
      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setPrivacyVisible(false)}
          />
          <Animated.View style={[styles.sheet, { height: sheetHeight, backgroundColor: colors.surface }]}>
            {/* Drag handle */}
            <View style={styles.sheetHandle} {...panResponder.panHandlers}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setPrivacyVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={[styles.sheetScrollContent, { paddingBottom: insets.bottom + 16 }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.policyText, { color: colors.textSecondary }]}>
                {PRIVACY_POLICY}
              </Text>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingTop: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  signOutText: {
    fontWeight: '700',
    fontSize: 15,
  },
  // Privacy policy sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    padding: 20,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
