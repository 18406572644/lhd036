import { Slider, Space, Typography, Button, message } from 'antd';
import { Upload, ZoomIn, Eye, RotateCw, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRef } from 'react';

const { Text } = Typography;

export default function ImageWatermarkTab() {
  const imageConfig = useAppStore((state) => state.watermarkConfig.image);
  const updateImageConfig = useAppStore((state) => state.updateImageConfig);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          updateImageConfig({
            imageUrl: dataUrl,
            width: img.width,
            height: img.height,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    updateImageConfig({
      imageUrl: '',
      width: 100,
      height: 100,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const scalePercent = Math.round((imageConfig.width / 100) * 100);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Upload size={16} color="#00E5CC" />
          <Text strong>水印图片</Text>
        </Space>
        {imageConfig.imageUrl ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              borderRadius: 4,
              border: '1px solid #2A2A3E',
              backgroundColor: '#2A2A3E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src={imageConfig.imageUrl}
              alt="水印预览"
              style={{
                maxWidth: '80%',
                maxHeight: '80%',
                objectFit: 'contain',
              }}
            />
            <Button
              type="text"
              icon={<X size={14} />}
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                color: '#fff',
                padding: 0,
                minWidth: 'auto',
                width: 24,
                height: 24,
              }}
            />
          </div>
        ) : (
          <div
            onClick={handleSelectImage}
            style={{
              width: '100%',
              height: 120,
              borderRadius: 4,
              border: '2px dashed #2A2A3E',
              backgroundColor: 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00E5CC';
              e.currentTarget.style.backgroundColor = 'rgba(0, 229, 204, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2A2A3E';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Upload size={32} color="#00E5CC" style={{ marginBottom: 8 }} />
            <Text type="secondary">点击选择水印图片</Text>
          </div>
        )}
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <ZoomIn size={16} color="#00E5CC" />
          <Text strong>缩放比例</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {scalePercent}%
          </Text>
        </Space>
        <Slider
          min={10}
          max={200}
          value={scalePercent}
          onChange={(value) => {
            const newWidth = (value / 100) * 100;
            updateImageConfig({ width: newWidth, height: newWidth });
          }}
          disabled={!imageConfig.imageUrl}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Eye size={16} color="#00E5CC" />
          <Text strong>透明度</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {Math.round(imageConfig.opacity * 100)}%
          </Text>
        </Space>
        <Slider
          min={0}
          max={100}
          value={Math.round(imageConfig.opacity * 100)}
          onChange={(value) => updateImageConfig({ opacity: value / 100 })}
          disabled={!imageConfig.imageUrl}
        />
      </div>

      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <RotateCw size={16} color="#00E5CC" />
          <Text strong>旋转角度</Text>
          <Text type="secondary" style={{ marginLeft: 'auto' }}>
            {imageConfig.rotation}°
          </Text>
        </Space>
        <Slider
          min={-180}
          max={180}
          value={imageConfig.rotation}
          onChange={(value) => updateImageConfig({ rotation: value })}
          disabled={!imageConfig.imageUrl}
        />
      </div>
    </Space>
  );
}
