/*
 * File: global-system-prompt.js
 * Project: g-ai-studio-global-system-prompt
 * Created: 2025-01-10 09:46:13
 * Author: Victor Cheng
 * Email: greenzorromail@gmail.com
 * Description:
 */

// 写一个Tampermonkey脚本
// 用在 https://aistudio.google.com/*prompts/* 网页
// 在页面上加一个链接，"Set Global System Prompt"
// 点击链接出现弹窗，里面有个输入框，可以输入全局系统提示词，默认为：
// Always search in English. Answer in the same language as the question.
// 这个全局系统提示词保存到本地，如果用户调整过，下次打开页面时，要保持用户调整后的内容
// 找到class名为 "system-instructions" 的节点，找到里面的textarea，把textarea里的内容改为全局系统提示词

// ==UserScript==
// @name         Google AI Studio easy use
// @namespace    http://tampermonkey.net/
// @version      1.0.6
// @description  Automatically set Google AI Studio system prompt; Increase chat content font size; Toggle Grounding with Ctrl/Cmd + i. 自动设置 Google AI Studio 的系统提示词；增大聊天内容字号；快捷键 Ctrl/Cmd + i 开关Grounding。
// @author       Victor Cheng
// @match        https://aistudio.google.com/*prompts/*
// @grant        none
// @license      MIT
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 默认系统提示词
    const DEFAULT_PROMPT = '1. Answer in the same language as the question.\n2. If web search is necessary, always search in English.';
    const DEFAULT_FONT_SIZE = 'medium';

    // 记录当前选中的对话索引
    let currentChatIndex = 0;

    // 从localStorage获取保存的设置
    const getSettings = () => ({
        systemPrompt: localStorage.getItem('aiStudioSystemPrompt') || DEFAULT_PROMPT,
        fontSize: localStorage.getItem('aiStudioFontSize') || DEFAULT_FONT_SIZE
    });

    // 创建设置链接
    const createSettingLink = () => {
        const link = document.createElement('a');
        link.textContent = '⚙️ Easy use settings';
        link.style.cssText = `
            display: block;
            color: #076eff;
            text-decoration: none;
            font-size: 14px;
            margin-bottom: 20px;
            cursor: pointer;
        `;
        return link;
    };

    // 创建快捷键说明区域
    const createShortcutsSection = () => {
        const shortcutsSection = document.createElement('div');
        shortcutsSection.style.cssText = 'margin-bottom: 24px; padding: 12px; background: #f8f9fa; border-radius: 4px;';

        const shortcutsTitle = document.createElement('div');
        shortcutsTitle.textContent = 'Keyboard Shortcuts';
        shortcutsTitle.style.cssText = 'font-weight: 500; margin-bottom: 8px; color: #202124;';

        const shortcutsList = document.createElement('div');
        shortcutsList.style.cssText = 'font-size: 14px; color: #5f6368;';

        // 分别创建快捷键说明
        const shortcut1 = document.createElement('div');
        shortcut1.textContent = '• ';
        const kbd1 = document.createElement('kbd');
        kbd1.textContent = 'Ctrl/Cmd + i';
        const text1 = document.createTextNode(': Toggle Grounding');
        shortcut1.appendChild(kbd1);
        shortcut1.appendChild(text1);

        const shortcut2 = document.createElement('div');
        shortcut2.textContent = '• ';
        const kbd2 = document.createElement('kbd');
        kbd2.textContent = 'Ctrl/Cmd + j';
        const text2 = document.createTextNode(': New Chat');
        shortcut2.appendChild(kbd2);
        shortcut2.appendChild(text2);

        const shortcut3 = document.createElement('div');
        shortcut3.textContent = '• ';
        const kbd3 = document.createElement('kbd');
        kbd3.textContent = 'Ctrl/Cmd + /';
        const text3 = document.createTextNode(': Switch Recent Chats');
        shortcut3.appendChild(kbd3);
        shortcut3.appendChild(text3);

        shortcutsList.appendChild(shortcut1);
        shortcutsList.appendChild(shortcut2);
        shortcutsList.appendChild(shortcut3);

        shortcutsSection.appendChild(shortcutsTitle);
        shortcutsSection.appendChild(shortcutsList);

        return shortcutsSection;
    };

    // 创建弹窗
    const createDialog = () => {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            min-width: 450px;
            max-width: 700px;
            width: 50vw;
        `;

        const settings = getSettings();

        // 创建标题
        const title = document.createElement('h2');
        title.textContent = '⚙️ Easy Use Settings';
        title.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 18px;
            color: #202124;
        `;
        dialog.appendChild(title);

        // 创建系统提示词设置区域
        const promptSection = document.createElement('div');
        promptSection.style.cssText = 'margin-bottom: 24px;';

        const promptLabel = document.createElement('label');
        promptLabel.textContent = 'Global System Prompt';
        promptLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202124;
        `;

        const promptTextarea = document.createElement('textarea');
        promptTextarea.value = settings.systemPrompt;
        promptTextarea.style.cssText = `
            width: 100%;
            min-height: 100px;
            margin-bottom: 8px;
            padding: 8px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-family: inherit;
            resize: vertical;
        `;

        // 创建重置按钮
        const resetPromptButton = document.createElement('button');
        resetPromptButton.textContent = 'Reset to Default';
        resetPromptButton.style.cssText = `
            padding: 4px 8px;
            background-color: #f8f9fa;
            color: #3c4043;
            border: 1px solid #dadce0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 16px;
        `;
        resetPromptButton.addEventListener('click', () => {
            promptTextarea.value = DEFAULT_PROMPT;
        });

        promptSection.appendChild(promptLabel);
        promptSection.appendChild(promptTextarea);
        promptSection.appendChild(resetPromptButton);

        // 创建字体大小设置区域
        const fontSection = document.createElement('div');
        fontSection.style.cssText = 'margin-bottom: 24px;';

        const fontLabel = document.createElement('label');
        fontLabel.textContent = 'Font Size';
        fontLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #202124;
        `;

        const fontButtonGroup = document.createElement('div');
        fontButtonGroup.style.cssText = `
            display: flex;
            gap: 8px;
            width: 100%;
        `;

        const fontSizes = [
            { value: 'small', label: 'Small', size: '12px' },
            { value: 'medium', label: 'Medium', size: '14px' },
            { value: 'large', label: 'Large', size: '16px' },
            { value: 'x-large', label: 'X-large', size: '18px' },
            { value: 'xx-large', label: 'XX-large', size: '20px' }
        ];

        fontSizes.forEach(size => {
            const button = document.createElement('button');
            button.type = 'button';
            button.value = size.value;
            button.textContent = size.label;
            button.title = `${size.label} (${size.size})`;
            const isSelected = size.value === settings.fontSize;
            button.style.cssText = `
                flex: 1;
                padding: 8px;
                border: 1px solid ${isSelected ? '#076eff' : '#dadce0'};
                border-radius: 4px;
                background: ${isSelected ? '#e8f0fe' : 'white'};
                color: ${isSelected ? '#076eff' : '#3c4043'};
                cursor: pointer;
                font-size: ${size.size};
                transition: all 0.2s;
            `;

            button.addEventListener('click', (e) => {
                // 移除其他按钮的选中状态
                fontButtonGroup.querySelectorAll('button').forEach(btn => {
                    btn.style.border = '1px solid #dadce0';
                    btn.style.background = 'white';
                    btn.style.color = '#3c4043';
                    btn.removeAttribute('data-selected');
                });
                // 设置当前按钮的选中状态
                button.style.border = '1px solid #076eff';
                button.style.background = '#e8f0fe';
                button.style.color = '#076eff';
                button.setAttribute('data-selected', 'true');
            });

            if (isSelected) {
                button.setAttribute('data-selected', 'true');
            }

            fontButtonGroup.appendChild(button);
        });

        fontSection.appendChild(fontLabel);
        fontSection.appendChild(fontButtonGroup);

        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 8px 16px;
            background-color: #076eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background-color: #f8f9fa;
            color: #3c4043;
            border: 1px solid #dadce0;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        `;

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);

        // 组装弹窗
        dialog.appendChild(promptSection);
        dialog.appendChild(fontSection);
        dialog.appendChild(createShortcutsSection());
        dialog.appendChild(buttonContainer);

        return {
            dialog,
            promptTextarea,
            fontButtonGroup,
            saveButton,
            cancelButton
        };
    };

    // 更新系统提示词
    const updateSystemPrompt = (prompt) => {
        const systemInstructions = document.querySelector('.system-instructions');
        if (systemInstructions) {
            const textarea = systemInstructions.querySelector('textarea');
            if (textarea) {
                textarea.value = prompt;
                const inputEvent = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                textarea.dispatchEvent(inputEvent);
            }
        }
    };

    // 更新字体大小
    const updateFontSize = (size) => {
        const style = document.getElementById('aiStudioCustomStyle') || document.createElement('style');
        if (!style.id) {
            style.id = 'aiStudioCustomStyle';
        }
        const fontSize = {
            'small': '12px',
            'medium': '14px',
            'large': '16px',
            'x-large': '18px',
            'xx-large': '20px'
        }[size] || '14px';

        style.textContent = `
            body:not(.dark-theme) ms-cmark-node p {
                font-size: ${fontSize} !important;
            }
        `;
        if (!style.parentNode) {
            document.head.appendChild(style);
        }
    };

    // 创建遮罩层
    const createOverlay = () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        return overlay;
    };

    // 切换到下一个对话
    const switchToNextChat = () => {
        const chatLinks = document.querySelectorAll('.nav-sub-items-wrapper a');
        if (chatLinks.length > 0) {
            chatLinks[currentChatIndex].click();
            currentChatIndex = (currentChatIndex + 1) % chatLinks.length;
        }
    };

    // 重置对话索引
    const resetChatIndex = () => {
        currentChatIndex = 0;
    };

    // 初始化
    const init = () => {
        const link = createSettingLink();

        // 监听DOM变化，等待navigation区域出现
        const observer = new MutationObserver((mutations, obs) => {
            const nav = document.querySelector('[role="navigation"]');
            if (nav && !nav.querySelector('.easy-use-settings')) {
                link.classList.add('easy-use-settings');
                nav.insertBefore(link, nav.firstChild);
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 设置链接的点击事件
        link.addEventListener('click', () => {
            const overlay = createOverlay();
            document.body.appendChild(overlay);

            const { dialog, promptTextarea, fontButtonGroup, saveButton, cancelButton } = createDialog();
            document.body.appendChild(dialog);

            saveButton.addEventListener('click', () => {
                const newPrompt = promptTextarea.value.trim();
                const selectedFontButton = fontButtonGroup.querySelector('button[data-selected="true"]');
                const newFontSize = selectedFontButton ? selectedFontButton.value : DEFAULT_FONT_SIZE;

                localStorage.setItem('aiStudioSystemPrompt', newPrompt);
                localStorage.setItem('aiStudioFontSize', newFontSize);

                updateSystemPrompt(newPrompt);
                updateFontSize(newFontSize);

                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
            });

            cancelButton.addEventListener('click', () => {
                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
            });
        });

        // 应用保存的字体大小设置
        const { fontSize } = getSettings();
        updateFontSize(fontSize);

        // 添加快捷键监听
        document.documentElement.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + i: 切换 Grounding
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                e.stopPropagation();
                const searchToggle = document.querySelector('.search-input-toggle button');
                if (searchToggle) {
                    searchToggle.click();
                }
                return false;
            }

            // Ctrl/Cmd + j: 新建聊天
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
                e.preventDefault();
                e.stopPropagation();
                const newChatLink = document.querySelector('a[href="/prompts/new_chat"]');
                if (newChatLink) {
                    newChatLink.click();
                    resetChatIndex();
                }
                return false;
            }
        }, true);
    };

    // 初始化函数，增加重试机制
    const initWithRetry = (maxRetries = 10, interval = 1000) => {
        let retries = 0;

        const tryInit = () => {
            if (document.readyState === 'complete') {
                // 确保系统提示词区域存在并且已经设置
                const ensureSystemPrompt = () => {
                    const systemInstructions = document.querySelector('.system-instructions');
                    if (systemInstructions) {
                        const textarea = systemInstructions.querySelector('textarea');
                        if (textarea && textarea.spellcheck === true) {
                            updateSystemPrompt(getSettings().systemPrompt);
                            return true;
                        }
                    }
                    return false;
                };

                // 先初始化UI和事件监听
                init();

                // 然后尝试设置系统提示词
                if (!ensureSystemPrompt() && retries < maxRetries) {
                    retries++;
                    setTimeout(tryInit, interval);
                }
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(tryInit, interval);
            }
        };

        tryInit();
    };

    // 添加全局快捷键监听
    const setupGlobalShortcuts = () => {
        window.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + i: 切换 Grounding
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                e.stopPropagation();
                const searchToggle = document.querySelector('.search-input-toggle button');
                if (searchToggle) {
                    searchToggle.click();
                }
                return false;
            }

            // Ctrl/Cmd + j: 新建聊天
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
                e.preventDefault();
                e.stopPropagation();
                const newChatLink = document.querySelector('a[href="/prompts/new_chat"]');
                if (newChatLink) {
                    newChatLink.click();
                    resetChatIndex();
                }
                return false;
            }

            // Ctrl/Cmd + /: 切换最近对话
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault();
                e.stopPropagation();
                switchToNextChat();
                return false;
            }
        }, true);
    };

    // 开始初始化
    setupGlobalShortcuts();
    initWithRetry();

    // 监听路由变化（针对SPA）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            initWithRetry();
        }
    }).observe(document, { subtree: true, childList: true });
})();
