const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 想法管理
  saveIdea: (idea) => ipcRenderer.send('save-idea', idea),
  onIdeaSaved: (callback) => ipcRenderer.on('idea-saved', (_, idea) => callback(idea)),
  onIdeaSaveError: (callback) => ipcRenderer.on('idea-save-error', (_, error) => callback(error)),
  getAllIdeas: () => ipcRenderer.invoke('get-all-ideas'),
  getIdeaById: (id) => ipcRenderer.invoke('get-idea-by-id', id),
  updateIdea: (id, updates) => ipcRenderer.invoke('update-idea', id, updates),
  deleteIdea: (id) => ipcRenderer.invoke('delete-idea', id),
  searchIdeas: (query) => ipcRenderer.invoke('search-ideas', query),
  
  // 窗口控制
  hideInputWindow: () => ipcRenderer.send('hide-input-window'),
  
  // AI功能
  analyzeIdea: (content) => ipcRenderer.invoke('analyze-idea', content),
  findRelatedIdeas: (content) => ipcRenderer.invoke('find-related-ideas', content),
  generateReminder: (idea) => ipcRenderer.invoke('generate-reminder', idea),
  answerQuery: (query) => ipcRenderer.invoke('answer-query', query),
  
  // 设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
});
