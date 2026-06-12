import { useState, useCallback } from 'react';
import { Checkbox, Empty, Tooltip, message } from 'antd';
import { X, Upload, FileImage } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { electronApi } from '@/utils/electronApi';
import type { ImageInfo } from '@/types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function Sidebar() {
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    images,
    selectedImageId,
    selectedIds,
    addImages,
    removeImage,
    selectImage,
    toggleSelection,
    selectAll,
    clearSelection,
  } = useAppStore();

  const isAllSelected = images.length > 0 && selectedIds.length === images.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < images.length;
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  const handleImageClick = useCallback(
    (image: ImageInfo, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        toggleSelection(image.id);
      } else {
        selectImage(image.id);
      }
    },
    [selectImage, toggleSelection]
  );

  const handleDelete = useCallback(
    (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      removeImage(id);
      message.success('已删除图片');
    },
    [removeImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        message.warning('请拖拽图片文件');
        return;
      }

      try {
        const imagePromises = imageFiles.map(async (file) => {
          const path = (file as unknown as { path?: string }).path || URL.createObjectURL(file);
          const name = file.name;
          
          let info: ImageInfo;
          let url: string;

          if (electronApi.isElectron && (file as unknown as { path?: string }).path) {
            const electronInfo = await electronApi.getImageInfo(path);
            const thumbnail = await electronApi.getThumbnail(path, 200);
            info = {
              id: '',
              name,
              path,
              url: '',
              width: electronInfo.width,
              height: electronInfo.height,
              size: electronInfo.size,
            } as ImageInfo;
            url = thumbnail;
          } else {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = objectUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            info = {
              id: '',
              name,
              path: objectUrl,
              url: objectUrl,
              width: img.width,
              height: img.height,
              size: file.size,
            } as ImageInfo;
            url = objectUrl;
          }

          return {
            ...info,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            path,
            url,
          } as ImageInfo;
        });

        const imageInfos = await Promise.all(imagePromises);
        addImages(imageInfos);
        message.success(`成功导入 ${imageInfos.length} 张图片`);
      } catch (error) {
        console.error('Drag drop failed:', error);
        message.error('导入图片失败');
      }
    },
    [addImages]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAll();
    } else {
      clearSelection();
    }
  };

  return (
    <aside
      className="w-[280px] bg-[#1A1A2E] border-r border-[#2A2A3E] flex flex-col"
    >
      <div className="p-4 border-b border-[#2A2A3E]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">
            共 <span className="text-[#00E5CC] font-semibold">{images.length}</span> 张图片
          </span>
          {images.length > 0 && (
            <Checkbox
              indeterminate={isIndeterminate}
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            >
              <span className="text-sm text-gray-400">全选</span>
            </Checkbox>
          )}
        </div>
        {selectedIds.length > 0 && (
          <div className="text-xs text-gray-500">
            已选择 <span className="text-[#00E5CC]">{selectedIds.length}</span> 张
          </div>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto p-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {images.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
              isDragOver
                ? 'border-[#00E5CC] bg-[#00E5CC]/10'
                : 'border-[#2A2A3E] hover:border-[#3A3A4E]'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isDragOver ? 'bg-[#00E5CC]/20' : 'bg-[#2A2A3E]'
              }`}
            >
              {isDragOver ? (
                <Upload className="w-8 h-8 text-[#00E5CC]" />
              ) : (
                <FileImage className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">拖拽图片到此处</p>
            <p className="text-gray-600 text-xs">或点击顶部导入按钮</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => {
              const isSelected = selectedImageId === image.id;
              const isChecked = selectedIds.includes(image.id);

              return (
                <div
                  key={image.id}
                  onClick={(e) => handleImageClick(image, e)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-[#00E5CC] bg-[#00E5CC]/10'
                      : 'border-transparent hover:border-[#00E5CC]/50'
                  }`}
                >
                  <div className="aspect-square overflow-hidden bg-[#0A0A0A]">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute top-1 left-1">
                    <Checkbox checked={isChecked} />
                  </div>

                  <button
                    onClick={(e) => handleDelete(image.id, e)}
                    className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <Tooltip title={image.name}>
                      <p className="text-white text-xs truncate">{image.name}</p>
                    </Tooltip>
                    <p className="text-gray-400 text-[10px]">
                      {image.width} × {image.height}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="p-4 border-t border-[#2A2A3E]">
          <div className="text-xs text-gray-500">
            总大小: <span className="text-gray-300">{formatFileSize(totalSize)}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
