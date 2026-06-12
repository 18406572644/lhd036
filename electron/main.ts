import { app, BrowserWindow, ipcMain, dialog, shell, protocol } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    backgroundColor: '#0A0A0A',
    title: '水印工作室',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-image', (request, callback) => {
    const url = request.url.replace('local-image://', '');
    const decodedUrl = decodeURI(url);
    try {
      return callback({ path: decodedUrl });
    } catch (error) {
      console.error('Failed to register protocol', error);
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-files', async (_event, filters) => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: filters || [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] },
      ],
    });
    return result.filePaths;
  } catch (error) {
    console.error('select-files error:', error);
    return [];
  }
});

ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.filePaths[0] || null;
  } catch (error) {
    console.error('select-directory error:', error);
    return null;
  }
});

ipcMain.handle('get-image-info', async (_event, imagePath: string) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);
    return {
      path: imagePath,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
    };
  } catch (error) {
    console.error('get-image-info error:', error);
    throw error;
  }
});

ipcMain.handle('get-thumbnail', async (_event, imagePath: string, size: number = 200) => {
  try {
    const buffer = await sharp(imagePath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('get-thumbnail error:', error);
    throw error;
  }
});

const BASE_IMAGE_WIDTH = 1000;

function getAdaptiveScale(imageWidth: number): number {
  return imageWidth / BASE_IMAGE_WIDTH;
}

function hexToRgbValues(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleanHex.length !== 6) {
    cleanHex = 'ffffff';
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

function calculateRotatedBoundingBox(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const radians = (rotation * Math.PI) / 180;
  const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const rotatedHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
  return { width: rotatedWidth, height: rotatedHeight };
}

function measureTextSharp(
  text: string,
  fontFamily: string,
  fontSize: number
): { width: number; height: number } {
  const avgGlyphWidth = fontSize * 0.55;
  const cjkWeight = fontSize * 1.0;
  let width = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code > 0x2E80) {
      width += cjkWeight;
    } else {
      width += avgGlyphWidth;
    }
  }
  width = Math.max(width, fontSize * 0.5);
  const height = Math.ceil(fontSize * 1.3);
  return { width: Math.ceil(width), height };
}

function calculatePosition(
  preset: string,
  imageWidth: number,
  imageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  margin: number,
  customPos?: { x: number; y: number }
): { top: number; left: number } {
  switch (preset) {
    case 'top-left':
      return { top: margin, left: margin };
    case 'top-center':
      return { top: margin, left: Math.round((imageWidth - watermarkWidth) / 2) };
    case 'top-right':
      return { top: margin, left: imageWidth - watermarkWidth - margin };
    case 'center-left':
      return { top: Math.round((imageHeight - watermarkHeight) / 2), left: margin };
    case 'center':
      return {
        top: Math.round((imageHeight - watermarkHeight) / 2),
        left: Math.round((imageWidth - watermarkWidth) / 2),
      };
    case 'center-right':
      return {
        top: Math.round((imageHeight - watermarkHeight) / 2),
        left: imageWidth - watermarkWidth - margin,
      };
    case 'bottom-left':
      return { top: imageHeight - watermarkHeight - margin, left: margin };
    case 'bottom-center':
      return {
        top: imageHeight - watermarkHeight - margin,
        left: Math.round((imageWidth - watermarkWidth) / 2),
      };
    case 'bottom-right':
      return {
        top: imageHeight - watermarkHeight - margin,
        left: imageWidth - watermarkWidth - margin,
      };
    case 'custom':
      return customPos ? { top: Math.round(customPos.y), left: Math.round(customPos.x) } : { top: 0, left: 0 };
    case 'tile':
      return { top: 0, left: 0 };
    default:
      return { top: margin, left: margin };
  }
}

