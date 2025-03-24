const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const dbService = require('./database');
const vectorDbService = require('./vectordb');
const aiService = require('./ai-service');
const Store = require('electron-store');

// 初始化配置存储
const store = new Store();

// 保持对window对象的全局引用，避免JavaScript对象被垃圾回收时，窗口被自动关闭
let mainWindow;
let inputWindow;
let tray;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  // 加载应用
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // 打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createInputWindow() {
  inputWindow = new BrowserWindow({
    width: 600,
    height: 300,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  const startUrl = isDev 
    ? 'http://localhost:3000/#/input' 
    : `file://${path.join(__dirname, '../../build/index.html')}#/input`;
  
  inputWindow.loadURL(startUrl);

  inputWindow.on('blur', () => {
    inputWindow.hide();
  });

  inputWindow.on('closed', () => {
    inputWindow = null;
  });
}

function setupTray() {
  tray = new Tray(path.join(__dirname, '../../public/icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主界面', click: () => { if (mainWindow) mainWindow.show(); else createMainWindow(); } },
    { label: '快速记录', click: () => { if (inputWindow) inputWindow.show(); else createInputWindow(); } },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setToolTip('ideaSystemX');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createMainWindow();
    }
  });
}

// 注册全局快捷键
function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Alt+I', () => {
    if (inputWindow) {
      inputWindow.show();
    } else {
      createInputWindow();
    }
  });
}

// 当Electron完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createMainWindow();
  setupTray();
  registerGlobalShortcuts();
  
  app.on('activate', () => {
    // 在macOS上，当点击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC通信处理
ipcMain.on('save-idea', async (event, idea) => {
  try {
    const savedIdea = await dbService.saveIdea(idea);
    
    // 如果AI配置有效，尝试生成嵌入和分析
    if (aiService.checkConfiguration()) {
      try {
        // 生成嵌入向量
        const embedding = await aiService.generateEmbedding(idea.content);
        vectorDbService.addVector(savedIdea.id, embedding, { content: idea.content });
        
        // 分析想法内容
        const analysis = await aiService.analyzeIdea(idea.content);
        await dbService.updateIdea(savedIdea.id, {
          ...savedIdea,
          tags: analysis.tags,
          summary: analysis.summary
        });
      } catch (aiError) {
        console.error('AI处理失败，但想法已保存:', aiError);
      }
    }
    
    event.reply('idea-saved', savedIdea);
  } catch (error) {
    console.error('保存想法失败:', error);
    event.reply('idea-save-error', error.message);
  }
});

ipcMain.handle('get-all-ideas', async () => {
  try {
    return await dbService.getAllIdeas();
  } catch (error) {
    console.error('获取想法失败:', error);
    throw error;
  }
});

ipcMain.handle('get-idea-by-id', async (event, id) => {
  try {
    return await dbService.getIdeaById(id);
  } catch (error) {
    console.error('获取想法失败:', error);
    throw error;
  }
});

ipcMain.handle('update-idea', async (event, id, updates) => {
  try {
    return await dbService.updateIdea(id, updates);
  } catch (error) {
    console.error('更新想法失败:', error);
    throw error;
  }
});

ipcMain.handle('delete-idea', async (event, id) => {
  try {
    await dbService.deleteIdea(id);
    vectorDbService.deleteVector(id);
    return { success: true, id };
  } catch (error) {
    console.error('删除想法失败:', error);
    throw error;
  }
});

ipcMain.handle('search-ideas', async (event, query) => {
  try {
    return await dbService.searchIdeasByContent(query);
  } catch (error) {
    console.error('搜索想法失败:', error);
    throw error;
  }
});

ipcMain.on('hide-input-window', () => {
  if (inputWindow) {
    inputWindow.hide();
  }
});

// AI相关功能
ipcMain.handle('analyze-idea', async (event, content) => {
  try {
    return await aiService.analyzeIdea(content);
  } catch (error) {
    console.error('分析想法失败:', error);
    throw error;
  }
});

ipcMain.handle('find-related-ideas', async (event, content) => {
  try {
    if (!aiService.checkConfiguration()) {
      return [];
    }
    
    const embedding = await aiService.generateEmbedding(content);
    const similarVectors = vectorDbService.searchSimilarVectors(embedding, 5);
    
    // 获取相关想法的完整数据
    const relatedIdeas = [];
    for (const item of similarVectors) {
      const idea = await dbService.getIdeaById(item.id);
      if (idea) {
        relatedIdeas.push({
          ...idea,
          relevance: item.similarity
        });
      }
    }
    
    return relatedIdeas;
  } catch (error) {
    console.error('查找相关想法失败:', error);
    return [];
  }
});

ipcMain.handle('generate-reminder', async (event, idea) => {
  try {
    return await aiService.generateReminder(idea);
  } catch (error) {
    console.error('生成提醒失败:', error);
    throw error;
  }
});

ipcMain.handle('answer-query', async (event, query) => {
  try {
    // 获取所有想法作为上下文
    const allIdeas = await dbService.getAllIdeas();
    return await aiService.answerQuery(query, allIdeas);
  } catch (error) {
    console.error('回答查询失败:', error);
    throw error;
  }
});

// 设置相关功能
ipcMain.handle('get-settings', async () => {
  return store.get('settings') || {};
});

ipcMain.handle('update-settings', async (event, settings) => {
  store.set('settings', settings);
  
  // 更新AI服务配置
  if (settings.ai) {
    aiService.setConfiguration(settings.ai);
  }
  
  return { success: true };
});
