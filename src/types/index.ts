export type WatermarkPositionPreset =
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

export interface Position {
  x: number;
  y: number;
}

export interface ImageInfo {
  id: string;
  name: string;
  path: string;
  url: string;
  width: number;
  height: number;
  size: number;
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

export interface WatermarkConfig {
  type: 'text' | 'image';
  position: WatermarkPositionPreset;
  positionValue: Position;
  margin: number;
  text: TextWatermarkConfig;
  image: ImageWatermarkConfig;
  tile: TileConfig;
  preprocess: PreprocessConfig;
}

export interface WatermarkTemplate {
  id: string;
  name: string;
  config: WatermarkConfig;
  createdAt: number;
}

export interface ExportConfig {
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  outputDir: string;
  prefix: string;
  suffix: string;
}

export interface ExportProgressDetail {
  currentFile: string;
  completed: number;
  total: number;
  success: number;
  failed: number;
}

export interface FileFilter {
  name: string;
  extensions: string[];
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

export interface WatchLogEntry {
  id: string;
  watchFolderId: string;
  timestamp: number;
  filePath: string;
  action: 'processing' | 'success' | 'error' | 'skipped';
  message: string;
}

export interface ElectronImageInfo {
  path: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export type RenameRuleType =
  | 'template'
  | 'replace'
  | 'case'
  | 'trim'
  | 'substring'
  | 'condition';

export type RenameCaseType = 'upper' | 'lower' | 'capitalize' | 'title';

export type RenameTrimType = 'spaces' | 'special' | 'both';

export interface RenameRuleBase {
  id: string;
  type: RenameRuleType;
  enabled: boolean;
}

export interface RenameTemplateRule extends RenameRuleBase {
  type: 'template';
  template: string;
}

export interface RenameReplaceRule extends RenameRuleBase {
  type: 'replace';
  find: string;
  replace: string;
  useRegex: boolean;
}

export interface RenameCaseRule extends RenameRuleBase {
  type: 'case';
  caseType: RenameCaseType;
}

export interface RenameTrimRule extends RenameRuleBase {
  type: 'trim';
  trimType: RenameTrimType;
}

export interface RenameSubstringRule extends RenameRuleBase {
  type: 'substring';
  start: number;
  length: number;
}

export type RenameConditionField = 'width' | 'height' | 'ratio';
export type RenameConditionOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';

export interface RenameConditionRule extends RenameRuleBase {
  type: 'condition';
  field: RenameConditionField;
  operator: RenameConditionOperator;
  value: number;
  trueText: string;
  falseText: string;
  position: 'prefix' | 'suffix';
}

export type RenameRule =
  | RenameTemplateRule
  | RenameReplaceRule
  | RenameCaseRule
  | RenameTrimRule
  | RenameSubstringRule
  | RenameConditionRule;

export interface RenamePreset {
  id: string;
  name: string;
  rules: RenameRule[];
  createdAt: number;
}

export interface RenameConfig {
  enabled: boolean;
  rules: RenameRule[];
  autoResolveConflict: boolean;
}

export interface RenamePreviewItem {
  id: string;
  originalName: string;
  newName: string;
  hasConflict: boolean;
  conflictGroup?: string;
}
