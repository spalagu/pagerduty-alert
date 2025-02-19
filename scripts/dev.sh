#!/bin/bash

# 检查并终止已存在的进程
kill_existing_processes() {
    echo "检查已存在的进程..."
    
    # 查找 Electron 相关进程
    ELECTRON_PIDS=$(ps aux | grep "[e]lectron" | awk '{print $2}')
    NODE_PIDS=$(ps aux | grep "[n]ode.*webpack" | awk '{print $2}')
    
    # 如果找到进程则终止它们
    if [ ! -z "$ELECTRON_PIDS" ] || [ ! -z "$NODE_PIDS" ]; then
        echo "发现未终止的进程，正在关闭..."
        
        if [ ! -z "$ELECTRON_PIDS" ]; then
            echo "终止 Electron 进程: $ELECTRON_PIDS"
            for pid in $ELECTRON_PIDS; do
                kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
            done
        fi
        
        if [ ! -z "$NODE_PIDS" ]; then
            echo "终止 webpack 进程: $NODE_PIDS"
            for pid in $NODE_PIDS; do
                kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
            done
        fi
        
        # 等待进程完全终止
        sleep 2
    else
        echo "没有发现未终止的进程"
    fi
}

# 清理临时文件
cleanup_temp_files() {
    echo "清理临时文件..."
    rm -rf dist/.webpack-watch-* 2>/dev/null
    rm -rf dist/.hot-update.* 2>/dev/null
}

# 主函数
main() {
    # 终止已存在的进程
    kill_existing_processes
    
    # 清理临时文件
    cleanup_temp_files
    
    # 启动开发环境
    echo "启动开发环境..."
    npm run dev:start
}

# 设置退出处理
trap 'kill_existing_processes' EXIT

# 运行主函数
main 