import { useState, useMemo } from 'react';
import {
  Space,
  Typography,
  Button,
  Switch,
  Select,
  Input,
  InputNumber,
  Card,
  Tooltip,
  Modal,
  Dropdown,
  message,
  Empty,
  Tag,
  Alert,
  Divider,
} from 'antd';
import {
  FileSignature,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Folder,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GripVertical,
  Wand2,
  Bookmark,
  BookmarkMinus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  createDefaultRenameRule,
  generateRenamePreview,
  resolveConflicts,
  RULE_LABELS,
  TEMPLATE_VARIABLES,
} from '@/utils/renameEngine';
import type {
  RenameRule,
  RenameRuleType,
} from '@/types';

const { Text } = Typography;
const { Option } = Select;

function RuleEditor({
  rule,
  index,
  total,
}: {
  rule: RenameRule;
  index: number;
  total: number;
}) {
  const updateRenameRule = useAppStore((state) => state.updateRenameRule);
  const removeRenameRule = useAppStore((state) => state.removeRenameRule);
  const moveRenameRule = useAppStore((state) => state.moveRenameRule);

  const handleChange = (patch: Partial<RenameRule>) => {
    updateRenameRule(rule.id, patch);
  };

  const insertVariable = (variable: string) => {
    if (rule.type === 'template') {
      handleChange({ template: rule.template + variable } as Partial<RenameRule>);
    }
  };

  const renderRuleConfig = () => {
    switch (rule.type) {
      case 'template':
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Input
              value={rule.template}
              onChange={(e) => handleChange({ template: e.target.value } as Partial<RenameRule>)}
              placeholder="如: {原文件名}_{序号:0001}"
              size="small"
            />
            <Space size={[4, 4]} wrap>
              {TEMPLATE_VARIABLES.map((v) => (
                <Tag
                  key={v.label}
                  color="cyan"
                  style={{ cursor: 'pointer', margin: 0 }}
                  onClick={() => insertVariable(v.label)}
                >
                  <Tooltip title={v.desc}>{v.label}</Tooltip>
                </Tag>
              ))}
            </Space>
          </Space>
        );

      case 'replace':
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space style={{ width: '100%' }}>
              <Input
                value={rule.find}
                onChange={(e) => handleChange({ find: e.target.value } as Partial<RenameRule>)}
                placeholder="查找内容"
                size="small"
                style={{ flex: 1 }}
              />
              <Text type="secondary">→</Text>
              <Input
                value={rule.replace}
                onChange={(e) => handleChange({ replace: e.target.value } as Partial<RenameRule>)}
                placeholder="替换为"
                size="small"
                style={{ flex: 1 }}
              />
            </Space>
            <Space>
              <Switch
                size="small"
                checked={rule.useRegex}
                onChange={(v) => handleChange({ useRegex: v } as Partial<RenameRule>)}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                正则表达式
              </Text>
            </Space>
          </Space>
        );

      case 'case':
        return (
          <Select
            size="small"
            value={rule.caseType}
            onChange={(v) => handleChange({ caseType: v } as Partial<RenameRule>)}
            style={{ width: '100%' }}
          >
            <Option value="upper">全部大写 (UPPER)</Option>
            <Option value="lower">全部小写 (lower)</Option>
            <Option value="capitalize">首字母大写 (Capitalize)</Option>
            <Option value="title">每个单词首字母大写 (Title Case)</Option>
          </Select>
        );

      case 'trim':
        return (
          <Select
            size="small"
            value={rule.trimType}
            onChange={(v) => handleChange({ trimType: v } as Partial<RenameRule>)}
            style={{ width: '100%' }}
          >
            <Option value="spaces">去除空格</Option>
            <Option value="special">去除特殊字符</Option>
            <Option value="both">去除空格和特殊字符</Option>
          </Select>
        );

      case 'substring':
        return (
          <Space style={{ width: '100%' }}>
            <InputNumber
              size="small"
              min={0}
              value={rule.start}
              onChange={(v) => handleChange({ start: v ?? 0 } as Partial<RenameRule>)}
              placeholder="起始位置"
              style={{ flex: 1 }}
            />
            <Text type="secondary">长度</Text>
            <InputNumber
              size="small"
              min={0}
              value={rule.length}
              onChange={(v) => handleChange({ length: v ?? 0 } as Partial<RenameRule>)}
              placeholder="0=到末尾"
              style={{ flex: 1 }}
            />
          </Space>
        );

      case 'condition':
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space style={{ width: '100%' }} wrap>
              <Select
                size="small"
                value={rule.field}
                onChange={(v) => handleChange({ field: v } as Partial<RenameRule>)}
                style={{ width: 90 }}
              >
                <Option value="width">宽度</Option>
                <Option value="height">高度</Option>
                <Option value="ratio">宽高比</Option>
              </Select>
              <Select
                size="small"
                value={rule.operator}
                onChange={(v) => handleChange({ operator: v } as Partial<RenameRule>)}
                style={{ width: 70 }}
              >
                <Option value=">">{'>'}</Option>
                <Option value="<">{'<'}</Option>
                <Option value=">=">{'>='}</Option>
                <Option value="<=">{'<='}</Option>
                <Option value="==">{'=='}</Option>
                <Option value="!=">{'!='}</Option>
              </Select>
              <InputNumber
                size="small"
                value={rule.value}
                onChange={(v) => handleChange({ value: v ?? 0 } as Partial<RenameRule>)}
                placeholder="值"
                style={{ width: 80 }}
              />
            </Space>
            <Space style={{ width: '100%' }}>
              <Input
                size="small"
                value={rule.trueText}
                onChange={(e) => handleChange({ trueText: e.target.value } as Partial<RenameRule>)}
                placeholder="满足时添加"
                style={{ flex: 1 }}
                prefix={<CheckCircle2 size={12} color="#52c41a" />}
              />
              <Input
                size="small"
                value={rule.falseText}
                onChange={(e) => handleChange({ falseText: e.target.value } as Partial<RenameRule>)}
                placeholder="不满足时添加"
                style={{ flex: 1 }}
                prefix={<XCircle size={12} color="#ff4d4f" />}
              />
              <Select
                size="small"
                value={rule.position}
                onChange={(v) => handleChange({ position: v } as Partial<RenameRule>)}
                style={{ width: 80 }}
              >
                <Option value="prefix">前缀</Option>
                <Option value="suffix">后缀</Option>
              </Select>
            </Space>
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      size="small"
      style={{
        backgroundColor: rule.enabled ? '#2A2A3E' : '#1E1E30',
        borderColor: '#3A3A55',
        opacity: rule.enabled ? 1 : 0.6,
      }}
      styles={{ body: { padding: 10 } }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space style={{ width: '100%' }}>
          <GripVertical size={14} color="#666" style={{ cursor: 'grab' }} />
          <Text strong style={{ fontSize: 12 }}>
            {index + 1}. {RULE_LABELS[rule.type]}
          </Text>
          <div style={{ flex: 1 }} />
          <Switch
            size="small"
            checked={rule.enabled}
            onChange={(v) => handleChange({ enabled: v })}
          />
          <Button
            type="text"
            size="small"
            icon={<ChevronUp size={14} />}
            onClick={() => moveRenameRule(rule.id, 'up')}
            disabled={index === 0}
            style={{ color: '#999', padding: 0 }}
          />
          <Button
            type="text"
            size="small"
            icon={<ChevronDown size={14} />}
            onClick={() => moveRenameRule(rule.id, 'down')}
            disabled={index === total - 1}
            style={{ color: '#999', padding: 0 }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => removeRenameRule(rule.id)}
            style={{ padding: 0 }}
          />
        </Space>
        {renderRuleConfig()}
      </Space>
    </Card>
  );
}

