import { useState, useCallback } from 'react';
import {
  Button,
  Space,
  Typography,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Tooltip,
  Checkbox,
  message,
  Slider,
} from 'antd';
import {
  Eye,
  FolderPlus,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Folder,
  Settings2,
  FileSearch,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { electronApi } from '@/utils/electronApi';
import type {
  WatchFolderConfig,
  WatchTrigger,
  RenameStrategy,
  WatchLogEntry,
  WatermarkConfig,
  ExportConfig,
} from '@/types';

const { Text } = Typography;

function WatchFolderItem({
  config,
  onToggle,
  onRemove,
  onScan,
}: {
  config: WatchFolderConfig;
  onToggle: () => void;
  onRemove: () => void;
  onScan: () => void;
}) {
  return (
    <div
      style={{
        padding: 12,
        backgroundColor: '#2A2A3E',
        borderRadius: 6,
        border: `1px solid ${config.enabled ? '#00E5CC33' : '#2A2A3E'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <Folder size={14} color={config.enabled ? '#00E5CC' : '#666'} style={{ flexShrink: 0 }} />
          <Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
            {config.name}
          </Text>
          <Tag
            color={config.enabled ? 'cyan' : 'default'}
            style={{ margin: 0, fontSize: 11, flexShrink: 0 }}
          >
            {config.enabled ? '监控中' : '已暂停'}
          </Tag>
        </div>
        <Switch
          size="small"
          checked={config.enabled}
          onChange={onToggle}
          style={{ flexShrink: 0, marginLeft: 8 }}
        />
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
        监控：<span style={{ color: 'rgba(255,255,255,0.85)' }}>{config.watchPath}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
        输出：<span style={{ color: 'rgba(255,255,255,0.85)' }}>{config.outputDir}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {config.triggers.map((t) => (
          <Tag key={t} style={{ fontSize: 10, margin: 0 }}>
            {t === 'create' ? '文件创建' : t === 'change' ? '文件修改' : `定时${config.scanInterval}s`}
          </Tag>
        ))}
        {config.rule.extensions.length > 0 && (
          <Tag style={{ fontSize: 10, margin: 0, color: '#00E5CC' }}>
            {config.rule.extensions.join(', ')}
          </Tag>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <Tooltip title="手动扫描">
          <Button
            size="small"
            icon={<RefreshCw size={12} />}
            onClick={onScan}
            disabled={!config.enabled}
          />
        </Tooltip>
        <Tooltip title="删除">
          <Button
            size="small"
            danger
            icon={<Trash2 size={12} />}
            onClick={onRemove}
          />
        </Tooltip>
      </div>
    </div>
  );
}

function WatchLogList({
  logs,
  watchFolderId,
  onClear,
}: {
  logs: WatchLogEntry[];
  watchFolderId?: string;
  onClear: () => void;
}) {
  const filtered = watchFolderId
    ? logs.filter((l) => l.watchFolderId === watchFolderId)
    : logs;
  const display = filtered.slice(0, 100);

  const actionColor: Record<string, string> = {
    processing: '#1890ff',
    success: '#00E5CC',
    error: '#FF4D4F',
    skipped: '#888',
  };
  const actionLabel: Record<string, string> = {
    processing: '处理中',
    success: '成功',
    error: '失败',
    skipped: '跳过',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>
          <FileSearch size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          处理日志
        </Text>
        <Button size="small" onClick={onClear}>
          清空
        </Button>
      </div>
      {display.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          暂无日志
        </div>
      ) : (
        <div
          style={{
            maxHeight: 260,
            overflowY: 'auto',
            backgroundColor: '#1A1A2E',
            borderRadius: 4,
            padding: 8,
          }}
        >
          {display.map((log) => (
            <div
              key={log.id}
              style={{
                fontSize: 11,
                padding: '4px 0',
                borderBottom: '1px solid #2A2A3E',
                display: 'flex',
                gap: 6,
                alignItems: 'baseline',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0, fontFamily: 'monospace', fontSize: 10 }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <Tag
                color={actionColor[log.action] || '#888'}
                style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', flexShrink: 0 }}
              >
                {actionLabel[log.action] || log.action}
              </Tag>
              <span style={{ color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.filePath.split(/[/\\]/).pop()}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AddWatchFolderFormValues {
  name: string;
  watchPath: string;
  outputDir: string;
  triggers: WatchTrigger[];
  scanInterval: number;
  extensions: string;
  minFileSize: number;
  renameStrategy: RenameStrategy;
  format: ExportConfig['format'];
  quality: number;
  prefix: string;
  suffix: string;
}

export default function WatchMonitorTab() {
  const watchFolders = useAppStore((s) => s.watchFolders);
  const watchLogs = useAppStore((s) => s.watchLogs);
  const watchGlobalPaused = useAppStore((s) => s.watchGlobalPaused);
  const watermarkConfig = useAppStore((s) => s.watermarkConfig);
  const addWatchFolder = useAppStore((s) => s.addWatchFolder);
  const removeWatchFolder = useAppStore((s) => s.removeWatchFolder);
  const toggleWatchFolder = useAppStore((s) => s.toggleWatchFolder);
  const setWatchGlobalPaused = useAppStore((s) => s.setWatchGlobalPaused);
  const clearWatchLogs = useAppStore((s) => s.clearWatchLogs);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<AddWatchFolderFormValues>();

  const syncWatchers = useCallback(
    (folders?: WatchFolderConfig[]) => {
      const list = folders || useAppStore.getState().watchFolders;
      electronApi.watchSync(list);
    },
    []
  );

  const handleAdd = useCallback(() => {
    form.resetFields();
    setModalOpen(true);
  }, [form]);

  const handleSelectWatchPath = useCallback(async () => {
    const dir = await electronApi.selectDirectory();
    if (dir) {
      form.setFieldsValue({ watchPath: dir });
      if (!form.getFieldValue('name')) {
        form.setFieldsValue({ name: dir.split(/[/\\]/).pop() || '监控文件夹' });
      }
    }
  }, [form]);

  const handleSelectOutputDir = useCallback(async () => {
    const dir = await electronApi.selectDirectory();
    if (dir) {
      form.setFieldsValue({ outputDir: dir });
    }
  }, [form]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const newConfig: WatchFolderConfig = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: values.name,
        watchPath: values.watchPath,
        outputDir: values.outputDir,
        watermarkConfig: JSON.parse(JSON.stringify(watermarkConfig)) as WatermarkConfig,
        exportConfig: {
          format: values.format,
          quality: values.quality,
          outputDir: values.outputDir,
          prefix: values.prefix,
          suffix: values.suffix,
        },
        triggers: values.triggers,
        rule: {
          extensions: values.extensions
            .split(',')
            .map((e: string) => e.trim().toLowerCase())
            .filter(Boolean),
          minFileSize: values.minFileSize * 1024,
          renameStrategy: values.renameStrategy,
        },
        scanInterval: values.scanInterval,
        enabled: true,
      };
      addWatchFolder(newConfig);
      syncWatchers([...useAppStore.getState().watchFolders, newConfig]);
      setModalOpen(false);
      message.success('监控文件夹已添加');
    } catch {
      // validation failed
    }
  }, [form, watermarkConfig, addWatchFolder, syncWatchers]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleWatchFolder(id);
      const updated = useAppStore.getState().watchFolders.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      );
      syncWatchers(updated);
    },
    [toggleWatchFolder, syncWatchers]
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeWatchFolder(id);
      const updated = useAppStore.getState().watchFolders;
      syncWatchers(updated);
    },
    [removeWatchFolder, syncWatchers]
  );

  const handleGlobalPause = useCallback(
    (paused: boolean) => {
      setWatchGlobalPaused(paused);
      electronApi.watchPause(paused);
    },
    [setWatchGlobalPaused]
  );

  const handleScan = useCallback(async (id: string) => {
    await electronApi.watchTriggerScan(id);
    message.info('手动扫描已触发');
  }, []);

  const handleClearLogs = useCallback(() => {
    clearWatchLogs();
  }, [clearWatchLogs]);

  const triggersValue = Form.useWatch('triggers', form) || [];
  const hasTimer = triggersValue.includes('timer');
  const watchPathValue = Form.useWatch('watchPath', form) || '';
  const outputDirValue = Form.useWatch('outputDir', form) || '';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Eye size={16} color="#00E5CC" />
          <Text strong>文件夹自动监控</Text>
        </Space>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          监控文件夹中的新图片，自动添加水印并输出到指定目录
        </Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary">全局暂停</Text>
          <Switch
            size="small"
            checked={watchGlobalPaused}
            onChange={handleGlobalPause}
            checkedChildren={<Pause size={10} />}
            unCheckedChildren={<Play size={10} />}
          />
        </div>
        <Button
          type="primary"
          size="small"
          icon={<FolderPlus size={14} />}
          onClick={handleAdd}
        >
          添加监控
        </Button>
      </div>

      {watchFolders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            backgroundColor: '#2A2A3E',
            borderRadius: 6,
          }}
        >
          <Folder size={32} color="#444" style={{ marginBottom: 8 }} />
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>暂无监控文件夹</div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>
            点击上方"添加监控"开始设置
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {watchFolders.map((folder) => (
            <WatchFolderItem
              key={folder.id}
              config={folder}
              onToggle={() => handleToggle(folder.id)}
              onRemove={() => handleRemove(folder.id)}
              onScan={() => handleScan(folder.id)}
            />
          ))}
        </div>
      )}

      <WatchLogList logs={watchLogs} onClear={handleClearLogs} />

      <Modal
        title="添加监控文件夹"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="添加"
        cancelText="取消"
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            triggers: ['create'],
            scanInterval: 10,
            extensions: 'jpg, jpeg, png, webp',
            minFileSize: 0,
            renameStrategy: 'suffix',
            format: 'jpeg',
            quality: 90,
            prefix: '',
            suffix: '_watermarked',
          }}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：产品图片监控" />
          </Form.Item>

          <Form.Item name="watchPath" label="监控文件夹" rules={[{ required: true, message: '请选择监控文件夹' }]}>
            <Space style={{ width: '100%' }}>
              <div
                style={{
                  flex: 1,
                  padding: '4px 11px',
                  backgroundColor: '#2A2A3E',
                  borderRadius: 6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  minWidth: 280,
                }}
              >
                {watchPathValue || '未选择'}
              </div>
              <Button icon={<Folder size={14} />} onClick={handleSelectWatchPath}>
                选择
              </Button>
            </Space>
          </Form.Item>

          <Form.Item name="outputDir" label="输出目录" rules={[{ required: true, message: '请选择输出目录' }]}>
            <Space style={{ width: '100%' }}>
              <div
                style={{
                  flex: 1,
                  padding: '4px 11px',
                  backgroundColor: '#2A2A3E',
                  borderRadius: 6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  minWidth: 280,
                }}
              >
                {outputDirValue || '未选择'}
              </div>
              <Button icon={<Folder size={14} />} onClick={handleSelectOutputDir}>
                选择
              </Button>
            </Space>
          </Form.Item>

          <Form.Item name="triggers" label="触发条件">
            <Checkbox.Group>
              <Space>
                <Checkbox value="create">文件创建</Checkbox>
                <Checkbox value="change">文件修改</Checkbox>
                <Checkbox value="timer">定时扫描</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          {hasTimer && (
            <Form.Item name="scanInterval" label="扫描间隔（秒）">
              <InputNumber min={1} max={3600} style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item name="extensions" label="文件扩展名" extra="逗号分隔，如：jpg, png, webp">
            <Input placeholder="jpg, jpeg, png, webp" />
          </Form.Item>

          <Form.Item name="minFileSize" label="最小文件大小（KB）" extra="小于此大小的文件将被跳过">
            <InputNumber min={0} max={102400} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="renameStrategy" label="重名策略">
            <Select>
              <Select.Option value="skip">跳过（不覆盖）</Select.Option>
              <Select.Option value="overwrite">覆盖</Select.Option>
              <Select.Option value="suffix">自动添加序号后缀</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ borderTop: '1px solid #2A2A3E', paddingTop: 16, marginTop: 8 }}>
            <Space align="center" style={{ marginBottom: 12 }}>
              <Settings2 size={14} color="#00E5CC" />
              <Text strong>导出设置</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                （使用当前水印配置）
              </Text>
            </Space>

            <Form.Item name="format" label="导出格式">
              <Select>
                <Select.Option value="jpeg">JPG</Select.Option>
                <Select.Option value="png">PNG</Select.Option>
                <Select.Option value="webp">WebP</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="quality" label="导出质量">
              <Slider min={10} max={100} />
            </Form.Item>

            <Space style={{ width: '100%' }} size={12}>
              <Form.Item name="prefix" label="文件名前缀" style={{ flex: 1 }}>
                <Input placeholder="如: wm_" />
              </Form.Item>
              <Form.Item name="suffix" label="文件名后缀" style={{ flex: 1 }}>
                <Input placeholder="如: _watermarked" />
              </Form.Item>
            </Space>
          </div>
        </Form>
      </Modal>
    </Space>
  );
}
