(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mark = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>');

  /* ---------------------------------------------------------------- */
  /* Icons                                                             */
  /* ---------------------------------------------------------------- */

  const ICONS = {
    droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    flaskRound: '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>',
    swap: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><path d="M16 14v4"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/>',
    divide: '<circle cx="12" cy="6" r="1"/><line x1="5" x2="19" y1="12" y2="12"/><circle cx="12" cy="18" r="1"/>',
    atom: '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    x: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    save: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';

  /* ---------------------------------------------------------------- */
  /* Storage (history)                                                 */
  /* ---------------------------------------------------------------- */

  const Store = (() => {
    const KEY = 'icp-lab-calc:history:v1';
    const MAX = 30;
    let mem = [];
    const read = () => {
      try {
        const raw = localStorage.getItem(KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
      } catch (e) { return mem; }
    };
    const write = list => {
      mem = list;
      try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
    };
    return {
      list: read,
      add(entry) {
        const list = read().filter(x => !(x.tool === entry.tool && x.summary === entry.summary));
        list.unshift(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: Date.now() }, entry));
        write(list.slice(0, MAX));
      },
      remove(id) { write(read().filter(x => x.id !== id)); },
      clear() { write([]); }
    };
  })();

  /* ---------------------------------------------------------------- */
  /* Catalog (extension point for future product lookup)               */
  /* ---------------------------------------------------------------- */

  const Catalog = (() => {
    const providers = [];
    return {
      register(provider) { if (provider && typeof provider.find === 'function') providers.push(provider); },
      available: () => providers.length > 0,
      find: query => Promise.all(providers.map(p => p.find(query))).then(r => [].concat.apply([], r))
    };
  })();
  window.ICPLab = { Catalog };

  function catalogItemsHtml(items) {
    if (!items.length) return '<p class="hint">일치하는 제품 정보가 없습니다.</p>';
    return items.map(i => '<div class="conv"><b>' + esc(i.name) + '</b><span>' + esc([i.catalogNo, i.package].filter(Boolean).join(' · ')) + '</span></div>').join('');
  }

  /* ---------------------------------------------------------------- */
  /* Form helpers                                                      */
  /* ---------------------------------------------------------------- */

  const DIL_UNITS = ['mg/L', 'μg/L', 'ng/L', 'mg/mL', 'μg/mL', 'ppm', 'ppb', 'ppt', '%'];
  const VOL_UNITS = ['mL', 'L', 'μL'];
  const CONV_UNITS = ['%', 'ppm', 'ppb', 'ppt', 'mg/L', 'μg/L', 'ng/L', 'mg/mL', 'μg/mL', 'mg/kg', 'μg/kg'];
  const PREC_OPTIONS = [['auto', '자동 (입력 자릿수 기준)'], ['1', '소수점 1자리'], ['2', '소수점 2자리'], ['3', '소수점 3자리'], ['4', '소수점 4자리']];

  const opts = (list, val) => list.map(u => {
    const value = Array.isArray(u) ? u[0] : u;
    const text = Array.isArray(u) ? u[1] : u;
    return '<option value="' + esc(value) + '"' + (value === val ? ' selected' : '') + '>' + esc(text) + '</option>';
  }).join('');

  const selectEl = (key, list, val, label) =>
    '<select data-key="' + key + '" aria-label="' + esc(label) + '">' + opts(list, val) + '</select>';

  function numField(o) {
    const id = 'f-' + o.key;
    let control = '<input type="text" id="' + id + '" data-key="' + o.key + '" inputmode="decimal" autocomplete="off" spellcheck="false" value="' +
      esc(o.vals[o.key]) + '" placeholder="' + esc(o.placeholder || '') + '" aria-describedby="e-' + o.key + '">';
    let cls = 'ig ig-single';
    if (o.unitKey) {
      cls = 'ig';
      control += selectEl(o.unitKey, o.units, o.vals[o.unitKey], o.label + ' 단위');
    } else if (o.suffix) {
      cls = 'ig-suffix';
      control += '<span class="suffix">' + esc(o.suffix) + '</span>';
    }
    return '<div class="field"><label for="' + id + '">' + o.label + (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') + '</label>' +
      '<div class="' + cls + '">' + control + '</div><p class="ferr" id="e-' + o.key + '" role="alert"></p></div>';
  }

  function textField(o) {
    const id = 'f-' + o.key;
    return '<div class="field"><label for="' + id + '">' + o.label + (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') + '</label>' +
      '<input type="text" id="' + id + '" data-key="' + o.key + '" autocomplete="off" spellcheck="false" autocapitalize="off"' +
      (o.list ? ' list="' + o.list + '"' : '') + ' maxlength="' + (o.max || 40) + '" value="' + esc(o.vals[o.key]) + '" placeholder="' + esc(o.placeholder || '') + '"></div>';
  }

  const section = (title, sub, body) =>
    '<div class="sect"><div class="sect-title">' + title + (sub ? '<span>' + sub + '</span>' : '') + '</div>' + body + '</div>';

  const precisionBlock = vals =>
    '<details class="adv"><summary>표시 옵션</summary><div class="adv-body">' +
    '<div class="field"><label for="f-prec">결과 표시 정밀도 <span class="sub">Display precision</span></label>' +
    selectEl('prec', PREC_OPTIONS, vals.prec, '결과 표시 정밀도') + '</div>' +
    '<p class="hint">내부 계산은 전체 정밀도로 수행하고, 마지막 표시 단계에서만 반올림합니다.</p></div></details>';

  const elementDatalist = () =>
    '<datalist id="el-list">' + Core.ELEMENTS.map(e => '<option value="' + e.symbol + '">' + esc(e.name + ' ' + e.ko[0]) + '</option>').join('') + '</datalist>';

  function setFieldError(key, msg) {
    const p = $('#e-' + key);
    const input = $('#f-' + key);
    if (p) p.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  const collect = root => {
    const v = {};
    $$('[data-key]', root).forEach(e => { v[e.dataset.key] = e.value; });
    return v;
  };

  /* ---------------------------------------------------------------- */
  /* Tool definitions                                                  */
  /* ---------------------------------------------------------------- */

  function dilutionTool(kind) {
    const std = kind === 'standard';
    return {
      id: std ? 'standard' : 'dilution',
      ko: std ? '표준용액 제조' : '희석 계산',
      en: std ? 'Standard Preparation' : 'Dilution Calculator',
      formula: std ? 'V₁ = C₂ × V₂ ÷ C₁' : 'C₁ × V₁ = C₂ × V₂',
      defaults: { name: std ? 'Fe' : '', c1: '1000', c1u: 'mg/L', c2: '10', c2u: 'mg/L', v2: '100', v2u: 'mL', diluent: '', prec: 'auto' },
      template(v) {
        return '<div class="form">' +
          section(std ? 'Stock standard' : '원액 (Stock)', std ? '보유 중인 표준원액' : '가지고 있는 용액',
            textField({ key: 'name', label: std ? '원소 <span class="sub">Element</span>' : '원액 이름', sub: std ? '' : '선택', vals: v, placeholder: std ? '예: Fe' : '예: Fe', list: 'el-list', max: 20 }) +
            numField({ key: 'c1', unitKey: 'c1u', units: DIL_UNITS, vals: v, label: '원액 농도', sub: 'C₁', placeholder: '1000' })) +
          section('목표 (Target)', '만들고 싶은 용액', numField({ key: 'c2', unitKey: 'c2u', units: DIL_UNITS, vals: v, label: '목표 농도', sub: 'C₂', placeholder: '10' })) +
          section('조제량 (Final volume)', '', numField({ key: 'v2', unitKey: 'v2u', units: VOL_UNITS, vals: v, label: '최종 부피', sub: 'V₂', placeholder: '100' })) +
          '<details class="adv"><summary>희석액 · 표시 옵션</summary><div class="adv-body">' +
          textField({ key: 'diluent', label: '희석액 종류', sub: '선택 · 예: 2% HNO₃', vals: v, max: 40 }) +
          '<div class="field"><label for="f-prec">결과 표시 정밀도 <span class="sub">Display precision</span></label>' + selectEl('prec', PREC_OPTIONS, v.prec, '결과 표시 정밀도') + '</div>' +
          '<p class="hint">내부 계산은 전체 정밀도로 수행하고, 마지막 표시 단계에서만 반올림합니다.</p></div></details>' +
          elementDatalist() + '</div>';
      },
      calc(v, api) {
        const c1 = api.num('c1'), c2 = api.num('c2'), v2 = api.num('v2');
        if (!(c1.ok && c2.ok && v2.ok)) return { status: 'incomplete' };
        const calc = Core.dilute({ c1: c1.value, u1: v.c1u, c2: c2.value, u2: v.c2u, v2: v2.value, vu: v.v2u });
        return Core.describeDilution(calc, {
          kind, name: v.name.trim(), c1Str: c1.raw, u1: v.c1u, c2Str: c2.raw, u2: v.c2u, v2Str: v2.raw, vu: v.v2u,
          diluent: v.diluent.trim(), decimals: Core.pickDecimals(v.prec, [c1.decimals, c2.decimals, v2.decimals])
        });
      },
      actions(code, v) {
        if (code !== 'small_volume') return null;
        return { label: '단계 희석으로 계산', tool: 'serial', preset: { c1: v.c1, c1u: v.c1u, c2: v.c2, c2u: v.c2u, fin: v.v2, finu: v.v2u === 'μL' ? 'mL' : v.v2u } };
      }
    };
  }

  const serialTool = {
    id: 'serial', ko: '단계 희석 계산', en: 'Serial Dilution', formula: 'DF = C₀ ÷ Cₙ',
    defaults: { c1: '1000', c1u: 'mg/L', c2: '1', c2u: 'mg/L', fin: '100', finu: 'mL', step: '100', maxdf: '10', prec: 'auto' },
    template(v) {
      return '<div class="form">' +
        section('Stock', '', numField({ key: 'c1', unitKey: 'c1u', units: DIL_UNITS, vals: v, label: 'Stock 농도', placeholder: '1000' })) +
        section('목표 (Target)', '', numField({ key: 'c2', unitKey: 'c2u', units: DIL_UNITS, vals: v, label: '최종 목표 농도', placeholder: '1' }) +
          numField({ key: 'fin', unitKey: 'finu', units: ['mL', 'L'], vals: v, label: '최종 필요량', placeholder: '100' })) +
        section('단계 설정', '', numField({ key: 'step', suffix: 'mL', vals: v, label: '한 단계 조제 부피', sub: '중간 용액', placeholder: '100' }) +
          numField({ key: 'maxdf', suffix: '배', vals: v, label: '최대 권장 희석배수', sub: '한 단계당', placeholder: '10' }) +
          '<p class="hint">최대 희석배수를 낮추면 단계가 늘고 피펫 취급량이 커집니다.</p>') +
        precisionBlock(v) + '</div>';
    },
    calc(v, api) {
      const c1 = api.num('c1'), c2 = api.num('c2'), fin = api.num('fin'), step = api.num('step'), mx = api.num('maxdf');
      if (mx.ok && mx.value < 2) { api.custom('maxdf', '2 이상의 값을 입력하세요.'); mx.ok = false; }
      if (!(c1.ok && c2.ok && fin.ok && step.ok && mx.ok)) return { status: 'incomplete' };
      const plan = Core.planSerial({ c1: c1.value, u1: v.c1u, c2: c2.value, u2: v.c2u, finalMl: fin.value * Core.VOL[v.finu], stepMl: step.value, maxDf: mx.value });
      return Core.describeSerial(plan, {
        decimals: Core.pickDecimals(v.prec, [c1.decimals, c2.decimals, fin.decimals, step.decimals]),
        c1Str: c1.raw, u1: v.c1u, c2Str: c2.raw, u2: v.c2u, finStr: fin.raw, finU: v.finu
      });
    }
  };

  const MIXED_DEFAULT_ROWS = [
    { el: 'Fe', c1: '1000', u1: 'mg/L', c2: '10', u2: 'mg/L' },
    { el: 'Cu', c1: '1000', u1: 'mg/L', c2: '5', u2: 'mg/L' },
    { el: 'Zn', c1: '1000', u1: 'mg/L', c2: '5', u2: 'mg/L' },
    { el: 'Mn', c1: '1000', u1: 'mg/L', c2: '10', u2: 'mg/L' }
  ];

  function mixedRowHtml(r, i) {
    const n = i + 1;
    const rk = (k, cls) => 'data-rk="' + k + '" ' + (cls || '');
    const conc = (label, kc, ku, cls) =>
      '<div class="field ' + cls + '"><label for="m' + i + '-' + kc + '">' + label + '</label><div class="ig">' +
      '<input type="text" id="m' + i + '-' + kc + '" ' + rk(kc) + ' inputmode="decimal" autocomplete="off" spellcheck="false" value="' + esc(r[kc]) + '" aria-label="행 ' + n + ' ' + label + '">' +
      '<select ' + rk(ku) + ' aria-label="행 ' + n + ' ' + label + ' 단위">' + opts(DIL_UNITS, r[ku]) + '</select></div></div>';
    return '<div class="mrow" data-i="' + i + '">' +
      '<div class="field m-el"><label for="m' + i + '-el">원소</label><input type="text" id="m' + i + '-el" ' + rk('el') + ' list="el-list" maxlength="20" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="Fe" value="' + esc(r.el) + '" aria-label="행 ' + n + ' 원소"></div>' +
      conc('Stock 농도', 'c1', 'u1', 'm-c1') + conc('목표 농도', 'c2', 'u2', 'm-c2') +
      '<button type="button" class="icon-btn m-del" data-act="del-row" data-i="' + i + '" aria-label="행 ' + n + ' 삭제">' + svg('trash') + '</button>' +
      '<p class="ferr rowerr" role="alert"></p></div>';
  }

  const mixedTool = {
    id: 'mixed', ko: '혼합 표준용액 제조', en: 'Mixed Standard', formula: 'ΣV₁ + 희석액 = V', wide: true,
    defaults: { vf: '100', vfu: 'mL', prec: 'auto', rows: MIXED_DEFAULT_ROWS },
    template(v) {
      const rows = v.rows && v.rows.length ? v.rows : MIXED_DEFAULT_ROWS;
      return '<div class="form">' +
        section('최종 부피', '', numField({ key: 'vf', unitKey: 'vfu', units: VOL_UNITS, vals: v, label: '혼합 표준용액 최종 부피', placeholder: '100' })) +
        section('원소별 Stock · 목표 농도', '행을 추가하거나 삭제할 수 있습니다',
          '<div class="mhead" aria-hidden="true"><span>원소</span><span>Stock 농도</span><span>목표 농도</span><span></span></div>' +
          '<div class="mrows" id="mrows">' + rows.map(mixedRowHtml).join('') + '</div>' +
          '<div><button type="button" class="btn btn-secondary" data-act="add-row">' + svg('plus') + '원소 추가</button></div>') +
        precisionBlock(v) + elementDatalist() + '</div>';
    },
    collect(root) {
      const v = collect(root);
      v.rows = $$('.mrow', root).map(r => {
        const o = {};
        $$('[data-rk]', r).forEach(e => { o[e.dataset.rk] = e.value; });
        return o;
      });
      return v;
    },
    calc(v, api) {
      $$('.rowerr').forEach(p => { p.textContent = ''; });
      const vf = api.num('vf');
      const rows = [];
      let incomplete = !vf.ok;
      let any = false;
      v.rows.forEach((r, i) => {
        if (!r.el.trim() && !r.c1.trim() && !r.c2.trim()) return;
        any = true;
        const c1 = Core.parseNum(r.c1), c2 = Core.parseNum(r.c2);
        const msgs = [];
        if (!c1.ok) msgs.push('Stock 농도: ' + c1.msg);
        if (!c2.ok) msgs.push('목표 농도: ' + c2.msg);
        if (msgs.length) { api.rowError(i, msgs.join(' ')); incomplete = true; return; }
        rows.push({ el: r.el.trim(), c1: c1.value, u1: r.u1, c2: c2.value, u2: r.u2, c1Str: c1.raw, c2Str: c2.raw, decs: [c1.decimals, c2.decimals], idx: i });
      });
      if (!any) return { status: 'incomplete', message: '원소를 한 행 이상 입력하세요.' };
      if (incomplete) return { status: 'incomplete' };
      const calc = Core.mixStandard({ rows: rows.map(r => ({ el: r.el, c1: r.c1, u1: r.u1, c2: r.c2, u2: r.u2, c1Str: r.c1Str, c2Str: r.c2Str })), vf: vf.value, vu: v.vfu });
      const decs = rows.reduce((a, r) => a.concat(r.decs), [vf.decimals]);
      const rep = Core.describeMixed(calc, { decimals: Core.pickDecimals(v.prec, decs), vfStr: vf.raw, vu: v.vfu });
      (rep.rowErrors || []).forEach(e => api.rowError(rows[e.i].idx, e.text));
      return rep;
    }
  };

  const converterTool = {
    id: 'converter', ko: '농도 단위 변환', en: 'Concentration Converter', formula: '1 ppm = 1 mg/L (수용액)',
    defaults: { val: '1', unit: 'ppm', dens: '1.000' },
    template(v) {
      return '<div class="form">' +
        section('변환할 값', '', numField({ key: 'val', unitKey: 'unit', units: CONV_UNITS, vals: v, label: '농도', placeholder: '1' })) +
        section('시료 밀도', '질량/부피 ↔ 질량/질량 환산에만 사용',
          numField({ key: 'dens', suffix: 'g/mL', vals: v, label: '밀도 (Density)', placeholder: '1.000' }) +
          '<p class="hint">희박 수용액은 약 1.000 g/mL입니다. 진한 산, 유기용매, 슬러리 등은 실제 밀도를 입력하세요.</p>') +
        '<div class="callout info" role="note">' + svg('info') + '<div><strong>환산 가능 조건</strong><p>mg/L ↔ μg/L ↔ ng/L처럼 같은 계열끼리는 항상 정확합니다. mg/L(질량/부피)와 mg/kg(질량/질량) 사이는 밀도가 필요하며, ppm·ppb·ppt는 희박 수용액에서만 mg/L·μg/L·ng/L와 같은 값입니다.</p></div></div></div>';
    },
    calc(v, api) {
      const val = api.num('val'), dens = api.num('dens');
      if (!(val.ok && dens.ok)) return { status: 'incomplete' };
      return Core.describeConvert({ value: val.value, unit: v.unit, density: dens.value });
    }
  };

  const RESULT_UNITS = ['mg/L', 'μg/L', 'ppm', 'ppb'];
  const AMOUNT_UNITS = ['g', 'mg', 'kg', 'mL', 'L'];
  const OUT_UNITS = ['mg/kg', 'μg/kg', 'ppm', 'ppb', 'mg/L', 'μg/L'];

  const sampleTool = {
    id: 'sample', ko: '시료 농도 역산', en: 'Sample Concentration', formula: 'C = (c × DF × V) ÷ m',
    defaults: { label: '', res: '2.5', resu: 'mg/L', vol: '100', volu: 'mL', amt: '0.5', amtu: 'g', df: '10', ou: 'mg/kg' },
    template(v) {
      return '<div class="form">' +
        section('ICP 측정', '', numField({ key: 'res', unitKey: 'resu', units: RESULT_UNITS, vals: v, label: '기기 결과', sub: 'Instrument result', placeholder: '2.5' })) +
        section('시료 전처리', '', numField({ key: 'vol', unitKey: 'volu', units: VOL_UNITS, vals: v, label: '최종 부피', sub: 'Final volume', placeholder: '100' }) +
          numField({ key: 'amt', unitKey: 'amtu', units: AMOUNT_UNITS, vals: v, label: '시료량', sub: 'Sample weight / volume', placeholder: '0.5' }) +
          numField({ key: 'df', suffix: '배', vals: v, label: '추가 희석배수', sub: 'Dilution factor', placeholder: '1' })) +
        section('결과 단위', '', '<div class="field"><label for="f-ou">원시료 농도 단위</label>' + selectEl('ou', OUT_UNITS, v.ou, '원시료 농도 단위') + '</div>' +
          textField({ key: 'label', label: '시료명 (Label)', sub: '선택 · 개인정보 입력 금지', vals: v, placeholder: '예: Sample A', max: 30 })) + '</div>';
    },
    calc(v, api) {
      const res = api.num('res'), vol = api.num('vol'), amt = api.num('amt'), df = api.num('df');
      if (!(res.ok && vol.ok && amt.ok && df.ok)) return { status: 'incomplete' };
      const calc = Core.sampleConc({ result: res.value, ru: v.resu, vol: vol.value, vu: v.volu, amount: amt.value, au: v.amtu, df: df.value, ou: v.ou });
      return Core.describeSample(calc, { ou: v.ou, resStr: res.raw, ru: v.resu, volStr: vol.raw, vu: v.volu, amtStr: amt.raw, au: v.amtu, dfVal: df.value, label: v.label.trim() });
    }
  };

  const factorTool = {
    id: 'factor', ko: '희석배수 계산', en: 'Dilution Factor', formula: 'DF = V₂ ÷ V₁',
    defaults: { label: '', vs: '1', vsu: 'mL', vf: '100', vfu: 'mL' },
    template(v) {
      return '<div class="form">' +
        section('부피 입력', '', numField({ key: 'vs', unitKey: 'vsu', units: VOL_UNITS, vals: v, label: '원액 부피', sub: 'Sample volume', placeholder: '1' }) +
          numField({ key: 'vf', unitKey: 'vfu', units: VOL_UNITS, vals: v, label: '최종 부피', sub: 'Final volume', placeholder: '100' }) +
          textField({ key: 'label', label: '시료명 (Label)', sub: '선택 · 개인정보 입력 금지', vals: v, placeholder: '예: Sample A', max: 30 })) + '</div>';
    },
    calc(v, api) {
      const vs = api.num('vs'), vf = api.num('vf');
      if (!(vs.ok && vf.ok)) return { status: 'incomplete' };
      const calc = Core.dilutionFactor({ vs: vs.value, us: v.vsu, vf: vf.value, uf: v.vfu });
      return Core.describeFactor(calc, { vsStr: vs.raw, us: v.vsu, vfStr: vf.raw, uf: v.vfu, label: v.label.trim() });
    }
  };

  const TOOLS = [
    dilutionTool('dilution'), serialTool, dilutionTool('standard'), mixedTool, converterTool, sampleTool, factorTool,
    { id: 'elements', ko: '원소 정보', en: 'Element Information', formula: '118 elements', special: true }
  ];
  const TOOL = {};
  TOOLS.forEach(t => { TOOL[t.id] = t; });

  const CARDS = {
    dilution: { icon: 'droplet', desc: '원액 농도, 목표 농도, 최종 부피만 입력하면 무엇을 몇 mL 취해야 하는지 바로 알려줍니다.' },
    standard: { icon: 'flask', desc: 'Stock standard로 목표 농도의 표준용액을 만드는 방법을 안내합니다.' },
    converter: { icon: 'swap', desc: '% · ppm · ppb · mg/L 등 11개 단위를 한 번에 환산합니다.' },
    serial: { icon: 'layers', desc: '큰 희석배수를 피펫 취급량이 적절한 여러 단계로 나눠 계산합니다.' },
    mixed: { icon: 'flaskRound', desc: '여러 원소의 Stock 취급량과 희석액 부피를 한 번에 계산합니다.' },
    sample: { icon: 'calc', desc: 'ICP 측정값을 최종 부피, 시료량, 희석배수로 원시료 농도에 환산합니다.' },
    factor: { icon: 'divide', desc: '원액 부피와 최종 부피로 희석배수를 확인합니다.' },
    elements: { icon: 'atom', desc: '기호, 영문명, 한글명, 원자번호로 원자량을 찾아봅니다.' }
  };

  /* ---------------------------------------------------------------- */
  /* Rendering                                                         */
  /* ---------------------------------------------------------------- */

  const app = $('#app');
  const session = {};
  let current = null;
  let pendingPreset = null;

  function calloutHtml(c) {
    const icon = c.level === 'error' ? 'x' : c.level === 'warn' ? 'alert' : 'info';
    let action = '';
    if (c.action) {
      action = '<button type="button" class="btn btn-secondary btn-sm" data-go="' + esc(c.action.tool) + '" data-preset="' + esc(JSON.stringify(c.action.preset)) + '">' +
        esc(c.action.label) + svg('arrow') + '</button>';
    }
    return '<div class="callout ' + c.level + '" role="' + (c.level === 'error' ? 'alert' : 'note') + '">' + svg(icon) +
      '<div><strong>' + esc(c.title) + '</strong><p>' + esc(c.text) + '</p>' + action + '</div></div>';
  }

  function tableHtml(t) {
    const head = '<thead><tr>' + t.head.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead>';
    const body = '<tbody>' + t.rows.map(r => '<tr' + (r.warn ? ' class="warn"' : '') + '>' +
      r.cells.map((c, i) => '<td' + (i === r.cells.length - 2 && t.head.length > 5 && !t.foot ? ' class="strong"' : '') + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
    const foot = t.foot ? '<tfoot><tr>' + t.foot.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr></tfoot>' : '';
    return '<div class="tbl-wrap"><table class="tbl">' + head + body + foot + '</table></div>';
  }

  function renderReport(rep, toolId) {
    if (rep.status === 'incomplete') {
      return '<div class="empty">' + esc(rep.message || '값을 모두 입력하면 결과가 여기에 표시됩니다.') + '</div>';
    }
    let h = (rep.callouts || []).map(calloutHtml).join('');
    if (rep.status === 'error') return h;
    if (rep.big) {
      h += '<div class="big"><div class="big-main">' + esc(rep.big.ko) + '</div><div class="big-en">' + esc(rep.big.en) + '</div><div class="big-sub">' + esc(rep.big.sub) + '</div></div>';
    }
    if (rep.procedure) {
      h += '<div class="proc"><div class="lbl">' + (toolId === 'sample' ? '결과 · Result' : '제조 방법 · Procedure') + '</div><p class="proc-ko">' + mark(rep.procedure.ko) + '</p><p class="proc-en">' + mark(rep.procedure.en) + '</p></div>';
    }
    if (rep.metrics) {
      h += '<div class="metrics">' + rep.metrics.map(m => '<div class="metric"><div class="metric-l">' + esc(m.label) + '</div><div class="metric-v">' + esc(m.value) + '</div>' +
        (m.sub ? '<div class="metric-s">' + esc(m.sub) + '</div>' : '') + '</div>').join('') + '</div>';
    }
    if (rep.table) h += tableHtml(rep.table);
    if (rep.procList) {
      h += '<ol class="proc-list">' + rep.procList.map(p => '<li>' + mark(p.ko) + '<small>' + mark(p.en) + '</small></li>').join('') + '</ol>';
    }
    if (rep.groups) {
      h += rep.groups.map(g => '<div><div class="group-t">' + esc(g.title) + '</div><p class="group-n">' + esc(g.note) + '</p><div class="conv-list">' +
        g.rows.map(r => '<div class="conv' + (r.input ? ' in' : '') + (g.exact ? '' : ' approx') + '"><b>' + esc(r.text) + '</b><span>' + esc(r.unit) + '</span></div>').join('') + '</div></div>').join('');
    }
    if (rep.steps) {
      h += '<details class="calc" open><summary>계산 과정 · Calculation</summary><ul class="calc-list">' + rep.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></details>';
    }
    h += '<div class="actions">' +
      '<button type="button" class="btn btn-primary" data-act="copy-ko">' + svg('copy') + '결과 복사 (한국어)</button>' +
      '<button type="button" class="btn btn-secondary" data-act="copy-en">' + svg('copy') + 'Copy result (English)</button>' +
      '<button type="button" class="btn btn-ghost" data-act="save">' + svg('save') + '기록에 저장</button>';
    if (rep.catalogQuery && Catalog.available()) {
      h += '<button type="button" class="btn btn-secondary" data-act="catalog">필요한 표준시약 찾기</button>';
    }
    h += '</div><div class="catalog" id="catalog-slot"></div>';
    return h;
  }

  function toolShell(tool, formHtml) {
    const tabs = TOOLS.map(t => '<a class="tab" href="#/' + t.id + '"' + (t.id === tool.id ? ' aria-current="page"' : '') + '>' + esc(t.ko) + '</a>').join('');
    return '<div class="tool-head"><a class="back" href="#/">' + svg('back') + '전체 기능</a>' +
      '<h1 class="tool-title">' + esc(tool.ko) + '</h1>' +
      '<div class="tool-sub"><span>' + esc(tool.en) + '</span><span class="chip">' + esc(tool.formula) + '</span></div>' +
      '<nav class="tabs" aria-label="기능 선택">' + tabs + '</nav></div>' +
      '<div class="layout' + (tool.wide ? ' stack' : '') + '">' +
      '<section class="panel' + (tool.wide ? '' : ' sticky') + '" aria-label="입력"><div class="panel-lbl">INPUT</div><div id="tool-form">' + formHtml + '</div></section>' +
      '<section class="panel" aria-label="결과"><div class="panel-lbl">RESULT</div><div class="results" id="results" aria-live="polite"></div></section></div>';
  }

  function mountTool(tool, preset) {
    const vals = Object.assign({}, tool.defaults, session[tool.id] || {}, preset || {});
    app.innerHTML = toolShell(tool, tool.template(vals));
    current = { tool, report: null, vals };
    const active = $('.tab[aria-current="page"]');
    if (active && active.parentNode) {
      const box = active.parentNode;
      box.scrollLeft = Math.max(0, active.offsetLeft - (box.clientWidth - active.offsetWidth) / 2);
    }
    update();
  }

  function update() {
    if (!current || !current.tool.template) return;
    const tool = current.tool;
    const form = $('#tool-form');
    if (!form) return;
    const vals = tool.collect ? tool.collect(form) : collect(form);
    $$('.ferr:not(.rowerr)', form).forEach(p => { p.textContent = ''; });
    $$('input[aria-invalid="true"]', form).forEach(i => i.setAttribute('aria-invalid', 'false'));
    const api = {
      num(key, allowZero) {
        const r = Core.parseNum(vals[key], allowZero);
        setFieldError(key, r.ok ? '' : r.msg);
        return r;
      },
      custom(key, msg) { setFieldError(key, msg); },
      rowError(i, msg) {
        const row = $('.mrow[data-i="' + i + '"] .rowerr');
        if (row) row.textContent = msg;
      }
    };
    const rep = tool.calc(vals, api);
    (rep.callouts || []).forEach(c => {
      const a = tool.actions && c.code ? tool.actions(c.code, vals) : null;
      if (a) c.action = a;
    });
    current.vals = vals;
    current.report = rep;
    session[tool.id] = vals;
    $('#results').innerHTML = renderReport(rep, tool.id);
  }

  /* ---------------------------------------------------------------- */
  /* Home / history / elements views                                   */
  /* ---------------------------------------------------------------- */

  function fmtTime(ts) {
    try { return new Date(ts).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  function historyListHtml(list) {
    if (!list.length) return '<div class="empty-note">저장된 계산이 없습니다. 결과 아래의 “기록에 저장”을 누르면 여기에 표시됩니다.</div>';
    return '<div class="hist">' + list.map(h =>
      '<div class="hist-item"><button type="button" class="hist-main" data-act="hist-load" data-id="' + esc(h.id) + '" aria-label="' + esc(h.summary) + ' 불러오기">' +
      '<div class="hist-title">' + esc(h.title) + ' · ' + esc(fmtTime(h.ts)) + '</div><div class="hist-sum">' + esc(h.summary) + '</div></button>' +
      '<button type="button" class="icon-btn" data-act="hist-del" data-id="' + esc(h.id) + '" aria-label="기록 삭제">' + svg('trash') + '</button></div>').join('') + '</div>';
  }

  function cardHtml(id, cls, i, extra) {
    const t = TOOL[id];
    const c = CARDS[id];
    return '<a class="card ' + cls + '" href="#/' + id + '" style="--i:' + i + '">' +
      '<div class="card-top"><span class="ic">' + svg(c.icon) + '</span>' + (extra && extra.tag ? '<span class="tag">' + extra.tag + '</span>' : '') + '</div>' +
      '<h3>' + esc(t.ko) + '<small>' + esc(t.en) + '</small></h3><p>' + esc(c.desc) + '</p>' +
      (extra && extra.mini ? extra.mini : '<span class="formula">' + esc(t.formula) + '</span>') + '</a>';
  }

  function homeView() {
    const d = Core.dilute({ c1: 1000, u1: 'mg/L', c2: 10, u2: 'mg/L', v2: 100, vu: 'mL' });
    const v1 = Core.fmtVol(d.V1, 2).text;
    const dil = Core.fmtVol(d.diluent, 2).text;
    const mini = '<div class="mini"><div><span class="k">원액</span> <span class="v">1000 mg/L</span> <span class="k">→ 목표</span> <span class="v">10 mg/L</span> <span class="k">/ 최종</span> <span class="v">100 mL</span></div>' +
      '<div><span class="k">▸ 원액</span> <span class="r">' + v1 + '</span> <span class="k">+ 희석액 약</span> <span class="v">' + dil + '</span> <span class="k">· 희석배수</span> <span class="r">' + Core.trimNum(d.df) + '×</span></div></div>';
    const recent = Store.list().slice(0, 4);
    return '<section class="hero"><div class="hero-inner">' +
      '<span class="pill"><i></i>ICP-OES / ICP-MS</span>' +
      '<h1 class="display">ICP Lab <span class="shine">Calculator</span></h1>' +
      '<p class="lead">ICP-OES / ICP-MS 분석 실무자를 위한 농도·희석·표준용액 계산기</p>' +
      '<div class="hero-cta"><a class="btn btn-primary" href="#/dilution">희석 계산 시작</a><a class="btn btn-secondary" href="#/standard">표준용액 제조</a></div>' +
      '</div></section>' +
      '<section class="bento" aria-label="기능">' +
      cardHtml('dilution', 'c-hero', 0, { tag: '가장 많이 사용', mini }) +
      cardHtml('standard', 'c-2', 1, { tag: '자주 사용' }) +
      cardHtml('converter', 'c-2', 2, { tag: '자주 사용' }) +
      cardHtml('serial', 'c-3', 3) + cardHtml('mixed', 'c-3', 4) +
      cardHtml('sample', 'c-2', 5) + cardHtml('factor', 'c-2', 6) + cardHtml('elements', 'c-2', 7) + '</section>' +
      '<div class="section-head"><div><h2>최근 계산</h2><p>이 브라우저에만 저장됩니다.</p></div>' +
      (recent.length ? '<a class="btn btn-ghost btn-sm" href="#/history">전체 보기</a>' : '') + '</div>' + historyListHtml(recent) +
      '<p class="privacy">개인정보·민감정보는 입력하지 마세요. 모든 계산은 이 브라우저 안에서만 처리됩니다.</p>';
  }

  function historyView() {
    const list = Store.list();
    return '<div class="tool-head"><a class="back" href="#/">' + svg('back') + '전체 기능</a><h1 class="tool-title">계산 기록</h1>' +
      '<div class="tool-sub"><span>Recent calculations · 최대 30건</span></div></div>' +
      '<div class="section-head" style="margin-top:24px"><div><p>기록을 누르면 입력값과 함께 해당 계산기가 열립니다.</p></div>' +
      (list.length ? '<button type="button" class="btn btn-secondary btn-sm" data-act="hist-clear">' + svg('trash') + '기록 전체 삭제</button>' : '') + '</div>' +
      historyListHtml(list) + '<p class="privacy">개인정보·민감정보는 입력하지 마세요. 기록은 이 브라우저(localStorage)에만 저장됩니다.</p>';
  }

  /* Elements */

  let elSel = 26;

  function elementDetailHtml(z) {
    const e = Core.ELEMENTS[z - 1];
    const place = Core.elementPlace(z);
    const aw = e.hasStdWeight ? e.weight : e.weight;
    const awNote = e.hasStdWeight ? 'g/mol' : '표준 원자량 없음 · 가장 안정한 동위원소 질량수';
    const mol = e.hasStdWeight ? '<p class="hint el-note">몰 농도 환산: 1 mg/L = ' + Core.trimNum(1000 / parseFloat(e.weight), 5) + ' μmol/L</p>' : '';
    return '<div class="el-detail"><div class="el-tile"><small>' + e.z + '</small><b>' + esc(e.symbol) + '</b></div><div>' +
      '<div class="el-name">' + esc(e.name) + '<span>' + esc(e.ko.join(' / ')) + '</span></div>' +
      '<dl class="dl"><div><dt>원소 기호 (Symbol)</dt><dd>' + esc(e.symbol) + '</dd></div>' +
      '<div><dt>원소명 (Element name)</dt><dd>' + esc(e.name) + '</dd></div>' +
      '<div><dt>원자번호 (Atomic Number)</dt><dd>' + e.z + '</dd></div>' +
      '<div><dt>원자량 (Atomic Weight)</dt><dd>' + esc(aw) + '</dd></div>' +
      '<div><dt>주기 (Period)</dt><dd>' + place.period + '</dd></div>' +
      '<div><dt>족 (Group)</dt><dd>' + esc(place.group) + '</dd></div></dl>' +
      '<p class="hint el-note">' + esc(awNote) + '</p>' + mol + '</div></div>' +
      '<div class="actions" style="margin-top:18px"><button type="button" class="btn btn-primary" data-act="el-use">' + svg('flask') + e.symbol + ' 표준용액 제조</button>' +
      '<button type="button" class="btn btn-secondary" data-act="el-copy">' + svg('copy') + '정보 복사</button></div>' +
      '<div class="callout info el-note" role="note">' + svg('info') + '<div><strong>ICP 분석 조건은 포함하지 않습니다</strong><p>분석 파장, 검출한계, 간섭 정보는 장비와 분석법에 따라 달라지므로 제공하지 않습니다. 사용 중인 장비의 라이브러리와 검증된 분석법을 참고하세요. 원자량은 IUPAC 표준 원자량(약식)이며, [ ] 값은 대표 질량수입니다.</p></div></div>';
  }

  function elementsView() {
    const cells = Core.ELEMENTS.map(e => {
      const p = Core.elementPos(e.z);
      return '<button type="button" data-act="el-select" data-z="' + e.z + '" style="grid-row:' + p[0] + ';grid-column:' + p[1] + '" aria-label="' + esc(e.symbol + ' ' + e.name + ' ' + e.ko[0]) + '"><small>' + e.z + '</small>' + esc(e.symbol) + '</button>';
    }).join('');
    return '<div class="tool-head"><a class="back" href="#/">' + svg('back') + '전체 기능</a><h1 class="tool-title">원소 정보</h1>' +
      '<div class="tool-sub"><span>Element Information</span><span class="chip">118 elements</span></div>' +
      '<nav class="tabs" aria-label="기능 선택">' + TOOLS.map(t => '<a class="tab" href="#/' + t.id + '"' + (t.id === 'elements' ? ' aria-current="page"' : '') + '>' + esc(t.ko) + '</a>').join('') + '</nav></div>' +
      '<div class="layout stack"><section class="panel" aria-label="검색"><div class="search">' + svg('search') +
      '<input type="text" id="el-q" autocomplete="off" spellcheck="false" placeholder="Fe · Iron · 철 · 26 로 검색" aria-label="원소 검색"></div>' +
      '<div class="matches" id="el-matches"></div><div class="pt-wrap" style="margin-top:14px"><div class="pt" id="pt">' + cells +
      '<div class="ph" style="grid-row:6;grid-column:3">57–71</div><div class="ph" style="grid-row:7;grid-column:3">89–103</div></div></div></section>' +
      '<section class="panel" aria-label="원소 상세"><div class="panel-lbl">DETAIL</div><div id="el-detail"></div></section></div>';
  }

  function paintElements(matches) {
    $$('#pt button').forEach(b => {
      const z = Number(b.dataset.z);
      b.classList.toggle('sel', z === elSel);
      b.classList.toggle('dim', !!matches && matches.indexOf(z) < 0);
      b.setAttribute('aria-pressed', z === elSel ? 'true' : 'false');
    });
    $('#el-detail').innerHTML = elementDetailHtml(elSel);
  }

  function runElementSearch(q) {
    const zs = Core.searchElements(q);
    const box = $('#el-matches');
    if (!q.trim()) { box.innerHTML = ''; paintElements(null); return; }
    if (!zs.length) {
      box.innerHTML = '<p class="hint">검색 결과가 없습니다. 원소 기호(Fe), 영문명(Iron), 한글명(철), 원자번호(26)로 검색해 보세요.</p>';
      paintElements([]);
      return;
    }
    elSel = zs[0];
    box.innerHTML = zs.slice(0, 10).map(z => {
      const e = Core.ELEMENTS[z - 1];
      return '<button type="button" data-act="el-select" data-z="' + z + '">' + esc(e.symbol + ' · ' + e.name + ' · ' + e.ko[0]) + '</button>';
    }).join('');
    paintElements(zs);
  }

  /* ---------------------------------------------------------------- */
  /* Actions                                                           */
  /* ---------------------------------------------------------------- */

  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = svg('check') + '<span>' + esc(msg) + '</span>';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => fallback());
    }
    return Promise.resolve(fallback());
  }

  function saveCurrent(silent) {
    if (!current || !current.report || current.report.status !== 'ok' || !current.report.history) return false;
    Store.add({ tool: current.tool.id, title: current.report.history.title, summary: current.report.history.summary, vals: current.vals });
    if (!silent) toast('기록에 저장했습니다');
    return true;
  }

  function go(id, preset) {
    pendingPreset = preset || null;
    if (location.hash === '#/' + id) route(); else location.hash = '#/' + id;
  }

  function addRow() {
    const box = $('#mrows');
    if (!box) return;
    const i = $$('.mrow', box).length;
    box.insertAdjacentHTML('beforeend', mixedRowHtml({ el: '', c1: '1000', u1: 'mg/L', c2: '', u2: 'mg/L' }, i));
    update();
    const input = $('#m' + i + '-el');
    if (input) input.focus();
  }

  function delRow(i) {
    const box = $('#mrows');
    const rows = mixedTool.collect($('#tool-form')).rows;
    rows.splice(i, 1);
    if (!rows.length) rows.push({ el: '', c1: '', u1: 'mg/L', c2: '', u2: 'mg/L' });
    box.innerHTML = rows.map(mixedRowHtml).join('');
    update();
  }

  document.addEventListener('click', ev => {
    const goEl = ev.target.closest('[data-go]');
    if (goEl) {
      let preset = null;
      try { preset = goEl.dataset.preset ? JSON.parse(goEl.dataset.preset) : null; } catch (e) { preset = null; }
      go(goEl.dataset.go, preset);
      return;
    }
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'copy-ko' || act === 'copy-en') {
      if (!current || !current.report || !current.report.copy) return;
      copyText(current.report.copy[act === 'copy-ko' ? 'ko' : 'en']).then(ok => {
        if (ok) { saveCurrent(true); toast('결과를 복사하고 기록에 저장했습니다'); } else toast('복사에 실패했습니다. 결과를 직접 선택해 복사하세요');
      });
    } else if (act === 'save') saveCurrent(false);
    else if (act === 'add-row') addRow();
    else if (act === 'del-row') delRow(Number(el.dataset.i));
    else if (act === 'hist-load') {
      const h = Store.list().filter(x => x.id === el.dataset.id)[0];
      if (h && TOOL[h.tool]) go(h.tool, h.vals);
    } else if (act === 'hist-del') { Store.remove(el.dataset.id); route(); }
    else if (act === 'hist-clear') { Store.clear(); route(); toast('기록을 삭제했습니다'); }
    else if (act === 'el-select') {
      elSel = Number(el.dataset.z);
      paintElements(($('#el-q').value.trim() ? Core.searchElements($('#el-q').value) : null));
    } else if (act === 'el-use') go('standard', { name: Core.ELEMENTS[elSel - 1].symbol });
    else if (act === 'el-copy') {
      const e = Core.ELEMENTS[elSel - 1];
      copyText(e.symbol + ' / ' + e.name + ' / Atomic Number: ' + e.z + ' / Atomic Weight: ' + e.weight).then(ok => toast(ok ? '원소 정보를 복사했습니다' : '복사에 실패했습니다'));
    } else if (act === 'catalog') {
      const slot = $('#catalog-slot');
      Catalog.find(current.report.catalogQuery).then(items => { slot.innerHTML = catalogItemsHtml(items); });
    }
  });

  app.addEventListener('input', ev => {
    if (ev.target.id === 'el-q') { runElementSearch(ev.target.value); return; }
    if (ev.target.closest('#tool-form')) update();
  });
  app.addEventListener('change', ev => { if (ev.target.closest('#tool-form')) update(); });

  document.addEventListener('pointermove', ev => {
    const t = ev.target.closest && ev.target.closest('.card, .panel');
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', ev.clientX - r.left + 'px');
    t.style.setProperty('--my', ev.clientY - r.top + 'px');
  });

  /* ---------------------------------------------------------------- */
  /* Router                                                            */
  /* ---------------------------------------------------------------- */

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  function parallax() {
    ticking = false;
    const h = $('.hero-inner');
    if (!h || reduceMotion) return;
    const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.5)));
    h.style.opacity = String(1 - p);
    h.style.transform = 'translateY(' + p * 100 + 'px) scale(' + (1 - p * 0.05) + ')';
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });

  function route() {
    const id = location.hash.replace(/^#\/?/, '');
    const preset = pendingPreset;
    pendingPreset = null;
    current = null;
    if (id === 'history') {
      app.innerHTML = historyView();
      document.title = '계산 기록 · ICP Lab Calculator';
    } else if (id === 'elements') {
      app.innerHTML = elementsView();
      paintElements(null);
      document.title = '원소 정보 · ICP Lab Calculator';
    } else if (TOOL[id]) {
      mountTool(TOOL[id], preset);
      document.title = TOOL[id].ko + ' · ICP Lab Calculator';
    } else {
      app.innerHTML = homeView();
      document.title = 'ICP Lab Calculator';
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();
