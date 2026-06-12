import { create } from 'zustand';
import type {
  ImageInfo,
  Position,
  TextWatermarkConfig,
  ImageWatermarkConfig,
  WatermarkConfig,
  WatermarkTemplate,
  ExportConfig,
  ExportProgressDetail,
  TileConfig,
  PreprocessConfig,
  WatchFolderConfig,
  WatchLogEntry,
  RenameConfig,
  RenamePreset,
  RenameRule,
} from '@/types';

const STORAGE_KEY = 'watermark-templates';
const WATCH_STORAGE_KEY = 'watch-folders';
const RENAME_PRESETS_KEY = 'rename-presets';

const defaultTextConfig: TextWatermarkConfig = {
  text: '水印文字',
  fontFamily: 'Arial',
  fontSize: 32,
  color: '#ffffff',
  opacity: 0.6,
  rotation: 0,
};

const defaultImageConfig: ImageWatermarkConfig = {
  imageUrl: '',
  width: 100,
  height: 100,
  opacity: 0.6,
  rotation: 0,
};

const defaultTileConfig: TileConfig = {
  enabled: false,
  horizontalSpacing: 50,
  verticalSpacing: 50,
  staggered: false,
  offsetX: 0,
  offsetY: 0,
};

const defaultPreprocessConfig: PreprocessConfig = {
  resizeMode: 'none',
  fixedWidth: 1920,
  fixedHeight: 1080,
  maxSide: 2000,
  scalePercent: 100,
  rotation: 'none',
  targetMaxSize: 2,
  targetMaxSizeEnabled: false,
};

const defaultWatermarkConfig: WatermarkConfig = {
  type: 'text',
  position: 'bottom-right',
  positionValue: { x: 0, y: 0 },
  margin: 20,
  text: defaultTextConfig,
  image: defaultImageConfig,
  tile: defaultTileConfig,
  preprocess: defaultPreprocessConfig,
};

const defaultExportConfig: ExportConfig = {
  format: 'jpeg',
  quality: 90,
  outputDir: '',
  prefix: '',
  suffix: '_watermarked',
};

const defaultRenameConfig: RenameConfig = {
  enabled: false,
  rules: [],
  autoResolveConflict: true,
};

interface AppState {
  images: ImageInfo[];
  selectedImageId: string | null;
  selectedIds: string[];
  watermarkConfig: WatermarkConfig;
  templates: WatermarkTemplate[];
  exportConfig: ExportConfig;
  renameConfig: RenameConfig;
  renamePresets: RenamePreset[];
  isExporting: boolean;
  exportProgress: number;
  exportProgressDetail: ExportProgressDetail;
  watchFolders: WatchFolderConfig[];
  watchLogs: WatchLogEntry[];
  watchGlobalPaused: boolean;

