import type { Position, WatermarkPositionPreset, TextWatermarkConfig, WatermarkConfig } from '@/types';

export const BASE_IMAGE_WIDTH = 1000;

export function getAdaptiveScale(imageWidth: number): number {
  return imageWidth / BASE_IMAGE_WIDTH;
}

export function calculateRotatedBoundingBox(
  width: number,
  height: number,
  rotationDeg: number
): { width: number; height: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const newWidth = width * cos + height * sin;
  const newHeight = width * sin + height * cos;
  return { width: newWidth, height: newHeight };
}

export function calculatePosition(
  preset: WatermarkPositionPreset,
  imgWidth: number,
  imgHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  margin: number = 20,
  customPosition?: Position
): Position {
  if (preset === 'custom' && customPosition) {
    return customPosition;
  }

  let x: number;
  let y: number;

  switch (preset) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-center':
      x = (imgWidth - watermarkWidth) / 2;
      y = margin;
      break;
    case 'top-right':
      x = imgWidth - watermarkWidth - margin;
      y = margin;
      break;
    case 'center-left':
      x = margin;
      y = (imgHeight - watermarkHeight) / 2;
      break;
    case 'center':
      x = (imgWidth - watermarkWidth) / 2;
      y = (imgHeight - watermarkHeight) / 2;
      break;
    case 'center-right':
      x = imgWidth - watermarkWidth - margin;
      y = (imgHeight - watermarkHeight) / 2;
      break;
    case 'bottom-left':
      x = margin;
      y = imgHeight - watermarkHeight - margin;
      break;
    case 'bottom-center':
      x = (imgWidth - watermarkWidth) / 2;
      y = imgHeight - watermarkHeight - margin;
      break;
    case 'bottom-right':
      x = imgWidth - watermarkWidth - margin;
      y = imgHeight - watermarkHeight - margin;
      break;
    default:
      x = margin;
      y = margin;
  }

  return { x, y };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
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

export function measureText(
  text: string,
  fontFamily: string,
  fontSize: number
): { width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: Math.ceil(metrics.width),
    height: Math.ceil(fontSize * 1.3),
  };
}

async function ensureImageLoaded(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        reject(new Error('Image loaded with zero dimensions: ' + src.substring(0, 80)));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Image load failed: ' + src.substring(0, 80)));
    img.src = src;
  });
}

export async function renderWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  baseImage: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  watermarkConfig: WatermarkConfig
): Promise<void> {
  const baseW = baseImage.naturalWidth;
  const adaptiveScale = getAdaptiveScale(baseW);
  const toCanvas = baseW > 0 ? canvasW / baseW : 1;

  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.drawImage(baseImage, 0, 0, canvasW, canvasH);

  if (watermarkConfig.type === 'text') {
    const textCfg = watermarkConfig.text;
    if (!textCfg.text || !textCfg.text.trim()) return;

    const effectiveFontSize = Math.max(8, Math.round(textCfg.fontSize * adaptiveScale * toCanvas));
    const dispMargin = watermarkConfig.margin * adaptiveScale * toCanvas;

    ctx.save();
    ctx.font = `${effectiveFontSize}px ${textCfg.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(textCfg.text);
    const textW = textMetrics.width;
    const textH = effectiveFontSize * 1.3;

    const rawBbox = calculateRotatedBoundingBox(textW, textH, textCfg.rotation);
    const dispBboxW = rawBbox.width;
    const dispBboxH = rawBbox.height;

    const pos = calculatePosition(
      watermarkConfig.position,
      canvasW,
      canvasH,
      dispBboxW,
      dispBboxH,
      dispMargin,
      {
        x: watermarkConfig.positionValue.x * adaptiveScale * toCanvas,
        y: watermarkConfig.positionValue.y * adaptiveScale * toCanvas,
      }
    );

    const cx = pos.x + dispBboxW / 2;
    const cy = pos.y + dispBboxH / 2;

    ctx.translate(cx, cy);
    ctx.rotate((textCfg.rotation * Math.PI) / 180);

    const { r, g, b } = hexToRgb(textCfg.color);
    const safeOpacity = Math.max(0, Math.min(1, textCfg.opacity));
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
    ctx.fillText(textCfg.text, 0, 0);

    ctx.restore();
  } else if (watermarkConfig.type === 'image' && watermarkConfig.image.imageUrl) {
    const imgCfg = watermarkConfig.image;
    const origWmW = Math.max(4, imgCfg.width * adaptiveScale);
    const origWmH = Math.max(4, imgCfg.height * adaptiveScale);
    const dispWmW = origWmW * toCanvas;
    const dispWmH = origWmH * toCanvas;
    const dispMargin = watermarkConfig.margin * adaptiveScale * toCanvas;

    const bbox = imgCfg.rotation !== 0
      ? calculateRotatedBoundingBox(dispWmW, dispWmH, imgCfg.rotation)
      : { width: dispWmW, height: dispWmH };

    const pos = calculatePosition(
      watermarkConfig.position,
      canvasW,
      canvasH,
      bbox.width,
      bbox.height,
      dispMargin,
      {
        x: watermarkConfig.positionValue.x * adaptiveScale * toCanvas,
        y: watermarkConfig.positionValue.y * adaptiveScale * toCanvas,
      }
    );

    const centerX = pos.x + bbox.width / 2;
    const centerY = pos.y + bbox.height / 2;

    try {
      const wmImg = await ensureImageLoaded(imgCfg.imageUrl);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((imgCfg.rotation * Math.PI) / 180);
      ctx.globalAlpha = imgCfg.opacity;
      ctx.drawImage(wmImg, -dispWmW / 2, -dispWmH / 2, dispWmW, dispWmH);
      ctx.restore();
    } catch (err) {
      console.error('Failed to load watermark image for render:', err);
    }
  }
}

export function generateTextWatermarkSVG(config: TextWatermarkConfig): string {
  const { text, fontFamily, fontSize, color, opacity, rotation } = config;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx!.font = `${fontSize}px ${fontFamily}`;
  const metrics = tempCtx!.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.3);

  const padding = Math.ceil(fontSize * 0.6);
  const rawWidth = textWidth + padding * 2;
  const rawHeight = textHeight + padding * 2;

  const bbox = calculateRotatedBoundingBox(rawWidth, rawHeight, rotation);
  const svgWidth = Math.ceil(bbox.width);
  const svgHeight = Math.ceil(bbox.height);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const { r, g, b } = hexToRgb(color);
  const safeOpacity = Math.max(0, Math.min(1, opacity));

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <text
        x="${centerX}"
        y="${centerY}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        fill="rgb(${r}, ${g}, ${b})"
        fill-opacity="${safeOpacity}"
        text-anchor="middle"
        dominant-baseline="central"
        transform="rotate(${rotation} ${centerX} ${centerY})"
      >${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    </svg>
  `;

  return svg.trim();
}

export function getTextWatermarkSize(
  config: TextWatermarkConfig
): { rawWidth: number; rawHeight: number; bboxWidth: number; bboxHeight: number } {
  const { text, fontFamily, fontSize, rotation } = config;
  const { width, height } = measureText(text, fontFamily, fontSize);
  const padding = Math.ceil(fontSize * 0.6);
  const rawWidth = width + padding * 2;
  const rawHeight = height + padding * 2;
  const bbox = calculateRotatedBoundingBox(rawWidth, rawHeight, rotation);
  return {
    rawWidth,
    rawHeight,
    bboxWidth: Math.ceil(bbox.width),
    bboxHeight: Math.ceil(bbox.height),
  };
}
