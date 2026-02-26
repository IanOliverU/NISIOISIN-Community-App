import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMangaCoverSource } from '@/src/manga/asset-map';
import { mangaManifest } from '@/src/manga/data';
import type { MangaVolume } from '@/src/manga/types';

const COVER_PLACEHOLDER = require('@/assets/images/partial-react-logo.png');

const PAD_H = 12;
const GAP = 16;
const COVER_ASPECT = 2 / 3;

function VolumeCard({
  folder,
  volume,
  volumeLabel,
  cardWidth,
}: {
  folder: string;
  volume: MangaVolume;
  volumeLabel: string;
  cardWidth: number;
}) {
  const router = useRouter();
  const coverSource = volume.coverFilename
    ? getMangaCoverSource(folder, volume.coverFilename)
    : null;

  const openReader = () => {
    router.push({
      pathname: '/manga-reader',
      params: {
        folder: encodeURIComponent(folder),
        cbz: encodeURIComponent(volume.cbzFilename),
        title: encodeURIComponent(volume.title),
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={openReader}
    >
      <ThemedView
        style={[styles.coverContainer, { width: cardWidth, aspectRatio: COVER_ASPECT }]}
      >
        <Image
          source={coverSource ?? COVER_PLACEHOLDER}
          style={styles.cover}
          contentFit="cover"
        />
      </ThemedView>
      <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
        {volumeLabel}
      </ThemedText>
    </Pressable>
  );
}

export default function MangaSeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const series = mangaManifest.series.find((s) => s.id === id);
  const cardWidth = (width - PAD_H * 2 - GAP) / 2;

  const navigation = useNavigation();
  useEffect(() => {
    if (series) navigation.setOptions({ title: series.name });
  }, [series, navigation]);

  if (!series) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Series not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {series.volumes.length === 0 ? (
        <ThemedText style={styles.empty}>No volumes yet.</ThemedText>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {series.volumes.map((vol, index) => (
            <VolumeCard
              key={vol.cbzFilename}
              folder={series.folder}
              volume={vol}
              volumeLabel={`Volume ${String(index + 1).padStart(2, '0')}`}
              cardWidth={cardWidth}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  empty: {
    paddingHorizontal: 20,
    paddingTop: 8,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD_H,
    gap: GAP,
    paddingBottom: 24,
  },
  card: {},
  cardPressed: {
    opacity: 0.8,
  },
  coverContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
