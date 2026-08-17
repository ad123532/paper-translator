/**
 * PaperTranslator - 多翻译引擎封装
 * 支持：Google Translate(免费)、有道词典、DeepL、OpenAI
 * 统一接口：translate(text, options) => { text, detail, engine, sourceLang }
 */

// ========== 工具函数 ==========
export function detectLanguage(text) {
  if (!text || !text.trim()) return 'auto';
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  return 'en';
}

export function isSingleWord(text) {
  const t = text.trim();
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(t);
}

// ========== Google Translate (免费端点) ==========
export async function googleTranslate(text, from = 'auto', to = 'zh-CN') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=bd&dj=1&q=${encodeURIComponent(text)}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`Google HTTP ${resp.status}`);
  const data = await resp.json();

  let translated = '';
  if (data.sentences) translated = data.sentences.map(s => s.trans).join('');

  let dictionary = null;
  if (data.dict) {
    dictionary = data.dict.map(d => ({ pos: d.pos, terms: d.terms || [], entry: d.entry || [] }));
  }

  return { text: translated, detail: dictionary, engine: 'google', sourceLang: data.src || from };
}

// ========== 有道词典（单词详细释义） ==========
export async function youdaoDictionary(word) {
  const url = `https://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&q=${encodeURIComponent(word)}&dicts=%7B%22count%22%3A99%2C%22dicts%22%3A%5B%5B%22ec%22%2C%22ce%22%2C%22newce%22%5D%5D%7D`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`Youdao HTTP ${resp.status}`);
  const data = await resp.json();

  let phonetic = '';
  let explanations = [];

  if (data.ec && data.ec.word) {
    const w = data.ec.word;
    phonetic = w.ukphone || w.usphone || w.phone || '';
    if (w.trs) {
      explanations = w.trs.map(t => {
        const tr = t.tr;
        if (Array.isArray(tr)) return tr.map(x => x.l?.i?.[0] || x.i || '').filter(Boolean).join('; ');
        return tr?.l?.i?.[0] || tr?.i || '';
      }).filter(Boolean);
    }
  }
  if (data.ce && data.ce.word && explanations.length === 0) {
    const w = data.ce.word;
    phonetic = w.phone || '';
    if (w.trs) {
      explanations = w.trs.map(t => {
        const tr = t.tr;
        if (Array.isArray(tr)) return tr.map(x => x.l?.i?.[0] || x.i || '').filter(Boolean).join('; ');
        return tr?.l?.i?.[0] || tr?.i || '';
      }).filter(Boolean);
    }
  }

  return {
    text: explanations.join('\n') || word,
    detail: { phonetic, explanations },
    engine: 'youdao',
    sourceLang: 'en'
  };
}

// ========== DeepL ==========
export async function deeplTranslate(text, apiKey, from = null, to = 'ZH') {
  const isFree = apiKey?.endsWith(':fx');
  const baseUrl = isFree ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const body = new URLSearchParams({ text, target_lang: to });
  if (from) body.append('source_lang', from);

  const resp = await fetch(`${baseUrl}/v2/translate`, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  if (!resp.ok) throw new Error(`DeepL HTTP ${resp.status}`);
  const data = await resp.json();
  return { text: data.translations?.[0]?.text || '', detail: null, engine: 'deepl', sourceLang: data.translations?.[0]?.detected_source_language || from };
}

// ========== OpenAI 兼容接口 ==========
export async function openaiTranslate(text, apiKey, model = 'gpt-4o-mini', to = '中文', baseUrl = 'https://api.openai.com/v1') {
  const prompt = `你是专业的学术文献翻译助手。请将以下文本翻译成${to}。要求：1.保持专业术语准确；2.保留原文格式；3.仅输出翻译结果。\n\n原文：\n${text}`;
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 })
  });
  if (!resp.ok) throw new Error(`OpenAI HTTP ${resp.status}`);
  const data = await resp.json();
  return { text: data.choices?.[0]?.message?.content?.trim() || '', detail: null, engine: 'openai', sourceLang: 'auto' };
}

// ========== 统一调度器 ==========
export async function translate(text, options = {}) {
  const { engine = 'google', from = 'auto', to = 'zh-CN', apiKey = '', model = 'gpt-4o-mini', baseUrl = 'https://api.openai.com/v1', preferDictionary = true } = options;
  const trimmed = text.trim();
  if (!trimmed) throw new Error('空文本');

  // 单词优先走有道词典
  if (isSingleWord(trimmed) && preferDictionary) {
    try { return await youdaoDictionary(trimmed); } catch (e) { console.warn('[PaperTranslator] 有道失败，回退:', e.message); }
  }

  switch (engine) {
    case 'deepl':
      if (!apiKey) throw new Error('DeepL 需要 API Key');
      return await deeplTranslate(trimmed, apiKey, from === 'auto' ? null : from.toUpperCase(), to.toUpperCase());
    case 'openai':
      if (!apiKey) throw new Error('OpenAI 需要 API Key');
      return await openaiTranslate(trimmed, apiKey, model, to, baseUrl);
    case 'google':
    default:
      return await googleTranslate(trimmed, from, to);
  }
}
