import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/loading-screen';
import { ColorSchemeProvider, useColorSchemeContext } from '@/contexts/color-scheme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { isHydrated } = useColorSchemeContext();
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: tintColor,
        background: backgroundColor,
        card: backgroundColor,
        text: textColor,
        notification: tintColor,
      },
    };
  }, [backgroundColor, colorScheme, textColor, tintColor]);

  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={StyleSheet.absoluteFill}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="series/[id]"
            options={{ title: '', headerBackTitle: 'Library' }}
          />
          <Stack.Screen
            name="reader"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="manga-series/[id]"
            options={{ title: '', headerBackTitle: 'Manga' }}
          />
          <Stack.Screen
            name="manga-reader"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Settings' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {isLoading && (
          <LoadingScreen onFinish={() => setIsLoading(false)} />
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ColorSchemeProvider>
        <RootLayoutInner />
      </ColorSchemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
