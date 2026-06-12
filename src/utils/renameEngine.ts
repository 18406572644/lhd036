import type {
  RenameRule,
  RenameConfig,
  RenamePreviewItem,
  ImageInfo,
} from '@/types';

function padNumber(num: number, pad: number): string {
  return num.toString().padStart(pad, '0');
}

function formatDate(date: Date, format: string): string {
  const map: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: padNumber(date.getMonth() + 1, 2),
    DD: padNumber(date.getDate(), 2),
    HH: padNumber(date.getHours(), 2),
    mm: padNumber(date.getMinutes(), 2),
    ss: padNumber(date.getSeconds(), 2),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match] || match);
}

function getSizeLabel(width: number, height: number): string {
  const longer = Math.max(width, height);
  if (longer >= 3840) return '4K';
  if (longer >= 2560) return '2K';
  if (longer >= 1920) return 'FHD';
  if (longer >= 1280) return 'HD';
  return 'SD';
}

interface RenameContext {
  originalName: string;
  baseName: string;
  extension: string;
  index: number;
  width: number;
  height: number;
  now: Date;
}

function createContext(
  item: ImageInfo,
  index: number,
  now: Date
): RenameContext {
  const lastDot = item.name.lastIndexOf('.');
  const baseName = lastDot > 0 ? item.name.substring(0, lastDot) : item.name;
  const extension = lastDot > 0 ? item.name.substring(lastDot + 1) : '';
  return {
    originalName: item.name,
    baseName,
    extension,
    index,
    width: item.width || 0,
    height: item.height || 0,
    now,
  };
}

function applyTemplateVariables(template: string, ctx: RenameContext): string {
  let result = template;

  result = result.replace(/\{原文件名\}/g, ctx.baseName);

  result = result.replace(/\{序号:?(\d*)\}/g, (_match, group) => {
    const pad = group ? parseInt(group.length > 0 ? group : '4', 10) : 4;
    return padNumber(ctx.index + 1, pad);
  });

  result = result.replace(/\{日期:?([^}]*)\}/g, (_match, group) => {
    const fmt = group || 'YYYYMMDD';
    return formatDate(ctx.now, fmt);
  });

  result = result.replace(/\{时间:?([^}]*)\}/g, (_match, group) => {
    const fmt = group || 'HHmmss';
    return formatDate(ctx.now, fmt);
  });

  result = result.replace(/\{宽度\}/g, ctx.width.toString());
  result = result.replace(/\{高度\}/g, ctx.height.toString());
  result = result.replace(/\{尺寸标签\}/g, getSizeLabel(ctx.width, ctx.height));

  return result;
}

function applyReplaceRule(
  text: string,
  find: string,
  replace: string,
  useRegex: boolean
): string {
  if (!find) return text;
  try {
    if (useRegex) {
      const regex = new RegExp(find, 'g');
      return text.replace(regex, replace);
    }
    return text.split(find).join(replace);
  } catch {
    return text;
  }
}

function applyCaseRule(text: string, caseType: string): string {
  switch (caseType) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'capitalize':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case 'title':
      return text
        .split(/(\s+|_+|-+)/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    default:
      return text;
  }
}

function applyTrimRule(text: string, trimType: string): string {
  let result = text;
  if (trimType === 'spaces' || trimType === 'both') {
    result = result.replace(/\s+/g, '');
  }
  if (trimType === 'special' || trimType === 'both') {
    result = result.replace(/[^\w\u4e00-\u9fa5.-]/g, '');
  }
  return result;
}

function applySubstringRule(
  text: string,
  start: number,
  length: number
): string {
  const s = Math.max(0, start);
  if (length <= 0) return text.substring(s);
  return text.substring(s, s + length);
}

function evalCondition(
  field: string,
  operator: string,
  value: number,
  ctx: RenameContext
): boolean {
  let actual: number;
  switch (field) {
    case 'width':
      actual = ctx.width;
      break;
    case 'height':
      actual = ctx.height;
      break;
    case 'ratio':
      actual = ctx.height > 0 ? ctx.width / ctx.height : 0;
      break;
    default:
      return false;
  }
  switch (operator) {
    case '>':
      return actual > value;
    case '<':
      return actual < value;
    case '>=':
      return actual >= value;
    case '<=':
      return actual <= value;
    case '==':
      return actual === value;
    case '!=':
      return actual !== value;
    default:
      return false;
  }
}

function applyRule(text: string, rule: RenameRule, ctx: RenameContext): string {
  if (!rule.enabled) return text;

  switch (rule.type) {
    case 'template':
      return applyTemplateVariables(rule.template, { ...ctx, baseName: text });

    case 'replace':
      return applyReplaceRule(text, rule.find, rule.replace, rule.useRegex);

    case 'case':
      return applyCaseRule(text, rule.caseType);

    case 'trim':
      return applyTrimRule(text, rule.trimType);

    case 'substring':
      return applySubstringRule(text, rule.start, rule.length);

    case 'condition': {
      const conditionMet = evalCondition(rule.field, rule.operator, rule.value, ctx);
      const textToAdd = conditionMet ? rule.trueText : rule.falseText;
      return rule.position === 'prefix' ? textToAdd + text : text + textToAdd;
    }

    default:
      return text;
  }
}

