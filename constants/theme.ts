/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

type ThemeColors = {
  text: string;
  background: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

export type ThemeName = 'light' | 'dark' | 'sepia' | 'midnight' | 'forest';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#ffffff';

export const Colors: Record<ThemeName, ThemeColors> = {
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  sepia: {
    text: '#3b2f2f',
    background: '#f5ecd9',
    tint: '#8b5e34',
    icon: '#8b7765',
    tabIconDefault: '#8b7765',
    tabIconSelected: '#8b5e34',
  },
  midnight: {
    text: '#e6edf7',
    background: '#0b1220',
    tint: '#7ab3ff',
    icon: '#9aa9bf',
    tabIconDefault: '#8d9db4',
    tabIconSelected: '#7ab3ff',
  },
  forest: {
    text: '#e8f1eb',
    background: '#0f1f17',
    tint: '#8ac6a1',
    icon: '#9bb8a7',
    tabIconDefault: '#87a593',
    tabIconSelected: '#8ac6a1',
  },
};

export const ThemeBaseScheme: Record<ThemeName, 'light' | 'dark'> = {
  light: 'light',
  dark: 'dark',
  sepia: 'light',
  midnight: 'dark',
  forest: 'dark',
};

export const ThemeOptions: { value: ThemeName; label: string; subtitle?: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'sepia', label: 'Sepia', subtitle: 'Warm reading palette' },
  { value: 'midnight', label: 'Midnight', subtitle: 'Cool blue dark palette' },
  { value: 'forest', label: 'Forest', subtitle: 'Muted green dark palette' },
];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
