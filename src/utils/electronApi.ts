import type {
  FileFilter,
  ElectronImageInfo,
  ExportConfig,
  WatermarkConfig,
  ExportProgress,
  ExportResult,
  WatchFolderConfig,
  WatchLogEntry,
} from '@/types';

const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

export const electronApi = {
  get isElectron() {
    return isElectron;
  },

  async selectFiles(filters?: FileFilter[]): Promise<string[]> {
    if (isElectron) {
      return window.electronAPI.selectFiles(filters);
    }
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const paths = files.map((f) => (f as unknown as { path?: string }).path || f.name);
        resolve(paths);
      };
      input.oncancel = () => resolve([]);
      input.click();
    });
  },

  async selectDirectory(): Promise<string | null> {
    if (isElectron) {
      return window.electronAPI.selectDirectory();
    }
    console.warn('selectDirectory is only available in Electron');
    return null;
  },

  async getImageInfo(path: string): Promise<ElectronImageInfo> {
    if (isElectron) {
      return window.electronAPI.getImageInfo(path);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          path,
          width: img.width,
          height: img.height,
          format: 'unknown',
          size: 0,
        });
      };
      img.onerror = reject;
      img.src = path;
    });
  },

  async getThumbnail(path: string, size: number = 200): Promise<string> {
    if (isElectron) {
      return window.electronAPI.getThumbnail(path, size);
    }
    return path;
  },

  async exportImages(
    config: ExportConfig,
    items: Array<{ path: string; name: string; outputName?: string }>,
    watermark: WatermarkConfig,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (isElectron) {
      return window.electronAPI.exportImages(config, items, watermark, onProgress);
    }
    console.warn('exportImages is only available in Electron');
    return {
      success: false,
      total: items.length,
      successCount: 0,
      failCount: items.length,
      results: items.map(() => ({ success: false, error: '仅在 Electron 环境中可用' })),
    };
  },

  onExportProgress(callback: (progress: ExportProgress) => void): () => void {
    if (isElectron && window.electronAPI.onExportProgress) {
      return window.electronAPI.onExportProgress(callback);
    }
    return () => {};
  },

  async watchSync(configs: WatchFolderConfig[]): Promise<boolean> {
    if (isElectron && window.electronAPI.watchSync) {
      return window.electronAPI.watchSync(configs);
    }
    return false;
  },

  async watchPause(paused: boolean): Promise<boolean> {
    if (isElectron && window.electronAPI.watchPause) {
      return window.electronAPI.watchPause(paused);
    }
    return false;
  },

  async watchStopAll(): Promise<boolean> {
    if (isElectron && window.electronAPI.watchStopAll) {
      return window.electronAPI.watchStopAll();
    }
    return false;
  },

  async watchTriggerScan(watchId: string): Promise<boolean> {
    if (isElectron && window.electronAPI.watchTriggerScan) {
      return window.electronAPI.watchTriggerScan(watchId);
    }
    return false;
  },

  onWatchLog(callback: (log: WatchLogEntry) => void): () => void {
    if (isElectron && window.electronAPI.onWatchLog) {
      return window.electronAPI.onWatchLog(
        callback as (log: { id: string; watchFolderId: string; timestamp: number; filePath: string; action: 'processing' | 'success' | 'error' | 'skipped'; message: string }) => void
      );
    }
    return () => {};
  },
};
