import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicAssetsDir = path.resolve(__dirname, '../public/assets');
const outputJson = path.resolve(__dirname, '../public/gallery.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.avif']);

function parseFolderDate(folderName) {
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

async function processPhoto(folderPath, folderName, file) {
  const ext = path.extname(file).toLowerCase();
  const filePath = path.join(folderPath, file);
  const stats = fs.statSync(filePath);

  // If it's an SVG or already a generated thumbnail, handle appropriately
  if (ext === '.svg') {
    return {
      filename: file,
      path: `assets/${folderName}/${file}`,
      thumbPath: `assets/${folderName}/${file}`,
      size: stats.size
    };
  }

  // Thumbnails directory inside the date folder
  const thumbsDir = path.join(folderPath, '.thumbs');
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }

  const thumbFilename = `${path.parse(file).name}_thumb.webp`;
  const thumbPathOnDisk = path.join(thumbsDir, thumbFilename);
  const thumbRelativePath = `assets/${folderName}/.thumbs/${thumbFilename}`;

  // Generate thumbnail if it doesn't exist or original is newer
  let shouldGenerate = false;
  if (!fs.existsSync(thumbPathOnDisk)) {
    shouldGenerate = true;
  } else {
    const thumbStats = fs.statSync(thumbPathOnDisk);
    if (stats.mtimeMs > thumbStats.mtimeMs) {
      shouldGenerate = true;
    }
  }

  if (shouldGenerate) {
    try {
      await sharp(filePath)
        .rotate() // automatically adjust EXIF orientation
        .resize({ width: 600, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(thumbPathOnDisk);
    } catch (err) {
      console.warn(`[Sharp] Could not process thumbnail for ${file}:`, err.message);
      return {
        filename: file,
        path: `assets/${folderName}/${file}`,
        thumbPath: `assets/${folderName}/${file}`,
        size: stats.size
      };
    }
  }

  return {
    filename: file,
    path: `assets/${folderName}/${file}`,
    thumbPath: thumbRelativePath,
    size: stats.size
  };
}

async function scanGallery() {
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

      // Filter raw candidate files (ignore .thumbs folder and hidden files)
      const rawImageFiles = files.filter(file => {
        if (file.startsWith('.')) return false;
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext) || ext === '.svg';
      });

      const photos = [];
      for (const file of rawImageFiles) {
        const photoData = await processPhoto(folderPath, entry.name, file);
        photos.push(photoData);
      }

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
