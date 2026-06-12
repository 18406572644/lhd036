import { Slider, Space, Typography, Switch, InputNumber } from 'antd';
import { Grid3x3, ArrowRightLeft, ArrowUpDown, Shuffle, Move } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

export default function TileTab() {
  const tileConfig = useAppStore((state) => state.watermarkConfig.tile);
  const updateTileConfig = useAppStore((state) => state.updateTileConfig);
  const watermarkConfig = useAppStore((state) => state.watermarkConfig);
  const updateWatermarkConfig = useAppStore((state) => state.updateWatermarkConfig);

  const isTileMode = watermarkConfig.position === 'tile';

  const handleToggleTile = (checked: boolean) => {
    updateWatermarkConfig({ position: checked ? 'tile' : 'bottom-right' });
    updateTileConfig({ enabled: checked });
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Grid3x3 size={16} color="#00E5CC" />
          <Text strong>平铺水印</Text>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text type="secondary">启用水印铺满模式</Text>
          <Switch
            checked={isTileMode}
            onChange={handleToggleTile}
          />
        </div>
      </div>

      <div style={{ opacity: isTileMode ? 1 : 0.4, pointerEvents: isTileMode ? 'auto' : 'none' }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <ArrowRightLeft size={16} color="#00E5CC" />
          <Text strong>水平间距</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {tileConfig.horizontalSpacing}px
          </Text>
        </Space>
        <Slider
          min={0}
          max={500}
          value={tileConfig.horizontalSpacing}
          onChange={(value) => updateTileConfig({ horizontalSpacing: value })}
        />
      </div>

      <div style={{ opacity: isTileMode ? 1 : 0.4, pointerEvents: isTileMode ? 'auto' : 'none' }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <ArrowUpDown size={16} color="#00E5CC" />
          <Text strong>垂直间距</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {tileConfig.verticalSpacing}px
          </Text>
        </Space>
        <Slider
          min={0}
          max={500}
          value={tileConfig.verticalSpacing}
          onChange={(value) => updateTileConfig({ verticalSpacing: value })}
        />
      </div>

      <div style={{ opacity: isTileMode ? 1 : 0.4, pointerEvents: isTileMode ? 'auto' : 'none' }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Shuffle size={16} color="#00E5CC" />
          <Text strong>交错排列</Text>
        </Space>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text type="secondary">类似砖墙效果，奇数行偏移半个水印宽度</Text>
          <Switch
            checked={tileConfig.staggered}
            onChange={(checked) => updateTileConfig({ staggered: checked })}
          />
        </div>
      </div>

      <div style={{ opacity: isTileMode ? 1 : 0.4, pointerEvents: isTileMode ? 'auto' : 'none' }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          <Move size={16} color="#00E5CC" />
          <Text strong>起始偏移量</Text>
        </Space>
        <Space style={{ width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              X 偏移
            </Text>
            <InputNumber
              style={{ width: '100%' }}
              value={tileConfig.offsetX}
              onChange={(value) => updateTileConfig({ offsetX: value ?? 0 })}
              min={-500}
              max={500}
              addonAfter="px"
            />
          </div>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Y 偏移
            </Text>
            <InputNumber
              style={{ width: '100%' }}
              value={tileConfig.offsetY}
              onChange={(value) => updateTileConfig({ offsetY: value ?? 0 })}
              min={-500}
              max={500}
              addonAfter="px"
            />
          </div>
        </Space>
      </div>

      {!isTileMode && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          开启平铺模式后，水印将重复排列铺满整张图片
        </Text>
      )}
    </Space>
  );
}
