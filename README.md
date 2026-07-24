# ai-studio-easy-use

*Chrome extension builds of this script are produced with [browser-script-to-extension](https://github.com/greenzorro/browser-script-to-extension).*

Ask an agent to install it on your browser (see `# For Agent`). Afterwards you just use AI Studio as usual.

**Make Google AI Studio easier to use**

1. Automatically set Google AI Studio system prompt and enable Grounding / URL context;
2. Freely adjust chat content font size;
3. Toggle Grounding (Web Search) and URL context with Ctrl/Cmd + i;
4. Create new chat with Ctrl/Cmd + j.

**优化 Google AI Studio 使用体验**

1. 自动设置 Google AI Studio 的系统提示词，并开启 Grounding / URL context；
2. 自由调整聊天内容字号；
3. 快捷键 Ctrl/Cmd + i 开关 Grounding (网页搜索) 和 URL context；
4. 快捷键 Ctrl/Cmd + j 创建新对话。

![](https://github.com/user-attachments/assets/c668a412-f42e-465b-af70-c9826a5de4f5)

---

Created by [Victor42](https://victor42.work/) & [Agent Vik](https://github.com/agent-vik)

---

# For Agent

Install this browser enhancement on the current machine, verify it injects on AI Studio, then hand everyday chatting shortcuts to the human. Batch install/login gates; avoid multi-round tug-of-war.

This tool runs in the browser. You can install it and drive a browser session; you cannot run it headlessly without a browser tool and a logged-in Google session.

## Prerequisites

- Chromium-based browser
- Tampermonkey **or** willingness to load the repo ZIP as an unpacked extension
- Access to `https://aistudio.google.com/*` or `https://ai.dev/*` (user may need to log in)

## Steps

1. Prefer the fastest path that matches what you have:
   - **Tampermonkey:** install root `ai-studio-easy-use.js` or https://greasyfork.org/en/scripts/523344-google-ai-studio-easy-use
   - **Extension:** unzip `ai-studio-easy-use.zip` if needed → `chrome://extensions` → Developer mode → **Load unpacked** → the extension folder (Web Store link is optional / human-clicky)
2. **One handoff to the human:** approve extension/userscript install prompts; sign into Google AI Studio if the session is cold.
3. With a browser tool (if available), open AI Studio, confirm the script is enabled for the tab, and smoke-test: system prompt / Grounding or URL-context defaults appear as designed; try `Ctrl/Cmd+I` and `Ctrl/Cmd+J`.
4. Stop. Daily prompting and model work belong to the human.

## Hand off to the human

- Google account / 2FA
- Ongoing use of shortcuts and prompt settings

## Red lines

- Do not collect or store Google credentials
- Do not widen `@match` beyond AI Studio hosts
- DOM/selector breakage: consult `notes.md` (maintainer memo), do not dump it into the README
- Do not rebuild via `browser-script-to-extension` unless the human asked to republish
