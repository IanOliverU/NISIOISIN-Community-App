const DRIVE_FILE_IDS: Record<string, Record<string, string>> = {
  Bakemonogatari: {
    v01: '1K_4OkLA0UnsRrHe_DENNGe6hMe64YXrZ',
    v02: '1GSLhOvkSxO87-rAoSmxbTJpbOC5BRyUp',
    v03: '1VOlUHI9rJx18S9iILDh_dwFHq_ZOza_t',
    v04: '1LiXN4PBBhZojV5LRc48Wq6p-H7ixhBwp',
    v05: '1TmDFZGkaxFRupWoVCF9XLSlxmnMj0ijg',
    v06: '1ipHBZHmh3LDI7Hlg6O2Dkk8rhDJXakIm',
    v07: '1kz5C4HJSAKgWxiAOHWijH_Edv9coXBNv',
    v08: '106XaxPXJZ1-eIK3bS2pCkHVD_cW4kWxX',
    v09: '1kEoSCa6V5UIXg_hrW_qs3kDpoT-atoVD',
    v10: '1LAzq28POk8o6RwgQvDSGUqUyh-CW07me',
    v11: '1XYIepUZkU5B-2xIUkYiNeVxmqZnSEyIl',
    v12: '193nNC8Oic80gI0lXYcH-EIuUgoQlf4xa',
    v13: '1P-RvhX8CrEqQ7-743d0P1r8L9T7ERmw9',
    v14: '1UrI7-3RXmVTPHJjdaneVj24FYI9xTeWC',
    v15: '1mhtOCLT5iV5PuR7mKvSDjVgt0szmyiWw',
    v16: '1KaGvtpW3fBQmvJ2a6MmZEea5oIM75brJ',
    v17: '14fXh-G4unbxo_VZciGJyP2Avsi4ad4Oo',
    v18: '17hqJUjo4yWIpmcsYXErV6gxJCyqOxBi2',
    v19: '1yrL93va_07fTkfdlRizm58e-hmLH-lOe',
    v20: '1nPYUK-TmXcI-ttH9vmab4t_bnR63j5j_',
    v21: '1wPju4_8zZoA9DAvEUaS6xLBlK6o6MKzG',
    v22: '12K-xEkwBMAyPEQsHM8-jaUejQtRibbtm',
  },
  'Cipher Academy': {
    v01: '1e1NB-r5hqIacIiPcRmurRPIyvbTsyBYG',
    v02: '1e82a-uKP0Jsvq3vU4PjpGjBxEqsdIfjI',
    v03: '1u8NTUHeeakt-n9yk4TRfkscAXi5_5JOQ',
    v04: '1Zs98GoT-uHFFhBMuunumRUAt-iTO-_Lz',
    v05: '1yw2NTVI_YX9S4UgQvnm-2kNAAAknuf8v',
    v06: '1d9oa56OCDKk6GmRH2I7dZPIuBulG8gYl',
    v07: '10jdxrs0aYrdyvry9siMcAl7fkponvY6l',
  },
};

function getVolumeTag(cbzFilename: string): string | null {
  const match = cbzFilename.match(/v(\d{1,3})/i);
  if (!match) return null;
  return `v${match[1].padStart(2, '0')}`;
}

function buildGoogleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getRemoteCbzUrl(folder: string, cbzFilename: string): string | null {
  const volumeTag = getVolumeTag(cbzFilename);
  if (!volumeTag) return null;
  const fileId = DRIVE_FILE_IDS[folder]?.[volumeTag];
  if (!fileId) return null;
  return buildGoogleDriveDownloadUrl(fileId);
}