function PresetManager() {
  const renamePresets = useAppStore((state) => state.renamePresets);
  const saveRenamePreset = useAppStore((state) => state.saveRenamePreset);
  const loadRenamePreset = useAppStore((state) => state.loadRenamePreset);
  const deleteRenamePreset = useAppStore((state) => state.deleteRenamePreset);
  const renameConfig = useAppStore((state) => state.renameConfig);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (!presetName.trim()) {
      message.warning('请输入预设名称');
      return;
    }
    if (renameConfig.rules.length === 0) {
      message.warning('当前没有可保存的规则');
      return;
    }
    saveRenamePreset(presetName.trim());
    message.success('预设已保存');
    setPresetName('');
    setSaveModalOpen(false);
  };

  if (renamePresets.length === 0) {
    return (
      <Space size="small">
        <Button
          size="small"
          icon={<Save size={14} />}
          onClick={() => setSaveModalOpen(true)}
        >
          保存为预设
        </Button>
        <Modal
          title="保存命名预设"
          open={saveModalOpen}
          onOk={handleSave}
          onCancel={() => setSaveModalOpen(false)}
          okText="保存"
        >
          <Input
            placeholder="输入预设名称"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
        </Modal>
      </Space>
    );
  }

  const presetItems = [
    ...renamePresets.map((p) => ({
      key: p.id,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Bookmark size={12} color="#00E5CC" />
            <span>{p.name}</span>
          </Space>
          <Button
            type="text"
            size="small"
            danger
            icon={<BookmarkMinus size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              deleteRenamePreset(p.id);
              message.success('预设已删除');
            }}
            style={{ padding: 0 }}
          />
        </Space>
      ),
      onClick: () => {
        loadRenamePreset(p.id);
        message.success(`已应用预设: ${p.name}`);
      },
    })),
    {
      type: 'divider' as const,
    },
    {
      key: 'save',
      label: (
        <Space>
          <Plus size={12} />
          <span>保存当前规则为预设</span>
        </Space>
      ),
      onClick: () => setSaveModalOpen(true),
    },
  ];

  return (
    <Space size="small">
      <Dropdown menu={{ items: presetItems }} placement="bottomRight">
        <Button size="small" icon={<Folder size={14} />}>
          预设 ({renamePresets.length})
        </Button>
      </Dropdown>
      <Modal
        title="保存命名预设"
        open={saveModalOpen}
        onOk={handleSave}
        onCancel={() => setSaveModalOpen(false)}
        okText="保存"
      >
        <Input
          placeholder="输入预设名称"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
        />
      </Modal>
    </Space>
  );
}

