import { ConfigProvider, Layout, App as AntApp } from 'antd';
import { antdThemeConfig } from '@/theme/antdTheme';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { PreviewPanel } from '@/components/PreviewPanel';
import ConfigPanel from '@/components/ConfigPanel';
import ExportProgress from '@/components/ExportProgress';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef } from 'react';
import { electronApi } from '@/utils/electronApi';

const { Content } = Layout;

export default function Home() {
  const loadTemplatesFromStorage = useAppStore((state) => state.loadTemplatesFromStorage);
  const updateExportProgressDetail = useAppStore((state) => state.updateExportProgressDetail);
  const configPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTemplatesFromStorage();
  }, [loadTemplatesFromStorage]);

  useEffect(() => {
    const removeListener = electronApi.onExportProgress((progress) => {
      updateExportProgressDetail({
        currentFile: progress.path,
        completed: progress.current,
        total: progress.total,
        success: progress.success ? 1 : 0,
        failed: progress.success ? 0 : 1,
      });
    });
    return removeListener;
  }, [updateExportProgressDetail]);

  const handleExport = () => {
    const tabs = document.querySelectorAll('.ant-tabs-tab');
    if (tabs.length >= 4) {
      (tabs[3] as HTMLElement).click();
    }
  };

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <AntApp>
        <Layout style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
          <Header onExport={handleExport} />
          <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Sidebar />
            <Content style={{ display: 'flex', overflow: 'hidden' }}>
              <PreviewPanel />
              <div ref={configPanelRef}>
                <ConfigPanel />
              </div>
            </Content>
          </Layout>
        </Layout>
        <ExportProgress />
      </AntApp>
    </ConfigProvider>
  );
}
