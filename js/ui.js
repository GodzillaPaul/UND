/* ══════════════════════════════════════
   ui.js — UI 更新與互動邏輯
   ══════════════════════════════════════ */

let userEditedSA = false;

function getCurrentInputs() {
  const birth  = parseRoc(document.getElementById('bday').value.trim());
  const sex    = document.getElementById('sex').value;
  const target = parseFloat(document.getElementById('target').value) || 0;
  const ptype  = (document.getElementById('ptype') || { value: 'A' }).value;
  return { birth, sex, target, ptype };
}

function onMonthlyChange() {
  const monthly     = parseFloat(document.getElementById('monthly').value) || 0;
  const annualTarget = Math.round(monthly * 12 / 100) * 100;
  document.getElementById('target').value = annualTarget;

  // Animate annual value flip
  const valEl = document.getElementById('target-display');
  valEl.classList.remove('anim-flip');
  void valEl.offsetWidth;
  valEl.textContent = fmt(annualTarget);
  valEl.classList.add('anim-flip');

  onInputChange();
}

function onInputChange() {
  userEditedSA = false;
  updateUI();
}

function onSAInput() {
  userEditedSA = true;
  const { birth, sex, target } = getCurrentInputs();
  if (!birth || target <= 0) return;
  const age   = calcInsureAge(birth.year, birth.month, birth.day);
  const minSA = calcMinSA(target, age, sex);
  const maxSA = calcMaxSA(target, age, sex);
  const cur   = parseFloat(document.getElementById('sa').value) || 0;
  const badge = document.getElementById('sa-badge');
  let text, warn;
  if      (cur < minSA) { text = '⚠ 低於最低保額'; warn = true; }
  else if (cur === minSA) { text = '✓ 最低保額'; warn = false; }
  else if (cur > maxSA) { text = '⚠ 超過最高保額'; warn = true; }
  else                   { text = '✓ 自訂保額'; warn = false; }
  badge.textContent = text;
  badge.className   = 'sa-badge' + (warn ? ' warn' : '');
  triggerPop(badge);

  // Update bar thumb position
  updateRangeBar(cur, minSA, maxSA);
}

function updateUI() {
  const { birth, sex, target } = getCurrentInputs();
  if (!birth || target <= 0) return;

  const age   = calcInsureAge(birth.year, birth.month, birth.day);
  const minSA = calcMinSA(target, age, sex);
  const maxSA = calcMaxSA(target, age, sex);

  // SA range display
  document.getElementById('sa-range-vals').innerHTML = `
    <span class="info-range-val">${fmt(minSA)}</span>
    <span class="info-range-sep">～</span>
    <span class="info-range-val">${fmt(maxSA)}</span>
    <span class="info-range-sep" style="font-size:12px">元</span>`;
  document.getElementById('sa-range-note').textContent = `投保年齡 ${age} 歲`;

  if (!userEditedSA) {
    document.getElementById('sa').value = minSA;
    const badge = document.getElementById('sa-badge');
    badge.textContent = '✓ 最低保額（自動帶入）';
    badge.className   = 'sa-badge';
    updateRangeBar(minSA, minSA, maxSA);
  }
}

function updateRangeBar(cur, minSA, maxSA) {
  const wrap  = document.getElementById('sa-range-bar-wrap');
  const fill  = document.getElementById('sa-range-bar-fill');
  const thumb = document.getElementById('sa-range-bar-thumb');
  if (!wrap) return;

  wrap.style.display = 'block';
  const range = maxSA - minSA;
  const ratio = range > 0 ? Math.min(Math.max((cur - minSA) / range, 0), 1) : 0;
  const pctVal = (ratio * 100).toFixed(1) + '%';

  fill.style.width  = pctVal;
  thumb.style.left  = pctVal;

  // Trigger animation once
  if (!fill.dataset.animated) {
    fill.classList.add('anim-grow');
    thumb.classList.add('anim-appear');
    fill.dataset.animated = '1';
  }
}

function triggerPop(el) {
  el.classList.remove('anim-pop');
  void el.offsetWidth;
  el.classList.add('anim-pop');
}

