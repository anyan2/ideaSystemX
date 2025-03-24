const { app, BrowserWindow, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');
const database = require('./database');
const vectordb = require('./vectordb');
const aiService = require('./ai-service');
const config = require('../common/config');

// 保持对窗口对象的全局引用，避免JavaScript对象被垃圾回收时窗口关闭
let mainWindow = null;
let inputWindow = null;

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    show: false
  });

  // 加载应用
  const startUrl = process.env.ELECTRON_START_URL || 
    `file://${path.join(__dirname, '../../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // 打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
    
    // 如果输入窗口存在，也关闭它
    if (inputWindow) {
      inputWindow.close();
      inputWindow = null;
    }
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 创建输入窗口
function createInputWindow() {
  // 如果输入窗口已存在，则聚焦并返回
  if (inputWindow) {
    inputWindow.focus();
    return;
  }

  inputWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 400,
    minHeight: 300,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    show: false,
    frame: false,
    resizable: true,
    alwaysOnTop: true
  });

  // 加载应用
  const startUrl = process.env.ELECTRON_START_URL || 
    `file://${path.join(__dirname, '../../build/index.html')}?page=input`;
  
  inputWindow.loadURL(startUrl);

  // 打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    inputWindow.webContents.openDevTools();
  }

  // 当窗口关闭时触发
  inputWindow.on('closed', () => {
    inputWindow = null;
    
    // 注销输入窗口的快捷键
    globalShortcut.unregister('Escape');
  });

  // 窗口准备好后显示
  inputWindow.once('ready-to-show', () => {
    inputWindow.show();
    
    // 为输入窗口注册Escape快捷键关闭
    globalShortcut.register('Escape', () => {
      if (inputWindow) {
        inputWindow.close();
      }
    });
  });
}

