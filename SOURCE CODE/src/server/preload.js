const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 可以在这里添加需要暴露给渲染进程的方法
});