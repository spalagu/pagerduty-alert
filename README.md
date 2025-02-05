# PagerDuty Alert Desktop

一个基于 Electron 的 PagerDuty 告警桌面客户端，提供实时告警通知和管理功能。

## 🌟 功能特点

### 📱 实时告警通知
- **系统通知集成**
  - 原生系统通知支持
  - 可配置通知持续时间
  - 支持通知分组
  - 点击通知跳转告警详情

- **声音提醒**
  - 可选择是否开启声音
  - 按优先级设置提示音
  - 音量控制

### 🔄 告警监控
- **轮询机制**
  - 可配置轮询间隔
  - 网络异常自动重试
  - 支持仅显示新告警

- **告警状态追踪**
  - 实时状态同步
  - 变更历史记录

### 🎨 界面设计
- **主题支持**
  - 自动跟随系统主题
  - 深色/浅色模式切换

- **窗口管理**
  - 最小化到托盘
  - 状态栏图标动态更新

### ⚙️ 配置选项
- **PagerDuty 集成**
  - API 密钥配置
  - 自定义 API 域名
  - 请求重试策略

- **告警过滤**
  - 按状态过滤
  - 按优先级过滤

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 开发调试
```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

# 启动带调试工具的开发服务
npm run dev:debug
```

### 应用打包
```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

## 📁 项目结构

```
src/
├── main/                 # Electron 主进程
│   ├── windows/         # 窗口管理
│   ├── services/        # 主进程服务
│   └── main.ts          # 主进程入口
├── renderer/            # 渲染进程
│   ├── components/     # React 组件
│   ├── pages/          # 页面组件
│   └── styles/         # 样式文件
└── shared/             # 共享模块
    ├── types/          # 类型定义
    └── utils/          # 工具函数

assets/                # 静态资源
└── icons/            # 应用图标
```

## ⚙️ 配置说明

### PagerDuty 配置
```typescript
interface PagerDutyConfig {
  apiKey: string;           // API 密钥
  apiEndpoint?: string;     // 自定义 API 端点
  pollingInterval: number;  // 轮询间隔(ms)
}
```

### 通知配置
```typescript
interface NotificationConfig {
  enabled: boolean;         // 启用通知
  sound: boolean;          // 启用声音
  grouping: boolean;       // 启用分组
  duration: number;        // 显示时长
}
```

## 📝 常见问题

### 使用相关
1. **Q: 为什么收不到通知？**
   - A: 检查系统通知权限
   - A: 验证 PagerDuty 配置
   - A: 检查网络连接

2. **Q: 如何处理代理问题？**
   - A: 配置系统代理
   - A: 使用应用内代理设置

## 📈 版本记录

### v0.0.1 (2025-01-26)
- 🎉 首次发布
- ✨ 基础功能实现
- 🔧 核心功能稳定 
