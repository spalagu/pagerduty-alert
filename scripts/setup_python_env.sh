#!/bin/bash

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3"
    exit 1
fi

# 检查 pip 是否安装
if ! command -v pip3 &> /dev/null; then
    echo "错误: 未找到 pip3"
    exit 1
fi

# 检查虚拟环境目录
if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "错误: 无法找到虚拟环境激活脚本"
    exit 1
fi

# 安装依赖
echo "安装 Python 依赖..."
pip install -r requirements.txt

echo "Python 环境设置完成！" 