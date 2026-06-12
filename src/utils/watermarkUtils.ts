import type { Position, WatermarkPositionPreset, TextWatermarkConfig } from '@/types';

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

export function hexToRgba(hex: string, opacity: number): string {
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

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function generateTextWatermarkSVG(config: TextWatermarkConfig): string {
  const { text, fontFamily, fontSize, color, opacity, rotation } = config;

  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx!.font = `${fontSize}px ${fontFamily}`;
  const metrics = tempCtx!.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.2);

  const padding = Math.ceil(fontSize * 0.6);
  const rawWidth = textWidth + padding * 2;
  const rawHeight = textHeight + padding * 2;

  const bbox = calculateRotatedBoundingBox(rawWidth, rawHeight, rotation);
  const svgWidth = Math.ceil(bbox.width);
  const svgHeight = Math.ceil(bbox.height);

  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  const rgbaColor = hexToRgba(color, opacity);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <text
        x="${centerX}"
        y="${centerY}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        fill="${rgbaColor}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${rotation} ${centerX} ${centerY})"
      >${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
    </svg>
  `;

  return svg.trim();
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
    height: Math.ceil(fontSize * 1.2),
  };
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