function createTextWatermarkOverlay(
  text: string,
  fontFamily: string,
  fontSize: number,
  color: string,
  opacity: number,
  rotation: number,
  imageWidth: number,
  imageHeight: number,
  margin: number,
  customPx: number,
  customPy: number,
  position: string
): Buffer {
  const { width: textW, height: textH } = measureTextSharp(text, fontFamily, fontSize);
  const bbox = calculateRotatedBoundingBox(textW, textH, rotation);
  const bboxW = Math.ceil(bbox.width);
  const bboxH = Math.ceil(bbox.height);

  const pos = calculatePosition(position, imageWidth, imageHeight, bboxW, bboxH, margin, {
    x: customPx,
    y: customPy,
  });

  const cx = pos.left + bboxW / 2;
  const cy = pos.top + bboxH / 2;
  const { r, g, b } = hexToRgbValues(color);
  const safeOpacity = Math.max(0, Math.min(1, opacity));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">
  <text
    x="${cx}"
    y="${cy}"
    font-family="${fontFamily}"
    font-size="${fontSize}"
    fill="rgb(${r}, ${g}, ${b})"
    fill-opacity="${safeOpacity}"
    text-anchor="middle"
    dominant-baseline="central"
    transform="rotate(${rotation} ${cx} ${cy})"
  >${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
</svg>`;

  return Buffer.from(svg.trim());
}

function createTiledTextWatermarkOverlay(
  text: string,
  fontFamily: string,
  fontSize: number,
  color: string,
  opacity: number,
  rotation: number,
  imageWidth: number,
  imageHeight: number,
  tileConfig: TileConfig
): Buffer {
  const { width: textW, height: textH } = measureTextSharp(text, fontFamily, fontSize);
  const { r, g, b } = hexToRgbValues(color);
  const safeOpacity = Math.max(0, Math.min(1, opacity));

  const hSpacing = tileConfig.horizontalSpacing;
  const vSpacing = tileConfig.verticalSpacing;
  const stepX = textW + hSpacing;
  const stepY = textH + vSpacing;
  if (stepX <= 0 || stepY <= 0) return Buffer.from('<svg></svg>');

  const offsetX = tileConfig.offsetX;
  const offsetY = tileConfig.offsetY;
  const margin = Math.max(textW, textH) * 2;
  const startX = -margin + offsetX;
  const startY = -margin + offsetY;

  let textElements = '';
  let rowIndex = 0;
  for (let y = startY; y < imageHeight + margin; y += stepY) {
    const rowOffsetX = tileConfig.staggered && rowIndex % 2 !== 0 ? stepX / 2 : 0;
    for (let x = startX; x < imageWidth + margin; x += stepX) {
      const cx = x + textW / 2 + rowOffsetX;
      const cy = y + textH / 2;
      textElements += `<text x="${cx}" y="${cy}" font-family="${fontFamily}" font-size="${fontSize}" fill="rgb(${r}, ${g}, ${b})" fill-opacity="${safeOpacity}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotation} ${cx} ${cy})">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
    }
    rowIndex++;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">${textElements}</svg>`;
  return Buffer.from(svg.trim());
}

function computePreprocessedSize(
  origW: number,
  origH: number,
  preprocess: PreprocessConfig
): { width: number; height: number } {
  const { resizeMode, fixedWidth, fixedHeight, maxSide, scalePercent } = preprocess;
  switch (resizeMode) {
    case 'fixed-width': {
      if (fixedWidth <= 0) return { width: origW, height: origH };
      const ratio = origH / origW;
      return { width: fixedWidth, height: Math.round(fixedWidth * ratio) };
    }
    case 'fixed-height': {
      if (fixedHeight <= 0) return { width: origW, height: origH };
      const ratio = origW / origH;
      return { height: fixedHeight, width: Math.round(fixedHeight * ratio) };
    }
    case 'max-side': {
      if (maxSide <= 0) return { width: origW, height: origH };
      const longer = Math.max(origW, origH);
      if (longer <= maxSide) return { width: origW, height: origH };
      const scale = maxSide / longer;
      return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
    }
    case 'percent': {
      if (scalePercent <= 0) return { width: origW, height: origH };
      const s = scalePercent / 100;
      return { width: Math.round(origW * s), height: Math.round(origH * s) };
    }
    default:
      return { width: origW, height: origH };
  }
}

