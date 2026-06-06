# ai-studio-easy-use 项目备忘录

## 1. 项目概述

### 1.1 项目目的

本文档旨在详细记录 `ai-studio-easy-use` Tampermonkey 用户脚本的技术架构、实现细节和开发维护指南。

**项目定位**: 增强谷歌 AI Studio (Google AI Studio / AI Dev) 使用体验的用户脚本，通过自动化操作和 UI 优化提升用户生产力。

**重要提示**: 每次修改功能或 Google 更新前端代码后，请及时更新此备忘录。

### 1.2 核心价值

Google AI Studio 官方客户端存在以下痛点：
- 新建对话时需要重复设置系统提示词
- 聊天内容字号固定，长时间使用易疲劳
- 网页搜索 (Grounding) 和 URL context 开关操作繁琐

本脚本通过自动化和 UI 增强解决上述问题。

---

## 2. 技术架构

### 2.1 整体架构

脚本采用**模块化类架构**，核心由 `AppManager` 统筹协调各功能模块：

```
┌─────────────────────────────────────────────────────────────┐
│                        AppManager                           │
│                    (核心管理器)                              │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┬───────────────┐
          ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│SettingsMgr   │ │DialogManager │ │ShortcutMgr   │ │SystemPrompt  │
│              │ │              │ │              │ │Manager       │
│本地存储管理  │ │设置界面管理  │ │快捷键监听    │ │系统提示词注入│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               
┌──────────────┐                 
│StyleManager  │                 
│              │                 
│动态样式注入  │                 
└──────────────┘                 
           │
           ▼
┌──────────────────────────────────────────┐
│        DOMUtils & UIComponents           │
│         (工具类和UI组件)                  │
└──────────────────────────────────────────┘
```

### 2.2 模块职责

#### 2.2.1 `AppManager` - 核心管理器

**职责**: 脚本的启动入口和中央协调器

**核心逻辑**:
```javascript
class AppManager {
    static init() {
        SettingsManager.init();           // 初始化设置
        DOMUtils.observeRouteChanges();   // 监听路由变化
        DialogManager.createSettingsEntry(); // 创建设置入口
        ShortcutManager.init();           // 初始化快捷键
        StyleManager.updateFontSize();    // 应用字号设置
    }
}
```

#### 2.2.2 `SettingsManager` - 设置管理器

**职责**: 封装本地存储操作

**存储键**:
- `aiStudioSystemPrompt`: 全局系统提示词
- `aiStudioFontSize`: 字号设置 (small/medium/large/x-large/xx-large)

#### 2.2.3 `DialogManager` - 弹窗管理器

**职责**: 创建和管理设置界面

**关键选择器**:
- `SETTINGS_CONTAINER: 'ms-nav-items-v2'` - 侧边栏主导航容器

**插入位置**: 插入到 `ms-nav-items-v2` 容器的第一个子元素之前。

#### 2.2.4 `ShortcutManager` - 快捷键管理器

**职责**: 全局键盘事件监听和快捷键绑定

**快捷键映射**:
| 快捷键 | 功能 | 触发条件 |
|--------|------|----------|
| `Ctrl/Cmd + i` | 开关 Grounding 和 URL context | 全局 |
| `Ctrl/Cmd + j` | 创建新聊天 | 全局 |

**注**: 原有的 `Ctrl/Cmd + /` (历史对话切换) 已于 v1.2.1 移除，以避免与官方搜索快捷键冲突。

#### 2.2.5 `SystemPromptManager` - 系统提示词管理器

**职责**: 智能注入系统提示词

**核心特性**:
- **URL 检测**: 只在 URL 包含 `new_chat` 时生效
- **智能覆盖**: 检测输入框现有内容，避免覆盖用户已输入的自定义提示词
- **自动清理**: 如果输入框内容与全局提示词不同，不执行注入
- **自动开启工具**: 全局系统提示词注入完成后，确保 Grounding 和 URL context 处于开启状态

#### 2.2.6 `StyleManager` - 样式管理器

**职责**: 动态注入 CSS 样式

**字号映射**: 12px (Small) 到 20px (XX-large)，行高固定 1.4。

#### 2.2.8 `DOMUtils` - DOM 操作工具类

---

## 3. 关键选择器 (V3 版本适配)

### 3.1 选择器汇总

| 选择器名称 | 选择器值 | 用途 | 稳定性 |
|-----------|---------|------|--------|
| `SETTINGS_CONTAINER` | `ms-nav-items-v2` | 设置链接插入位置 | 高 (V3 核心导航) |
| `NEW_CHAT_LINK` | `a[href$="/prompts/new_chat"]` | 新建对话链接 | 高 (路由模式) |
| `SYSTEM_INSTRUCTIONS_BUTTON` | `button[aria-label="System instructions"]` | 系统提示词按钮 | 中 (依赖 aria-label) |
| `SYSTEM_TEXTAREA` | `.cdk-overlay-container textarea` | 系统提示词输入框 | 中 (Angular CDK 结构) |
| `SEARCH_TOGGLE` | `button[aria-label="Grounding with Google Search"]` | 网页搜索开关 | 中 (依赖 aria-label) |
| `URL_CONTEXT_TOGGLE` | `button[aria-label="Browse the url context"]` | URL context 开关 | 中 (依赖 aria-label) |

---

## 5. 功能实现要点

### 5.1 系统提示词智能注入

1. 检测 URL 是否包含 `new_chat`
2. 如果内容为空或与全局提示词相同 → 执行注入

### 5.2 功能精简 (v1.2.1)

**重大变更**:
- 移除了历史记录自动展开功能。
- 移除了快捷键切换历史对话功能。
**原因**: 官方 V3 版本引入了全局搜索 (`⌘ /`)，功能已实现覆盖且存在快捷键冲突。脚本现在专注于 UI 增强和核心自动化。

---

## 6. 维护指南

### 6.1 常见问题处理

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 设置入口未显示 | DOM 结构变化 | 检查 `ms-nav-items-v2` 是否存在 |

### 6.2 Google 前端更新应对

1. 检查侧边栏 V3 结构是否发生变化。
2. 验证 `ms-nav-items-v2` 容器。
