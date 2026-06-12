import { useState } from 'react';
import { Button, Space, Modal, Form, Input, List, message } from 'antd';
import { ImagePlus, Trash2, Layers, Download, Droplets, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { electronApi } from '@/utils/electronApi';
import type { ImageInfo } from '@/types';

interface HeaderProps {
  onExport: () => void;
}

export function Header({ onExport }: HeaderProps) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm] = Form.useForm();

  const {
    images,
    templates,
    watermarkConfig,
    addImages,
    clearImages,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
  } = useAppStore();

  const handleImport = async () => {
    try {
      if (electronApi.isElectron) {
        const filters = [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] },
        ];
        const filePaths = await electronApi.selectFiles(filters);

        if (filePaths.length === 0) return;

        const imagePromises = filePaths.map(async (path) => {
          const info = await electronApi.getImageInfo(path);
          const thumbnail = await electronApi.getThumbnail(path, 200);
          const name = path.split('\\').pop() || path.split('/').pop() || path;

          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            path,
            url: thumbnail,
            width: info.width,
            height: info.height,
            size: info.size,
          } as ImageInfo;
        });

        const imageInfos = await Promise.all(imagePromises);
        addImages(imageInfos);
        message.success(`成功导入 ${imageInfos.length} 张图片`);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          if (files.length === 0) return;

          const imagePromises = files.map(async (file) => {
            const objectUrl = URL.createObjectURL(file);
            const imgEl = document.createElement('img');
            imgEl.src = objectUrl;
            await new Promise((resolve, reject) => {
              imgEl.onload = resolve;
              imgEl.onerror = reject;
            });

            return {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              path: objectUrl,
              url: objectUrl,
              width: imgEl.naturalWidth,
              height: imgEl.naturalHeight,
              size: file.size,
            } as ImageInfo;
          });

          const imageInfos = await Promise.all(imagePromises);
          addImages(imageInfos);
          message.success(`成功导入 ${imageInfos.length} 张图片`);
        };
        input.click();
      }
    } catch (error) {
      console.error('Import failed:', error);
      message.error('导入图片失败');
    }
  };

  const handleClear = () => {
    if (images.length === 0) return;
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有已导入的图片吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        clearImages();
        message.success('已清空所有图片');
      },
    });
  };

  const handleSaveTemplate = () => {
    templateForm.validateFields().then((values) => {
      saveTemplate(values.name);
      templateForm.resetFields();
      message.success('模板保存成功');
    });
  };

  const handleLoadTemplate = (id: string) => {
    loadTemplate(id);
    setTemplateModalOpen(false);
    message.success('模板加载成功');
  };

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个模板吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        deleteTemplate(id);
        message.success('模板已删除');
      },
    });
  };

  return (
    <>
      <header
        className="flex items-center justify-between px-6 h-[60px] bg-[#1A1A2E] border-b border-[#2A2A3E]"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-[#00E5CC] tracking-wide">水印工作室</span>
        </div>

        <Space size={12}>
          <Button
            type="primary"
            size="large"
            icon={<ImagePlus className="w-4 h-4" />}
            onClick={handleImport}
          >
            导入图片
          </Button>
          <Button
            size="large"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleClear}
            disabled={images.length === 0}
          >
            清空
          </Button>
        </Space>

        <Space size={12}>
          <Button
            size="large"
            icon={<Layers className="w-4 h-4" />}
            onClick={() => setTemplateModalOpen(true)}
          >
            模板管理
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<Download className="w-4 h-4" />}
            onClick={onExport}
            disabled={images.length === 0}
            style={{
              boxShadow: '0 0 20px rgba(0, 229, 204, 0.5), 0 0 40px rgba(0, 229, 204, 0.3)',
              background: 'linear-gradient(135deg, #00E5CC 0%, #00B3A0 100%)',
            }}
          >
            导出图片
          </Button>
        </Space>
      </header>

      <Modal
        title="模板管理"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="mb-6">
          <Form form={templateForm} layout="inline">
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入模板名称' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="输入模板名称" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" size="large" onClick={handleSaveTemplate}>
                保存当前配置
              </Button>
            </Form.Item>
          </Form>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无保存的模板</p>
          </div>
        ) : (
          <List
            dataSource={templates}
            renderItem={(template) => (
              <List.Item
                key={template.id}
                actions={[
                  <Button type="link" onClick={() => handleLoadTemplate(template.id)}>
                    应用
                  </Button>,
                  <Button
                    type="text"
                    danger
                    icon={<X className="w-4 h-4" />}
                    onClick={() => handleDeleteTemplate(template.id)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={template.name}
                  description={`类型: ${template.config.type === 'text' ? '文字水印' : '图片水印'} | ${new Date(template.createdAt).toLocaleString()}`}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
}
