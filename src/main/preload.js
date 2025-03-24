const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 想法管理
  saveIdea: (idea) => ipcRenderer.invoke('save-idea', idea),
  getAllIdeas: () => ipcRenderer.invoke('get-all-ideas'),
  getIdea: (id) => ipcRenderer.invoke('get-idea', id),
  updateIdea: (id, updates) => ipcRenderer.invoke('update-idea', id, updates),
  deleteIdea: (id) => ipcRenderer.invoke('delete-idea', id),
  searchIdeas: (query) => ipcRenderer.invoke('search-ideas', query),
  filterIdeasByTags: (tags) => ipcRenderer.invoke('filter-ideas-by-tags', tags),
  
  // 标签管理
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  
  // 设置管理
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // AI功能
  getAIProviders: () => ipcRenderer.invoke('get-ai-providers'),
  checkAIConfig: () => ipcRenderer.invoke('check-ai-config'),
  generateSummary: (ideas, topic) => ipcRenderer.invoke('generate-summary', ideas, topic),
  answerQuery: (query) => ipcRenderer.invoke('answer-query', query),
  
  // 提醒管理
  getAllReminders: () => ipcRenderer.invoke('get-all-reminders'),
  completeReminder: (id) => ipcRenderer.invoke('complete-reminder', id),
  
  // 窗口控制
  closeInputWindow: () => ipcRenderer.send('close-input-window'),
  minimizeInputWindow: () => ipcRenderer.send('minimize-input-window'),
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  
  // 事件监听
  onPendingReminders: (callback) => {
    ipcRenderer.on('pending-reminders', (event, reminders) => callback(reminders));
    
    // 返回清理函数
    return () => {
      ipcRenderer.removeAllListeners('pending-reminders');
    };
  }
});
