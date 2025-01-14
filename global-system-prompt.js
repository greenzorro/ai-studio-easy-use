/*
 * File: global-system-prompt.js
 * Project: g-ai-studio-global-system-prompt
 * Created: 2025-01-10 09:46:13
 * Author: Victor Cheng
 * Email: greenzorromail@gmail.com
 * Description: 
 */

// 写一个Tampermonkey脚本
// 用在 https://aistudio.google.com/prompts/ 开头的网页
// 在页面上加一个链接，"Set Global System Prompt"
// 点击链接出现弹窗，里面有个输入框，可以输入全局系统提示词，默认为：
// Always search in English. Answer in the same language as the question.
// 这个全局系统提示词保存到本地，如果用户调整过，下次打开页面时，要保持用户调整后的内容
// 找到class名为 "system-instructions" 的节点，找到里面的textarea，把textarea里的内容改为全局系统提示词

// ==UserScript==
// @name         Google AI Studio easy use
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Automatically set Google AI Studio system prompt; Increase chat content font size; Toggle Grounding with Ctrl/Cmd + i. 自动设置 Google AI Studio 的系统提示词；增大聊天内容字号；快捷键 Ctrl/Cmd + i 开关Grounding。
// @author       Victor Cheng
// @match        https://aistudio.google.com/prompts/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 默认系统提示词
    const DEFAULT_PROMPT = '1. Answer in the same language as the question.\n2. If web search is necessary, always search in English.';
    
    // 从localStorage获取保存的提示词
    const getSavedPrompt = () => localStorage.getItem('aiStudioSystemPrompt') || DEFAULT_PROMPT;

    // 创建设置链接
    const createSettingLink = () => {
        const link = document.createElement('a');
        link.textContent = 'Set Global System Prompt';
        link.href = 'javascript:void(0)';
        link.style.cssText = `
            display: block;
            color: #1a73e8;
            text-decoration: none;
            font-size: 14px;
            margin-bottom: 20px;
        `;
        return link;
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
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            min-width: 300px;
        `;
        
        const textarea = document.createElement('textarea');
        textarea.value = getSavedPrompt();
        textarea.style.cssText = `
            width: 100%;
            min-height: 100px;
            margin: 10px 0;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.cssText = `
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset';
        resetButton.style.cssText = `
            padding: 8px 16px;
            background-color: #f8f9fa;
            color: #3c4043;
            border: 1px solid #dadce0;
            border-radius: 4px;
            cursor: pointer;
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
        `;

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(resetButton);

        dialog.appendChild(textarea);
        dialog.appendChild(buttonContainer);

        // 添加重置按钮的点击事件
        resetButton.addEventListener('click', () => {
            textarea.value = DEFAULT_PROMPT;
        });

        return { dialog, textarea, saveButton, cancelButton };
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

    // 初始化
    const init = () => {
        const link = createSettingLink();
        
        // 监听DOM变化，等待navigation区域出现
        const observer = new MutationObserver((mutations, obs) => {
            const nav = document.querySelector('[role="navigation"]');
            if (nav && !nav.querySelector('a[href="javascript:void(0)"]')) {
                // 在导航区域的开头插入链接
                nav.insertBefore(link, nav.firstChild);
                // 找到后就停止观察
                obs.disconnect();
            }
        });

        // 观察文档变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 设置链接的点击事件
        link.addEventListener('click', () => {
            const overlay = createOverlay();
            document.body.appendChild(overlay);
            
            const { dialog, textarea, saveButton, cancelButton } = createDialog();
            document.body.appendChild(dialog);

            saveButton.addEventListener('click', () => {
                const newPrompt = textarea.value.trim();
                localStorage.setItem('aiStudioSystemPrompt', newPrompt);
                updateSystemPrompt(newPrompt);
                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
            });

            cancelButton.addEventListener('click', () => {
                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
            });
        });

        // 添加样式覆盖
        const style = document.createElement('style');
        style.textContent = `
            body:not(.dark-theme) ms-cmark-node p {
                font-size: 16px !important;
            }
        `;
        document.head.appendChild(style);

        // 添加快捷键监听
        document.documentElement.addEventListener('keydown', function(e) {
            // 检查是否按下 cmd/ctrl + i
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡
                const searchToggle = document.querySelector('.search-input-toggle button');
                if (searchToggle) {
                    searchToggle.click();
                }
                return false; // 额外的事件阻止
            }
        }, true);
    };

    // 监听DOM变化，自动设置系统提示词
    const observer = new MutationObserver((mutations, obs) => {
        const systemInstructions = document.querySelector('.system-instructions');
        if (systemInstructions) {
            const textarea = systemInstructions.querySelector('textarea');
            if (textarea && textarea.spellcheck === true) {
                updateSystemPrompt(getSavedPrompt());
            }
        }
    });

    // 开始观察文档变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初始化
    init();
})();
