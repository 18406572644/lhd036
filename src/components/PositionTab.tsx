import { Slider, Space, Typography, InputNumber, Button } from 'antd';
import { Move, Maximize2, Grid3x3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { WatermarkPositionPreset } from '@/types';

const { Text } = Typography;

const positionButtons: { value: WatermarkPositionPreset; label: string }[][] = [
  [
    { value: 'top-left', label: '↖' },
    { value: 'top-center', label: '↑' },
    { value: 'top-right', label: '↗' },
  ],
  [
    { value: 'center-left', label: '←' },
    { value: 'center', label: '⊙' },
    { value: 'center-right', label: '→' },
  ],
  [
    { value: 'bottom-left', label: '↙' },
    { value: 'bottom-center', label: '↓' },
    { value: 'bottom-right', label: '↘' },
  ],
];

export default function PositionTab() {
  const watermarkConfig = useAppStore((state) => state.watermarkConfig);
  const updateWatermarkConfig = useAppStore((state) => state.updateWatermarkConfig);
  const updatePosition = useAppStore((state) => state.updatePosition);

  const isCustom = watermarkConfig.position === 'custom';
  const isTile = watermarkConfig.position === 'tile';

  const handlePositionSelect = (position: WatermarkPositionPreset) => {
    updateWatermarkConfig({ position });
  };

  const getButtonStyle = (position: WatermarkPositionPreset) => {
    const isSelected = watermarkConfig.position === position;
    return {
      width: 64,
      height: 48,
      fontSize: 18,
      fontWeight: 'bold',
      backgroundColor: isSelected ? '#00E5CC' : '#2A2A3E',
      borderColor: isSelected ? '#00E5CC' : '#2A2A3E',
      color: isSelected ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
      boxShadow: isSelected ? '0 0 12px rgba(0, 229, 204, 0.5)' : 'none',
    };
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          <Move size={16} color="#00E5CC" />
          <Text strong>位置选择</Text>
        </Space>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {positionButtons.map((row, rowIndex) =>
            row.map((btn, colIndex) => (
              <Button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handlePositionSelect(btn.value)}
                style={getButtonStyle(btn.value)}
              >
                {btn.label}
              </Button>
            ))
          )}
        </div>
        <Button
          onClick={() => handlePositionSelect('custom')}
          block
          style={{
            marginTop: 8,
            backgroundColor: isCustom ? '#00E5CC' : '#2A2A3E',
            borderColor: isCustom ? '#00E5CC' : '#2A2A3E',
            color: isCustom ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
            boxShadow: isCustom ? '0 0 12px rgba(0, 229, 204, 0.5)' : 'none',
          }}
        >
          自定义坐标
        </Button>
        <Button
          onClick={() => handlePositionSelect('tile')}
          block
          icon={<Grid3x3 size={14} />}
          style={{
            marginTop: 8,
            backgroundColor: isTile ? '#00E5CC' : '#2A2A3E',
            borderColor: isTile ? '#00E5CC' : '#2A2A3E',
            color: isTile ? '#0A0A0A' : 'rgba(255, 255, 255, 0.85)',
            boxShadow: isTile ? '0 0 12px rgba(0, 229, 204, 0.5)' : 'none',
          }}
        >
          平铺铺满
        </Button>
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Maximize2 size={16} color="#00E5CC" />
          <Text strong>边距</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {watermarkConfig.margin}px
          </Text>
        </Space>
        <Slider
          min={0}
          max={100}
          value={watermarkConfig.margin}
          onChange={(value) => updateWatermarkConfig({ margin: value })}
          disabled={isCustom || isTile}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 12 }}>
          <Move size={16} color="#00E5CC" />
          <Text strong>自定义坐标</Text>
        </Space>
        <Space style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              X 坐标
            </Text>
            <InputNumber
              style={{ width: '100%' }}
              value={watermarkConfig.positionValue.x}
              onChange={(value) => updatePosition({ x: value ?? 0, y: watermarkConfig.positionValue.y })}
              disabled={!isCustom}
              min={0}
              placeholder="像素"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Y 坐标
            </Text>
            <InputNumber
              style={{ width: '100%' }}
              value={watermarkConfig.positionValue.y}
              onChange={(value) => updatePosition({ x: watermarkConfig.positionValue.x, y: value ?? 0 })}
              disabled={!isCustom}
              min={0}
              placeholder="像素"
            />
          </div>
        </Space>
        {!isCustom && (
          <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
            选择"自定义坐标"后可编辑 X、Y 坐标
          </Text>
        )}
      </div>
    </Space>
  );
}
