import { useState } from 'react';
import { Modal, List, Button, Input, Space, Empty, message, Popconfirm } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TemplateModal({ open, onClose }: TemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const templates = useAppStore((state) => state.templates);
  const saveTemplate = useAppStore((state) => state.saveTemplate);
  const loadTemplate = useAppStore((state) => state.loadTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);

  const handleSave = () => {
    const name = templateName.trim();
    if (!name) {
      message.warning('请输入模板名称');
      return;
    }
    if (templates.some((t) => t.name === name)) {
      message.error('模板名称已存在，请使用其他名称');
      return;
    }
    saveTemplate(name);
    setTemplateName('');
    message.success('模板保存成功');
  };

  const handleApply = (id: string) => {
    loadTemplate(id);
    message.success('模板已应用');
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    message.success('模板已删除');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      title="模板管理"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnClose
    >
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="输入模板名称"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          onPressEnter={handleSave}
          prefix={<SaveOutlined />}
        />
        <Button type="primary" onClick={handleSave}>
          保存为模板
        </Button>
      </Space.Compact>

      {templates.length === 0 ? (
        <Empty description="暂无保存的模板" style={{ margin: '40px 0' }} />
      ) : (
        <List
          dataSource={templates}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button
                  key="apply"
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleApply(item.id)}
                >
                  应用
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这个模板吗？"
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={`创建时间：${formatDate(item.createdAt)}`}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