export default function RenameTab() {
  const renameConfig = useAppStore((state) => state.renameConfig);
  const updateRenameConfig = useAppStore((state) => state.updateRenameConfig);
  const addRenameRule = useAppStore((state) => state.addRenameRule);
  const images = useAppStore((state) => state.images);
  const exportConfig = useAppStore((state) => state.exportConfig);

  const previewItems = useMemo(
    () => generateRenamePreview(images, renameConfig, exportConfig.format),
    [images, renameConfig, exportConfig.format]
  );

  const conflictCount = previewItems.filter((p) => p.hasConflict).length;
  const hasConflicts = conflictCount > 0;

  const handleAddRule = (type: RenameRuleType) => {
    const rule = createDefaultRenameRule(type);
    addRenameRule(rule);
  };

  const handleAutoResolve = () => {
    const resolved = resolveConflicts(previewItems);
    message.success(`已自动解决 ${conflictCount} 个命名冲突`);
    console.log('Resolved names:', resolved);
  };

  const addRuleItems = (Object.keys(RULE_LABELS) as RenameRuleType[]).map((type) => ({
    key: type,
    label: (
      <Space>
        <Wand2 size={14} />
        <span>{RULE_LABELS[type]}</span>
      </Space>
    ),
    onClick: () => handleAddRule(type),
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%', padding: '0 4px' }}>
      <Space align="center" style={{ width: '100%' }}>
        <Space align="center">
          <FileSignature size={16} color="#00E5CC" />
          <Text strong>批量重命名</Text>
        </Space>
        <div style={{ flex: 1 }} />
        <Switch
          checked={renameConfig.enabled}
          onChange={(v) => updateRenameConfig({ enabled: v })}
        />
      </Space>

      {!renameConfig.enabled && (
        <Alert
          type="info"
          showIcon
          message="重命名功能未启用"
          description="开启后可自定义复杂的命名规则，导出时将应用规则生成新文件名"
          style={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E' }}
        />
      )}

      {renameConfig.enabled && (
        <>
          <Space style={{ width: '100%' }}>
            <Dropdown menu={{ items: addRuleItems }}>
              <Button type="primary" size="small" icon={<Plus size={14} />}>
                添加规则
              </Button>
            </Dropdown>
            <PresetManager />
            <div style={{ flex: 1 }} />
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                自动解决冲突
              </Text>
              <Switch
                size="small"
                checked={renameConfig.autoResolveConflict}
                onChange={(v) => updateRenameConfig({ autoResolveConflict: v })}
              />
            </Space>
          </Space>

          {renameConfig.rules.length === 0 ? (
            <Empty
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  点击"添加规则"开始构建命名规则
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {renameConfig.rules.map((rule, idx) => (
                <RuleEditor
                  key={rule.id}
                  rule={rule}
                  index={idx}
                  total={renameConfig.rules.length}
                />
              ))}
            </Space>
          )}

          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              实时预览 ({images.length} 张)
            </Text>
          </Divider>

          {hasConflicts && (
            <Alert
              type="warning"
              showIcon
              icon={<AlertTriangle size={16} />}
              message={`检测到 ${conflictCount} 个命名冲突`}
              action={
                renameConfig.autoResolveConflict ? null : (
                  <Button size="small" type="primary" ghost onClick={handleAutoResolve}>
                    自动解决
                  </Button>
                )
              }
              style={{ backgroundColor: '#3a2a1a', border: '1px solid #5a4a2a' }}
            />
          )}

          {images.length === 0 ? (
            <Empty
              description={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  导入图片后可预览重命名结果
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '10px 0' }}
            />
          ) : (
            <div
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                backgroundColor: '#12121E',
                borderRadius: 4,
                padding: 8,
              }}
            >
              {previewItems.slice(0, 100).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderBottom: '1px solid #2A2A3E',
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {item.originalName}
                  </div>
                  <Text type="secondary" style={{ fontSize: 10 }}>
                    →
                  </Text>
                  <div
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: item.hasConflict ? '#ff4d4f' : '#00E5CC',
                      fontWeight: item.hasConflict ? 600 : 400,
                    }}
                  >
                    {item.hasConflict && <AlertTriangle size={10} style={{ marginRight: 4 }} />}
                    {item.newName}
                  </div>
                </div>
              ))}
              {images.length > 100 && (
                <div style={{ textAlign: 'center', padding: 8, color: '#666', fontSize: 12 }}>
                  仅显示前 100 条预览...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Space>
  );
}
