import type { Position, WatermarkPositionPreset, TextWatermarkConfig } from '@/types';

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
  const cleanHex = hex.replace('#', '');
  
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
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;
  
  const padding = fontSize * 0.5;
  const svgWidth = textWidth + padding * 2;
  const svgHeight = textHeight + padding * 2;
  
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  
  const rgbaColor = hexToRgba(color, opacity);
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <text
        x="${centerX}"
        y="${centerY}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        fill="${rgbaColor}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${rotation} ${centerX} ${centerY})"
      >${text}</text>
    </svg>
  `;
  
  return svg.trim();
}

export function textWatermarkToDataURL(config: TextWatermarkConfig): string {
  const svg = generateTextWatermarkSVG(config);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function measureText(text: string, fontFamily: string, fontSize: number): { width: number; height: number } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  return {
    width: metrics.width,
    height: fontSize * 1.2,
  };
}
