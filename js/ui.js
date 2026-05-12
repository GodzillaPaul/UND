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

function renderResults({ rows, iAge, minSA, maxSA, SA, target, highDisc, lo_, hi_, avg_, stages }) {
  // Info metrics
  document.getElementById('info-cards').innerHTML = `
    <div class="metric"><div class="metric-label">投保年齡</div><div class="metric-val">${iAge} 歲</div></div>
    <div class="metric"><div class="metric-label">低/平均/高倍</div><div class="metric-val sm">${lo_}x / ${avg_}x / ${hi_}x</div></div>
    <div class="metric"><div class="metric-label">最低保額</div><div class="metric-val sm">${fmt(minSA)}</div></div>
    <div class="metric"><div class="metric-label">最高保額</div><div class="metric-val sm">${fmt(maxSA)}</div></div>
    <div class="metric"><div class="metric-label">實際保額</div><div class="metric-val sm">${fmt(SA)}</div></div>
    <div class="metric"><div class="metric-label">目標保費（年）</div><div class="metric-val sm">${fmt(target)}</div></div>
    <div class="metric"><div class="metric-label">高保費折扣</div><div class="metric-val">${pct(highDisc)}</div></div>
    <div class="metric"><div class="metric-label">分段增額</div><div class="metric-val sm">${stages.length ? stages.join(' → ') : '—'}</div></div>`;

  // Table rows (rendered but invisible — animate.js will reveal them)
  document.getElementById('tbl-body').innerHTML = rows.map(r => `
    <tr>
      <td>${r.yr}</td>
      <td>${r.age}</td>
      <td>${fmt(r.yearTarget)}</td>
      <td>${r.yearExtra > 0 ? fmt(r.yearExtra) : '<span class="muted">—</span>'}</td>
      <td class="neg">${fmt(r.yearFee)}</td>
      <td class="neg">${fmt(r.yearMgmt)}</td>
      <td class="neg">${fmt(r.yearCOI)}</td>
      <td class="pos">${fmt(r.av)}</td>
      <td>${fmt(r.death)}</td>
    </tr>`).join('');

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
