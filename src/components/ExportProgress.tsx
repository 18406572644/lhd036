import { Modal, Progress, Button, Space } from 'antd';
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/useAppStore';

export default function ExportProgress() {
  const isExporting = useAppStore((state) => state.isExporting);
  const exportProgress = useAppStore((state) => state.exportProgress);
  const exportProgressDetail = useAppStore((state) => state.exportProgressDetail);
  const resetExportProgress = useAppStore((state) => state.resetExportProgress);

  const isCompleted = exportProgress >= 100;
  const isSuccess = exportProgressDetail.failed === 0;

  const handleClose = () => {
    resetExportProgress();
  };

  return (
    <Modal
      title={isCompleted ? '导出完成' : '正在导出...'}
      open={isExporting || isCompleted}
      closable={false}
      maskClosable={false}
      footer={
        isCompleted ? (
          <Button type="primary" onClick={handleClose} icon={<CloseOutlined />}>
            关闭
          </Button>
        ) : null
      }
      width={480}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <Progress
          percent={Math.round(exportProgress)}
          status={isCompleted ? (isSuccess ? 'success' : 'exception') : 'active'}
          strokeColor="#00E5CC"
          size="default"
        />

        {!isCompleted && exportProgressDetail.currentFile && (
          <div style={{ marginTop: 16, color: 'rgba(255, 255, 255, 0.85)' }}>
            <div
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                position: 'relative',
                animation: 'streamer 2s linear infinite',
                background: 'linear-gradient(90deg, #00E5CC 0%, #00E5CC 50%, rgba(0, 229, 204, 0.3) 75%, #00E5CC 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {exportProgressDetail.currentFile}
            </div>
          </div>
        )}

        {isCompleted && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            {isSuccess ? (
              <Space>
                <CheckCircleOutlined style={{ color: '#00E5CC', fontSize: 20 }} />
                <span style={{ color: '#00E5CC', fontSize: 16 }}>全部导出成功！</span>
              </Space>
            ) : (
              <Space>
                <CloseOutlined style={{ color: '#FF4D4F', fontSize: 20 }} />
                <span style={{ color: '#FF4D4F', fontSize: 16 }}>部分文件导出失败</span>
              </Space>
            )}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.65)' }}>
          <span>已完成/总数：{exportProgressDetail.completed}/{exportProgressDetail.total}</span>
          <span>
            成功：<span style={{ color: '#00E5CC' }}>{exportProgressDetail.success}</span>
            {' / '}
            失败：<span style={{ color: '#FF4D4F' }}>{exportProgressDetail.failed}</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes streamer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
      `}</style>
    </Modal>
  );
}
