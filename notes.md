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
- 网页搜索 (Grounding) 开关操作繁琐
- 快速切换历史对话需要多次点击

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
          ▼                               ▼
┌──────────────┐                 ┌──────────────┐
│StyleManager  │                 │HistoryMenuMgr│
│              │                 │              │
│动态样式注入  │                 │历史记录管理  │
└──────────────┘                 └──────────────┘
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
        HistoryMenuManager.init();        // 初始化历史菜单
    }
}
```

#### 2.2.2 `SettingsManager` - 设置管理器

**职责**: 封装本地存储操作

**存储键**:
- `aiStudioSystemPrompt`: 全局系统提示词
- `aiStudioFontSize`: 字号设置 (small/medium/large/x-large/xx-large)

**默认值**:
```javascript
SYSTEM_PROMPT: '1. Answer in the same language as the question.\n2. If web search is necessary, always search in English.'
FONT_SIZE: 'medium'
LINE_HEIGHT: '1.4'
```

#### 2.2.3 `DialogManager` - 弹窗管理器

**职责**: 创建和管理设置界面

**关键选择器**:
- `SETTINGS_CONTAINER: 'a[href$="/"]'` - 设置链接的定位基准

**插入位置**: 设置入口插入到基准元素的**上级元素的同级位置**，而非导航栏开头

#### 2.2.4 `ShortcutManager` - 快捷键管理器

**职责**: 全局键盘事件监听和快捷键绑定

**快捷键映射**:
| 快捷键 | 功能 | 触发条件 |
|--------|------|----------|
| `Ctrl/Cmd + i` | 开关 Grounding | 全局 |
| `Ctrl/Cmd + j` | 创建新聊天 | 全局 |
| `Ctrl/Cmd + /` | 切换历史对话 | 全局 |

**实现细节**: 使用 `keydown` 事件监听，通过 `event.metaKey || event.ctrlKey` 检测修饰键

#### 2.2.5 `SystemPromptManager` - 系统提示词管理器

**职责**: 智能注入系统提示词

**核心特性**:
- **URL 检测**: 只在 URL 包含 `new_chat` 时生效
- **智能覆盖**: 检测输入框现有内容，避免覆盖用户已输入的自定义提示词
- **自动清理**: 如果输入框内容与全局提示词不同，不执行注入

**关键代码逻辑**:
```javascript
static async update(prompt) {
    if (!window.location.href.includes('new_chat')) return;

    const textarea = await waitForElement(SELECTORS.SYSTEM_TEXTAREA);
    const currentContent = textarea.value.trim();

    if (currentContent && currentContent !== prompt) return; // 已有自定义内容

    textarea.value = prompt;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}
