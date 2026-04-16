import { createContext, useContext } from 'react';

export const lightColors = {
  background:      '#F2F2F7',
  surface:         '#FFFFFF',
  surfaceElevated: '#EBEBF3',
  border:          '#DCDCE8',
  text:            '#1A1A2E',
  textSecondary:   '#6B6B80',
  textMuted:       '#9898AC',
  placeholder:     '#9898AC',
  subtle:          '#9898BC',       // movement-type italic label
  accent:          '#6C63FF',
  accentBg:        'rgba(108,99,255,0.10)',
  accentBorder:    'rgba(108,99,255,0.25)',
  danger:          '#FF6584',
  dangerBg:        'rgba(255,101,132,0.08)',
  dangerBorder:    'rgba(255,101,132,0.25)',
  warn:            '#FF9F43',
  success:         '#26de81',
  overlay:         'rgba(0,0,0,0.40)',
  statusBar:       'dark-content',
  statusBarBg:     '#F2F2F7',
  shadow:          'rgba(0,0,0,0.06)',
};

export const darkColors = {
  background:      '#12121E',
  surface:         '#1E1E2E',
  surfaceElevated: '#2A2A3E',
  border:          '#2A2A3E',
  text:            '#FFFFFF',
  textSecondary:   '#AAAAAA',
  textMuted:       '#666666',
  placeholder:     '#555555',
  subtle:          '#4A4A6A',
  accent:          '#6C63FF',
  accentBg:        'rgba(108,99,255,0.13)',
  accentBorder:    'rgba(108,99,255,0.33)',
  danger:          '#FF6584',
  dangerBg:        'rgba(255,101,132,0.13)',
  dangerBorder:    'rgba(255,101,132,0.33)',
  warn:            '#FF9F43',
  success:         '#26de81',
  overlay:         'rgba(0,0,0,0.60)',
  statusBar:       'light-content',
  statusBarBg:     '#12121E',
  shadow:          '#000000',
};

export const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  setDark: () => {},
  wifiOnly: false,
  setWifiOnly: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}
