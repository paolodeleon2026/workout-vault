import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, lightColors, darkColors } from './index';

const THEME_KEY    = '@workout_vault_dark_mode';
const WIFI_KEY     = '@workout_vault_wifi_only';

export default function ThemeProvider({ children }) {
  const [isDark, setIsDarkState] = useState(false);
  const [wifiOnly, setWifiOnlyState] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, WIFI_KEY]).then((pairs) => {
      const themeVal = pairs[0][1];
      const wifiVal  = pairs[1][1];
      if (themeVal !== null) setIsDarkState(themeVal === 'true');
      if (wifiVal  !== null) setWifiOnlyState(wifiVal === 'true');
    }).catch(() => {});
  }, []);

  function setDark(value) {
    setIsDarkState(value);
    AsyncStorage.setItem(THEME_KEY, String(value)).catch(() => {});
  }

  function setWifiOnly(value) {
    setWifiOnlyState(value);
    AsyncStorage.setItem(WIFI_KEY, String(value)).catch(() => {});
  }

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, setDark, wifiOnly, setWifiOnly }}>
      {children}
    </ThemeContext.Provider>
  );
}
