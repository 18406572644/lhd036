import { useState } from 'react';
import { Tabs } from 'antd';
import { Type, Image, Move, Download } from 'lucide-react';
import TextWatermarkTab from './TextWatermarkTab';
import ImageWatermarkTab from './ImageWatermarkTab';
import PositionTab from './PositionTab';
import ExportTab from './ExportTab';
import { useAppStore } from '@/store/useAppStore';

export default function ConfigPanel() {
  const watermarkConfig = useAppStore((state) => state.watermarkConfig);
  const updateWatermarkConfig = useAppStore((state) => state.updateWatermarkConfig);
  const [activeKey, setActiveKey] = useState('text');

  const tabItems = [
    {
      key: 'text',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Type size={14} />
          文字水印
        </span>
      ),
      children: <TextWatermarkTab />,
    },
    {
      key: 'image',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Image size={14} />
          图片水印
        </span>
      ),
      children: <ImageWatermarkTab />,
    },
    {
      key: 'position',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Move size={14} />
          位置设置
        </span>
      ),
      children: <PositionTab />,
    },
    {
      key: 'export',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Download size={14} />
          导出设置
        </span>
      ),
      children: <ExportTab />,
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    if (key === 'text' || key === 'image') {
      updateWatermarkConfig({ type: key as 'text' | 'image' });
    }
  };

  return (
    <div
      style={{
        width: 420,
        backgroundColor: '#1A1A2E',
        borderLeft: '1px solid #2A2A3E',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={tabItems}
        tabPosition="top"
        size="small"
        style={{
          height: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
        tabBarStyle={{
          padding: '0 16px',
          margin: '12px 0 0 0',
        }}
      />
    </div>
  );
}
