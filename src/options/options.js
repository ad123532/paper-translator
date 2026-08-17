import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../lib/settings.js';

const elements = {
  enabled: document.getElementById('enabled'),
  targetLang: document.getElementById('targetLang'),
  triggerMode: document.getElementById('triggerMode'),
  showPhonetic: document.getElementById('showPhonetic'),
  showDetail: document.getElementById('showDetail'),
  autoCopy: document.getElementById('autoCopy'),
  blacklist: document.getElementById('blacklist'),
  theme: document.getElementById('theme'),
  fontSize: document.getElementById('fontSize'),
  fontSizeValue: document.getElementById('fontSizeValue'),
  deeplApiKey: document.getElementById('deeplApiKey'),
  openaiApiKey: document.getElementById('openaiApiKey'),
  openaiModel: document.getElementById('openaiModel'),
  openaiBaseUrl: document.getElementById('openaiBaseUrl')
};

// Tab 切换
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// 加载设置
async function load() {
  const s = await getSettings();
  elements.enabled.checked = s.enabled;
  elements.targetLang.value = s.targetLang;
  elements.triggerMode.value = s.triggerMode;
  elements.showPhonetic.checked = s.showPhonetic;
  elements.showDetail.checked = s.showDetail;
  elements.autoCopy.checked = s.autoCopy;
  elements.blacklist.value = (s.blacklist || []).join('\n');
  elements.theme.value = s.theme;
  elements.fontSize.value = s.fontSize;
  elements.fontSizeValue.textContent = s.fontSize;
  elements.deeplApiKey.value = s.deeplApiKey || '';
  elements.openaiApiKey.value = s.openaiApiKey || '';
  elements.openaiModel.value = s.openaiModel || 'gpt-4o-mini';
  elements.openaiBaseUrl.value = s.openaiBaseUrl || 'https://api.openai.com/v1';

  document.querySelector(`input[name="engine"][value="${s.defaultEngine}"]`).checked = true;
}

// 字号实时显示
elements.fontSize.addEventListener('input', () => {
  elements.fontSizeValue.textContent = elements.fontSize.value;
});

// 保存
document.getElementById('saveBtn').addEventListener('click', async () => {
  const engine = document.querySelector('input[name="engine"]:checked').value;
  const settings = {
    enabled: elements.enabled.checked,
    targetLang: elements.targetLang.value,
    triggerMode: elements.triggerMode.value,
    showPhonetic: elements.showPhonetic.checked,
    showDetail: elements.showDetail.checked,
    autoCopy: elements.autoCopy.checked,
    blacklist: elements.blacklist.value.split('\n').map(s => s.trim()).filter(Boolean),
    theme: elements.theme.value,
    fontSize: parseInt(elements.fontSize.value),
    defaultEngine: engine,
    deeplApiKey: elements.deeplApiKey.value.trim(),
    openaiApiKey: elements.openaiApiKey.value.trim(),
    openaiModel: elements.openaiModel.value.trim() || 'gpt-4o-mini',
    openaiBaseUrl: elements.openaiBaseUrl.value.trim() || 'https://api.openai.com/v1'
  };

  const current = await getSettings();
  await saveSettings({ ...current, ...settings });

  const status = document.getElementById('saveStatus');
  status.textContent = '✓ 设置已保存';
  status.classList.add('show');
  setTimeout(() => status.classList.remove('show'), 2000);
});

// 恢复默认
document.getElementById('resetBtn').addEventListener('click', async () => {
  if (confirm('确定要恢复所有默认设置吗？')) {
    await saveSettings({ ...DEFAULT_SETTINGS });
    await load();
    const status = document.getElementById('saveStatus');
    status.textContent = '✓ 已恢复默认设置';
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2000);
  }
});

// 打开快捷键设置
document.getElementById('openShortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

load();
