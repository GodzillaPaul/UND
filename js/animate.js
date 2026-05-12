/* ══════════════════════════════════════
   animate.js — 動畫執行邏輯
   ══════════════════════════════════════ */

/**
 * animateResults()
 * 試算完成後觸發：
 *  1. metric 卡片逐一彈入
 *  2. metric 數值閃現
 *  3. 表格每行依序滑入
 */
function animateResults() {
  animateMetrics();
  animateTableRows();
}

/* ── 1. Metric 卡片彈入 ── */
function animateMetrics() {
  const metrics = document.querySelectorAll('#info-cards .metric');
  metrics.forEach((el, i) => {
    el.style.opacity = '0';
    setTimeout(() => {
      el.style.opacity = '';
      el.classList.add('anim-pop');
      // 數值閃現
      const val = el.querySelector('.metric-val');
      if (val) {
        val.classList.remove('anim-count');
        void val.offsetWidth;
        val.classList.add('anim-count');
      }
    }, i * 55);
  });
}

/* ── 2. 表格逐行滑入 ── */
function animateTableRows() {
  const rows = document.querySelectorAll('#tbl-body tr');
  // 用 IntersectionObserver 讓行進入視窗才動
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const idx = parseInt(row.dataset.rowIdx || 0);
        setTimeout(() => {
          row.classList.add('row-visible');
        }, idx * 18); // 每行間隔 18ms，快速連帶感
        observer.unobserve(row);
      }
    });
  }, { threshold: 0.1 });

  rows.forEach((row, i) => {
    row.dataset.rowIdx = i;
    row.classList.remove('row-visible');
    observer.observe(row);
  });
}

/* ── 3. 數字滾動計數器 ── */
/**
 * countUp(el, targetNum, duration)
 * 讓一個 DOM 元素的數字從 0 滾到目標值
 * 用於想要強調的關鍵數字（帳戶價值、身故保障）
 */
function countUp(el, targetNum, duration = 600) {
  const start     = performance.now();
  const formatter = new Intl.NumberFormat('zh-TW');

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out cubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * targetNum);
    el.textContent = formatter.format(current);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── 4. 頁面載入後 card stagger 已由 CSS 處理 ── */
/* 補充：如果 prefers-reduced-motion，關閉所有動畫 */
(function respectReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }
})();