// 初始化应用
async function initApp() {
  try {
    // 初始化数据库
    await database.init();
    console.log('数据库初始化成功');
    
    // 初始化向量数据库
    await vectordb.init();
    console.log('向量数据库初始化成功');
    
    // 初始化AI服务
    await aiService.init();
    console.log('AI服务初始化成功');
    
    // 注册全局快捷键
    registerGlobalShortcuts();
    
    // 设置IPC通信
    setupIPC();
    
    // 检查并处理提醒
    checkReminders();
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  // 注册Ctrl+Alt+I快捷键打开输入窗口
  const ret = globalShortcut.register('CommandOrControl+Alt+I', () => {
    createInputWindow();
  });

  if (!ret) {
    console.error('快捷键注册失败');
  }

  console.log('快捷键注册状态:', globalShortcut.isRegistered('CommandOrControl+Alt+I'));
}

// 设置IPC通信
function setupIPC() {
  // 保存想法
  ipcMain.handle('save-idea', async (event, idea) => {
    try {
      // 保存想法到数据库
      const savedIdea = await database.saveIdea(idea);
      
      // 如果AI服务已配置，进行AI处理
      if (await aiService.isConfigured()) {
        // 分析想法并提取标签
        const analysis = await aiService.analyzeIdea(idea.content);
        
        // 更新想法的标签和摘要
        const updatedIdea = await database.updateIdea(savedIdea.id, {
          tags: analysis.tags,
          summary: analysis.summary
        });
        
        // 查找相关想法
        const relatedIdeas = await aiService.findRelatedIdeas(idea.content, savedIdea.id);
        
        // 设置提醒（如果需要）
        const reminder = await aiService.setReminder(savedIdea.id, idea.content);
        
        return {
          idea: updatedIdea,
          relatedIdeas,
          reminder
        };
      }
      
      return { idea: savedIdea };
    } catch (error) {
      console.error('保存想法失败:', error);
      throw error;
    }
  });

  // 获取所有想法
  ipcMain.handle('get-all-ideas', async () => {
    try {
      return await database.getAllIdeas();
    } catch (error) {
      console.error('获取所有想法失败:', error);
      throw error;
    }
  });

  // 获取想法详情
  ipcMain.handle('get-idea', async (event, id) => {
    try {
      return await database.getIdeaById(id);
    } catch (error) {
      console.error('获取想法详情失败:', error);
      throw error;
    }
  });

  // 更新想法
  ipcMain.handle('update-idea', async (event, id, updates) => {
    try {
      return await database.updateIdea(id, updates);
    } catch (error) {
      console.error('更新想法失败:', error);
      throw error;
    }
  });

  // 删除想法
  ipcMain.handle('delete-idea', async (event, id) => {
    try {
      return await database.deleteIdea(id);
    } catch (error) {
      console.error('删除想法失败:', error);
      throw error;
    }
  });

  // 搜索想法
  ipcMain.handle('search-ideas', async (event, query) => {
    try {
      return await database.searchIdeas(query);
    } catch (error) {
      console.error('搜索想法失败:', error);
      throw error;
    }
  });

  // 按标签筛选想法
  ipcMain.handle('filter-ideas-by-tags', async (event, tags) => {
    try {
      return await database.getIdeasByTags(tags);
    } catch (error) {
      console.error('按标签筛选想法失败:', error);
      throw error;
    }
  });

  // 获取所有标签
  ipcMain.handle('get-all-tags', async () => {
    try {
      return await database.getAllTags();
    } catch (error) {
      console.error('获取所有标签失败:', error);
      throw error;
    }
  });

  // 获取设置
  ipcMain.handle('get-settings', async () => {
    try {
      return await database.getSettings();
    } catch (error) {
      console.error('获取设置失败:', error);
      throw error;
    }
  });

  // 保存设置
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      return await database.saveSettings(settings);
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  });

  // 获取AI提供商列表
  ipcMain.handle('get-ai-providers', () => {
    return config.aiProviders;
  });

  // 检查AI配置
  ipcMain.handle('check-ai-config', async () => {
    try {
      return await aiService.isConfigured();
    } catch (error) {
      console.error('检查AI配置失败:', error);
      return false;
    }
  });

  // 生成想法总结
  ipcMain.handle('generate-summary', async (event, ideas, topic) => {
    try {
      return await aiService.generateSummary(ideas, topic);
    } catch (error) {
      console.error('生成总结失败:', error);
      throw error;
    }
  });

  // 回答用户查询
  ipcMain.handle('answer-query', async (event, query) => {
    try {
      return await aiService.answerQuery(query);
    } catch (error) {
      console.error('回答查询失败:', error);
      throw error;
    }
  });

  // 获取所有提醒
  ipcMain.handle('get-all-reminders', async () => {
    try {
      return await database.getAllReminders();
    } catch (error) {
      console.error('获取所有提醒失败:', error);
      throw error;
    }
  });

  // 标记提醒为已完成
  ipcMain.handle('complete-reminder', async (event, id) => {
    try {
      return await database.completeReminder(id);
    } catch (error) {
      console.error('标记提醒为已完成失败:', error);
      throw error;
    }
  });

  // 关闭输入窗口
  ipcMain.on('close-input-window', () => {
    if (inputWindow) {
      inputWindow.close();
    }
  });

  // 最小化输入窗口
  ipcMain.on('minimize-input-window', () => {
    if (inputWindow) {
      inputWindow.minimize();
    }
  });

  // 打开主窗口
  ipcMain.on('open-main-window', () => {
    if (!mainWindow) {
      createMainWindow();
    } else {
      mainWindow.focus();
    }
  });
}

// 检查提醒
async function checkReminders() {
  try {
    const pendingReminders = await database.getPendingReminders();
    
    if (pendingReminders.length > 0 && mainWindow) {
      mainWindow.webContents.send('pending-reminders', pendingReminders);
    }
    
    // 每小时检查一次提醒
    setTimeout(checkReminders, 3600000);
  } catch (error) {
    console.error('检查提醒失败:', error);
  }
}

// 应用准备就绪时
app.whenReady().then(() => {
  createMainWindow();
  initApp();

  // 在macOS上，当点击dock图标且没有其他窗口打开时，重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，应用和菜单栏通常会保持活动状态，直到用户使用Cmd+Q明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前
app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
  
  // 关闭数据库连接
  database.close();
});