async function processImage(
  inputPath: string,
  outputPath: string,
  config: ExportConfig,
  watermark: WatermarkConfig
): Promise<void> {
  let src = sharp(inputPath);
  const metadata = await src.metadata();
  let imageWidth = metadata.width || 0;
  let imageHeight = metadata.height || 0;

  const preprocess = watermark.preprocess;

  if (preprocess && preprocess.rotation !== 'none') {
    if (preprocess.rotation === 'auto-exif') {
      src = src.rotate();
    } else {
      const angle = parseInt(preprocess.rotation, 10);
      if (!isNaN(angle)) {
        src = src.rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
      }
    }
    const rotatedMeta = await src.metadata();
    imageWidth = rotatedMeta.width || imageWidth;
    imageHeight = rotatedMeta.height || imageHeight;
  }

  if (preprocess && preprocess.resizeMode !== 'none') {
    const { width: newW, height: newH } = computePreprocessedSize(imageWidth, imageHeight, preprocess);
    if (newW > 0 && newH > 0) {
      src = src.resize(newW, newH, { fit: 'fill', kernel: 'lanczos3' });
      imageWidth = newW;
      imageHeight = newH;
    }
  }

  const adaptiveScale = getAdaptiveScale(imageWidth);

  const composites: sharp.OverlayOptions[] = [];
  const isTile = watermark.position === 'tile';

  if (watermark.type === 'text') {
    const textConfig = watermark.text;
    if (textConfig.text && textConfig.text.trim()) {
      const effectiveFontSize = Math.max(8, Math.round(textConfig.fontSize * adaptiveScale));

      if (isTile) {
        const tileConfig = watermark.tile;
        const svgBuffer = createTiledTextWatermarkOverlay(
          textConfig.text,
          textConfig.fontFamily,
          effectiveFontSize,
          textConfig.color,
          textConfig.opacity,
          textConfig.rotation,
          imageWidth,
          imageHeight,
          tileConfig
        );
        composites.push({ input: svgBuffer, left: 0, top: 0 });
      } else {
        const dispMargin = Math.round(watermark.margin * adaptiveScale);
        const customPx = Math.round(watermark.positionValue.x * adaptiveScale);
        const customPy = Math.round(watermark.positionValue.y * adaptiveScale);

        const svgBuffer = createTextWatermarkOverlay(
          textConfig.text,
          textConfig.fontFamily,
          effectiveFontSize,
          textConfig.color,
          textConfig.opacity,
          textConfig.rotation,
          imageWidth,
          imageHeight,
          dispMargin,
          customPx,
          customPy,
          watermark.position
        );

        composites.push({ input: svgBuffer, left: 0, top: 0 });
      }
    }
  } else if (watermark.type === 'image' && watermark.image.imageUrl) {
    const imageConfig = watermark.image;
    let wmSrc = imageConfig.imageUrl;
    const tempFiles: string[] = [];

    try {
      if (wmSrc.startsWith('data:image')) {
        const commaIdx = wmSrc.indexOf(',');
        const base64Data = commaIdx >= 0 ? wmSrc.substring(commaIdx + 1) : '';
        const tempPath = path.join(
          app.getPath('temp'),
          `wm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`
        );
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
        wmSrc = tempPath;
        tempFiles.push(tempPath);
      }

      const targetWmW = Math.max(4, Math.round(imageConfig.width * adaptiveScale));
      const targetWmH = Math.max(4, Math.round(imageConfig.height * adaptiveScale));

      let wmPipeline = sharp(wmSrc)
        .resize(targetWmW, targetWmH, { fit: 'fill', kernel: 'lanczos3' });

      wmPipeline = wmPipeline.png();

      let wmBuf = await wmPipeline.toBuffer();

      if (imageConfig.opacity < 1) {
        const alphaVal = Math.max(0, Math.min(255, Math.round(255 * imageConfig.opacity)));
        wmBuf = await sharp(wmBuf)
          .ensureAlpha()
          .composite([
            {
              input: Buffer.from([0, 0, 0, alphaVal]),
              raw: { width: 1, height: 1, channels: 4 },
              tile: true,
              blend: 'in',
            },
          ])
          .png()
          .toBuffer();
      }

      if (imageConfig.rotation !== 0) {
        wmBuf = await sharp(wmBuf)
          .rotate(imageConfig.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      }

      const wmMeta = await sharp(wmBuf).metadata();
      const bboxW = wmMeta.width || targetWmW;
      const bboxH = wmMeta.height || targetWmH;

      if (isTile) {
        const tileConfig = watermark.tile;
        const hSpacing = tileConfig.horizontalSpacing;
        const vSpacing = tileConfig.verticalSpacing;
        const stepX = bboxW + hSpacing;
        const stepY = bboxH + vSpacing;
        if (stepX > 0 && stepY > 0) {
          const offsetX = tileConfig.offsetX;
          const offsetY = tileConfig.offsetY;
          const margin = Math.max(bboxW, bboxH) * 2;
          const startX = -margin + offsetX;
          const startY = -margin + offsetY;

          const overlayComposites: sharp.OverlayOptions[] = [];
          let rowIndex = 0;
          for (let y = startY; y < imageHeight + margin; y += stepY) {
            const rowOffsetX = tileConfig.staggered && rowIndex % 2 !== 0 ? stepX / 2 : 0;
            for (let x = startX; x < imageWidth + margin; x += stepX) {
              overlayComposites.push({
                input: wmBuf,
                left: Math.round(x + rowOffsetX),
                top: Math.round(y),
              });
            }
            rowIndex++;
          }

          if (overlayComposites.length > 0) {
            const overlayBuf = await sharp({
              create: {
                width: imageWidth,
                height: imageHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              },
            })
              .composite(overlayComposites)
              .png()
              .toBuffer();

            composites.push({ input: overlayBuf, left: 0, top: 0 });
          }
        }
      } else {
        const dispMargin = Math.round(watermark.margin * adaptiveScale);
        const customPx = Math.round(watermark.positionValue.x * adaptiveScale);
        const customPy = Math.round(watermark.positionValue.y * adaptiveScale);

        const pos = calculatePosition(
          watermark.position,
          imageWidth,
          imageHeight,
          bboxW,
          bboxH,
          dispMargin,
          { x: customPx, y: customPy }
        );

        const overlayBuf = await sharp({
          create: {
            width: imageWidth,
            height: imageHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([{ input: wmBuf, left: pos.left, top: pos.top }])
          .png()
          .toBuffer();

        composites.push({ input: overlayBuf, left: 0, top: 0 });
      }
    } finally {
      for (const f of tempFiles) {
        try {
          fs.unlinkSync(f);
        } catch (_err) {
          // ignore
        }
      }
    }
  }

  let pipeline = src;

  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }

  if (preprocess && preprocess.targetMaxSizeEnabled && preprocess.targetMaxSize > 0) {
    const maxSizeBytes = preprocess.targetMaxSize * 1024 * 1024;
    let quality = config.quality;
    let resultBuf: Buffer | null = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      let testPipeline = pipeline.clone();
      switch (config.format) {
        case 'jpeg':
          testPipeline = testPipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality, mozjpeg: true });
          break;
        case 'png':
          testPipeline = testPipeline.png({ compressionLevel: 9 });
          break;
        case 'webp':
          testPipeline = testPipeline.webp({ quality, effort: 4 });
          break;
      }

      resultBuf = await testPipeline.toBuffer();
      if (resultBuf.length <= maxSizeBytes || config.format === 'png') break;

      quality = Math.max(10, quality - 10);
      if (quality <= 10) break;
    }

    if (resultBuf) {
      fs.writeFileSync(outputPath, resultBuf);
      return;
    }
  }

  switch (config.format) {
    case 'jpeg':
      pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({
        quality: config.quality,
        mozjpeg: true,
      });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: config.quality, effort: 4 });
      break;
  }

  await pipeline.toFile(outputPath);
}

