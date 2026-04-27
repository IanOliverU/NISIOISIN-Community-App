/**
 * Scans src/lightnovels for series folders and generates:
 * - src/lightnovels/manifest.json (series and volumes from .pdf + matching .webp)
 * - src/lightnovels/data.ts and asset-map.ts
 *
 * Run: node scripts/generate-lightnovel-assets.js
 *
 * PDF-driven: finds all .pdf in each series folder, then looks for matching .webp
 * (same base name) in the folder or in a "Novel Covers" subfolder. PDFs with
 * missing covers are kept and use a runtime placeholder in the app.
 */

const fs = require('fs');
const path = require('path');

const LIGHTNOVELS_DIR = path.join(__dirname, '..', 'src', 'lightnovels');
const COVERS_SUBFOLDER = 'Novel Covers';
const SKIP_FILES = new Set(['manifest.json', 'types.json', 'types.ts', 'data.ts', 'asset-map.ts']);
const TITLE_OVERRIDES = {
  'Zaregoto Series|Zaregoto Series v01 - Decapitation [Vertical] [LuCaZ].pdf':
    'Volume 1 - The Beheading Cycle: The Blue Savant and the Nonsense Bearer',
  'Zaregoto Series|Zaregoto Series v02 - Strangulation [Vertical] [LuCaZ].pdf':
    'Volume 2 - Strangulation Romanticist: Hitoshiki Zerozaki, Human Failure',
  'Zaregoto Series|Zaregoto Series v03 - Suspension [Vertical] [LuCaZ].pdf':
    "Volume 3 - Hanging High School: The Nonsense Bearer's Pupil",
  'Zaregoto Series|Zaregoto Series v04 - Psycho Logical [DutchAngleTL].pdf':
    "Volume 4 - Psycho Logical (Part One): Gaisuke Utsurigi's Nonsense Killer",
  'Zaregoto Series|Zaregoto Series v05 - Psycho Logical 2 [DutchAngleTL].pdf':
    'Volume 5 - Psycho Logical (Part Two): Sour Little Song',
  'Zaregoto Series|Zaregoto Series v06 - Hitokui Magical [Suiminchuudoku, SwayTL].pdf':
    'Volume 6 - Cannibal Magical: Niounomiya Siblings, Masters of Carnage',
  'Zaregoto Series|Zaregoto Series v07 - Nekosogi Radical 1 [SwayTL].pdf':
    'Volume 7 - Uprooted Radical (Part One): The Thirteen Stairs',
  'Zaregoto Series|Zaregoto Series v08 - Nekosogi Radical 2 [SwayTL].pdf':
    'Volume 8 - Uprooted Radical (Part Two): Overkill Red vs. The Orange Seed',
  'Zaregoto Series|Zaregoto Series v09 - Nekosogi Radical 3 [SwayTL].pdf':
    'Volume 9 - Uprooted Radical (Part Three): The Blue Savant and the Nonsense Bearer',
};

function slug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function scanSeries() {
  const entries = fs.readdirSync(LIGHTNOVELS_DIR, { withFileTypes: true });
  const seriesList = [];

  for (const ent of entries) {
    if (!ent.isDirectory() || SKIP_FILES.has(ent.name)) continue;

    const folderPath = path.join(LIGHTNOVELS_DIR, ent.name);
    const topFiles = fs.readdirSync(folderPath);
    const pdfs = topFiles.filter((f) => f.endsWith('.pdf'));
    const rootWebps = topFiles.filter((f) => f.endsWith('.webp'));

    let coverDirFiles = [];
    const coversSubPath = path.join(folderPath, COVERS_SUBFOLDER);
    if (fs.existsSync(coversSubPath) && fs.statSync(coversSubPath).isDirectory()) {
      coverDirFiles = fs.readdirSync(coversSubPath);
    }
    const coverWebps = coverDirFiles.filter((f) => f.endsWith('.webp'));

    const volumes = [];

    for (const pdfName of pdfs) {
      const base = pdfName.replace(/\.pdf$/, '');
      const webpName = base + '.webp';

      let coverFilename = null;
      let coverRequirePath = null;

      if (rootWebps.includes(webpName)) {
        coverFilename = webpName;
        coverRequirePath = webpName;
      } else if (coverWebps.includes(webpName)) {
        coverFilename = webpName;
        coverRequirePath = COVERS_SUBFOLDER + '/' + webpName;
      }

      if (!coverFilename) {
        console.warn(`  No cover for ${pdfName}, using runtime placeholder.`);
        coverFilename = webpName;
      }

      const generatedTitle = base.replace(/^[^v]*\s*v?\d+\s*-\s*/, '').trim() || base;
      const title = TITLE_OVERRIDES[`${ent.name}|${pdfName}`] ?? generatedTitle;
      volumes.push({
        coverFilename,
        title: title,
        pdfFilename: pdfName,
        coverRequirePath,
      });
    }

    volumes.sort((a, b) => a.pdfFilename.localeCompare(b.pdfFilename));

    seriesList.push({
      id: slug(ent.name),
      name: ent.name,
      folder: ent.name,
      volumes,
    });
  }

  return seriesList.sort((a, b) => a.name.localeCompare(b.name));
}

