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
} from '@/types';

const STORAGE_KEY = 'watermark-templates';

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

const defaultWatermarkConfig: WatermarkConfig = {
  type: 'text',
  position: 'bottom-right',
  positionValue: { x: 0, y: 0 },
  margin: 20,
  text: defaultTextConfig,
  image: defaultImageConfig,
};

const defaultExportConfig: ExportConfig = {
  format: 'jpeg',
  quality: 90,
  outputDir: '',
  prefix: '',
  suffix: '_watermarked',
};

interface AppState {
  images: ImageInfo[];
  selectedImageId: string | null;
  selectedIds: string[];
  watermarkConfig: WatermarkConfig;
  templates: WatermarkTemplate[];
  exportConfig: ExportConfig;
  isExporting: boolean;
  exportProgress: number;
  exportProgressDetail: ExportProgressDetail;

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
  updatePosition: (position: Position) => void;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  updateExportConfig: (config: Partial<ExportConfig>) => void;
  beginExport: (total: number) => void;
  setExportProgress: (progress: number) => void;
  updateExportProgressDetail: (detail: Partial<ExportProgressDetail> & { accumulative?: boolean }) => void;
  finishExport: () => void;
  resetExportProgress: () => void;
  loadTemplatesFromStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  images: [],
  selectedImageId: null,
  selectedIds: [],
  watermarkConfig: defaultWatermarkConfig,
  templates: [],
  exportConfig: defaultExportConfig,
  isExporting: false,
  exportProgress: 0,
  exportProgressDetail: {
    currentFile: '',
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
  },

  addImages: (images) =>
    set((state) => ({
      images: [...state.images, ...images],
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
}));
