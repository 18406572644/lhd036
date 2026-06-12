import { useRef, useEffect, useState, useCallback } from 'react';
import { Button, Slider, Space, Empty } from 'antd';
import { ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { renderWatermarkToCanvas } from '@/utils/watermarkUtils';
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

  const { images, selectedImageId, watermarkConfig } = useAppStore();
  const selectedImage = images.find((img) => img.id === selectedImageId);

  const renderWatermark = useCallback(async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !selectedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        img.src = pathToUrl(selectedImage.path);
      });

      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      let displayWidth: number;
      let displayHeight: number;
      const containerWidth = container.clientWidth - 48;
      const containerHeight = container.clientHeight - 120;

      switch (zoomMode) {
        case 'actual':
          displayWidth = originalWidth;
          displayHeight = originalHeight;
          break;
        case 'fitWidth':
          displayWidth = containerWidth;
          displayHeight = (originalHeight / originalWidth) * containerWidth;
          break;
        case 'fitHeight':
          displayHeight = containerHeight;
          displayWidth = (originalWidth / originalHeight) * containerHeight;
          break;
        case 'fit':
        default: {
          const scale = Math.min(containerWidth / originalWidth, containerHeight / originalHeight);
          displayWidth = originalWidth * scale;
          displayHeight = originalHeight * scale;
          break;
        }
      }

      const scaledWidth = Math.max(1, Math.round(displayWidth * (zoom / 100)));
      const scaledHeight = Math.max(1, Math.round(displayHeight * (zoom / 100)));

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      await renderWatermarkToCanvas(ctx, img, scaledWidth, scaledHeight, watermarkConfig);
    } catch (err) {
      console.error('Preview render error:', err);
    }
  }, [selectedImage, watermarkConfig, zoomMode, zoom]);

  useEffect(() => {
    let cancelled = false;
    if (selectedImage) {
      (async () => {
        if (!cancelled) await renderWatermark();
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [renderWatermark, selectedImage]);

  useEffect(() => {
    setZoom(100);
  }, [selectedImageId, zoomMode]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 300));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 10));
  const handleReset = () => { setZoomMode('fit'); setZoom(100); };
  const handleFitWidth = () => setZoomMode('fitWidth');
  const handleFitHeight = () => setZoomMode('fitHeight');
  const handleActualSize = () => setZoomMode('actual');

  return (
    <div ref={containerRef} className="flex-1 bg-[#0A0A0A] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        {selectedImage ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(0, 229, 204, 0.1)' }}
          />
        ) : (
          <Empty
            image={
              <div className="w-24 h-24 rounded-full bg-[#1A1A2E] flex items-center justify-center mx-auto">
                <ImageIcon className="w-12 h-12 text-gray-600" />
              </div>
            }
            description={<span className="text-gray-500">请从左侧选择一张图片进行预览</span>}
          />
        )}
      </div>

      {selectedImage && (
        <div className="px-6 py-3 bg-[#1A1A2E] border-t border-[#2A2A3E]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedImage.name}
              <span className="text-gray-600 ml-2">({selectedImage.width} × {selectedImage.height})</span>
            </div>
            <Space size={8}>
              <Button size="small" icon={<ZoomOut className="w-4 h-4" />} onClick={handleZoomOut} disabled={zoom <= 10} />
              <div className="w-32">
                <Slider min={10} max={300} value={zoom} onChange={setZoom} tooltip={{ formatter: (value) => `${value}%` }} />
              </div>
              <Button size="small" icon={<ZoomIn className="w-4 h-4" />} onClick={handleZoomIn} disabled={zoom >= 300} />
              <span className="text-sm text-gray-400 w-14 text-center">{zoom}%</span>
              <div className="w-px h-6 bg-[#2A2A3E]" />
              <Button size="small" icon={<Maximize className="w-4 h-4" />} onClick={handleFitWidth} type={zoomMode === 'fitWidth' ? 'primary' : 'default'}>适应宽度</Button>
              <Button size="small" icon={<Minimize className="w-4 h-4" />} onClick={handleFitHeight} type={zoomMode === 'fitHeight' ? 'primary' : 'default'}>适应高度</Button>
              <Button size="small" onClick={handleActualSize} type={zoomMode === 'actual' ? 'primary' : 'default'}>100%</Button>
              <Button size="small" icon={<RotateCcw className="w-4 h-4" />} onClick={handleReset}>重置</Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
}