function generateManifest(seriesList) {
  const forManifest = seriesList.map((s) => ({
    ...s,
    volumes: s.volumes.map(({ coverFilename, title, pdfFilename }) => ({
      coverFilename,
      title,
      pdfFilename,
    })),
  }));
  const manifest = { series: forManifest };
  const outPath = path.join(LIGHTNOVELS_DIR, 'manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Wrote manifest.json');
}

function generateDataTs(seriesList) {
  const outPath = path.join(LIGHTNOVELS_DIR, 'data.ts');
  const forExport = seriesList.map((s) => ({
    ...s,
    volumes: s.volumes.map(({ coverFilename, title, pdfFilename }) => ({
      coverFilename,
      title,
      pdfFilename,
    })),
  }));
  const seriesJson = JSON.stringify(forExport, null, 2)
    .replace(/"([^"]+)":/g, '$1:');
  const content = `import type { Manifest } from './types';

export const manifest: Manifest = {
  series: ${seriesJson},
};
`;
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote data.ts');
}

function generateAssetMap(seriesList) {
  const coverLines = [];
  const pdfLines = [];

  for (const s of seriesList) {
    for (const v of s.volumes) {
      if (v.coverRequirePath) {
        const key = `'${s.folder}|${v.coverFilename}'`;
        const reqPath = `./${s.folder}/${v.coverRequirePath}`.replace(/\\/g, '/');
        coverLines.push(`  ${key}: require('${reqPath}'),`);
      }
      const pdfKey = `'${s.folder}|${v.pdfFilename}'`;
      const pdfReqPath = `./${s.folder}/${v.pdfFilename}`.replace(/\\/g, '/');
      pdfLines.push(`  ${pdfKey}: require('${pdfReqPath}'),`);
    }
  }

  const content = `/**
 * Auto-generated by scripts/generate-lightnovel-assets.js
 * Maps (seriesFolder, filename) to bundled cover/PDF assets.
 */
import type { ImageSourcePropType } from 'react-native';

type AssetMap = Record<string, ImageSourcePropType>;
type PdfMap = Record<string, number>;

const COVERS: AssetMap = {
${coverLines.join('\n')}
};

const PDFS: PdfMap = {
${pdfLines.join('\n')}
};

function key(folder: string, filename: string): string {
  return \`\${folder}|\${filename}\`;
}

export function getCoverSource(folder: string, coverFilename: string): ImageSourcePropType | null {
  return COVERS[key(folder, coverFilename)] ?? null;
}

export function getPdfRequire(folder: string, pdfFilename: string): number | null {
  return PDFS[key(folder, pdfFilename)] ?? null;
}
`;

  const outPath = path.join(LIGHTNOVELS_DIR, 'asset-map.ts');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Wrote asset-map.ts');
}

function main() {
  if (!fs.existsSync(LIGHTNOVELS_DIR)) {
    console.error('Not found:', LIGHTNOVELS_DIR);
    process.exit(1);
  }
  const seriesList = scanSeries();
  console.log('Series:', seriesList.length);
  seriesList.forEach((s) => console.log('  -', s.name, '(' + s.volumes.length + ' volumes)'));
  generateManifest(seriesList);
  generateDataTs(seriesList);
  generateAssetMap(seriesList);
}

main();
