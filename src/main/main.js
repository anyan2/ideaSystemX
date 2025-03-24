const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

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
      contextIsolation: false,
      enableRemoteModule: true,
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
      contextIsolation: false,
      enableRemoteModule: true,
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
ipcMain.on('save-idea', (event, idea) => {
  // 这里将连接到数据库服务
  console.log('保存想法:', idea);
  // 后续会实现数据库存储逻辑
});

ipcMain.on('hide-input-window', () => {
  if (inputWindow) {
    inputWindow.hide();
  }
});
