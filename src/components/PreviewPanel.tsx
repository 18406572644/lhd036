import { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Slider, Space, Empty } from 'antd';
import { ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { calculatePosition, generateTextWatermarkSVG, measureText } from '@/utils/watermarkUtils';
import { electronApi } from '@/utils/electronApi';

type ZoomMode = 'fit' | 'fitWidth' | 'fitHeight' | 'actual';

function pathToUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('local-image://')) {
    return path;
  }
  if (electronApi.isElectron) {
    return `local-image://${encodeURI(path.replace(/\\/g, '/'))}`;
  }
  return path;
}

export function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [zoom, setZoom] = useState(100);
  const [, setImageLoaded] = useState<HTMLImageElement | null>(null);

  const { images, selectedImageId, watermarkConfig } = useAppStore();
  const selectedImage = images.find((img) => img.id === selectedImageId);

  const renderWatermark = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !selectedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImageLoaded(img);

      let displayWidth: number;
      let displayHeight: number;
      const containerWidth = container.clientWidth - 48;
      const containerHeight = container.clientHeight - 120;

      switch (zoomMode) {
        case 'actual':
          displayWidth = img.width;
          displayHeight = img.height;
          break;
        case 'fitWidth':
          displayWidth = containerWidth;
          displayHeight = (img.height / img.width) * containerWidth;
          break;
        case 'fitHeight':
          displayHeight = containerHeight;
          displayWidth = (img.width / img.height) * containerHeight;
          break;
        case 'fit':
        default: {
          const scale = Math.min(containerWidth / img.width, containerHeight / img.height);
          displayWidth = img.width * scale;
          displayHeight = img.height * scale;
          break;
        }
      }

      const scaledWidth = displayWidth * (zoom / 100);
      const scaledHeight = displayHeight * (zoom / 100);

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      ctx.clearRect(0, 0, scaledWidth, scaledHeight);
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      const scaleFactor = scaledWidth / img.width;

      if (watermarkConfig.type === 'text') {
        const textCfg = watermarkConfig.text;
        if (!textCfg.text) return;
        const textMetrics = measureText(textCfg.text, textCfg.fontFamily, textCfg.fontSize);
        const watermarkWidth = textMetrics.width + textCfg.fontSize;
        const watermarkHeight = textMetrics.height + textCfg.fontSize;

        const position = calculatePosition(
          watermarkConfig.position,
          scaledWidth,
          scaledHeight,
          watermarkWidth * scaleFactor,
          watermarkHeight * scaleFactor,
          watermarkConfig.margin * scaleFactor,
          {
            x: watermarkConfig.positionValue.x * scaleFactor,
            y: watermarkConfig.positionValue.y * scaleFactor,
          }
        );

        const svg = generateTextWatermarkSVG(textCfg);
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const watermarkImg = new window.Image();
        watermarkImg.onload = () => {
          ctx.save();
          const cx = position.x + (watermarkWidth * scaleFactor) / 2;
          const cy = position.y + (watermarkHeight * scaleFactor) / 2;
          ctx.translate(cx, cy);
          ctx.rotate((textCfg.rotation * Math.PI) / 180);
          ctx.globalAlpha = textCfg.opacity;
          ctx.drawImage(
            watermarkImg,
            -(watermarkWidth * scaleFactor) / 2,
            -(watermarkHeight * scaleFactor) / 2,
            watermarkWidth * scaleFactor,
            watermarkHeight * scaleFactor
          );
          ctx.restore();
          URL.revokeObjectURL(url);
        };
        watermarkImg.src = url;
      } else if (watermarkConfig.type === 'image' && watermarkConfig.image.imageUrl) {
        const imgCfg = watermarkConfig.image;
        const watermarkImg = new window.Image();
        watermarkImg.crossOrigin = 'anonymous';

        watermarkImg.onload = () => {
          const position = calculatePosition(
            watermarkConfig.position,
            scaledWidth,
            scaledHeight,
            imgCfg.width * scaleFactor,
            imgCfg.height * scaleFactor,
            watermarkConfig.margin * scaleFactor,
            {
              x: watermarkConfig.positionValue.x * scaleFactor,
              y: watermarkConfig.positionValue.y * scaleFactor,
            }
          );

          ctx.save();
          const cx = position.x + (imgCfg.width * scaleFactor) / 2;
          const cy = position.y + (imgCfg.height * scaleFactor) / 2;
          ctx.translate(cx, cy);
          ctx.rotate((imgCfg.rotation * Math.PI) / 180);
          ctx.globalAlpha = imgCfg.opacity;
          ctx.drawImage(
            watermarkImg,
            -(imgCfg.width * scaleFactor) / 2,
            -(imgCfg.height * scaleFactor) / 2,
            imgCfg.width * scaleFactor,
            imgCfg.height * scaleFactor
          );
          ctx.restore();
        };
        watermarkImg.src = imgCfg.imageUrl;
      }
    };

    img.src = pathToUrl(selectedImage.path);
  }, [selectedImage, watermarkConfig, zoomMode, zoom]);

  useEffect(() => {
    if (selectedImage) {
      renderWatermark();
    }
  }, [renderWatermark, selectedImage]);

  useEffect(() => {
    setZoom(100);
  }, [selectedImageId, zoomMode]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 10, 300));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 10, 10));
  };

  const handleReset = () => {
    setZoomMode('fit');
    setZoom(100);
  };

  const handleFitWidth = () => {
    setZoomMode('fitWidth');
  };

  const handleFitHeight = () => {
    setZoomMode('fitHeight');
  };

  const handleActualSize = () => {
    setZoomMode('actual');
  };

  return (
    <div ref={containerRef} className="flex-1 bg-[#0A0A0A] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {selectedImage ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-2xl"
            style={{
              boxShadow: '0 0 60px rgba(0, 229, 204, 0.1)',
            }}
          />
        ) : (
          <Empty
            image={
              <div className="w-24 h-24 rounded-full bg-[#1A1A2E] flex items-center justify-center mx-auto">
                <ImageIcon className="w-12 h-12 text-gray-600" />
              </div>
            }
            description={
              <span className="text-gray-500">
                请从左侧选择一张图片进行预览
              </span>
            }
          />
        )}
      </div>

      {selectedImage && (
        <div className="px-6 py-3 bg-[#1A1A2E] border-t border-[#2A2A3E]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedImage.name}
              <span className="text-gray-600 ml-2">
                ({selectedImage.width} × {selectedImage.height})
              </span>
            </div>

            <Space size={8}>
              <Button
                size="small"
                icon={<ZoomOut className="w-4 h-4" />}
                onClick={handleZoomOut}
                disabled={zoom <= 10}
              />
              <div className="w-32">
                <Slider
                  min={10}
                  max={300}
                  value={zoom}
                  onChange={setZoom}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
              </div>
              <Button
                size="small"
                icon={<ZoomIn className="w-4 h-4" />}
                onClick={handleZoomIn}
                disabled={zoom >= 300}
              />
              <span className="text-sm text-gray-400 w-14 text-center">{zoom}%</span>

              <div className="w-px h-6 bg-[#2A2A3E]" />

              <Button
                size="small"
                icon={<Maximize className="w-4 h-4" />}
                onClick={handleFitWidth}
                type={zoomMode === 'fitWidth' ? 'primary' : 'default'}
              >
                适应宽度
              </Button>
              <Button
                size="small"
                icon={<Minimize className="w-4 h-4" />}
                onClick={handleFitHeight}
                type={zoomMode === 'fitHeight' ? 'primary' : 'default'}
              >
                适应高度
              </Button>
              <Button
                size="small"
                onClick={handleActualSize}
                type={zoomMode === 'actual' ? 'primary' : 'default'}
              >
                100%
              </Button>
              <Button
                size="small"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
}
