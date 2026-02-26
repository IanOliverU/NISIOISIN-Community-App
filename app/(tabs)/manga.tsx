import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMangaCoverSource } from '@/src/manga/asset-map';
import { mangaManifest } from '@/src/manga/data';
import type { MangaSeries } from '@/src/manga/types';

const COVER_PLACEHOLDER = require('@/assets/images/partial-react-logo.png');

const PAD_H = 12;
const GAP = 16;
const COVER_ASPECT = 2 / 3;

function SeriesCard({
  series,
  cardWidth,
}: {
  series: MangaSeries;
  cardWidth: number;
}) {
  const router = useRouter();
  const firstVolume = series.volumes[0];
  const coverSource =
    firstVolume && firstVolume.coverFilename
      ? getMangaCoverSource(series.folder, firstVolume.coverFilename)
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/manga-series/${series.id}`)}
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
        {series.name}
      </ThemedText>
    </Pressable>
  );
}

export default function MangaScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - PAD_H * 2 - GAP) / 2;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Manga Library
      </ThemedText>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {mangaManifest.series.map((series) => (
          <SeriesCard key={series.id} series={series} cardWidth={cardWidth} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