function calc() {
  const errEl  = document.getElementById('errmsg');
  const btn    = document.getElementById('calc-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoad = btn.querySelector('.btn-loading');

  errEl.style.display = 'none';

  // Show loading state
  btn.classList.add('loading');
  btnText.style.display = 'none';
  btnLoad.style.display = '';

  // Small delay for visual feedback
  setTimeout(() => {
    const result = runCalc();

    // Restore button
    btn.classList.remove('loading');
    btnText.style.display = '';
    btnLoad.style.display = 'none';

    if (result.error) {
      errEl.textContent    = result.error;
      errEl.style.display  = 'block';
      return;
    }

    renderResults(result);
  }, 320);
}

function renderResults({ rows, iAge, minSA, maxSA, SA, target, highDisc, lo_, hi_, avg_, stages, premiumStopYear }) {
  // Info metrics
  const stopAge = premiumStopYear ? iAge + premiumStopYear - 1 : null;
  document.getElementById('info-cards').innerHTML = `
    <div class="metric"><div class="metric-label">投保年齡</div><div class="metric-val">${iAge} 歲</div></div>
    <div class="metric"><div class="metric-label">低/平均/高倍</div><div class="metric-val sm">${lo_}x / ${avg_}x / ${hi_}x</div></div>
    <div class="metric"><div class="metric-label">最低保額</div><div class="metric-val sm">${fmt(minSA)}</div></div>
    <div class="metric"><div class="metric-label">最高保額</div><div class="metric-val sm">${fmt(maxSA)}</div></div>
    <div class="metric"><div class="metric-label">實際保額</div><div class="metric-val sm">${fmt(SA)}</div></div>
    <div class="metric"><div class="metric-label">目標保費（年）</div><div class="metric-val sm">${fmt(target)}</div></div>
    <div class="metric"><div class="metric-label">高保費折扣</div><div class="metric-val">${pct(highDisc)}</div></div>
    <div class="metric"><div class="metric-label">分段增額</div><div class="metric-val sm">${stages.length ? stages.join(' → ') : '—'}</div></div>
    ${stopAge ? `<div class="metric metric-warn"><div class="metric-label">⚠ 停繳保費年齡</div><div class="metric-val" style="color:var(--red,#e05)">${stopAge} 歲（第 ${premiumStopYear} 年）</div></div>` : ''}`;

  // 停繳提示框
  const existingNotice = document.getElementById('premium-stop-notice');
  if (existingNotice) existingNotice.remove();
  if (premiumStopYear) {
    const notice = document.createElement('div');
    notice.id = 'premium-stop-notice';
    notice.className = 'note-box';
    notice.style.cssText = 'margin-top:16px;border-left-color:#e05;border-color:rgba(220,0,80,.2);background:rgba(220,0,80,.05)';
    notice.innerHTML = `<strong style="color:#c03">⚠ 甲型保額充足比例限制（條款第十一條）</strong><br>
      自第 <strong>${premiumStopYear} 年度</strong>（被保險人保險年齡 <strong>${stopAge} 歲</strong>）起，
      帳戶價值累積已使保額占比低於法規門檻（${stopAge <= 60 ? '120%' : stopAge <= 70 ? '110%' : '102%'}），
      目標保費與定期定額<strong>停止繳入</strong>。保單繼續有效，仍按月扣除保單管理費與保險成本。`;
    const tblCard = document.querySelector('[data-card="r2"]');
    tblCard.parentNode.insertBefore(notice, tblCard);
  }

  // Table rows (rendered but invisible — animate.js will reveal them)
  document.getElementById('tbl-body').innerHTML = rows.map(r => {
    const trClass = r.premiumStopped ? ' class="row-stopped"' : '';
    const stopMark = r.premiumStopped && r.yr === premiumStopYear
      ? ' <span title="甲型保額比例限制：目標保費與定期定額停止" style="color:#c03;font-size:11px;font-weight:800">⚠停繳</span>'
      : '';
    return `
    <tr${trClass}>
      <td>${r.yr}${stopMark}</td>
      <td>${r.age}</td>
      <td>${r.yearTarget > 0 ? fmt(r.yearTarget) : '<span class="muted">—</span>'}</td>
      <td>${r.yearExtra > 0 ? fmt(r.yearExtra) : '<span class="muted">—</span>'}</td>
      <td class="neg">${fmt(r.yearFee)}</td>
      <td class="neg">${fmt(r.yearMgmt)}</td>
      <td class="neg">${fmt(r.yearCOI)}</td>
      <td class="pos">${fmt(r.av)}</td>
      <td>${fmt(r.death)}</td>
    </tr>`;
  }).join('');

  // Show summary
  const summary = document.getElementById('summary');
  summary.style.display = 'block';
  summary.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Trigger animations (handled by animate.js)
  animateResults();
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { onMonthlyChange(); updateUI(); });
} else {
  onMonthlyChange(); updateUI();
}
