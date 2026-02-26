import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';

SplashScreen.preventAutoHideAsync();

function colorWithAlpha(color: string, alpha: number) {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const hex = color.trim().replace('#', '');
  const validHex = /^[0-9a-fA-F]+$/.test(hex);

  if (!validHex) {
    return `rgba(128,128,128,${clampedAlpha})`;
  }

  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;

  if (normalized.length !== 6) {
    return `rgba(128,128,128,${clampedAlpha})`;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${clampedAlpha})`;
}

function AnimatedProgressBar({ color, trackColor }: { color: string; trackColor: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      ),
      -1
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

export function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const subtextColor = useThemeColor({}, 'icon');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const appTitle = 'NISIOISIN';
  const appSubtitle = 'Community Reading App';
  const circleBorderColor = colorWithAlpha(accentColor, 0.28);
  const progressTrackColor = colorWithAlpha(mutedColor, 0.25);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
      // Show our immersive screen for a moment, then fade out
      hideTimer = setTimeout(() => onFinish?.(), 1200);
    };
    const timer = setTimeout(hideSplash, 500);

    return () => {
      clearTimeout(timer);
      if (hideTimer != null) clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(500)}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.iconWrapper}
        >
          <View style={[styles.iconCircle, { borderColor: circleBorderColor }]}>
            <MaterialIcons
              name="menu-book"
              size={56}
              color={accentColor}
              style={styles.icon}
            />
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={[styles.title, { color: textColor }]}
        >
          {appTitle}
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(550).duration(400)}
          style={[styles.subtitle, { color: subtextColor }]}
        >
          {appSubtitle}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(700).duration(400)}
          style={styles.loaderWrapper}
        >
          <AnimatedProgressBar color={accentColor} trackColor={progressTrackColor} />
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={mutedColor} style={styles.spinner} />
            <Animated.Text style={[styles.loadingText, { color: mutedColor }]}>
              Loading your library…
            </Animated.Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom tagline */}
      <Animated.Text
        entering={FadeIn.delay(900).duration(600)}
        style={[styles.tagline, { color: mutedColor }]}
      >
        Light Novels & Manga Collection
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    ...(Platform.OS === 'ios' && { marginLeft: 2 }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 6,
    opacity: 0.8,
  },
  loaderWrapper: {
    marginTop: 32,
    width: '100%',
    maxWidth: 260,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    direction: 'ltr',
    marginBottom: 16,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    marginRight: 4,
  },
  loadingText: {
    fontSize: 14,
  },
  tagline: {
    position: 'absolute',
    bottom: 40,
    fontSize: 13,
  },
});
