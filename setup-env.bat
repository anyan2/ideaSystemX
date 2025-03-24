@echo off
echo ===== ideaSystemX 环境设置脚本 =====
echo 正在设置开发环境...

REM 检查Node.js是否已安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到Node.js! 请先安装Node.js (v16+)
    echo 您可以从 https://nodejs.org/zh-cn/download/ 下载
    exit /b 1
)

REM 检查npm是否已安装
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到npm! 请确保Node.js安装正确
    exit /b 1
)

echo Node.js版本:
node --version
echo npm版本:
npm --version

REM 安装项目依赖
echo 正在安装项目依赖...
call npm install

REM 安装全局依赖
echo 正在安装全局依赖...
call npm install -g electron-builder

echo ===== 环境设置完成 =====
echo 您现在可以使用以下命令:
echo - npm start: 启动开发环境
echo - npm run build:all: 构建生产版本
echo.
echo 按任意键退出...
pause >nul
