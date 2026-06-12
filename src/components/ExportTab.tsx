import { Radio, Slider, Space, Typography, Button, Progress, message } from 'antd';
import { Download, Folder, Image, CheckSquare, Square } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { electronApi } from '@/utils/electronApi';
import { useState } from 'react';
import type { ExportConfig } from '@/types';

const { Text } = Typography;

type ExportScope = 'all' | 'selected';

export default function ExportTab() {
  const exportConfig = useAppStore((state) => state.exportConfig);
  const updateExportConfig = useAppStore((state) => state.updateExportConfig);
  const setExportProgress = useAppStore((state) => state.setExportProgress);
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

  const handleExport = async () => {
    if (!exportConfig.outputDir) {
      message.warning('请先选择输出目录');
      return;
    }

    const exportItems = exportScope === 'all' 
      ? images 
      : images.filter((img) => selectedIds.includes(img.id));

    if (exportItems.length === 0) {
      message.warning('没有可导出的图片');
      return;
    }

    const items = exportItems.map((img) => ({
      path: img.path,
      name: img.name,
    }));

    try {
      setExportProgress(0);

      const result = await electronApi.exportImages(
        exportConfig,
        items,
        watermarkConfig,
        (progress) => {
          const percent = Math.round((progress.current / progress.total) * 100);
          setExportProgress(percent);
        }
      );

      setExportProgress(100);

      if (result.success) {
        message.success(`导出完成：成功 ${result.successCount} 张，失败 ${result.failCount} 张`);
      } else {
        if (!electronApi.isElectron) {
          message.info('导出功能仅在 Electron 环境中可用');
        } else {
          message.error('导出失败');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      message.error('导出过程中发生错误');
    } finally {
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  const getExportCount = () => {
    return exportScope === 'all' ? images.length : selectedIds.length;
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          <Image size={16} color="#00E5CC" />
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
          <Image size={16} color="#00E5CC" />
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
          <Button
            icon={<Folder size={14} />}
            onClick={handleSelectDirectory}
            disabled={isExporting}
          >
            选择
          </Button>
        </Space>
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          {exportScope === 'all' ? (
            <CheckSquare size={16} color="#00E5CC" />
          ) : (
            <Square size={16} color="#00E5CC" />
          )}
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
            strokeColor={{
              '0%': '#00E5CC',
              '100%': '#00B3A0',
            }}
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
          marginTop: 16,
        }}
      >
        {isExporting ? '导出中...' : `开始导出 (${getExportCount()} 张)`}
      </Button>
    </Space>
  );
}
