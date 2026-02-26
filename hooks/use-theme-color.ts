/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { ColorSchemeContext } from '@/contexts/color-scheme-context';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const ctx = useContext(ColorSchemeContext);
  const systemScheme = useSystemColorScheme() ?? 'light';
  const colorScheme = ctx?.colorScheme ?? systemScheme;
  const theme = ctx?.theme ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
