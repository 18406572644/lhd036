"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    selectFiles: (filters) => {
        return electron_1.ipcRenderer.invoke('select-files', filters);
    },
    selectDirectory: () => {
        return electron_1.ipcRenderer.invoke('select-directory');
    },
    getImageInfo: (path) => {
        return electron_1.ipcRenderer.invoke('get-image-info', path);
    },
    getThumbnail: (path, size = 200) => {
        return electron_1.ipcRenderer.invoke('get-thumbnail', path, size);
    },
    exportImages: (config, items, watermark, onProgress) => {
        if (onProgress) {
            const handler = (_event, progress) => {
                onProgress(progress);
            };
            electron_1.ipcRenderer.on('export-progress', handler);
        }
        return electron_1.ipcRenderer
            .invoke('export-images', config, items, watermark)
            .finally(() => {
            electron_1.ipcRenderer.removeAllListeners('export-progress');
        });
    },
    onExportProgress: (callback) => {
        const handler = (_event, progress) => {
            callback(progress);
        };
        electron_1.ipcRenderer.on('export-progress', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('export-progress', handler);
        };
    },
    watchSync: (configs) => {
        return electron_1.ipcRenderer.invoke('watch-sync', configs);
    },
    watchPause: (paused) => {
        return electron_1.ipcRenderer.invoke('watch-pause', paused);
    },
    watchStopAll: () => {
        return electron_1.ipcRenderer.invoke('watch-stop-all');
    },
    watchTriggerScan: (watchId) => {
        return electron_1.ipcRenderer.invoke('watch-trigger-scan', watchId);
    },
    onWatchLog: (callback) => {
        const handler = (_event, log) => {
            callback(log);
        };
        electron_1.ipcRenderer.on('watch-log', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('watch-log', handler);
        };
    },
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
//# sourceMappingURL=preload.js.map