ipcMain.handle(
  'export-images',
  async (
    event,
    config: ExportConfig,
    items: Array<{ path: string; name: string }>,
    watermark: WatermarkConfig
  ) => {
    const total = items.length;
    const results: Array<{ success: boolean; path?: string; error?: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const ext = path.extname(item.name);
        const baseName = path.basename(item.name, ext);
        const outputName = `${config.prefix}${baseName}${config.suffix}.${config.format}`;
        const outputPath = path.join(config.outputDir, outputName);

        await processImage(item.path, outputPath, config, watermark);

        results.push({ success: true, path: outputPath });
        event.sender.send('export-progress', {
          current: i + 1,
          total,
          path: outputPath,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('export error:', item.name, errorMessage);
        results.push({ success: false, error: errorMessage });
        event.sender.send('export-progress', {
          current: i + 1,
          total,
          path: item.path,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      success: failCount === 0,
      total,
      successCount,
      failCount,
      results,
    };
  }
);

export interface Position {
  x: number;
  y: number;
}

export interface TextWatermarkConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
}

export interface ImageWatermarkConfig {
  imageUrl: string;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
}

export interface TileConfig {
  enabled: boolean;
  horizontalSpacing: number;
  verticalSpacing: number;
  staggered: boolean;
  offsetX: number;
  offsetY: number;
}

export type ResizeMode = 'none' | 'fixed-width' | 'fixed-height' | 'max-side' | 'percent';
export type RotationPreset = 'none' | '90' | '180' | '270' | 'auto-exif';

export interface PreprocessConfig {
  resizeMode: ResizeMode;
  fixedWidth: number;
  fixedHeight: number;
  maxSide: number;
  scalePercent: number;
  rotation: RotationPreset;
  targetMaxSize: number;
  targetMaxSizeEnabled: boolean;
}

export type WatermarkPositionPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom'
  | 'tile';

export interface WatermarkConfig {
  type: 'text' | 'image';
  position: WatermarkPositionPreset;
  positionValue: Position;
  margin: number;
  text: TextWatermarkConfig;
  image: ImageWatermarkConfig;
  tile: TileConfig;
  preprocess: PreprocessConfig;
}

export interface ExportConfig {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  outputDir: string;
  prefix: string;
  suffix: string;
}
