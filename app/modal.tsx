import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemeOptions } from '@/constants/theme';
import { ColorSchemePreference, useColorSchemeContext } from '@/contexts/color-scheme-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const APPEARANCE_OPTIONS: { value: ColorSchemePreference; label: string; subtitle?: string }[] = [
  ...ThemeOptions,
  { value: 'system', label: 'System', subtitle: 'Follow device setting' },
];

export default function SettingsModal() {
  const router = useRouter();
  const { preference, setPreference } = useColorSchemeContext();
  const tintColor = useThemeColor({}, 'tint');
  const selectedBackgroundColor = withAlpha(tintColor, '26');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <ThemedText type="link">Done</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Appearance
        </ThemedText>

        <View style={styles.optionList}>
          {APPEARANCE_OPTIONS.map((option) => (
            <OptionRow
              key={option.value}
              label={option.label}
              subtitle={option.subtitle}
              selected={preference === option.value}
              onPress={() => setPreference(option.value)}
              selectedBackgroundColor={selectedBackgroundColor}
              tintColor={tintColor}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function OptionRow({
  label,
  subtitle,
  selected,
  onPress,
  selectedBackgroundColor,
  tintColor,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  selectedBackgroundColor: string;
  tintColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        pressed && styles.pressed,
        selected && { backgroundColor: selectedBackgroundColor },
      ]}
    >
      <View style={styles.optionLabel}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.optionSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
      {selected && (
        <IconSymbol name="checkmark" size={22} color={tintColor} />
      )}
    </Pressable>
  );
}

function withAlpha(hexColor: string, alpha: string) {
  if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    return `${hexColor}${alpha}`;
  }
  return 'rgba(10, 126, 164, 0.15)';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 12,
    opacity: 0.8,
  },
  optionList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  optionLabel: {
    flex: 1,
  },
  optionSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
});
