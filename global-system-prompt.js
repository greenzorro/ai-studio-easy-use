/*
 * File: ai-studio-easy-use.js
 * Project: browser-scipts
 * Created: 2025-03-03 10:46:13
 * Author: Victor Cheng
 * Email: greenzorromail@gmail.com
 * Description:
 */

// ==UserScript==
// @name         Google AI Studio easy use
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @description  Automatically set Google AI Studio system prompt; Increase chat content font size; Toggle Grounding with Ctrl/Cmd + i. 自动设置 Google AI Studio 的系统提示词；增大聊天内容字号；快捷键 Ctrl/Cmd + i 开关Grounding。
// @author       Victor Cheng
// @match        https://aistudio.google.com/*
// @match        https://ai.dev/*
// @grant        none
// @license      MIT
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    //=======================================
    // 常量管理
    //=======================================
    const CONSTANTS = {
        STORAGE_KEYS: {
            SYSTEM_PROMPT: 'aiStudioSystemPrompt',
            FONT_SIZE: 'aiStudioFontSize'
        },
        DEFAULTS: {
            SYSTEM_PROMPT: '1. Answer in the same language as the question.\n2. If web search is necessary, always search in English.',
            FONT_SIZE: 'medium'
        },
        SELECTORS: {
            NAVIGATION: '[role="navigation"]',
            SYSTEM_INSTRUCTIONS: '.toolbar-system-instructions',
            SYSTEM_INSTRUCTIONS_BUTTON: 'button[aria-label="System instructions"]',
            SYSTEM_TEXTAREA: '.toolbar-system-instructions textarea',
            NEW_CHAT_LINK: 'a[href$="/prompts/new_chat"]',
            SEARCH_TOGGLE: '.search-as-a-tool-toggle button',
            CHAT_LINKS: '.history-items-wrapper a'
        },
        FONT_SIZES: [
            { value: 'small', label: 'Small', size: '12px' },
            { value: 'medium', label: 'Medium', size: '14px' },
            { value: 'large', label: 'Large', size: '16px' },
            { value: 'x-large', label: 'X-large', size: '18px' },
            { value: 'xx-large', label: 'XX-large', size: '20px' }
        ],
        SHORTCUTS: {
            TOGGLE_GROUNDING: { key: 'i', requiresCmd: true },
            NEW_CHAT: { key: 'j', requiresCmd: true },
            SWITCH_CHAT: { key: '/', requiresCmd: true }
        }
    };

    //=======================================
    // 工具类
    //=======================================
    class DOMUtils {
        static createElement(tag, attributes = {}, styles = {}) {
            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'className') {
                    element.className = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            Object.assign(element.style, styles);
            return element;
        }

        static querySelector(selector) {
            return document.querySelector(selector);
        }

        static querySelectorAll(selector) {
            return document.querySelectorAll(selector);
        }
    }

    class StyleManager {
        static createStyleSheet(id, css) {
            let style = document.getElementById(id);
            if (!style) {
                style = DOMUtils.createElement('style', { id });
                document.head.appendChild(style);
            }
            style.textContent = css;
            return style;
        }

        static updateFontSize(size) {
            const fontSize = CONSTANTS.FONT_SIZES.find(s => s.value === size)?.size || '14px';
            this.createStyleSheet('aiStudioCustomStyle', `
                body:not(.dark-theme) ms-cmark-node p {
                    font-size: ${fontSize} !important;
                }
            `);
        }
    }

    class SystemPromptManager {
        static async update(prompt) {
            const systemInstructionsButton = DOMUtils.querySelector(CONSTANTS.SELECTORS.SYSTEM_INSTRUCTIONS_BUTTON);
            if (!systemInstructionsButton) {
                console.warn("System instructions button not found.");
                return false;
            }

            let textarea = DOMUtils.querySelector(CONSTANTS.SELECTORS.SYSTEM_TEXTAREA);
            if (!textarea) {
                systemInstructionsButton.click();
                await new Promise(resolve => setTimeout(resolve, 200));
                textarea = DOMUtils.querySelector(CONSTANTS.SELECTORS.SYSTEM_TEXTAREA);
            }

            if (textarea) {
                textarea.value = prompt;
                textarea.dispatchEvent(new Event('input', {
                    bubbles: true,
                    cancelable: true,
                }));
                return true;
            } else {
                console.warn("System prompt textarea not found after clicking button.");
                return false;
            }
        }
    }

    //=======================================
    // 功能类
    //=======================================
    class ShortcutManager {
        constructor() {
            this.currentChatIndex = 0;
            this.bindGlobalShortcuts();
        }

        bindGlobalShortcuts() {
            window.addEventListener('keydown', (e) => this.handleKeydown(e), {
                capture: true,
                passive: false
            });
        }

        handleKeydown(e) {
            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            if (!isCmdOrCtrl) return;

            const key = e.key.toLowerCase();
            const shortcut = Object.entries(CONSTANTS.SHORTCUTS)
                .find(([_, value]) => value.key === key && value.requiresCmd);

            if (!shortcut) return;

            e.preventDefault();
            e.stopPropagation();

            switch(shortcut[0]) {
                case 'TOGGLE_GROUNDING':
                    this.toggleGrounding();
                    break;
                case 'NEW_CHAT':
                    this.createNewChat();
                    break;
                case 'SWITCH_CHAT':
                    this.switchToNextChat();
                    break;
            }
        }

        toggleGrounding() {
            const searchToggle = DOMUtils.querySelector(CONSTANTS.SELECTORS.SEARCH_TOGGLE);
            searchToggle?.click();
        }

        createNewChat() {
            const newChatLink = DOMUtils.querySelector(CONSTANTS.SELECTORS.NEW_CHAT_LINK);
            if (newChatLink) {
                newChatLink.click();
                this.currentChatIndex = 0;
            }
        }

        switchToNextChat() {
            const chatLinks = DOMUtils.querySelectorAll(CONSTANTS.SELECTORS.CHAT_LINKS);
            if (chatLinks.length > 0) {
                chatLinks[this.currentChatIndex].click();
                this.currentChatIndex = (this.currentChatIndex + 1) % chatLinks.length;
            }
        }
    }

    //=======================================
    // UI相关类
    //=======================================
    class UIComponents {
        static createSettingLink() {
            return DOMUtils.createElement('a',
                { textContent: '⚙️ Easy use settings', className: 'easy-use-settings' },
                {
                    display: 'block',
                    color: '#076eff',
                    textDecoration: 'none',
                    fontSize: '14px',
                    marginBottom: '20px',
                    cursor: 'pointer'
                }
            );
        }

        static createShortcutsSection() {
            const shortcutsSection = DOMUtils.createElement('div', {}, {
                marginBottom: '24px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '4px'
            });

            const shortcutsTitle = DOMUtils.createElement('div',
                { textContent: 'Keyboard Shortcuts' },
                {
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#202124'
                }
            );

            const shortcutsList = DOMUtils.createElement('div', {}, {
                fontSize: '14px',
                color: '#5f6368'
            });

            // 创建快捷键列表
            const shortcuts = [
                { key: 'Ctrl/Cmd + i', description: 'Toggle Grounding' },
                { key: 'Ctrl/Cmd + j', description: 'New Chat' },
                { key: 'Ctrl/Cmd + /', description: 'Switch Recent Chats' }
            ];

            shortcuts.forEach(({ key, description }) => {
                const shortcutItem = DOMUtils.createElement('div');
                shortcutItem.textContent = '• ';
                const kbd = DOMUtils.createElement('kbd', { textContent: key });
                const text = document.createTextNode(`: ${description}`);
                shortcutItem.appendChild(kbd);
                shortcutItem.appendChild(text);
                shortcutsList.appendChild(shortcutItem);
            });

            shortcutsSection.appendChild(shortcutsTitle);
            shortcutsSection.appendChild(shortcutsList);
            return shortcutsSection;
        }
    }

    class DialogManager {
        constructor(settingsManager) {
            this.settingsManager = settingsManager;
            this.dialog = null;
            this.overlay = null;
        }

        createOverlay() {
            return DOMUtils.createElement('div', {}, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.5)',
                zIndex: '9999'
            });
        }

        createDialog() {
            const settings = this.settingsManager.getSettings();
            const dialog = DOMUtils.createElement('div', {}, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: '10000',
                minWidth: '450px',
                maxWidth: '700px',
                width: '50vw'
            });

            // 添加标题
            const title = DOMUtils.createElement('h2',
                { textContent: '⚙️ Easy Use Settings' },
                {
                    margin: '0 0 20px 0',
                    fontSize: '18px',
                    color: '#202124'
                }
            );
            dialog.appendChild(title);

            // 添加系统提示词设置
            const promptSection = this.createPromptSection(settings);
            dialog.appendChild(promptSection);

            // 添加字体大小设置
            const fontSection = this.createFontSection(settings);
            dialog.appendChild(fontSection);

            // 添加快捷键说明
            dialog.appendChild(UIComponents.createShortcutsSection());

            // 添加按钮
            const buttonContainer = this.createButtonContainer();
            dialog.appendChild(buttonContainer);

            return dialog;
        }

        createPromptSection(settings) {
            const section = DOMUtils.createElement('div', {}, {
                marginBottom: '24px'
            });

            const label = DOMUtils.createElement('label',
                { textContent: 'Global System Prompt' },
                {
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#202124'
                }
            );

            const textarea = document.createElement('textarea');
            textarea.value = settings.systemPrompt;
            Object.assign(textarea.style, {
                width: '100%',
                minHeight: '100px',
                marginBottom: '8px',
                padding: '8px',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                fontFamily: 'inherit',
                resize: 'vertical'
            });
            textarea.spellcheck = false;

            const resetButton = DOMUtils.createElement('button',
                { textContent: 'Reset to Default' },
                {
                    padding: '4px 8px',
                    backgroundColor: '#f8f9fa',
                    color: '#3c4043',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginBottom: '16px'
                }
            );

            resetButton.addEventListener('click', () => {
                textarea.value = CONSTANTS.DEFAULTS.SYSTEM_PROMPT;
            });

            section.appendChild(label);
            section.appendChild(textarea);
            section.appendChild(resetButton);
            return section;
        }

        createFontSection(settings) {
            const section = DOMUtils.createElement('div', {}, {
                marginBottom: '24px'
            });

            const label = DOMUtils.createElement('label',
                { textContent: 'Font Size' },
                {
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: '#202124'
                }
            );

            const buttonGroup = DOMUtils.createElement('div',
                { className: 'font-button-group' },
                {
                    display: 'flex',
                    gap: '8px',
                    width: '100%'
                }
            );

            CONSTANTS.FONT_SIZES.forEach(size => {
                const button = DOMUtils.createElement('button',
                    {
                        type: 'button',
                        value: size.value,
                        textContent: size.label,
                        title: `${size.label} (${size.size})`
                    },
                    {
                        ...this.getFontButtonStyles(size.value === settings.fontSize),
                        fontSize: size.size
                    }
                );

                if (size.value === settings.fontSize) {
                    button.setAttribute('data-selected', 'true');
                }

                button.addEventListener('click', () => this.handleFontButtonClick(button, buttonGroup));
                buttonGroup.appendChild(button);
            });

            section.appendChild(label);
            section.appendChild(buttonGroup);
            return section;
        }

        getFontButtonStyles(isSelected) {
            return {
                flex: '1',
                padding: '8px',
                border: `1px solid ${isSelected ? '#076eff' : '#dadce0'}`,
                borderRadius: '4px',
                background: isSelected ? '#e8f0fe' : 'white',
                color: isSelected ? '#076eff' : '#3c4043',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
            };
        }

        handleFontButtonClick(clickedButton, buttonGroup) {
            buttonGroup.querySelectorAll('button').forEach(btn => {
                const isThisButton = btn === clickedButton;
                Object.assign(btn.style, {
                    ...this.getFontButtonStyles(isThisButton),
                    fontSize: CONSTANTS.FONT_SIZES.find(s => s.value === btn.value)?.size
                });
                if (isThisButton) {
                    btn.setAttribute('data-selected', 'true');
                } else {
                    btn.removeAttribute('data-selected');
                }
            });
        }

        createButtonContainer() {
            const container = DOMUtils.createElement('div', {
                className: 'dialog-buttons'
            }, {
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
            });

            const saveButton = DOMUtils.createElement('button', {
                className: 'save-button',
                textContent: 'Save'
            }, {
                padding: '8px 16px',
                backgroundColor: '#076eff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
            });

            const cancelButton = DOMUtils.createElement('button', {
                className: 'cancel-button',
                textContent: 'Cancel'
            }, {
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                color: '#3c4043',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
            });

            container.appendChild(cancelButton);
            container.appendChild(saveButton);
            return container;
        }

        show() {
            this.overlay = this.createOverlay();
            this.dialog = this.createDialog();
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.dialog);
            this.bindEvents();
        }

        hide() {
            if (this.dialog && this.overlay) {
                document.body.removeChild(this.dialog);
                document.body.removeChild(this.overlay);
                this.dialog = null;
                this.overlay = null;
            }
        }

        bindEvents() {
            const saveButton = this.dialog.querySelector('.save-button');
            const cancelButton = this.dialog.querySelector('.cancel-button');

            if (saveButton && cancelButton) {
                saveButton.addEventListener('click', () => this.handleSave());
                cancelButton.addEventListener('click', () => this.hide());
            }
        }

        handleSave() {
            const textarea = this.dialog.querySelector('textarea');
            const selectedFontButton = this.dialog.querySelector('button[data-selected="true"]');

            if (!textarea || !selectedFontButton) return;

            const newSettings = {
                systemPrompt: textarea.value.trim(),
                fontSize: selectedFontButton.value
            };

            this.settingsManager.saveSettings(newSettings);
            StyleManager.updateFontSize(newSettings.fontSize);
            SystemPromptManager.update(newSettings.systemPrompt);
            this.hide();
        }
    }

    //=======================================
    // 核心管理器类
    //=======================================
    class SettingsManager {
        constructor() {
            this.settings = this.loadSettings();
        }

        loadSettings() {
            return {
                systemPrompt: localStorage.getItem(CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT) || CONSTANTS.DEFAULTS.SYSTEM_PROMPT,
                fontSize: localStorage.getItem(CONSTANTS.STORAGE_KEYS.FONT_SIZE) || CONSTANTS.DEFAULTS.FONT_SIZE
            };
        }

        saveSettings(settings) {
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.SYSTEM_PROMPT, settings.systemPrompt);
            localStorage.setItem(CONSTANTS.STORAGE_KEYS.FONT_SIZE, settings.fontSize);
            this.settings = settings;
        }

        getSettings() {
            return { ...this.settings };
        }
    }

    class AppManager {
        constructor() {
            this.settingsManager = new SettingsManager();
            this.shortcutManager = new ShortcutManager();
            this.dialogManager = new DialogManager(this.settingsManager);
        }

        init() {
            this.initSettingsLink();
            this.applyInitialSettings();
            this.observeRouteChanges();
        }

        initSettingsLink() {
            const link = UIComponents.createSettingLink();
            link.addEventListener('click', () => this.dialogManager.show());

            this.observeNavigation(link);
        }

        observeNavigation(link) {
            const observer = new MutationObserver((_, obs) => {
                const nav = DOMUtils.querySelector(CONSTANTS.SELECTORS.NAVIGATION);
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
        }

        applyInitialSettings() {
            const settings = this.settingsManager.getSettings();
            StyleManager.updateFontSize(settings.fontSize);
            this.initSystemPrompt(settings.systemPrompt);
        }

        async initSystemPrompt(prompt, maxRetries = 10, interval = 1000) {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            for (let i = 0; i < maxRetries; i++) {
                if (document.readyState !== 'complete') {
                    await wait(interval);
                    continue;
                }

                const success = await SystemPromptManager.update(prompt);
                if (success) {
                    console.log("System prompt updated successfully.");
                    return;
                }

                console.log(`Attempt ${i + 1} to set system prompt failed. Retrying...`);
                await wait(interval);
            }

            console.error(`Failed to set system prompt after ${maxRetries} attempts.`);
        }

        observeRouteChanges() {
            let lastUrl = location.href;
            const observer = new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    this.applyInitialSettings();
                }
            });

            observer.observe(document, {
                subtree: true,
                childList: true
            });
        }
    }

    // 启动应用
    new AppManager().init();
})();
