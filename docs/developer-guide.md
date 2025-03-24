# ideaSystemX 开发文档

## 项目概述

ideaSystemX 是一个基于 Electron、React 和 Node.js 的智能知识库系统，用于记录、管理和分析想法。系统集成了 SQLite 数据库、向量数据库和 AI 功能，提供了全局快捷键调用、数据存储、智能分析等功能。

## 技术栈

- **前端**：React、Material-UI
- **后端**：Node.js、Electron
- **数据库**：SQLite、自定义向量数据库
- **构建工具**：electron-builder

## 项目结构

```
ideaSystemX/
├── build/                  # React 构建输出目录
├── dist/                   # Electron 打包输出目录
├── docs/                   # 文档目录
├── public/                 # 静态资源
├── src/
│   ├── common/             # 共享代码
│   │   └── config.js       # 配置文件
│   ├── main/               # Electron 主进程
│   │   ├── main.js         # 主进程入口
│   │   ├── preload.js      # 预加载脚本
│   │   ├── database.js     # SQLite 数据库服务
│   │   ├── vectordb.js     # 向量数据库服务
│   │   └── ai-service.js   # AI 服务
│   └── renderer/           # React 渲染进程
│       ├── components/     # React 组件
│       ├── App.js          # 主应用组件
│       └── index.js        # 渲染进程入口
├── build-app.bat           # Windows 构建脚本
├── setup-env.bat           # 环境安装脚本
└── package.json            # 项目配置
```

## 核心模块

### 1. 主进程 (main.js)

主进程是 Electron 应用的入口点，负责创建窗口、设置全局快捷键、管理系统托盘和处理 IPC 通信。

主要功能：
- 创建主窗口和输入窗口
- 注册全局快捷键 (Ctrl+Alt+I)
- 设置系统托盘
- 处理 IPC 通信

### 2. 数据库服务 (database.js)

使用 SQLite 数据库存储用户的想法、标签和提醒。

主要功能：
- 创建和初始化数据库
- 保存、获取、更新和删除想法
- 搜索想法（按内容或标签）

### 3. 向量数据库服务 (vectordb.js)

实现简单的向量数据库，用于存储想法的向量表示，支持相似性搜索。

主要功能：
- 添加和删除向量
- 计算余弦相似度
- 搜索相似向量

### 4. AI 服务 (ai-service.js)

提供 AI 功能的接口，包括生成嵌入、分析想法、查找相关想法等。

主要功能：
- 生成文本嵌入（向量）
- 分析想法内容，提取标签和摘要
- 查找相关想法
- 生成智能提醒
- 回答用户查询

### 5. 前端组件

#### 主应用 (App.js)
- 实现主界面布局
- 管理导航和视图切换
- 处理深色/浅色主题切换

#### 输入窗口 (InputWindow.js)
- 提供快速记录想法的界面
- 支持添加标签
- 保存想法到数据库

#### 想法列表 (IdeaList.js)
- 显示所有想法
- 支持排序和搜索
- 点击想法查看详情

#### 想法详情 (IdeaDetail.js)
- 显示想法详情
- 支持编辑和删除
- 显示相关想法

#### AI 控制台 (AIConsole.js)
- 提供与 AI 交互的界面
- 向知识库提问
- 显示 AI 回答

#### AI 功能 (AIFeatures.js)
- 显示智能提醒
- 显示智能归纳
- 生成新的提醒和归纳

#### 设置面板 (SettingsPanel.js)
- 配置 AI API
- 设置应用程序选项

## 数据流

1. 用户通过全局快捷键或系统托盘打开输入窗口
2. 用户输入想法并保存
3. 想法保存到 SQLite 数据库
4. 如果 AI API 已配置：
   - 生成想法的向量表示并存储到向量数据库
   - 分析想法内容，提取标签和摘要
   - 更新数据库中的想法信息
5. 用户可以在主界面查看、搜索和管理想法
6. 用户可以使用 AI 功能分析想法、查找相关想法、生成提醒等

## 构建与部署

### 环境安装

使用 `setup-env.bat` 脚本安装必要的环境和依赖：
- 检查 Node.js 是否已安装，如果没有则下载并安装
- 安装项目依赖
- 安装全局依赖 (electron-builder)
- 创建数据目录

### 应用构建

使用 `build-app.bat` 脚本构建应用程序：
- 清理旧的构建文件
- 构建 React 应用
- 使用 electron-builder 打包 Windows 应用程序

## 扩展与定制

### 添加新的 AI 提供商

1. 在 `src/common/config.js` 中添加新的提供商配置
2. 在 `src/main/ai-service.js` 中实现相应的 API 调用
3. 在 `src/renderer/components/SettingsPanel.js` 中添加新的提供商选项

### 添加新功能

1. 在主进程中实现后端功能
2. 在预加载脚本中暴露 API
3. 创建新的 React 组件
4. 更新主应用组件以集成新功能

## 故障排除

### 常见问题

1. **全局快捷键不工作**
   - 检查是否有其他应用程序占用了相同的快捷键
   - 重启应用程序

2. **数据库错误**
   - 检查数据目录权限
   - 确保 SQLite 数据库文件未损坏

3. **AI 功能不工作**
   - 检查 API 密钥是否正确
   - 检查网络连接
   - 查看控制台日志以获取详细错误信息

### 日志

应用程序日志位于以下位置：
- Windows: `%APPDATA%\ideaSystemX\logs`

## 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT 许可证
