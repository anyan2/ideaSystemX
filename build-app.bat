@echo off
setlocal enabledelayedexpansion

echo ===================================
echo ideaSystemX 构建脚本
echo ===================================
echo.

:: 设置工作目录
set "WORK_DIR=%~dp0"
cd /d "%WORK_DIR%"
echo 工作目录: %WORK_DIR%
echo.

:: 检查Node.js是否已安装
echo 检查Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js未安装！
    echo 请先运行setup-env.bat安装必要的环境。
    pause
    exit /b 1
)

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo 未检测到项目依赖！
    echo 请先运行setup-env.bat安装必要的环境。
    pause
    exit /b 1
)

:: 清理旧的构建文件
echo 清理旧的构建文件...
if exist "build" rd /s /q "build"
if exist "dist" rd /s /q "dist"

:: 构建React应用
echo.
echo 构建React应用...
call npm run build

if %errorLevel% neq 0 (
    echo React应用构建失败！
    pause
    exit /b 1
)

:: 构建Electron应用
echo.
echo 构建Electron应用...
call npm run build:win

if %errorLevel% neq 0 (
    echo Electron应用构建失败！
    pause
    exit /b 1
)

:: 完成
echo.
echo ===================================
echo 构建完成！
echo ===================================
echo.
echo 您可以在dist目录中找到构建好的应用程序。
echo.
pause
exit /b 0
