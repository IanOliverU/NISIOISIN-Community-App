import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { ThemeBaseScheme, ThemeName } from '@/constants/theme';

const STORAGE_KEY = '@lnreader/color-scheme';

export type ColorSchemePreference = ThemeName | 'system';

const VALID_PREFERENCES = new Set<ColorSchemePreference>([
  'system',
  'light',
  'dark',
  'sepia',
  'midnight',
  'forest',
]);

type ColorSchemeContextValue = {
  isHydrated: boolean;
  colorScheme: 'light' | 'dark';
  theme: ThemeName;
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
};

export const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ColorSchemePreference>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored && VALID_PREFERENCES.has(stored as ColorSchemePreference)) {
          setPreferenceState(stored as ColorSchemePreference);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback((value: ColorSchemePreference) => {
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {
      // Ignore persistence errors and keep in-memory preference.
    });
  }, []);

  const theme: ThemeName =
    preference === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : preference;
  const colorScheme: 'light' | 'dark' = ThemeBaseScheme[theme];

  const value: ColorSchemeContextValue = {
    isHydrated,
    colorScheme,
    theme,
    preference,
    setPreference,
  };

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemeContext() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorSchemeContext must be used within ColorSchemeProvider');
  }
  return ctx;
}
