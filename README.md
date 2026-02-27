# 超级剪贴板系统 (Super Clipboard)

一个功能强大的 Windows 生产力工具，集成了多媒体内容管理、办公文档预览与版本控制、系统级快捷操作以及高安全性的密码管理功能。

## 1. 系统架构

### 1.1 技术栈
- **前端框架**: React 18 + TypeScript
- **UI 组件库**: shadcn/ui + Tailwind CSS
- **状态管理**: React Context + useReducer
- **动画效果**: Framer Motion
- **桌面框架**: Electron 28
- **本地数据库**: better-sqlite3
- **代码高亮**: react-syntax-highlighter
- **文档预览**: @microsoft/office-js-helpers (Office 文档)
- **OCR 识别**: tesseract.js

### 1.2 项目结构
```
clipboard-manager/
├── electron/                  # Electron 主进程
│   ├── main.ts               # 主进程入口
│   ├── database.ts           # 数据库操作
│   ├── crypto.ts             # 加密模块
│   ├── ocr.ts                # OCR 识别
│   ├── settings.ts           # 配置管理
│   ├── types.ts              # 类型定义
│   └── preload/              # 预加载脚本
├── src/                       # 渲染进程
│   ├── components/           # UI 组件
│   │   ├── ui/               # shadcn/ui 基础组件
│   │   ├── layout/           # 布局组件
│   │   ├── clipboard/        # 剪贴板相关组件
│   │   ├── preview/          # 预览组件
│   │   └── settings/         # 设置组件
│   ├── hooks/                # 自定义 Hooks
│   ├── lib/                  # 工具函数
│   ├── store/                # 状态管理
│   ├── types/                # TypeScript 类型
│   └── styles/               # 样式文件
├── public/                    # 静态资源
└── resources/                 # 应用资源
```

## 2. 核心需求与设计

### 2.1 界面与布局

#### 2.1.1 全宽主面板
- 主窗口内容区域**占满整个窗口宽度**，移除默认边距
- 采用**响应式栅格布局**，自动适配 1080P、2K、4K 等不同分辨率屏幕
- 左侧为分类导航栏（固定宽度 240px，可折叠）
- 右侧为主内容区（自适应宽度）

#### 2.1.2 智能悬浮窗
- **特性**: 支持拖拽移动、边缘调整大小
- **尺寸限制**: 最小 240x160 px，最大不超过当前屏幕工作区
- **布局**: 左侧垂直 Tab 布局 + 右侧列表 + 顶部搜索
- **状态记忆**: 记录最后的位置和尺寸，重启后自动恢复