function applyRulesToName(
  item: ImageInfo,
  index: number,
  rules: RenameRule[],
  outputExtension?: string
): string {
  const now = new Date();
  const ctx = createContext(item, index, now);
  let currentName = ctx.baseName;

  const enabledRules = rules.filter((r) => r.enabled);
  for (const rule of enabledRules) {
    currentName = applyRule(currentName, rule, ctx);
  }

  const ext = outputExtension || ctx.extension;
  if (!ext) return currentName;
  return `${currentName}.${ext}`;
}

export function applyRenameConfig(
  item: ImageInfo,
  index: number,
  config: RenameConfig,
  outputExtension?: string
): string {
  if (!config.enabled || config.rules.length === 0) {
    const lastDot = item.name.lastIndexOf('.');
    const baseName = lastDot > 0 ? item.name.substring(0, lastDot) : item.name;
    const ext = outputExtension || (lastDot > 0 ? item.name.substring(lastDot + 1) : '');
    return ext ? `${baseName}.${ext}` : baseName;
  }
  return applyRulesToName(item, index, config.rules, outputExtension);
}

export function generateRenamePreview(
  items: ImageInfo[],
  config: RenameConfig,
  outputExtension?: string
): RenamePreviewItem[] {
  const preview: RenamePreviewItem[] = items.map((item, index) => ({
    id: item.id,
    originalName: item.name,
    newName: applyRenameConfig(item, index, config, outputExtension),
    hasConflict: false,
  }));

  const nameCount = new Map<string, number>();
  for (const p of preview) {
    nameCount.set(p.newName, (nameCount.get(p.newName) || 0) + 1);
  }

  for (const p of preview) {
    const count = nameCount.get(p.newName) || 0;
    if (count > 1) {
      p.hasConflict = true;
      p.conflictGroup = p.newName;
    }
  }

  return preview;
}

export function resolveConflicts(
  preview: RenamePreviewItem[]
): RenamePreviewItem[] {
  const result = preview.map((p) => ({ ...p }));
  const nameIndex = new Map<string, number>();
  const usedNames = new Set<string>();

  for (const p of result) {
    if (!p.hasConflict) {
      usedNames.add(p.newName);
      continue;
    }

    const lastDot = p.newName.lastIndexOf('.');
    const baseName = lastDot > 0 ? p.newName.substring(0, lastDot) : p.newName;
    const ext = lastDot > 0 ? p.newName.substring(lastDot) : '';

    let currentIdx = (nameIndex.get(p.newName) || 0) + 1;
    nameIndex.set(p.newName, currentIdx);

    let candidate = `${baseName}_${currentIdx}${ext}`;
    while (usedNames.has(candidate)) {
      currentIdx++;
      candidate = `${baseName}_${currentIdx}${ext}`;
    }

    p.newName = candidate;
    p.hasConflict = false;
    usedNames.add(candidate);
  }

  return result;
}

export function createDefaultRenameRule(type: RenameRule['type']): RenameRule {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const base = { id, enabled: true };

  switch (type) {
    case 'template':
      return { ...base, type: 'template', template: '{原文件名}_{序号:0001}' };
    case 'replace':
      return { ...base, type: 'replace', find: '', replace: '', useRegex: false };
    case 'case':
      return { ...base, type: 'case', caseType: 'lower' };
    case 'trim':
      return { ...base, type: 'trim', trimType: 'spaces' };
    case 'substring':
      return { ...base, type: 'substring', start: 0, length: 0 };
    case 'condition':
      return {
        ...base,
        type: 'condition',
        field: 'width',
        operator: '>',
        value: 0,
        trueText: '_横',
        falseText: '_竖',
        position: 'suffix',
      };
    default:
      return { ...base, type: 'template', template: '{原文件名}' };
  }
}

export const RULE_LABELS: Record<RenameRule['type'], string> = {
  template: '模板变量',
  replace: '查找替换',
  case: '大小写转换',
  trim: '去除字符',
  substring: '截取子串',
  condition: '条件规则',
};

export const TEMPLATE_VARIABLES = [
  { label: '{原文件名}', desc: '原始文件名（不含扩展名）' },
  { label: '{序号:0001}', desc: '序号，可自定义位数' },
  { label: '{日期:YYYYMMDD}', desc: '当前日期' },
  { label: '{时间:HHmmss}', desc: '当前时间' },
  { label: '{宽度}', desc: '图片宽度' },
  { label: '{高度}', desc: '图片高度' },
  { label: '{尺寸标签}', desc: '4K/2K/FHD/HD/SD' },
];
