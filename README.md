# 📖 PaperTranslator - 文献阅读翻译助手

> 一款专注于学术文献阅读的免费开源浏览器翻译插件。**选中单词查词典释义，选中句子整句翻译**，智能识别，即划即译。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge%20%7C%20Firefox-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)

## ✨ 核心特性

- 🎯 **智能识别** — 自动判断选中文本是单词还是句子，单词走词典、句子走翻译
- 📚 **单词详解** — 音标、词性、多释义，来自有道词典
- 🌐 **多引擎支持** — Google Translate（免费默认）、DeepL、OpenAI 兼容接口
- 📄 **全网页支持** — 学术网站、PDF 在线预览、任意网页均可划词
- ⌨️ **快捷键** — `Alt+T` 翻译选中，`Alt+Shift+T` 开关插件
- 🖱️ **右键菜单** — 选中后右键可强制选择"查单词"或"翻译句子"
- 🌙 **深色模式** — 支持浅色/深色/跟随系统
- 🔒 **隐私安全** — 无广告、无追踪、无数据采集，翻译请求直连引擎
- 💾 **翻译历史** — 本地记录最近 50 条翻译，方便回顾
- ⚙️ **高度可配** — 目标语言、触发方式、黑名单、字号等均可自定义

## 🖼️ 效果预览

### 单词翻译
选中单个英文单词 → 显示音标 + 多词性释义

### 句子翻译
选中完整句子 → 整句翻译结果

## 🚀 安装方法

### 方式一：开发者模式加载（推荐）

1. 下载本项目源码（或 `git clone`）
2. 打开浏览器扩展管理页面：
   - Chrome: 地址栏输入 `chrome://extensions/`
   - Edge: 地址栏输入 `edge://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目中的 `paper-translator` 文件夹
6. 安装完成，浏览器工具栏出现 PaperTranslator 图标

### 方式二：打包安装
将 `paper-translator` 文件夹打包为 `.zip`，在扩展页面拖入即可。

## 📖 使用指南

### 基础使用
1. 在任意网页上用鼠标选中文本
2. 松开鼠标后自动弹出翻译气泡
3. 单词显示词典释义，句子显示翻译结果
4. 点击「复制译文」可复制到剪贴板
5. 按 `ESC` 或点击页面其他区域关闭气泡

### 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Alt + T` | 翻译当前选中文本 |
| `Alt + Shift + T` | 开启/关闭划词翻译 |

### 右键菜单
选中文本后右键，可选择：
- **PaperTranslator 翻译** — 自动识别模式
- **翻译为完整句子** — 强制句子翻译模式
- **查单词释义** — 强制单词词典模式

### 配置翻译引擎
点击插件图标 → 「详细设置」→「翻译引擎」：
- **Google Translate**：默认免费，无需配置
- **DeepL**：需填入 API Key（免费版每月 50 万字符）
- **OpenAI**：需填入 API Key，支持自定义模型和兼容端点（如国内代理）

> 💡 单词翻译默认优先使用有道词典获取详细释义，不受句子翻译引擎设置影响。

## 🛠️ 技术架构

```
paper-translator/
├── manifest.json              # 扩展清单 (Manifest V3)
├── icons/                     # 扩展图标
├── src/
│   ├── background/
│   │   └── service-worker.js  # 后台服务：消息中转、翻译调度、右键菜单
│   ├── content/
│   │   ├── content.js         # 内容脚本：选词监听、气泡渲染
│   │   └── content.css        # 气泡样式
│   ├── popup/                 # 工具栏弹窗：快速翻译、历史记录
│   ├── options/               # 设置页面：引擎配置、外观、快捷键
│   └── lib/
│       ├── translators.js     # 多翻译引擎封装（Google/有道/DeepL/OpenAI）
│       └── settings.js        # 配置存储与默认值
└── generate-icons.ps1         # 图标生成脚本
```

### 核心流程
```
用户选中文本 → content.js 监听 mouseup
    → 判断单词/句子 (isSingleWord)
    → 发送 TRANSLATE_REQUEST 到 service-worker
    → service-worker 调用对应翻译引擎
    → 单词: 有道词典 → 失败回退 Google
    → 句子: Google / DeepL / OpenAI (按配置)
    → 返回结果 → content.js 渲染气泡
```

## 📋 系统要求

- Chrome 88+ / Edge 88+ / Firefox 109+（支持 Manifest V3）
- 网络连接（翻译需要访问对应引擎服务）

## 🔧 开发说明

### 本地调试
1. 按安装方式加载扩展
2. 修改源码后，在扩展管理页面点击刷新按钮
3. content script 修改需刷新目标网页生效
4. service worker 修改需在扩展页面点击「service worker」重新加载

### 添加新翻译引擎
在 `src/lib/translators.js` 中：
1. 实现 `yourEngineTranslate(text, ...)` 函数
2. 在 `translate()` 统一调度器的 `switch` 中添加 case
3. 在 `src/options/options.html` 中添加配置 UI
4. 在 `manifest.json` 的 `host_permissions` 中添加引擎域名

## 🤝 参考与致谢

本项目参考了以下优秀开源项目的设计思路：

- [nextai-translator](https://github.com/nextai-translator/nextai-translator) — 基于 AI API 的划词翻译插件（24.9k⭐）
- [ext-saladict 沙拉查词](https://github.com/crimx/ext-saladict) — 全能划词词典与 PDF 选词（13.3k⭐）
- [FluentRead](https://github.com/FluentRead/FluentRead) — 双语网页阅读与即时划词翻译（7.5k⭐）

## 📄 许可证

[MIT License](LICENSE) — 免费开源，可自由使用、修改、分发。

## 🐛 问题反馈

如遇问题或有功能建议，欢迎在 GitHub Issues 中反馈。

---

**PaperTranslator** — 让学术文献阅读不再有语言障碍。