#### 2.1.3 视觉设计原则
- **配色方案**: 采用深邃的暗色调为主，搭配明亮的强调色
  - 主色: 青蓝色渐变 (#0EA5E9 → #06B6D4)
  - 强调色: 橙红色 (#F97316) 用于重要操作
  - 背景: 深灰色渐变 (#0F172A → #1E293B)
- **字体**: 使用 JetBrains Mono (代码) + Inter (UI)，支持中文字体回退
- **动效**: 所有交互具备平滑过渡动画 (150-300ms ease-out)
- **毛玻璃效果**: 悬浮窗和模态框采用 backdrop-blur 效果

### 2.2 数据类型体系

系统支持以下七种核心数据类型，每种类型具备独特的数据结构和展示方式：

| 类型 | 图标 | 描述 | 特有功能 |
|------|------|------|----------|
| Text | 文本 | 纯文本、富文本、Markdown | Markdown 渲染、字数统计 |
| Image | 图片 | 图片数据 (Base64) | 缩略图预览、OCR 文字提取 |
| Code | 代码 | 代码片段 | 语法高亮、语言检测、一键复制 |
| File | 文件 | 本地文件引用 | 文件类型图标、路径复制 |
| Shortcut | 快捷方式 | 应用快捷方式 (.lnk) | 一键启动应用 |
| Password | 密码 | 敏感凭证 | AES-256 加密、显示/隐藏切换 |
| Office | 办公文件 | Word/Excel/PPT/PDF | 内置预览、版本管理、差异对比 |

#### 2.2.1 密码类型详细设计
```typescript
interface PasswordItem {
  id: string
  title: string           // 密码条目标题
  username?: string       // 用户名
  password: string        // 密码 (加密存储)
  url?: string           // 关联网站
  notes?: string         // 备注
  category?: string      // 分类 (社交/工作/金融等)
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
}
```

**安全策略**:
- 添加时即强制 AES-256 加密存储
- 移除手动"启动加密"按钮
- 查看密码需要二次验证（可配置）
- 支持密码生成器（可配置长度、字符集）

#### 2.2.2 办公文件类型详细设计
```typescript
interface OfficeFileItem {
  id: string
  title: string
  filePath: string        // 原始文件路径
  fileType: 'word' | 'excel' | 'ppt' | 'pdf'
  fileSize: number
  preview?: string        // 预览图 (Base64)
  versions: FileVersion[] // 版本历史
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface FileVersion {
  id: string
  content: string         // 文件内容快照或差异
  hash: string           // 内容哈希
  timestamp: Date
  changes?: string       // 变更摘要
}
```

**功能支持**:
- 在线预览（无需安装 Office）
- 分页浏览、缩放、目录跳转
- 版本回滚
- 差异对比 (Diff View)

### 2.3 分组与标签系统

#### 2.3.1 多级分组
- **适用对象**: 文本、图片、代码片段、办公文件
- **结构**: 树形结构，最多支持 3 级嵌套
- **交互**: 支持拖拽改变层级、双击重命名

```
分组结构示例:
├── 工作
│   ├── 项目文档
│   │   ├── 需求规格
│   │   └── 技术方案
│   └── 会议记录
├── 学习
│   ├── 编程笔记
│   └── 读书摘录
└── 生活
    └── 常用信息
```

#### 2.3.2 标签系统
- **适用对象**: 所有七种数据类型
- **特性**:
  - 支持多标签
  - 支持颜色标记 (预设 8 种颜色)
  - 标签云展示
- **联动机制**: 打标签操作自动触发当前内容的"版本快照"保存

### 2.4 数据捕获与集成

#### 2.4.1 右键菜单集成
- 在 Windows 资源管理器右键菜单中添加"添加到超级剪贴板"
- 在系统文本框右键菜单中添加对应选项
- **交互流程**:
  1. 用户选中内容 → 右键 → 点击菜单项
  2. 弹出迷你浮窗，显示:
     - 标题输入框 (自动填充选中内容前 50 字符)
     - 分类选择 (下拉菜单)
     - 标签输入 (支持多选)
     - 保存/取消按钮

#### 2.4.2 智能监听
- 监听系统复制 (Ctrl+C) 事件
- **轻量确认机制**:
  - 鼠标附近弹出微型确认条 (3 秒倒计时)
  - 按钮: [保存] [忽略] [更多选项...]
  - 倒计时结束自动忽略
  - 可配置: 始终保存 / 始终忽略 / 每次确认

#### 2.4.3 快捷键支持
| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+V | 打开悬浮窗口 |
| Ctrl+Alt+C | 显示/隐藏主窗口 |
| Ctrl+1~7 | 切换到对应类型分类 |
| Escape | 关闭悬浮窗口 |

### 2.5 搜索功能

#### 2.5.1 基础搜索
- 全文搜索 (支持正则表达式)
- 按类型筛选
- 按时间范围筛选
- 按标签筛选

#### 2.5.2 高级搜索
- 组合条件搜索
- 保存搜索条件
- 搜索历史记录

## 3. 数据库设计

### 3.1 表结构

#### clipboard_history (剪贴板历史)
```sql
CREATE TABLE clipboard_history (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT NOT NULL,           -- text/image/code/file/shortcut/password/office
  title TEXT,                   -- 用户自定义标题
  timestamp TEXT NOT NULL,
  size INTEGER NOT NULL,
  formats TEXT,                 -- JSON: 原始格式列表
  full_content TEXT,            -- JSON: 完整内容
  is_favorite BOOLEAN DEFAULT 0,
  is_encrypted BOOLEAN DEFAULT 0,
  iv TEXT,                      -- 加密初始化向量
  auth_tag TEXT,                -- 加密认证标签
  salt TEXT,                    -- 加密盐值
  group_id TEXT,                -- 所属分组 ID
  tags TEXT,                    -- JSON: 标签列表
  metadata TEXT,                -- JSON: 类型特定元数据
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

#### groups (分组)
```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,               -- 父分组 ID
  icon TEXT,                    -- 分组图标
  color TEXT,                   -- 分组颜色
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES groups(id)
);
```

#### tags (标签)
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### item_tags (条目标签关联)
```sql
CREATE TABLE item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES clipboard_history(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

#### versions (版本历史)
```sql
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  content TEXT NOT NULL,        -- 内容快照
  hash TEXT NOT NULL,           -- 内容哈希
  changes TEXT,                 -- JSON: 变更摘要
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES clipboard_history(id)
);
```

#### passwords (密码条目)
```sql
CREATE TABLE passwords (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  username TEXT,
  password TEXT NOT NULL,       -- AES-256 加密
  url TEXT,
  notes TEXT,                   -- 加密存储
  category TEXT,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);
```

#### office_files (办公文件)
```sql
CREATE TABLE office_files (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,      -- word/excel/ppt/pdf
  file_size INTEGER NOT NULL,
  preview TEXT,                 -- 预览图 Base64
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES clipboard_history(id)
);
```

### 3.2 索引设计
```sql
CREATE INDEX idx_timestamp ON clipboard_history(timestamp DESC);
CREATE INDEX idx_type ON clipboard_history(type);
CREATE INDEX idx_content ON clipboard_history(content);
CREATE INDEX idx_group ON clipboard_history(group_id);
CREATE INDEX idx_parent ON groups(parent_id);
CREATE INDEX idx_item_versions ON versions(item_id);
```

## 4. 性能指标

| 指标 | 目标值 |
|------|--------|
| 冷启动渲染时间 | < 600ms (10,000 条数据) |
| 本地搜索响应 | < 150ms |
| 剪贴板监控延迟 | < 100ms |
| 内存占用 | < 200MB (空闲状态) |
| 数据库写入延迟 | < 50ms |

### 4.1 性能优化策略
- **虚拟滚动**: 使用 react-window 实现长列表渲染
- **索引优化**: 对常用查询字段建立索引
- **懒加载**: 图片和预览内容按需加载
- **缓存策略**: 内存缓存最近访问的 100 条记录
- **防抖节流**: 搜索输入防抖 300ms

## 5. 开发任务分解 (Roadmap)

### 5.1 Phase 1: 基础架构重构
- [x] **项目结构调整**
  - [x] 引入 Tailwind CSS v4
  - [x] 安装并配置 shadcn/ui 组件库
  - [x] 重构目录结构
- [x] **数据库重构**
  - [x] 新增 groups、tags、versions 表
  - [x] 扩展 clipboard_history 表字段 (group_id, tags, metadata 等)
  - [x] 创建数据库索引
  - [ ] 编写数据库迁移脚本 (可选优化)

### 5.2 Phase 2: UI 组件开发
- [x] **布局组件**
  - [x] MainLayout: 全宽主布局 (Sidebar + Main)
  - [x] Sidebar: 分类导航栏 (可折叠)
  - [x] FloatingLayout: 悬浮窗布局
- [x] **基础组件** (shadcn/ui)
  - [x] Button, Input, Dialog, DropdownMenu
  - [x] Tabs, Card, Badge, Tooltip
  - [x] ScrollArea, Separator, Skeleton
  - [x] Popover 组件
- [x] **剪贴板组件**
  - [x] ClipboardCard: 条目卡片
  - [x] ClipboardList: 条目列表
  - [x] ContentPreview: 内容预览对话框
  - [x] CodePreview: 代码高亮预览 (集成在 ClipboardCard 中)
  - [x] ImagePreview: 图片预览 (支持放大)
  - [x] MarkdownPreview: Markdown 渲染预览

### 5.3 Phase 3: 核心功能开发
- [x] **七大数据类型支持**
  - [x] Text: Markdown 渲染
  - [x] Image: OCR 文字提取
  - [x] Code: 语言自动检测
  - [x] File: 文件类型图标映射 (FileIcon 组件)
  - [x] Shortcut: 快捷方式解析 (shortcut.ts 模块)
  - [x] Password: 密码管理模块 (PasswordManager 组件)
  - [x] Office: 文档预览集成 (OfficePreview 组件)
- [x] **分组与标签系统**
  - [x] 数据库表结构 (groups, tags, item_tags)
  - [x] 分组 CRUD 操作 (database.ts 中已实现)
  - [x] 树形分组组件 (GroupTree)
  - [x] 标签选择器 (TagSelector)
  - [x] 标签云展示 (TagCloud)
  - [x] 版本快照联动 (VersionHistory 组件)

### 5.4 Phase 4: 高级特性
- [x] **办公文件处理**
  - [x] Word 预览
  - [x] Excel 预览
  - [x] PPT 预览 (占位符，建议使用专业工具)
  - [x] PDF 预览
  - [x] 版本差异对比 (VersionHistory 组件)
- [x] **系统集成**
  - [x] 右键菜单注册 (contextMenu.ts)
  - [x] 复制监听确认条 (CopyConfirmBar.tsx)
  - [x] 快捷键优化 (preload/index.ts)

### 5.5 Phase 5: 测试与优化
- [ ] **测试覆盖**
  - [ ] 单元测试 (覆盖率 > 85%)
  - [ ] 加密模块测试
  - [ ] 文件解析测试
  - [ ] 版本差异算法测试
- [ ] **性能优化**
  - [ ] 虚拟滚动实现 (react-window)
  - [ ] 搜索性能优化
  - [ ] 内存泄漏排查

## 6. 质量检查清单 (Checklist)

### 界面与布局
- [ ] 主面板宽度是否 100% 占满窗口？
- [ ] 悬浮窗是否支持拖拽调整大小？
- [ ] 悬浮窗最小尺寸是否为 240x160 px？
- [ ] 悬浮窗最大尺寸是否限制在屏幕工作区内？
- [ ] 悬浮窗拖拽位置是否能在重启后正确恢复？
- [ ] 所有动画是否平滑流畅 (60fps)？
- [ ] 深色/浅色主题是否正确切换？

### 数据类型验证
- [ ] **文本**: Markdown 是否正确渲染？
- [ ] **图片**: 缩略图是否正常显示？OCR 是否正常工作？
- [ ] **代码**: 语言检测是否准确？语法高亮是否正确？
- [ ] **文件**: 文件图标是否正确显示？路径复制是否正常？
- [ ] **快捷方式**: 应用启动是否正常？
- [ ] **密码**: 加密存储是否正确？查看是否需要验证？
- [ ] **办公文件**: 预览是否正常？版本回滚是否正确？

### 分组与标签功能
- [ ] 分组树形结构是否正常显示？
- [ ] 拖拽分组是否正确调整层级？
- [ ] 标签是否正确关联到条目？
- [ ] 打标签是否自动触发版本快照？
- [ ] 标签筛选是否正常工作？

### 系统集成
- [ ] 右键菜单是否正确注册？
- [ ] 复制监听确认条是否正常弹出？
- [ ] 全局快捷键是否正常响应？

### 安全性
- [ ] 密码是否默认 AES-256 加密？
- [ ] 加密密钥是否安全存储？
- [ ] 敏感数据是否在内存中及时清除？

## 7. 构建与运行

### 安装依赖
```bash
npm ci
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 打包安装程序 (Windows)
```bash
npm run build:win
```

### 运行测试
```bash
npm run test
```

## 8. 版本历史

### v1.0.0 (当前)
- 基础剪贴板历史记录功能
- 悬浮窗口支持
- AES-256 加密
- OCR 文字提取
- 代码语法高亮

### v2.0.0 (规划中)
- 全新 UI (shadcn/ui)
- 七大数据类型完整支持
- 分组与标签系统
- 办公文件预览与版本管理
- 密码管理模块
- 右键菜单集成
