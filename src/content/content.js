/**
 * PaperTranslator - Content Script
 * 功能：监听文本选中、显示翻译气泡、单词/句子智能识别
 */
(function () {
  'use strict';

  let bubble = null;
  let currentSettings = null;
  let enabled = true;
  let lastSelection = '';
  let debounceTimer = null;

  // 初始化
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (resp) => {
    if (resp?.success) {
      currentSettings = resp.data;
      enabled = resp.data.enabled;
    }
  });

  // 监听设置变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      currentSettings = changes.settings.newValue;
      enabled = currentSettings.enabled;
    }
  });

  // 监听来自后台的消息
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'CONTEXT_TRANSLATE') {
      showBubble(msg.text, null, msg.forceMode);
    } else if (msg.type === 'HOTKEY_TRANSLATE') {
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) {
        showBubble(sel.toString().trim());
      }
    } else if (msg.type === 'TOGGLE_EXTENSION') {
      enabled = !enabled;
      showToast(enabled ? 'PaperTranslator 已开启' : 'PaperTranslator 已关闭');
    }
  });

  // 鼠标松开：检测选中文本
  document.addEventListener('mouseup', (e) => {
    if (!enabled) return;
    if (e.target.closest('.paper-translator-bubble')) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';
      if (!text || text === lastSelection) return;
      if (text.length > 2000) return; // 限制长度
      lastSelection = text;
      showBubble(text, e);
    }, 150);
  });

  // 点击其他区域关闭气泡
  document.addEventListener('mousedown', (e) => {
    if (bubble && !bubble.contains(e.target)) {
      hideBubble();
      lastSelection = '';
    }
  });

  // ESC关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideBubble();
  });

  // ========== 气泡显示 ==========
  function showBubble(text, event, forceMode) {
    hideBubble();

    bubble = document.createElement('div');
    bubble.className = 'paper-translator-bubble';
    bubble.setAttribute('data-theme', currentSettings?.theme || 'light');
    bubble.innerHTML = `
      <div class="pt-header">
        <span class="pt-title">PaperTranslator</span>
        <span class="pt-mode-tag">检测中...</span>
        <button class="pt-close" title="关闭">×</button>
      </div>
      <div class="pt-source">${escapeHtml(text.length > 300 ? text.slice(0, 300) + '...' : text)}</div>
      <div class="pt-loading">
        <div class="pt-spinner"></div>
        <span>翻译中...</span>
      </div>
      <div class="pt-result" style="display:none;"></div>
      <div class="pt-footer">
        <button class="pt-btn pt-copy" style="display:none;">复制译文</button>
        <button class="pt-btn pt-retry" style="display:none;">重试</button>
        <span class="pt-engine"></span>
      </div>
    `;
    document.body.appendChild(bubble);

    // 定位
    positionBubble(event);

    // 关闭按钮
    bubble.querySelector('.pt-close').onclick = hideBubble;

    // 发送翻译请求
    requestTranslation(text, forceMode);
  }

  function positionBubble(event) {
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    let x, y;

    if (event) {
      x = event.clientX;
      y = event.clientY + 15;
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const selRect = range.getBoundingClientRect();
        x = selRect.left + selRect.width / 2;
        y = selRect.bottom + 8;
      } else {
        x = window.innerWidth / 2;
        y = window.innerHeight / 3;
      }
    }

    // 边界修正
    const bw = rect.width || 360;
    const bh = rect.height || 200;
    if (x + bw > window.innerWidth - 10) x = window.innerWidth - bw - 10;
    if (x < 10) x = 10;
    if (y + bh > window.innerHeight - 10) y = (event ? event.clientY - bh - 15 : y) - 10;
    if (y < 10) y = 10;

    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
  }

  function hideBubble() {
    if (bubble) {
      bubble.remove();
      bubble = null;
    }
  }

  // ========== 翻译请求 ==========
  function requestTranslation(text, forceMode) {
    chrome.runtime.sendMessage(
      { type: 'TRANSLATE_REQUEST', payload: { text, forceMode } },
      (resp) => {
        if (!bubble) return;
        const loading = bubble.querySelector('.pt-loading');
        const result = bubble.querySelector('.pt-result');
        const modeTag = bubble.querySelector('.pt-mode-tag');
        const engineTag = bubble.querySelector('.pt-engine');
        const copyBtn = bubble.querySelector('.pt-copy');
        const retryBtn = bubble.querySelector('.pt-retry');

        if (resp?.success) {
          const data = resp.data;
          loading.style.display = 'none';
          result.style.display = 'block';
          modeTag.textContent = data.mode === 'word' ? '单词释义' : '句子翻译';
          modeTag.className = 'pt-mode-tag ' + (data.mode === 'word' ? 'mode-word' : 'mode-sentence');
          engineTag.textContent = '引擎: ' + data.engine;
          copyBtn.style.display = 'inline-block';

          // 渲染结果
          result.innerHTML = renderResult(data);

          // 复制功能
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(data.text).then(() => {
              copyBtn.textContent = '已复制!';
              setTimeout(() => copyBtn.textContent = '复制译文', 1500);
            });
          };
        } else {
          loading.style.display = 'none';
          result.style.display = 'block';
          result.innerHTML = `<div class="pt-error">翻译失败: ${escapeHtml(resp?.error || '未知错误')}</div>`;
          retryBtn.style.display = 'inline-block';
          retryBtn.onclick = () => {
            loading.style.display = 'flex';
            result.style.display = 'none';
            retryBtn.style.display = 'none';
            requestTranslation(text, forceMode);
          };
        }
        positionBubble();
      }
    );
  }

  function renderResult(data) {
    let html = `<div class="pt-translation">${escapeHtml(data.text)}</div>`;

    // 单词详细释义
    if (data.mode === 'word' && data.detail) {
      if (data.detail.phonetic) {
        html += `<div class="pt-phonetic">/${escapeHtml(data.detail.phonetic)}/</div>`;
      }
      if (data.detail.explanations && data.detail.explanations.length > 0) {
        html += '<ul class="pt-explanations">';
        data.detail.explanations.forEach(exp => {
          html += `<li>${escapeHtml(exp)}</li>`;
        });
        html += '</ul>';
      }
      // Google词典数据
      if (Array.isArray(data.detail)) {
        data.detail.forEach(d => {
          html += `<div class="pt-dict-pos">${escapeHtml(d.pos || '')}</div>`;
          if (d.terms) html += `<div class="pt-dict-terms">${d.terms.map(t => escapeHtml(t)).join(', ')}</div>`;
        });
      }
    }

    return html;
  }

  // ========== Toast 提示 ==========
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'paper-translator-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
