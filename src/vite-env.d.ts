/// <reference types="vite/client" />

interface Position {
  x: number;
  y: number;
}

interface TextWatermarkConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
}

interface ImageWatermarkConfig {
  imageUrl: string;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
}

interface TileConfig {
  enabled: boolean;
  horizontalSpacing: number;
  verticalSpacing: number;
  staggered: boolean;
  offsetX: number;
  offsetY: number;
}

type ResizeMode = 'none' | 'fixed-width' | 'fixed-height' | 'max-side' | 'percent';
type RotationPreset = 'none' | '90' | '180' | '270' | 'auto-exif';

interface PreprocessConfig {
  resizeMode: ResizeMode;
  fixedWidth: number;
  fixedHeight: number;
  maxSide: number;
  scalePercent: number;
  rotation: RotationPreset;
  targetMaxSize: number;
  targetMaxSizeEnabled: boolean;
}

interface WatermarkConfig {
  type: 'text' | 'image';
  position:
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
  positionValue: Position;
  margin: number;
  text: TextWatermarkConfig;
  image: ImageWatermarkConfig;
  tile: TileConfig;
  preprocess: PreprocessConfig;
}

interface ExportConfig {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  outputDir: string;
  prefix: string;
  suffix: string;
}

interface ImageInfo {
  path: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

interface ExportProgress {
  current: number;
  total: number;
  path: string;
  success: boolean;
  error?: string;
}

interface ExportResult {
  success: boolean;
  total: number;
  successCount: number;
  failCount: number;
  results: Array<{
    success: boolean;
    path?: string;
    error?: string;
  }>;
}

interface FileFilter {
  name: string;
  extensions: string[];
}

interface ElectronAPI {
  selectFiles: (filters?: FileFilter[]) => Promise<string[]>;
  selectDirectory: () => Promise<string | null>;
  getImageInfo: (path: string) => Promise<ImageInfo>;
  getThumbnail: (path: string, size?: number) => Promise<string>;
  exportImages: (
    config: ExportConfig,
    items: Array<{ path: string; name: string }>,
    watermark: WatermarkConfig,
    onProgress?: (progress: ExportProgress) => void
  ) => Promise<ExportResult>;
  onExportProgress: (callback: (progress: ExportProgress) => void) => () => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
