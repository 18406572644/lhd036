"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    electron_1.protocol.registerFileProtocol('local-image', (request, callback) => {
        const url = request.url.replace('local-image://', '');
        const decodedUrl = decodeURI(url);
        try {
            return callback({ path: decodedUrl });
        }
        catch (error) {
            console.error('Failed to register protocol', error);
        }
    });
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.handle('select-files', async (_event, filters) => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: filters || [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] },
            ],
        });
        return result.filePaths;
    }
    catch (error) {
        console.error('select-files error:', error);
        return [];
    }
});
electron_1.ipcMain.handle('select-directory', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        return result.filePaths[0] || null;
    }
    catch (error) {
        console.error('select-directory error:', error);
        return null;
    }
});
electron_1.ipcMain.handle('get-image-info', async (_event, imagePath) => {
    try {
        const metadata = await (0, sharp_1.default)(imagePath).metadata();
        const stats = fs.statSync(imagePath);
        return {
            path: imagePath,
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: metadata.format || 'unknown',
            size: stats.size,
        };
    }
    catch (error) {
        console.error('get-image-info error:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('get-thumbnail', async (_event, imagePath, size = 200) => {
    try {
        const buffer = await (0, sharp_1.default)(imagePath)
            .resize(size, size, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    catch (error) {
        console.error('get-thumbnail error:', error);
        throw error;
    }
});
const BASE_IMAGE_WIDTH = 1000;
function getAdaptiveScale(imageWidth) {
    return imageWidth / BASE_IMAGE_WIDTH;
}
function hexToRgbValues(hex) {
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
function calculateRotatedBoundingBox(width, height, rotation) {
    const radians = (rotation * Math.PI) / 180;
    const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
    const rotatedHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
    return { width: rotatedWidth, height: rotatedHeight };
}
function measureTextSharp(text, fontFamily, fontSize) {
    const avgGlyphWidth = fontSize * 0.55;
    const cjkWeight = fontSize * 1.0;
    let width = 0;
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (code > 0x2E80) {
            width += cjkWeight;
        }
        else {
            width += avgGlyphWidth;
        }
    }
    width = Math.max(width, fontSize * 0.5);
    const height = Math.ceil(fontSize * 1.3);
    return { width: Math.ceil(width), height };
}
function calculatePosition(preset, imageWidth, imageHeight, watermarkWidth, watermarkHeight, margin, customPos) {
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
function createTextWatermarkOverlay(text, fontFamily, fontSize, color, opacity, rotation, imageWidth, imageHeight, margin, customPx, customPy, position) {
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
function createTiledTextWatermarkOverlay(text, fontFamily, fontSize, color, opacity, rotation, imageWidth, imageHeight, tileConfig) {
    const { width: textW, height: textH } = measureTextSharp(text, fontFamily, fontSize);
    const { r, g, b } = hexToRgbValues(color);
    const safeOpacity = Math.max(0, Math.min(1, opacity));
    const hSpacing = tileConfig.horizontalSpacing;
    const vSpacing = tileConfig.verticalSpacing;
    const stepX = textW + hSpacing;
    const stepY = textH + vSpacing;
    if (stepX <= 0 || stepY <= 0)
        return Buffer.from('<svg></svg>');
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
function computePreprocessedSize(origW, origH, preprocess) {
    const { resizeMode, fixedWidth, fixedHeight, maxSide, scalePercent } = preprocess;
    switch (resizeMode) {
        case 'fixed-width': {
            if (fixedWidth <= 0)
                return { width: origW, height: origH };
            const ratio = origH / origW;
            return { width: fixedWidth, height: Math.round(fixedWidth * ratio) };
        }
        case 'fixed-height': {
            if (fixedHeight <= 0)
                return { width: origW, height: origH };
            const ratio = origW / origH;
            return { height: fixedHeight, width: Math.round(fixedHeight * ratio) };
        }
        case 'max-side': {
            if (maxSide <= 0)
                return { width: origW, height: origH };
            const longer = Math.max(origW, origH);
            if (longer <= maxSide)
                return { width: origW, height: origH };
            const scale = maxSide / longer;
            return { width: Math.round(origW * scale), height: Math.round(origH * scale) };
        }
        case 'percent': {
            if (scalePercent <= 0)
                return { width: origW, height: origH };
            const s = scalePercent / 100;
            return { width: Math.round(origW * s), height: Math.round(origH * s) };
        }
        default:
            return { width: origW, height: origH };
    }
}
async function processImage(inputPath, outputPath, config, watermark) {
    let src = (0, sharp_1.default)(inputPath);
    const metadata = await src.metadata();
    let imageWidth = metadata.width || 0;
    let imageHeight = metadata.height || 0;
    const preprocess = watermark.preprocess;
    if (preprocess && preprocess.rotation !== 'none') {
        if (preprocess.rotation === 'auto-exif') {
            src = src.rotate();
        }
        else {
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
    const composites = [];
    const isTile = watermark.position === 'tile';
    if (watermark.type === 'text') {
        const textConfig = watermark.text;
        if (textConfig.text && textConfig.text.trim()) {
            const effectiveFontSize = Math.max(8, Math.round(textConfig.fontSize * adaptiveScale));
            if (isTile) {
                const tileConfig = watermark.tile;
                const svgBuffer = createTiledTextWatermarkOverlay(textConfig.text, textConfig.fontFamily, effectiveFontSize, textConfig.color, textConfig.opacity, textConfig.rotation, imageWidth, imageHeight, tileConfig);
                composites.push({ input: svgBuffer, left: 0, top: 0 });
            }
            else {
                const dispMargin = Math.round(watermark.margin * adaptiveScale);
                const customPx = Math.round(watermark.positionValue.x * adaptiveScale);
                const customPy = Math.round(watermark.positionValue.y * adaptiveScale);
                const svgBuffer = createTextWatermarkOverlay(textConfig.text, textConfig.fontFamily, effectiveFontSize, textConfig.color, textConfig.opacity, textConfig.rotation, imageWidth, imageHeight, dispMargin, customPx, customPy, watermark.position);
                composites.push({ input: svgBuffer, left: 0, top: 0 });
            }
        }
    }
    else if (watermark.type === 'image' && watermark.image.imageUrl) {
        const imageConfig = watermark.image;
        let wmSrc = imageConfig.imageUrl;
        const tempFiles = [];
        try {
            if (wmSrc.startsWith('data:image')) {
                const commaIdx = wmSrc.indexOf(',');
                const base64Data = commaIdx >= 0 ? wmSrc.substring(commaIdx + 1) : '';
                const tempPath = path.join(electron_1.app.getPath('temp'), `wm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);
                fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
                wmSrc = tempPath;
                tempFiles.push(tempPath);
            }
            const targetWmW = Math.max(4, Math.round(imageConfig.width * adaptiveScale));
            const targetWmH = Math.max(4, Math.round(imageConfig.height * adaptiveScale));
            let wmPipeline = (0, sharp_1.default)(wmSrc)
                .resize(targetWmW, targetWmH, { fit: 'fill', kernel: 'lanczos3' });
            wmPipeline = wmPipeline.png();
            let wmBuf = await wmPipeline.toBuffer();
            if (imageConfig.opacity < 1) {
                const alphaVal = Math.max(0, Math.min(255, Math.round(255 * imageConfig.opacity)));
                wmBuf = await (0, sharp_1.default)(wmBuf)
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
                wmBuf = await (0, sharp_1.default)(wmBuf)
                    .rotate(imageConfig.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .png()
                    .toBuffer();
            }
            const wmMeta = await (0, sharp_1.default)(wmBuf).metadata();
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
                    const overlayComposites = [];
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
                        const overlayBuf = await (0, sharp_1.default)({
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
            }
            else {
                const dispMargin = Math.round(watermark.margin * adaptiveScale);
                const customPx = Math.round(watermark.positionValue.x * adaptiveScale);
                const customPy = Math.round(watermark.positionValue.y * adaptiveScale);
                const pos = calculatePosition(watermark.position, imageWidth, imageHeight, bboxW, bboxH, dispMargin, { x: customPx, y: customPy });
                const overlayBuf = await (0, sharp_1.default)({
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
        }
        finally {
            for (const f of tempFiles) {
                try {
                    fs.unlinkSync(f);
                }
                catch (_err) {
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
        let resultBuf = null;
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
            if (resultBuf.length <= maxSizeBytes || config.format === 'png')
                break;
            quality = Math.max(10, quality - 10);
            if (quality <= 10)
                break;
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
electron_1.ipcMain.handle('export-images', async (event, config, items, watermark) => {
    const total = items.length;
    const results = [];
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
        }
        catch (error) {
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
});
//# sourceMappingURL=main.js.map