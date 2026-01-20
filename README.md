# Snow Leaf ID Playground ❄️🍃

> 互動學習 Snowflake 與 Leaf-Segment 分散式 ID 生成算法

[![Deploy to GitHub Pages](https://github.com/YOUR_USERNAME/snow-leaf-id-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/snow-leaf-id-playground/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 簡介

Snow Leaf ID Playground 是一個教育性質的互動式單頁網站，幫助開發者深入理解兩種主流的分散式 ID 生成算法：

- **Snowflake** - Twitter 開源的 64-bit 分散式 ID 算法
- **Leaf-Segment** - 美團開源的基於號段模式的 ID 生成方案

## 功能特色

### Snowflake 模組
- 📊 64-bit 位元結構視覺化
- 🔧 互動式參數調整（Epoch、Datacenter ID、Worker ID、Sequence）
- 🔄 即時 ID 生成與解析
- 📋 批量生成功能

### Leaf-Segment 模組
- 🗄️ 資料庫表結構展示
- 🔀 雙 Buffer 機制動態視覺化
- ⚡ 高併發模擬
- 💥 資料庫故障模擬

### 比較與決策
- 📈 詳細的算法比較表
- 🌳 互動式決策樹
- 📝 多語言實作範例（Java、Python、JavaScript）

## 技術棧

- **純靜態資源** - HTML、CSS、JavaScript（無後端服務）
- **現代 CSS** - CSS Variables、Flexbox、Grid
- **原生 JavaScript** - ES6+ 模組化設計
- **響應式設計** - 支援桌面與平板裝置

## 快速開始

### 本地開發

```bash
# Clone 專案
git clone https://github.com/YOUR_USERNAME/snow-leaf-id-playground.git
cd snow-leaf-id-playground

# 使用任意 HTTP 伺服器啟動
# 例如使用 Python
python -m http.server 8080

# 或使用 Node.js 的 serve
npx serve
```

然後在瀏覽器中開啟 `http://localhost:8080`

### 部署

專案已配置 GitHub Actions，推送到 `main` 分支會自動部署到 GitHub Pages。

## 專案結構

```
snow-leaf-id-playground/
├── index.html              # 主頁面
├── css/
│   ├── variables.css       # CSS 變數定義
│   ├── style.css           # 主樣式
│   ├── animations.css      # 動畫定義
│   └── responsive.css      # 響應式樣式
├── js/
│   ├── main.js             # 主程式進入點
│   ├── snowflake.js        # Snowflake 算法實作
│   ├── leaf-segment.js     # Leaf-Segment 模擬器
│   ├── visualizer.js       # 視覺化元件
│   ├── ui-components.js    # UI 互動元件
│   └── utils.js            # 工具函數
├── assets/                 # 靜態資源
├── .github/workflows/      # GitHub Actions 配置
├── README.md
└── LICENSE
```

## 算法概述

### Snowflake

Snowflake 將 64-bit 整數劃分為多個區塊：

```
┌────────┬────────────────────────┬──────────┬──────────────┐
│ 1 bit  │        41 bits         │ 10 bits  │   12 bits    │
│ 符號位  │        時間戳記         │ 機器 ID  │    序列號    │
│   0    │ 毫秒級時間戳 (69年週期) │ 最多1024 │ 每毫秒4096個 │
└────────┴────────────────────────┴──────────┴──────────────┘
```

**特點：**
- 無外部依賴，本地生成
- 每秒可生成約 409.6 萬個 ID（單機）
- ID 趨勢遞增

### Leaf-Segment

Leaf-Segment 採用預分配號段的方式：

```
┌─────────────────────────────────────────────────────────┐
│                    Database Table                       │
│  ┌──────────┬─────────┬──────────┬───────────────────┐  │
│  │ biz_tag  │ max_id  │   step   │    update_time    │  │
│  └──────────┴─────────┴──────────┴───────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Memory                    │
│  ┌───────────────────────┬───────────────────────────┐  │
│  │  Buffer 1 (Active)    │  Buffer 2 (Standby)       │  │
│  └───────────────────────┴───────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**特點：**
- ID 完全連續遞增
- 雙 Buffer 確保高可用
- 支援多業務標籤隔離

## 瀏覽器支援

- Chrome (最新兩個版本)
- Firefox (最新兩個版本)
- Safari (最新兩個版本)
- Edge (最新兩個版本)

## 延伸閱讀

- [Twitter Snowflake 原始公告](https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake)
- [Leaf - 美團分散式 ID 生成服務](https://tech.meituan.com/2017/04/21/mt-leaf.html)
- [百度 UidGenerator](https://github.com/baidu/uid-generator)
- [滴滴 TinyID](https://github.com/didi/tinyid)

## 授權

本專案採用 [MIT License](LICENSE) 授權。

## 貢獻

歡迎提交 Issue 和 Pull Request！

---

Made with ❤️ for the developer community
