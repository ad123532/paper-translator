/**
 * PaperTranslator - 默认配置与存储工具
 */
export const DEFAULT_SETTINGS = {
  enabled: true,
  defaultEngine: 'google',        // google | deepl | openai
  targetLang: 'zh-CN',            // 目标语言
  triggerMode: 'select',          // select: 选中即译 | hotkey: 仅快捷键 | double: 双击
  showPhonetic: true,             // 单词显示音标
  showDetail: true,               // 显示详细释义
  autoCopy: false,                // 自动复制译文
  fontSize: 14,                   // 气泡字号
  theme: 'light',                 // light | dark | auto
  deeplApiKey: '',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: 'https://api.openai.com/v1',
  blacklist: [],                  // 禁用网站列表
  history: []                     // 翻译历史（最多50条）
};

export async function getSettings() {
  const result = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

export async function addHistory(item) {
  const settings = await getSettings();
  const history = [item, ...(settings.history || [])].slice(0, 50);
  await saveSettings({ ...settings, history });
}

export async function clearHistory() {
  const settings = await getSettings();
  await saveSettings({ ...settings, history: [] });
}
