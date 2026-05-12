# UND 年年吉祥 試算工具

富邦人壽 UNDA 變額萬能壽險試算工具（甲型 · 年繳 · 金融機構轉帳）

## 使用方式

直接開啟 `index.html`，或部署至任何靜態網站服務（GitHub Pages、Netlify 等）。

不需要伺服器，不需要安裝套件，純前端。

## 檔案結構

```
und-tool/
├── index.html        # 主頁面與 HTML 結構
├── css/
│   ├── style.css     # 主要樣式（佈局、元件、顏色）
│   └── animate.css   # 動畫 keyframes 與入場效果
├── js/
│   ├── data.js       # 危險保費率表、保額倍數表、費用率常數
│   ├── calc.js       # 核心試算邏輯（保額計算、年度試算）
│   ├── ui.js         # UI 更新、使用者互動
│   └── animate.js    # 動畫執行（metric 彈入、表格逐行滑入）
└── README.md
```

## 部署到 GitHub Pages

1. Push 整個資料夾至 GitHub repo
2. Settings → Pages → Branch: `main` / `root`
3. 即可透過 `https://your-username.github.io/repo-name/` 存取

## 動畫效果說明

- **卡片入場**：頁面載入時三張輸入卡依序飄入（CSS stagger）
- **年繳數字**：月存金額更改時，年繳顯示有翻轉動畫
- **保額區間條**：顯示目前保額在可選區間的位置，動態填色
- **試算按鈕**：按下後顯示 loading 脈動，有視覺回饋
- **結果 metric**：逐一彈入 + 數值閃現效果
- **表格逐行**：每行依序滑入，使用 IntersectionObserver 優化效能
- **無障礙**：自動偵測 `prefers-reduced-motion`，關閉所有動畫

## 計算說明

- **甲型**：身故保障 = MAX(保額, 帳戶價值)
- **乙型**：身故保障 = 保額 + 帳戶價值
- 危險保額每月 = 保額 − 帳戶價值（甲型，≥ 0）
- 帳戶價值月遞推：前月餘額 + 本月淨投入 − 月危險保費，再 × (1 + 月投報率)
