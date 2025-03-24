@echo off
echo ===== ideaSystemX 应用构建脚本 =====
echo 正在准备构建生产版本...

REM 检查Node.js是否已安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到Node.js! 请先运行setup-env.bat
    exit /b 1
)

REM 检查是否已安装依赖
if not exist node_modules (
    echo 错误: 未找到node_modules! 请先运行setup-env.bat
    exit /b 1
)

REM 清理旧的构建文件
echo 正在清理旧的构建文件...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM 构建React应用
echo 正在构建React应用...
call npm run build

REM 检查React构建是否成功
if not exist build (
    echo 错误: React应用构建失败!
    exit /b 1
)

REM 构建Electron应用
echo 正在构建Electron应用...
call npm run build:electron

REM 检查Electron构建是否成功
if not exist dist (
    echo 错误: Electron应用构建失败!
    exit /b 1
)

echo ===== 构建完成 =====
echo 应用已成功构建! 可执行文件位于dist目录中。
echo.
echo 按任意键退出...
pause >nul
