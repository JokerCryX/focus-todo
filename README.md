# FocusTodo

一款本地化的桌面待办事项管理应用，基于 Electron + Vue 3 构建。

## 功能

- **任务管理** — 创建、编辑、删除、归档任务，支持优先级、标签、分类
- **多视图** — 收件箱、今日、最近、已完成
- **番茄钟** — 可自定义时长的专注计时，支持短休息 / 长休息
- **白噪音** — 内置多款环境音效（海浪、山涧、鸟鸣等）
- **桌面小组件** — 可拖拽、可停靠、可缩放的 Todo 悬浮面板
- **主题** — 浅色 / 深色 / 透白 / 透黑 四种主题
- **数据本地存储** — 所有数据存储在本地 SQLite 数据库，无需联网
- **国际化** — 支持中文 / 英文

## 技术栈

- **前端** — Vue 3 + Vue Router + Pinia + Vue I18n + Element Plus
- **后端** — Electron 33
- **构建** — electron-vite + TypeScript
- **数据库** — sql.js（SQLite WASM）
- **图表** — ECharts 6

## 开发

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建
npm run build

# 打包安装程序
npm run dist
```

## 项目结构

```
├── src/
│   ├── main/                # Electron 主进程
│   │   ├── database/        # 数据库层（DAO、迁移）
│   │   ├── ipc/             # IPC 通信处理
│   │   ├── locales/         # 主进程国际化
│   │   ├── index.ts         # 主入口
│   │   ├── tray.ts          # 系统托盘
│   │   └── widget-manager.ts # 桌面小组件管理
│   ├── preload/             # 预加载脚本
│   └── renderer/            # Vue 渲染进程
│       └── src/
│           ├── components/  # UI 组件
│           ├── composables/ # 组合式函数
│           ├── layouts/     # 布局
│           ├── stores/      # Pinia 状态管理
│           └── styles/      # 全局样式与主题
├── public/                  # 静态资源
├── sound/                   # 音效文件
└── build/                   # 构建资源（图标等）
```

## 许可证

MIT
