import { getSettings, saveSettings, clearHistory } from '../lib/settings.js';

const enableToggle = document.getElementById('enableToggle');
const quickInput = document.getElementById('quickInput');
const quickBtn = document.getElementById('quickBtn');
const quickEngine = document.getElementById('quickEngine');
const quickResult = document.getElementById('quickResult');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const engineName = document.getElementById('engineName');

// 加载设置
async function loadSettings() {
  const s = await getSettings();
  enableToggle.checked = s.enabled;
  quickEngine.value = s.defaultEngine;
  engineName.textContent = s.defaultEngine === 'google' ? 'Google' : s.defaultEngine === 'deepl' ? 'DeepL' : 'OpenAI';
  renderHistory(s.history || []);
}

// 开关
enableToggle.addEventListener('change', async () => {
  const s = await getSettings();
  await saveSettings({ ...s, enabled: enableToggle.checked });
});

// 快速翻译
quickBtn.addEventListener('click', async () => {
  const text = quickInput.value.trim();
  if (!text) return;
  quickBtn.disabled = true;
  quickBtn.textContent = '翻译中...';
  quickResult.style.display = 'none';

  chrome.runtime.sendMessage(
    { type: 'TRANSLATE_REQUEST', payload: { text, forceMode: null } },
    (resp) => {
      quickBtn.disabled = false;
      quickBtn.textContent = '翻译';
      if (resp?.success) {
        quickResult.style.display = 'block';
        quickResult.textContent = resp.data.text;
      } else {
        quickResult.style.display = 'block';
        quickResult.textContent = '翻译失败: ' + (resp?.error || '未知错误');
        quickResult.style.color = '#e74c3c';
      }
    }
  );
});

// 引擎切换
quickEngine.addEventListener('change', async () => {
  const s = await getSettings();
  await saveSettings({ ...s, defaultEngine: quickEngine.value });
  engineName.textContent = quickEngine.value === 'google' ? 'Google' : quickEngine.value === 'deepl' ? 'DeepL' : 'OpenAI';
});

// 历史渲染
function renderHistory(history) {
  historyCount.textContent = history.length;
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-history">暂无翻译记录</div>';
    return;
  }
  historyList.innerHTML = history.slice(0, 10).map(h => `
    <div class="history-item">
      <div class="history-src">${escapeHtml(h.text.slice(0, 50))}</div>
      <div class="history-trans">${escapeHtml(h.translation.slice(0, 60))}</div>
      <div class="history-meta">${h.mode === 'word' ? '单词' : '句子'} · ${h.engine} · ${new Date(h.time).toLocaleTimeString()}</div>
    </div>
  `).join('');
}

// 清空历史
document.getElementById('clearHistory').addEventListener('click', async () => {
  await clearHistory();
  renderHistory([]);
});

// 打开设置
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

loadSettings();
