/**
 * PaperTranslator - Background Service Worker
 * 负责：消息中转、翻译请求、右键菜单、快捷键
 */
import { translate, isSingleWord } from '../lib/translators.js';
import { getSettings, addHistory } from '../lib/settings.js';

// 安装时初始化
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  console.log('[PaperTranslator] 已安装/更新，当前配置:', settings);

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'paper-translate',
    title: 'PaperTranslator 翻译: "%s"',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'paper-translate-sentence',
    title: '翻译为完整句子',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'paper-translate-word',
    title: '查单词释义',
    contexts: ['selection']
  });
});

// 右键菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText || !tab?.id) return;
  const forceMode = info.menuItemId === 'paper-translate-word' ? 'word'
                  : info.menuItemId === 'paper-translate-sentence' ? 'sentence' : null;
  chrome.tabs.sendMessage(tab.id, {
    type: 'CONTEXT_TRANSLATE',
    text: info.selectionText,
    forceMode
  });
});

// 快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  if (command === 'translate-selection') {
    chrome.tabs.sendMessage(tab.id, { type: 'HOTKEY_TRANSLATE' });
  } else if (command === 'toggle-extension') {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_EXTENSION' });
  }
});

// 消息处理
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TRANSLATE_REQUEST') {
    handleTranslate(msg.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // 异步响应
  }
  if (msg.type === 'GET_SETTINGS') {
    getSettings().then(s => sendResponse({ success: true, data: s }));
    return true;
  }
});

async function handleTranslate({ text, forceMode }) {
  const settings = await getSettings();
  const singleWord = isSingleWord(text);
  const mode = forceMode || (singleWord ? 'word' : 'sentence');

  const result = await translate(text, {
    engine: settings.defaultEngine,
    to: settings.targetLang,
    apiKey: settings.defaultEngine === 'deepl' ? settings.deeplApiKey
          : settings.defaultEngine === 'openai' ? settings.openaiApiKey : '',
    model: settings.openaiModel,
    baseUrl: settings.openaiBaseUrl,
    preferDictionary: mode === 'word'
  });

  // 记录历史
  await addHistory({
    text: text.slice(0, 200),
    translation: result.text.slice(0, 200),
    mode,
    engine: result.engine,
    time: Date.now()
  });

  return { ...result, mode };
}
