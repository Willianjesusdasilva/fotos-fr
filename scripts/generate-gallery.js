import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicAssetsDir = path.resolve(__dirname, '../public/assets');
const outputJson = path.resolve(__dirname, '../public/gallery.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);

function parseFolderDate(folderName) {
  // Expected formats: DD_MM_YYYY or DD-MM-YYYY or YYYY-MM-DD
  const matchDmy = folderName.match(/^(\d{1,2})[_-](\d{1,2})[_-](\d{4})$/);
  if (matchDmy) {
    const day = matchDmy[1].padStart(2, '0');
    const month = matchDmy[2].padStart(2, '0');
    const year = matchDmy[3];
    return {
      formatted: `${day}/${month}/${year}`,
      isoDate: `${year}-${month}-${day}`,
      raw: folderName
    };
  }

  const matchYmd = folderName.match(/^(\d{4})[_-](\d{1,2})[_-](\d{1,2})$/);
  if (matchYmd) {
    const year = matchYmd[1];
    const month = matchYmd[2].padStart(2, '0');
    const day = matchYmd[3].padStart(2, '0');
    return {
      formatted: `${day}/${month}/${year}`,
      isoDate: `${year}-${month}-${day}`,
      raw: folderName
    };
  }

  return {
    formatted: folderName.replace(/_/g, ' '),
    isoDate: folderName,
    raw: folderName
  };
}

function scanGallery() {
  if (!fs.existsSync(publicAssetsDir)) {
    console.log(`Directory ${publicAssetsDir} does not exist. Creating...`);
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }

  const entries = fs.readdirSync(publicAssetsDir, { withFileTypes: true });
  const gallery = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderPath = path.join(publicAssetsDir, entry.name);
      const files = fs.readdirSync(folderPath);

      const photos = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return IMAGE_EXTENSIONS.has(ext);
        })
        .map(file => {
          const stats = fs.statSync(path.join(folderPath, file));
          return {
            filename: file,
            path: `assets/${entry.name}/${file}`,
            size: stats.size
          };
        });

      if (photos.length > 0) {
        const dateMeta = parseFolderDate(entry.name);
        gallery.push({
          id: entry.name,
          title: dateMeta.formatted,
          rawFolder: entry.name,
          isoDate: dateMeta.isoDate,
          count: photos.length,
          photos
        });
      }
    }
  }

  // Sort descending by date (most recent first)
  gallery.sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  fs.writeFileSync(outputJson, JSON.stringify(gallery, null, 2), 'utf-8');
  console.log(`Gallery generated successfully: ${gallery.length} event(s) found at ${outputJson}`);
}

scanGallery();