```

#### 2.2.6 `StyleManager` - 样式管理器

**职责**: 动态注入 CSS 样式

**字号映射**:
| 值 | 显示标签 | 实际字号 |
|---|---------|---------|
| `small` | Small | 12px |
| `medium` | Medium | 14px |
| `x-large` | X-large | 18px |
| `xx-large` | XX-large | 20px |

**行高固定**: 1.4 倍行高，提升阅读体验

#### 2.2.7 `HistoryMenuManager` - 历史记录管理器

**职责**: 自动展开历史记录菜单

**执行时机**: 页面首次加载时执行**一次**

**关键选择器**: `HISTORY_MENU_BUTTON: 'a[href$="/library"] + button'`

#### 2.2.8 `DOMUtils` - DOM 操作工具类

**职责**: 封装常用 DOM 操作

**静态方法**:
- `createElement(tag, attributes, styles)` - 创建元素
- `querySelector(selector)` - 查询单个元素
- `observeRouteChanges(callback)` - 监听 URL 变化

---

## 3. 关键选择器

### 3.1 选择器汇总

| 选择器名称 | 选择器值 | 用途 | 稳定性 |
|-----------|---------|------|--------|
| `SETTINGS_CONTAINER` | `a[href$="/"]` | 设置链接定位基准 | 高 (导航栏核心元素) |
| `HISTORY_MENU_BUTTON` | `a[href$="/library"] + button` | 历史菜单按钮 | 中 (依赖DOM结构) |
| `CHAT_LINKS` | `a[href^="/prompts/"]:not([href*="new_chat"])` | 历史对话链接 | 高 (路由模式) |
| `NEW_CHAT_LINK` | `a[href$="/prompts/new_chat"]` | 新建对话链接 | 高 (路由模式) |
| `SYSTEM_INSTRUCTIONS_BUTTON` | `button[aria-label="System instructions"]` | 系统提示词按钮 | 中 (依赖 aria-label) |
| `SYSTEM_TEXTAREA` | `.cdk-overlay-container textarea` | 系统提示词输入框 | 中 (Angular CDK 结构) |
| `SEARCH_TOGGLE` | `.search-as-a-tool-toggle button` | 网页搜索开关 | 中 (功能特定类名) |

### 3.2 选择器失效检测

**失效表现**:
- 系统提示词未自动设置
- 历史菜单未自动展开
- 快捷键无响应

**排查步骤**:
1. 打开浏览器控制台
2. 执行 `document.querySelector(SELECTORS.XXX)` 验证选择器
3. 检查 Google 是否更新了前端代码
4. 使用开发者工具检查元素结构变化

---

## 4. SPA 适配机制

### 4.1 路由变化监听

Google AI Studio 是单页应用 (SPA)，路由切换不会触发页面刷新。

**监听机制**: `MutationObserver` 监听 `document.body` 的 DOM 变化

**触发条件**: 当检测到 URL 变化时，执行 `onRouteChange` 回调

**应用场景**:
- 从历史对话切换到新建对话 → 触发系统提示词注入
- 从一个对话切换到另一个 → 不触发注入 (URL 不含 `new_chat`)

### 4.2 路由检测逻辑

```javascript
observeRouteChanges(callback) {
    let currentUrl = window.location.href;

    const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            callback(currentUrl);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
```

---

## 5. 功能实现要点

### 5.1 系统提示词智能注入

**问题**: 如何避免覆盖用户已输入的自定义提示词？

**解决方案**:
1. 检测 URL 是否包含 `new_chat`
2. 检测输入框现有内容
3. 如果内容存在且与全局提示词不同 → 不执行注入
4. 如果内容为空或与全局提示词相同 → 执行注入

### 5.2 新建聊天快捷键优化

**问题**: 通过快捷键创建新聊天时，系统提示词可能未正确注入

**解决方案**: 增加延迟确保页面完全加载
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
await SystemPromptManager.update(SettingsManager.getSystemPrompt());
```

### 5.3 历史菜单单次展开

**问题**: 避免重复点击导致菜单反复收起展开

**解决方案**: 使用 `hasInitialized` 标志，确保只在页面首次加载时执行一次

---

## 6. 维护指南

### 6.1 常见问题处理

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 系统提示词未设置 | 选择器失效 | 检查 `SYSTEM_INSTRUCTIONS_BUTTON` 和 `SYSTEM_TEXTAREA` |
| 字号未生效 | 样式注入失败 | 检查 `StyleManager.createStyleSheet` 是否执行 |
| 快捷键无响应 | 监听未绑定 | 检查 `ShortcutManager.init` 是否调用 |
| 设置入口未显示 | DOM 结构变化 | 检查 `SETTINGS_CONTAINER` 选择器 |

### 6.2 Google 前端更新应对

**检测方法**:
1. 用户反馈功能失效
2. 控制台无报错但功能不工作
3. 选择器查询返回 `null`

**处理流程**:
1. 打开 Google AI Studio
2. 使用开发者工具检查目标元素
3. 更新 `CONSTANTS.SELECTORS` 中的选择器
4. 测试验证功能恢复
5. 更新版本号和 Greasy Fork

### 6.3 版本发布流程

1. **本地测试**: 在 Tampermonkey 调试模式下验证所有功能
2. **版本更新**: 修改 `@version` 和版本历史
3. **发布到 Greasy Fork**: 上传代码并更新说明文档
4. **GitHub 同步**: 推送代码到仓库并更新 Release

---

## 7. 开发规范

### 7.1 代码风格

- 使用 ES6+ 语法
- 类采用静态方法模式
- 常量集中管理在 `CONSTANTS` 对象
- 错误处理使用 `try-catch` 包裹

### 7.2 扩展新功能

遵循现有架构，为新功能创建对应的管理器类：

```javascript
class NewFeatureManager {
    static init() {
        // 初始化逻辑
    }

    static async doSomething() {
        // 核心功能
    }
}

// 在 AppManager.init() 中调用
class AppManager {
    static init() {
        // ...
        NewFeatureManager.init();
    }
}
```
