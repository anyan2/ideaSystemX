@echo off
setlocal enabledelayedexpansion

echo ===================================
echo ideaSystemX 环境安装脚本
echo ===================================
echo.

:: 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 请以管理员身份运行此脚本！
    echo 右键点击脚本，选择"以管理员身份运行"。
    pause
    exit /b 1
)

:: 设置工作目录
set "WORK_DIR=%~dp0"
cd /d "%WORK_DIR%"
echo 工作目录: %WORK_DIR%
echo.

:: 检查Node.js是否已安装
echo 检查Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js未安装，正在下载...
    
    :: 下载Node.js安装程序
    echo 下载Node.js安装程序...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile 'node-installer.msi'}"
    
    if not exist "node-installer.msi" (
        echo 下载Node.js失败！
        echo 请手动安装Node.js (v20.x LTS)，然后重新运行此脚本。
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    )
    
    :: 安装Node.js
    echo 安装Node.js...
    start /wait msiexec /i node-installer.msi /quiet /norestart
    
    :: 检查安装是否成功
    where node >nul 2>&1
    if %errorLevel% neq 0 (
        echo Node.js安装失败！
        echo 请手动安装Node.js (v20.x LTS)，然后重新运行此脚本。
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    )
    
    echo Node.js安装成功！
    del node-installer.msi
) else (
    for /f "tokens=1,2,3 delims=." %%a in ('node -v') do (
        set "NODE_MAJOR=%%a"
    )
    set "NODE_MAJOR=!NODE_MAJOR:~1!"
    
    if !NODE_MAJOR! lss 16 (
        echo 检测到Node.js版本过低 (!NODE_MAJOR!)
        echo ideaSystemX需要Node.js v16.0.0或更高版本
        echo 请更新Node.js，然后重新运行此脚本
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    ) else (
        echo 检测到Node.js !NODE_MAJOR!.x，版本兼容
    )
)

:: 安装项目依赖
echo.
echo 安装项目依赖...
call npm install --production=false

if %errorLevel% neq 0 (
    echo 安装依赖失败！
    echo 请检查网络连接，然后重新运行此脚本。
    pause
    exit /b 1
)

:: 安装全局依赖
echo.
echo 安装全局依赖...
call npm install -g electron-builder

if %errorLevel% neq 0 (
    echo 安装全局依赖失败！
    echo 请检查网络连接或以管理员身份运行，然后重新运行此脚本。
    pause
    exit /b 1
)

:: 创建数据目录
echo.
echo 创建数据目录...
if not exist "data" mkdir data

:: 完成
echo.
echo ===================================
echo 环境安装完成！
echo ===================================
echo.
echo 您现在可以通过以下命令运行ideaSystemX:
echo.
echo 开发模式: npm run dev
echo 构建应用: npm run build:win
echo.
echo 感谢您使用ideaSystemX！
echo.
pause
exit /b 0
