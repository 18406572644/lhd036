import { Input, Select, Slider, ColorPicker, Space, Typography } from 'antd';
import { Type, Palette, RotateCw, Eye } from 'lucide-react';
import type { Color } from 'antd/es/color-picker';
import { useAppStore } from '@/store/useAppStore';

const { Text } = Typography;

const fontOptions = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'SimHei', label: '黑体' },
  { value: 'SimSun', label: '宋体' },
  { value: 'KaiTi', label: '楷体' },
];

export default function TextWatermarkTab() {
  const textConfig = useAppStore((state) => state.watermarkConfig.text);
  const updateTextConfig = useAppStore((state) => state.updateTextConfig);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Type size={16} color="#00E5CC" />
          <Text strong>水印文字</Text>
        </Space>
        <Input.TextArea
          value={textConfig.text}
          onChange={(e) => updateTextConfig({ text: e.target.value })}
          rows={3}
          maxLength={100}
          placeholder="请输入水印文字"
          showCount
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Type size={16} color="#00E5CC" />
          <Text strong>字体</Text>
        </Space>
        <Select
          value={textConfig.fontFamily}
          onChange={(value) => updateTextConfig({ fontFamily: value })}
          options={fontOptions}
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Type size={16} color="#00E5CC" />
          <Text strong>字号</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {textConfig.fontSize}px
          </Text>
        </Space>
        <Slider
          min={12}
          max={120}
          value={textConfig.fontSize}
          onChange={(value) => updateTextConfig({ fontSize: value })}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Palette size={16} color="#00E5CC" />
          <Text strong>颜色</Text>
        </Space>
        <ColorPicker
          value={textConfig.color}
          onChange={(color: Color) => updateTextConfig({ color: color.toHexString() })}
          showText
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Eye size={16} color="#00E5CC" />
          <Text strong>透明度</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {Math.round(textConfig.opacity * 100)}%
          </Text>
        </Space>
        <Slider
          min={0}
          max={100}
          value={Math.round(textConfig.opacity * 100)}
          onChange={(value) => updateTextConfig({ opacity: value / 100 })}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <RotateCw size={16} color="#00E5CC" />
          <Text strong>旋转角度</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {textConfig.rotation}°
          </Text>
        </Space>
        <Slider
          min={-180}
          max={180}
          value={textConfig.rotation}
          onChange={(value) => updateTextConfig({ rotation: value })}
        />
      </div>
    </Space>
  );
}
