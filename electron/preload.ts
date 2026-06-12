import { contextBridge, ipcRenderer } from 'electron';

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

export interface WatermarkConfig {
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

export interface ExportConfig {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  outputDir: string;
  prefix: string;
  suffix: string;
}

export interface ImageInfo {
  path: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ExportProgress {
  current: number;
  total: number;
  path: string;
  success: boolean;
  error?: string;
}

export interface ExportResult {
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

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface WatchLogEvent {
  id: string;
  watchFolderId: string;
  timestamp: number;
  filePath: string;
  action: 'processing' | 'success' | 'error' | 'skipped';
  message: string;
}

export type WatchTrigger = 'create' | 'change' | 'timer';
export type RenameStrategy = 'skip' | 'overwrite' | 'suffix';

export interface WatchFolderRule {
  extensions: string[];
  minFileSize: number;
  renameStrategy: RenameStrategy;
}

export interface WatchFolderConfig {
  id: string;
  name: string;
  watchPath: string;
  outputDir: string;
  watermarkConfig: WatermarkConfig;
  exportConfig: ExportConfig;
  triggers: WatchTrigger[];
  rule: WatchFolderRule;
  scanInterval: number;
  enabled: boolean;
}

export interface ElectronAPI {
  selectFiles: (filters?: FileFilter[]) => Promise<string[]>;
  selectDirectory: () => Promise<string | null>;
  getImageInfo: (path: string) => Promise<ImageInfo>;
  getThumbnail: (path: string, size?: number) => Promise<string>;
  exportImages: (
    config: ExportConfig,
    items: Array<{ path: string; name: string; outputName?: string }>,
    watermark: WatermarkConfig,
    onProgress?: (progress: ExportProgress) => void
  ) => Promise<ExportResult>;
  onExportProgress: (callback: (progress: ExportProgress) => void) => () => void;
  watchSync: (configs: WatchFolderConfig[]) => Promise<boolean>;
  watchPause: (paused: boolean) => Promise<boolean>;
  watchStopAll: () => Promise<boolean>;
  watchTriggerScan: (watchId: string) => Promise<boolean>;
  onWatchLog: (callback: (log: WatchLogEvent) => void) => () => void;
}

const api: ElectronAPI = {
  selectFiles: (filters?: FileFilter[]) => {
    return ipcRenderer.invoke('select-files', filters);
  },

  selectDirectory: () => {
    return ipcRenderer.invoke('select-directory');
  },

  getImageInfo: (path: string) => {
    return ipcRenderer.invoke('get-image-info', path);
  },

  getThumbnail: (path: string, size: number = 200) => {
    return ipcRenderer.invoke('get-thumbnail', path, size);
  },

  exportImages: (
    config: ExportConfig,
    items: Array<{ path: string; name: string }>,
    watermark: WatermarkConfig,
    onProgress?: (progress: ExportProgress) => void
  ) => {
    if (onProgress) {
      const handler = (_event: unknown, progress: ExportProgress) => {
        onProgress(progress);
      };
      ipcRenderer.on('export-progress', handler);
    }

    return ipcRenderer
      .invoke('export-images', config, items, watermark)
      .finally(() => {
        ipcRenderer.removeAllListeners('export-progress');
      });
  },

  onExportProgress: (callback: (progress: ExportProgress) => void) => {
    const handler = (_event: unknown, progress: ExportProgress) => {
      callback(progress);
    };
    ipcRenderer.on('export-progress', handler);
    return () => {
      ipcRenderer.removeListener('export-progress', handler);
    };
  },

  watchSync: (configs: WatchFolderConfig[]) => {
    return ipcRenderer.invoke('watch-sync', configs);
  },

  watchPause: (paused: boolean) => {
    return ipcRenderer.invoke('watch-pause', paused);
  },

  watchStopAll: () => {
    return ipcRenderer.invoke('watch-stop-all');
  },

  watchTriggerScan: (watchId: string) => {
    return ipcRenderer.invoke('watch-trigger-scan', watchId);
  },

  onWatchLog: (callback: (log: WatchLogEvent) => void) => {
    const handler = (_event: unknown, log: WatchLogEvent) => {
      callback(log);
    };
    ipcRenderer.on('watch-log', handler);
    return () => {
      ipcRenderer.removeListener('watch-log', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
