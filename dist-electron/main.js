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
            return customPos ? { top: customPos.y, left: customPos.x } : { top: 0, left: 0 };
        default:
            return { top: margin, left: margin };
    }
}
async function createTextWatermarkSvg(text, fontFamily, fontSize, color, opacity, rotation, width, height) {
    const radians = (rotation * Math.PI) / 180;
    const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
    const rotatedHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rotatedWidth}" height="${rotatedHeight}">
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="${fontFamily}"
        font-size="${fontSize}px"
        fill="${color}"
        opacity="${opacity}"
        transform="rotate(${rotation} ${rotatedWidth / 2} ${rotatedHeight / 2})"
      >${text}</text>
    </svg>
  `;
    return Buffer.from(svg);
}
async function processImage(inputPath, outputPath, config, watermark) {
    let pipeline = (0, sharp_1.default)(inputPath);
    const metadata = await pipeline.metadata();
    const imageWidth = metadata.width || 0;
    const imageHeight = metadata.height || 0;
    const composites = [];
    if (watermark.type === 'text') {
        const textConfig = watermark.text;
        const estimatedWidth = textConfig.text.length * textConfig.fontSize * 0.6;
        const estimatedHeight = textConfig.fontSize * 1.2;
        const svgBuffer = await createTextWatermarkSvg(textConfig.text, textConfig.fontFamily, textConfig.fontSize, textConfig.color, textConfig.opacity, textConfig.rotation, estimatedWidth, estimatedHeight);
        const svgMetadata = await (0, sharp_1.default)(svgBuffer).metadata();
        const svgWidth = svgMetadata.width || estimatedWidth;
        const svgHeight = svgMetadata.height || estimatedHeight;
        const position = calculatePosition(watermark.position, imageWidth, imageHeight, svgWidth, svgHeight, watermark.margin, watermark.positionValue);
        composites.push({
            input: svgBuffer,
            left: position.left,
            top: position.top,
        });
    }
    else if (watermark.type === 'image' && watermark.image.imageUrl) {
        const imageConfig = watermark.image;
        let wmPath = imageConfig.imageUrl;
        if (wmPath.startsWith('data:image')) {
            const base64Data = wmPath.replace(/^data:image\/\w+;base64,/, '');
            const tempPath = path.join(electron_1.app.getPath('temp'), `wm_${Date.now()}.png`);
            fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
            wmPath = tempPath;
        }
        let watermarkBuffer = await (0, sharp_1.default)(wmPath)
            .resize(imageConfig.width, imageConfig.height, { fit: 'contain' })
            .toBuffer();
        if (imageConfig.opacity < 1) {
            watermarkBuffer = await (0, sharp_1.default)(watermarkBuffer)
                .ensureAlpha()
                .composite([
                {
                    input: Buffer.from([0, 0, 0, Math.round(255 * imageConfig.opacity)]),
                    raw: { width: 1, height: 1, channels: 4 },
                    tile: true,
                    blend: 'in',
                },
            ])
                .toBuffer();
        }
        if (imageConfig.rotation !== 0) {
            watermarkBuffer = await (0, sharp_1.default)(watermarkBuffer)
                .rotate(imageConfig.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toBuffer();
        }
        const wmMetadata = await (0, sharp_1.default)(watermarkBuffer).metadata();
        const wmWidth = wmMetadata.width || imageConfig.width;
        const wmHeight = wmMetadata.height || imageConfig.height;
        const position = calculatePosition(watermark.position, imageWidth, imageHeight, wmWidth, wmHeight, watermark.margin, watermark.positionValue);
        composites.push({
            input: watermarkBuffer,
            left: position.left,
            top: position.top,
        });
    }
    if (composites.length > 0) {
        pipeline = pipeline.composite(composites);
    }
    switch (config.format) {
        case 'jpeg':
            pipeline = pipeline.jpeg({ quality: config.quality });
            break;
        case 'png':
            pipeline = pipeline.png({ compressionLevel: 9 });
            break;
        case 'webp':
            pipeline = pipeline.webp({ quality: config.quality });
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