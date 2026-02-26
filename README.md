# 剪贴板管理器（Windows 增强版）

一个基于 Electron + React + TypeScript 的 Windows 桌面剪贴板增强应用，支持剪贴板历史、悬浮粘贴、AES-256-GCM 加密、OCR 识别等核心功能。

## 项目架构
- 桌面框架：Electron v28
- 前端：React 18 + Vite 5 + TypeScript
- 构建：electron-vite
- 数据库：SQLite（better-sqlite3）
- OCR：tesseract.js

目录结构：
- [electron](file:///d:/Desktop/clipboard/electron) 主进程、数据库、加密、OCR、预加载
- [src](file:///d:/Desktop/clipboard/src) 渲染进程（React UI）
- [src/components](file:///d:/Desktop/clipboard/src/components) 组件（悬浮窗口等）
- [src/renderer/index.html](file:///d:/Desktop/clipboard/src/renderer/index.html) 渲染进程入口

## 核心功能
- 自动记录剪贴板文本、HTML、RTF、图片并持久化
- 悬浮窗口快速查看与复制最近记录
- 全局快捷键呼出悬浮窗口（Ctrl+Shift+V）
- AES-256-GCM 加密存储，支持解锁/启用/禁用
- OCR 图片文字识别（一键提取复制）
- 代码片段高亮预览（手动标记）

功能路线图与更详细的需求见：[Windows剪贴板软件需求规格文档.md](file:///d:/Desktop/clipboard/Windows剪贴板软件需求规格文档.md)

## 安装步骤
1. 安装 Node.js（18+ 推荐）
2. 安装依赖：
   ```bash
   npm ci
   ```
3. 开发模式运行：
   ```bash
   npm run dev
   ```
4. 预览（预打包）：
   ```bash
   npm run start
   ```

## 编译命令
- 类型检查：
  ```bash
  npm run typecheck
  ```
- 生产构建（生成 out/main、out/preload、out/renderer）：
  ```bash
  npm run build
  ```
- 测试与覆盖率（仅针对核心模块）：
  ```bash
  npm run test
  ```
- 打包安装包（Windows）：
  ```bash
  npm run build:win
  ```

## 贡献指南
- 分支管理建议采用 Git Flow
- 提交信息遵循规范：feat/fix/docs/chore 等前缀
- 在提交 PR 之前：
  - 运行类型检查与构建：`npm run typecheck && npm run build`
  - 运行测试并确保通过：`npm run test`
  - 保持 ESLint 与 Prettier 格式一致：`npm run format`

## 作者信息
- 作者：example.com
- 邮箱：support@example.com
- 主页：.*
