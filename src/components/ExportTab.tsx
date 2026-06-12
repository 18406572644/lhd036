import { Radio, Slider, Space, Typography, Button, Progress, message, Input } from 'antd';
import { Download, Folder, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { electronApi } from '@/utils/electronApi';
import { renderWatermarkToCanvas } from '@/utils/watermarkUtils';
import { useState, useCallback } from 'react';
import type { ExportConfig } from '@/types';

const { Text } = Typography;

type ExportScope = 'all' | 'selected';

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mime =
      format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const q = format === 'png' ? undefined : quality / 100;
    canvas.toBlob((b) => resolve(b), mime, q);
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const MAX_CANVAS_PIXELS = 16384 * 16384;

export default function ExportTab() {
  const exportConfig = useAppStore((state) => state.exportConfig);
  const updateExportConfig = useAppStore((state) => state.updateExportConfig);
  const beginExport = useAppStore((state) => state.beginExport);
  const setExportProgress = useAppStore((state) => state.setExportProgress);
  const updateExportProgressDetail = useAppStore((state) => state.updateExportProgressDetail);
  const finishExport = useAppStore((state) => state.finishExport);
  const exportProgress = useAppStore((state) => state.exportProgress);
  const isExporting = useAppStore((state) => state.isExporting);
  const images = useAppStore((state) => state.images);
  const selectedIds = useAppStore((state) => state.selectedIds);
  const watermarkConfig = useAppStore((state) => state.watermarkConfig);

  const [exportScope, setExportScope] = useState<ExportScope>('all');

  const formatOptions = [
    { value: 'jpeg', label: 'JPG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ];

  const isQualityDisabled = exportConfig.format === 'png';

  const handleSelectDirectory = async () => {
    try {
      const dir = await electronApi.selectDirectory();
      if (dir) {
        updateExportConfig({ outputDir: dir });
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      message.error('选择目录失败');
    }
  };

  const browserExport = useCallback(
    async (exportItems: typeof images) => {
      const total = exportItems.length;
      beginExport(total);

      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        message.error('Canvas 不可用');
        finishExport();
        return;
      }

      let success = 0;
      let failed = 0;

      for (let i = 0; i < exportItems.length; i++) {
        const item = exportItems[i];
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = item.url || item.path;
          });

          const targetW = Math.max(1, img.naturalWidth);
          const targetH = Math.max(1, img.naturalHeight);

          if (targetW * targetH > MAX_CANVAS_PIXELS) {
            throw new Error('图片尺寸超过浏览器 Canvas 上限');
          }

          offscreen.width = targetW;
          offscreen.height = targetH;

          await renderWatermarkToCanvas(ctx, img, targetW, targetH, watermarkConfig);

          const blob = await canvasToBlob(offscreen, exportConfig.format, exportConfig.quality);
          if (!blob) throw new Error('导出失败');

          const ext = exportConfig.format;
          const baseName = item.name.replace(/\.[^.]+$/, '');
          const filename = `${exportConfig.prefix}${baseName}${exportConfig.suffix}.${ext}`;
          triggerDownload(blob, filename);

          success++;
          const percent = Math.round(((i + 1) / total) * 100);
          setExportProgress(percent);
          updateExportProgressDetail({
            accumulative: true,
            currentFile: item.name,
            completed: i + 1,
            total,
            success: 1,
            failed: 0,
          });
        } catch (err) {
          console.error(err);
          failed++;
          updateExportProgressDetail({
            accumulative: true,
            currentFile: item.name,
            completed: i + 1,
            total,
            success: 0,
            failed: 1,
          });
          const percent = Math.round(((i + 1) / total) * 100);
          setExportProgress(percent);
        }
      }

      finishExport();
      if (failed === 0) {
        message.success(`导出完成：成功 ${success} 张，已触发下载`);
      } else {
        message.warning(`导出完成：成功 ${success} 张，失败 ${failed} 张`);
      }
    },
    [
      watermarkConfig,
      exportConfig,
      beginExport,
      setExportProgress,
      updateExportProgressDetail,
      finishExport,
    ]
  );

  const handleExport = async () => {
    const exportItems = exportScope === 'all' ? images : images.filter((img) => selectedIds.includes(img.id));

    if (exportItems.length === 0) {
      message.warning('没有可导出的图片');
      return;
    }

    if (electronApi.isElectron) {
      if (!exportConfig.outputDir) {
        message.warning('请先选择输出目录');
        return;
      }

      const items = exportItems.map((img) => ({ path: img.path, name: img.name }));
      const total = items.length;
      beginExport(total);
      try {
        const result = await electronApi.exportImages(
          exportConfig,
          items,
          watermarkConfig,
          (progress) => {
            const percent = Math.round((progress.current / progress.total) * 100);
            setExportProgress(percent);
            updateExportProgressDetail({
              accumulative: true,
              currentFile: progress.path,
              completed: progress.current,
              total: progress.total,
              success: progress.success ? 1 : 0,
              failed: progress.success ? 0 : 1,
            });
          }
        );

        finishExport();
        message.success(`导出完成：成功 ${result.successCount} 张，失败 ${result.failCount} 张`);
      } catch (error) {
        console.error('Export failed:', error);
        finishExport();
        message.error('导出过程中发生错误');
      }
    } else {
      await browserExport(exportItems);
    }
  };

  const getExportCount = () => (exportScope === 'all' ? images.length : selectedIds.length);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', padding: '0 4px' }}>
      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          <ImageIcon size={16} color="#00E5CC" />
          <Text strong>导出格式</Text>
        </Space>
        <Radio.Group
          value={exportConfig.format}
          onChange={(e) => updateExportConfig({ format: e.target.value as ExportConfig['format'] })}
          optionType="button"
          buttonStyle="solid"
          style={{ width: '100%' }}
        >
          {formatOptions.map((opt) => (
            <Radio.Button
              key={opt.value}
              value={opt.value}
              style={{
                width: '33.33%',
                textAlign: 'center',
                backgroundColor: exportConfig.format === opt.value ? '#00E5CC' : '#2A2A3E',
                borderColor: '#2A2A3E',
                color: exportConfig.format === opt.value ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
              }}
            >
              {opt.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <ImageIcon size={16} color="#00E5CC" />
          <Text strong>导出质量</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {isQualityDisabled ? '无损' : `${exportConfig.quality}%`}
          </Text>
        </Space>
        <Slider
          min={10}
          max={100}
          value={exportConfig.quality}
          onChange={(value) => updateExportConfig({ quality: value })}
          disabled={isQualityDisabled}
        />
        {isQualityDisabled && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            PNG 格式为无损压缩，不支持质量调节
          </Text>
        )}
      </div>

      {electronApi.isElectron && (
        <div>
          <Space align="center" style={{ marginBottom: 12 }}>
            <Folder size={16} color="#00E5CC" />
            <Text strong>输出目录</Text>
          </Space>
          <Space style={{ width: '100%' }}>
            <div
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: '#2A2A3E',
                borderRadius: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 13,
                color: exportConfig.outputDir ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)',
              }}
            >
              {exportConfig.outputDir || '未选择'}
            </div>
            <Button icon={<Folder size={14} />} onClick={handleSelectDirectory} disabled={isExporting}>
              选择
            </Button>
          </Space>
        </div>
      )}

      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          <Square size={16} color="#00E5CC" />
          <Text strong>命名选项</Text>
        </Space>
        <Space style={{ width: '100%' }} direction="vertical" size={8}>
          <div style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
              前缀
            </Text>
            <Input
              placeholder="如: watermark_"
              value={exportConfig.prefix}
              onChange={(e) => updateExportConfig({ prefix: e.target.value })}
              disabled={isExporting}
            />
          </div>
          <div style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
              后缀
            </Text>
            <Input
              placeholder="如: _已加水印"
              value={exportConfig.suffix}
              onChange={(e) => updateExportConfig({ suffix: e.target.value })}
              disabled={isExporting}
            />
          </div>
        </Space>
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          {exportScope === 'all' ? <CheckSquare size={16} color="#00E5CC" /> : <Square size={16} color="#00E5CC" />}
          <Text strong>导出范围</Text>
        </Space>
        <Radio.Group
          value={exportScope}
          onChange={(e) => setExportScope(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          style={{ width: '100%' }}
          disabled={isExporting}
        >
          <Radio.Button
            value="all"
            style={{
              width: '50%',
              textAlign: 'center',
              backgroundColor: exportScope === 'all' ? '#00E5CC' : '#2A2A3E',
              borderColor: '#2A2A3E',
              color: exportScope === 'all' ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
            }}
          >
            全部 ({images.length})
          </Radio.Button>
          <Radio.Button
            value="selected"
            style={{
              width: '50%',
              textAlign: 'center',
              backgroundColor: exportScope === 'selected' ? '#00E5CC' : '#2A2A3E',
              borderColor: '#2A2A3E',
              color: exportScope === 'selected' ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
            }}
          >
            仅选中 ({selectedIds.length})
          </Radio.Button>
        </Radio.Group>
      </div>

      {isExporting && (
        <div>
          <Progress
            percent={exportProgress}
            strokeColor={{ '0%': '#00E5CC', '100%': '#00B3A0' }}
            showInfo
          />
        </div>
      )}

      <Button
        type="primary"
        size="large"
        icon={<Download size={18} />}
        onClick={handleExport}
        loading={isExporting}
        disabled={getExportCount() === 0}
        block
        style={{
          height: 48,
          fontSize: 16,
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00E5CC 0%, #00B3A0 100%)',
          border: 'none',
          boxShadow: '0 0 20px rgba(0, 229, 204, 0.4)',
          marginTop: 8,
        }}
      >
        {isExporting ? '导出中...' : `开始导出 (${getExportCount()} 张)`}
      </Button>

      {!electronApi.isElectron && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          浏览器模式：将分别触发每一张图片的下载
        </Text>
      )}
    </Space>
  );
}
