@echo off

REM 检查 Python 是否安装
python3 --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Python3
    exit /b 1
)

REM 检查 pip 是否安装
pip3 --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 pip3
    exit /b 1
)

REM 检查虚拟环境目录
if not exist "venv" (
    echo 创建 Python 虚拟环境...
    python3 -m venv venv
)

REM 激活虚拟环境
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo 错误: 无法找到虚拟环境激活脚本
    exit /b 1
)

REM 安装依赖
echo 安装 Python 依赖...
pip install -r requirements.txt

echo Python 环境设置完成！ 