  addImages: (images: ImageInfo[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  selectImage: (id: string) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  updateWatermarkConfig: (config: Partial<WatermarkConfig>) => void;
  updateTextConfig: (config: Partial<TextWatermarkConfig>) => void;
  updateImageConfig: (config: Partial<ImageWatermarkConfig>) => void;
  updateTileConfig: (config: Partial<TileConfig>) => void;
  updatePreprocessConfig: (config: Partial<PreprocessConfig>) => void;
  updatePosition: (position: Position) => void;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  updateExportConfig: (config: Partial<ExportConfig>) => void;
  updateRenameConfig: (config: Partial<RenameConfig>) => void;
  addRenameRule: (rule: RenameRule) => void;
  updateRenameRule: (id: string, rule: Partial<RenameRule>) => void;
  removeRenameRule: (id: string) => void;
  moveRenameRule: (id: string, direction: 'up' | 'down') => void;
  saveRenamePreset: (name: string) => void;
  loadRenamePreset: (id: string) => void;
  deleteRenamePreset: (id: string) => void;
  loadRenamePresetsFromStorage: () => void;
  beginExport: (total: number) => void;
  setExportProgress: (progress: number) => void;
  updateExportProgressDetail: (detail: Partial<ExportProgressDetail> & { accumulative?: boolean }) => void;
  finishExport: () => void;
  resetExportProgress: () => void;
  loadTemplatesFromStorage: () => void;
  addWatchFolder: (config: WatchFolderConfig) => void;
  updateWatchFolder: (id: string, config: Partial<WatchFolderConfig>) => void;
  removeWatchFolder: (id: string) => void;
  toggleWatchFolder: (id: string) => void;
  setWatchGlobalPaused: (paused: boolean) => void;
  addWatchLog: (entry: WatchLogEntry) => void;
  clearWatchLogs: (watchFolderId?: string) => void;
  loadWatchFoldersFromStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  images: [],
  selectedImageId: null,
  selectedIds: [],
  watermarkConfig: defaultWatermarkConfig,
  templates: [],
  exportConfig: defaultExportConfig,
  renameConfig: defaultRenameConfig,
  renamePresets: [],
  isExporting: false,
  exportProgress: 0,
  exportProgressDetail: {
    currentFile: '',
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
  },
  watchFolders: [],
  watchLogs: [],
  watchGlobalPaused: false,

  addImages: (newImages) =>
    set((state) => ({
      images: [...state.images, ...newImages],
    })),

  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  clearImages: () =>
    set({
      images: [],
      selectedImageId: null,
      selectedIds: [],
    }),

  selectImage: (id) =>
    set({
      selectedImageId: id,
    }),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: () =>
    set((state) => ({
      selectedIds: state.images.map((img) => img.id),
    })),

  clearSelection: () =>
    set({
      selectedIds: [],
    }),

  updateWatermarkConfig: (config) =>
    set((state) => ({
      watermarkConfig: { ...state.watermarkConfig, ...config },
    })),

  updateTextConfig: (config) =>
    set((state) => ({
      watermarkConfig: {
        ...state.watermarkConfig,
        text: { ...state.watermarkConfig.text, ...config },
      },
    })),

  updateImageConfig: (config) =>
    set((state) => ({
      watermarkConfig: {
        ...state.watermarkConfig,
        image: { ...state.watermarkConfig.image, ...config },
      },
    })),

  updateTileConfig: (config) =>
    set((state) => ({
      watermarkConfig: {
        ...state.watermarkConfig,
        tile: { ...state.watermarkConfig.tile, ...config },
      },
    })),

  updatePreprocessConfig: (config) =>
    set((state) => ({
      watermarkConfig: {
        ...state.watermarkConfig,
        preprocess: { ...state.watermarkConfig.preprocess, ...config },
      },
    })),

  updatePosition: (position) =>
    set((state) => ({
      watermarkConfig: {
        ...state.watermarkConfig,
        positionValue: position,
      },
    })),

  saveTemplate: (name) => {
    const { watermarkConfig, templates } = get();
    const newTemplate: WatermarkTemplate = {
      id: Date.now().toString(),
      name,
      config: JSON.parse(JSON.stringify(watermarkConfig)),
      createdAt: Date.now(),
    };
    const updatedTemplates = [...templates, newTemplate];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    set({ templates: updatedTemplates });
  },

  loadTemplate: (id) => {
    const { templates } = get();
    const template = templates.find((t) => t.id === id);
    if (template) {
      set({
        watermarkConfig: JSON.parse(JSON.stringify(template.config)),
      });
    }
  },

  deleteTemplate: (id) => {
    const { templates } = get();
    const updatedTemplates = templates.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    set({ templates: updatedTemplates });
  },

  updateExportConfig: (config) =>
    set((state) => ({
      exportConfig: { ...state.exportConfig, ...config },
    })),

  updateRenameConfig: (config) =>
    set((state) => ({
      renameConfig: { ...state.renameConfig, ...config },
    })),

  addRenameRule: (rule) =>
    set((state) => ({
      renameConfig: {
        ...state.renameConfig,
        rules: [...state.renameConfig.rules, rule],
      },
    })),

  updateRenameRule: (id, rule) =>
    set((state) => ({
      renameConfig: {
        ...state.renameConfig,
        rules: state.renameConfig.rules.map((r) =>
          r.id === id ? ({ ...r, ...rule } as RenameRule) : r
        ),
      },
    })),

  removeRenameRule: (id) =>
    set((state) => ({
      renameConfig: {
        ...state.renameConfig,
        rules: state.renameConfig.rules.filter((r) => r.id !== id),
      },
    })),

  moveRenameRule: (id, direction) =>
    set((state) => {
      const rules = [...state.renameConfig.rules];
      const idx = rules.findIndex((r) => r.id === id);
      if (idx === -1) return state;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= rules.length) return state;
      [rules[idx], rules[targetIdx]] = [rules[targetIdx], rules[idx]];
      return {
        renameConfig: {
          ...state.renameConfig,
          rules,
        },
      };
    }),

  saveRenamePreset: (name) => {
    const { renameConfig, renamePresets } = get();
    const newPreset: RenamePreset = {
      id: Date.now().toString(),
      name,
      rules: JSON.parse(JSON.stringify(renameConfig.rules)),
      createdAt: Date.now(),
    };
    const updatedPresets = [...renamePresets, newPreset];
    localStorage.setItem(RENAME_PRESETS_KEY, JSON.stringify(updatedPresets));
    set({ renamePresets: updatedPresets });
  },

  loadRenamePreset: (id) => {
    const { renamePresets } = get();
    const preset = renamePresets.find((p) => p.id === id);
    if (preset) {
      set((state) => ({
        renameConfig: {
          ...state.renameConfig,
          rules: JSON.parse(JSON.stringify(preset.rules)),
        },
      }));
    }
  },

  deleteRenamePreset: (id) => {
    const { renamePresets } = get();
    const updatedPresets = renamePresets.filter((p) => p.id !== id);
    localStorage.setItem(RENAME_PRESETS_KEY, JSON.stringify(updatedPresets));
    set({ renamePresets: updatedPresets });
  },

  loadRenamePresetsFromStorage: () => {
    try {
      const stored = localStorage.getItem(RENAME_PRESETS_KEY);
      if (stored) {
        const presets = JSON.parse(stored) as RenamePreset[];
        set({ renamePresets: presets });
      }
    } catch {
      console.error('Failed to load rename presets from storage');
    }
  },

  beginExport: (total) =>
    set({
      isExporting: true,
      exportProgress: 0,
      exportProgressDetail: {
        currentFile: '',
        completed: 0,
        total,
        success: 0,
        failed: 0,
      },
    }),

  setExportProgress: (progress) =>
    set({
      exportProgress: Math.max(0, Math.min(100, progress)),
    }),

  updateExportProgressDetail: (detail) =>
    set((state) => {
      if (detail.accumulative) {
        const prev = state.exportProgressDetail;
        const merged: ExportProgressDetail = {
          ...prev,
          ...detail,
          success: prev.success + (detail.success || 0),
          failed: prev.failed + (detail.failed || 0),
        };
        return { exportProgressDetail: merged };
      }
      return {
        exportProgressDetail: { ...state.exportProgressDetail, ...detail },
      };
    }),

  finishExport: () =>
    set({
      isExporting: false,
      exportProgress: 100,
    }),

  resetExportProgress: () =>
    set({
      exportProgress: 0,
      isExporting: false,
      exportProgressDetail: {
        currentFile: '',
        completed: 0,
        total: 0,
        success: 0,
        failed: 0,
      },
    }),

  loadTemplatesFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const templates = JSON.parse(stored) as WatermarkTemplate[];
        set({ templates });
      }
    } catch {
      console.error('Failed to load templates from storage');
    }
  },

  addWatchFolder: (config) =>
    set((state) => {
      const updated = [...state.watchFolders, config];
      localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(updated));
      return { watchFolders: updated };
    }),

  updateWatchFolder: (id, config) =>
    set((state) => {
      const updated = state.watchFolders.map((f) =>
        f.id === id ? { ...f, ...config } : f
      );
      localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(updated));
      return { watchFolders: updated };
    }),

  removeWatchFolder: (id) =>
    set((state) => {
      const updated = state.watchFolders.filter((f) => f.id !== id);
      localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(updated));
      return {
        watchFolders: updated,
        watchLogs: state.watchLogs.filter((l) => l.watchFolderId !== id),
      };
    }),

  toggleWatchFolder: (id) =>
    set((state) => {
      const updated = state.watchFolders.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(updated));
      return { watchFolders: updated };
    }),

  setWatchGlobalPaused: (paused) =>
    set({ watchGlobalPaused: paused }),

  addWatchLog: (entry) =>
    set((state) => {
      const logs = [entry, ...state.watchLogs].slice(0, 500);
      return { watchLogs: logs };
    }),

  clearWatchLogs: (watchFolderId) =>
    set((state) => ({
      watchLogs: watchFolderId
        ? state.watchLogs.filter((l) => l.watchFolderId !== watchFolderId)
        : [],
    })),

  loadWatchFoldersFromStorage: () => {
    try {
      const stored = localStorage.getItem(WATCH_STORAGE_KEY);
      if (stored) {
        const watchFolders = JSON.parse(stored) as WatchFolderConfig[];
        set({ watchFolders });
      }
    } catch {
      console.error('Failed to load watch folders from storage');
    }
  },
}));
