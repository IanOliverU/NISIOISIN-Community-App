export type MangaVolume = {
  coverFilename: string;
  title: string;
  cbzFilename: string;
};

export type MangaSeries = {
  id: string;
  name: string;
  folder: string;
  volumes: MangaVolume[];
};

export type MangaManifest = {
  series: MangaSeries[];
};
