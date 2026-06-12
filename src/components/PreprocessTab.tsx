import { Radio, Slider, Space, Typography, Switch } from 'antd';
import { Maximize, RotateCw, FileDown, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { computePreprocessedSize } from '@/utils/watermarkUtils';
import type { ResizeMode, RotationPreset } from '@/types';

const { Text } = Typography;

export default function PreprocessTab() {
  const preprocessConfig = useAppStore((state) => state.watermarkConfig.preprocess);
  const updatePreprocessConfig = useAppStore((state) => state.updatePreprocessConfig);
  const selectedImage = useAppStore((state) => {
    const id = state.selectedImageId;
    return state.images.find((img) => img.id === id);
  });

  const getPreviewInfo = () => {
    if (!selectedImage) return null;
    const { width, height } = computePreprocessedSize(
      selectedImage.width,
      selectedImage.height,
      preprocessConfig
    );
    return { originalW: selectedImage.width, originalH: selectedImage.height, newW: width, newH: height };
  };

  const previewInfo = getPreviewInfo();

  const resizeOptions: { value: ResizeMode; label: string; desc: string }[] = [
    { value: 'none', label: '不调整', desc: '保持原始尺寸' },
    { value: 'fixed-width', label: '固定宽度', desc: '按指定宽度等比缩放' },
    { value: 'fixed-height', label: '固定高度', desc: '按指定高度等比缩放' },
    { value: 'max-side', label: '最大边', desc: '最长边不超过指定值' },
    { value: 'percent', label: '百分比', desc: '按百分比缩放' },
  ];

  const rotationOptions: { value: RotationPreset; label: string }[] = [
    { value: 'none', label: '不旋转' },
    { value: 'auto-exif', label: '自动EXIF' },
    { value: '90', label: '90°' },
    { value: '180', label: '180°' },
    { value: '270', label: '270°' },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Maximize size={16} color="#00E5CC" />
          <Text strong>尺寸调整</Text>
        </Space>
        <Radio.Group
          value={preprocessConfig.resizeMode}
          onChange={(e) => updatePreprocessConfig({ resizeMode: e.target.value as ResizeMode })}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {resizeOptions.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{opt.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 8 }}>{opt.desc}</span>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {preprocessConfig.resizeMode === 'fixed-width' && (
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Maximize size={16} color="#00E5CC" />
            <Text strong>目标宽度</Text>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>{preprocessConfig.fixedWidth}px</Text>
          </Space>
          <Slider
            min={100}
            max={8000}
            value={preprocessConfig.fixedWidth}
            onChange={(value) => updatePreprocessConfig({ fixedWidth: value })}
          />
        </div>
      )}

      {preprocessConfig.resizeMode === 'fixed-height' && (
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Maximize size={16} color="#00E5CC" />
            <Text strong>目标高度</Text>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>{preprocessConfig.fixedHeight}px</Text>
          </Space>
          <Slider
            min={100}
            max={8000}
            value={preprocessConfig.fixedHeight}
            onChange={(value) => updatePreprocessConfig({ fixedHeight: value })}
          />
        </div>
      )}

      {preprocessConfig.resizeMode === 'max-side' && (
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Maximize size={16} color="#00E5CC" />
            <Text strong>最大边长</Text>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>{preprocessConfig.maxSide}px</Text>
          </Space>
          <Slider
            min={100}
            max={8000}
            value={preprocessConfig.maxSide}
            onChange={(value) => updatePreprocessConfig({ maxSide: value })}
          />
        </div>
      )}

      {preprocessConfig.resizeMode === 'percent' && (
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Maximize size={16} color="#00E5CC" />
            <Text strong>缩放比例</Text>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>{preprocessConfig.scalePercent}%</Text>
          </Space>
          <Slider
            min={10}
            max={300}
            value={preprocessConfig.scalePercent}
            onChange={(value) => updatePreprocessConfig({ scalePercent: value })}
          />
        </div>
      )}

      {previewInfo && preprocessConfig.resizeMode !== 'none' && (
        <div style={{ padding: '8px 12px', backgroundColor: '#2A2A3E', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            预览：{previewInfo.originalW} × {previewInfo.originalH} → <span style={{ color: '#00E5CC' }}>{previewInfo.newW} × {previewInfo.newH}</span>
          </Text>
        </div>
      )}

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <RotateCw size={16} color="#00E5CC" />
          <Text strong>旋转方向</Text>
        </Space>
        <Radio.Group
          value={preprocessConfig.rotation}
          onChange={(e) => updatePreprocessConfig({ rotation: e.target.value as RotationPreset })}
          optionType="button"
          buttonStyle="solid"
          style={{ width: '100%' }}
        >
          {rotationOptions.map((opt) => (
            <Radio.Button
              key={opt.value}
              value={opt.value}
              style={{
                width: `${100 / rotationOptions.length}%`,
                textAlign: 'center',
                backgroundColor: preprocessConfig.rotation === opt.value ? '#00E5CC' : '#2A2A3E',
                borderColor: '#2A2A3E',
                color: preprocessConfig.rotation === opt.value ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
                fontSize: 12,
              }}
            >
              {opt.label}
            </Radio.Button>
          ))}
        </Radio.Group>
        {preprocessConfig.rotation === 'auto-exif' && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
            自动根据图片 EXIF 信息旋转，适合手机拍摄的照片
          </Text>
        )}
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <FileDown size={16} color="#00E5CC" />
          <Text strong>文件大小限制</Text>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text type="secondary">启用压缩上限</Text>
          <Switch
            checked={preprocessConfig.targetMaxSizeEnabled}
            onChange={(checked) => updatePreprocessConfig({ targetMaxSizeEnabled: checked })}
          />
        </div>
        {preprocessConfig.targetMaxSizeEnabled && (
          <div>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Text type="secondary">目标上限</Text>
              <Text type="secondary" style={{ marginLeft: 'auto' }}>{preprocessConfig.targetMaxSize} MB</Text>
            </Space>
            <Slider
              min={0.1}
              max={10}
              step={0.1}
              value={preprocessConfig.targetMaxSize}
              onChange={(value) => updatePreprocessConfig({ targetMaxSize: value })}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              导出时自动调整质量使文件大小不超过此值
            </Text>
          </div>
        )}
      </div>

      {previewInfo && (
        <div style={{ padding: '12px', backgroundColor: '#2A2A3E', borderRadius: 4 }}>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Eye size={14} color="#00E5CC" />
            <Text strong style={{ fontSize: 12 }}>预处理预览</Text>
          </Space>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            <div>原始尺寸：{previewInfo.originalW} × {previewInfo.originalH}</div>
            <div>处理后：<span style={{ color: '#00E5CC' }}>{previewInfo.newW} × {previewInfo.newH}</span></div>
            <div>旋转：{rotationOptions.find(r => r.value === preprocessConfig.rotation)?.label || '不旋转'}</div>
            {preprocessConfig.targetMaxSizeEnabled && (
              <div>大小上限：{preprocessConfig.targetMaxSize} MB</div>
            )}
          </div>
        </div>
      )}

      {!selectedImage && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          请先选择一张图片以预览预处理效果
        </Text>
      )}
    </Space>
  );
}
