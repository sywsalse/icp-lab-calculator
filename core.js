const Core = (() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Units & constants                                                   */
  /* ------------------------------------------------------------------ */

  const CONC = {
    '%':     { basis: 'm', f: 1e4 },
    'ppm':   { basis: 'm', f: 1 },
    'ppb':   { basis: 'm', f: 1e-3 },
    'ppt':   { basis: 'm', f: 1e-6 },
    'mg/L':  { basis: 'v', f: 1 },
    'μg/L':  { basis: 'v', f: 1e-3 },
    'ng/L':  { basis: 'v', f: 1e-6 },
    'mg/mL': { basis: 'v', f: 1e3 },
    'μg/mL': { basis: 'v', f: 1 },
    'mg/kg': { basis: 'm', f: 1 },
    'μg/kg': { basis: 'm', f: 1e-3 }
  };
  const VOL = { 'μL': 1e-3, 'mL': 1, 'L': 1e3 };
  const MASS = { 'mg': 1e-3, 'g': 1, 'kg': 1e3 };
  const FLASKS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
  const SMALL_ML = 0.2;
  const EPS = 1e-12;
  const SUPER = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const PPM_FAMILY = ['ppm', 'ppb', 'ppt'];

  const MSG = {
    empty: '값을 입력하세요.',
    negative: '음수는 입력할 수 없습니다.',
    zero: '0보다 큰 값을 입력하세요.',
    invalid: '숫자만 입력하세요. (예: 12.5)'
  };

  /* ------------------------------------------------------------------ */
  /* Parsing & formatting                                                */
  /* ------------------------------------------------------------------ */

  function parseNum(raw, allowZero) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return { ok: false, code: 'empty', msg: MSG.empty };
    if (s[0] === '-') return { ok: false, code: 'negative', msg: MSG.negative };
    const m = /^\+?(\d*\.?\d*)(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m || !/\d/.test(m[1])) return { ok: false, code: 'invalid', msg: MSG.invalid };
    const value = Number(s);
    if (!isFinite(value)) return { ok: false, code: 'invalid', msg: MSG.invalid };
    if (value === 0 && !allowZero) return { ok: false, code: 'zero', msg: MSG.zero };
    const decimals = m[2] === undefined && m[1].indexOf('.') >= 0 ? m[1].split('.')[1].length : 0;
    return { ok: true, value, decimals, raw: s.replace(/^\+/, '') };
  }

  function sup(n) {
    return String(n).split('').map(ch => SUPER[ch] || ch).join('');
  }

  function trimNum(x, sig) {
    sig = sig || 6;
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const r = Number(Number(x).toPrecision(12));
    const p = Number(r.toPrecision(sig));
    const a = Math.abs(p);
    if (a >= 1e-4 && a < 1e9) return String(p);
    const parts = p.toExponential(sig - 1).split('e');
    return Number(parts[0]) + '×10' + sup(Number(parts[1]));
  }

  function pickDecimals(mode, decs) {
    if (mode !== 'auto' && mode != null && mode !== '') return Number(mode);
    const list = (decs || []).filter(Number.isFinite);
    return Math.min(6, Math.max(2, ...list));
  }

  function fmtVol(mL, d) {
    const v = Math.abs(mL);
    if (v === 0) return { text: (0).toFixed(d) + ' mL', alt: '', unit: 'mL' };
    if (v < 0.1 - 1e-12) {
      const ul = mL * 1000;
      const dd = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(ul)) + 1e-9));
      return { text: ul.toFixed(dd) + ' μL', alt: trimNum(mL, 3) + ' mL', unit: 'μL' };
    }
    if (v >= 10000) return { text: (mL / 1000).toFixed(d) + ' L', alt: trimNum(mL, 6) + ' mL', unit: 'L' };
    return { text: mL.toFixed(d) + ' mL', alt: v < 1 ? trimNum(mL * 1000, 4) + ' μL' : '', unit: 'mL' };
  }

  function volLabel(f) {
    return f.alt ? f.text + ' (' + f.alt + ')' : f.text;
  }

  function isFlask(mL) {
    return FLASKS.some(f => Math.abs(f - mL) <= 1e-9 * f + 1e-12);
  }

  function flaskKo(mL, label) {
    return isFlask(mL) ? label + ' 메스플라스크' : label + ' 용기';
  }

  function toMgL(value, unit, density) {
    const u = CONC[unit];
    return u.basis === 'v' ? value * u.f : value * u.f * (density || 1);
  }

  function fromMgL(mgL, unit, density) {
    const u = CONC[unit];
    return u.basis === 'v' ? mgL / u.f : mgL / (u.f * (density || 1));
  }

  function fmtConcAuto(mgL, family) {
    const set = family === 'ppm'
      ? [['ppm', 1], ['ppb', 1e-3], ['ppt', 1e-6]]
      : [['mg/L', 1], ['μg/L', 1e-3], ['ng/L', 1e-6]];
    let pick = set[set.length - 1];
    for (const s of set) {
      if (mgL >= s[1] * (1 - 1e-9)) { pick = s; break; }
    }
    return trimNum(mgL / pick[1], 6) + ' ' + pick[0];
  }

  const familyOf = unit => (PPM_FAMILY.indexOf(unit) >= 0 ? 'ppm' : 'v');
  const usesMassBasis = (...units) => units.some(u => CONC[u] && CONC[u].basis === 'm');
  const stripMarks = s => s.replace(/\*\*/g, '');

  /* ------------------------------------------------------------------ */
  /* Dilution  (C1 V1 = C2 V2)                                           */
  /* ------------------------------------------------------------------ */

  function dilute(p) {
    const C1 = toMgL(p.c1, p.u1);
    const C2 = toMgL(p.c2, p.u2);
    const V2 = p.v2 * VOL[p.vu];
    const out = { C1, C2, V2, errors: [], flags: {} };
    if (C2 > C1 * (1 + EPS)) {
      out.errors.push({
        code: 'target_higher',
        title: '목표 농도가 너무 높습니다',
        text: '목표 농도가 Stock 농도보다 높습니다. 더 높은 농도의 Stock solution을 사용하세요.'
      });
      return out;
    }
    out.V1 = (C2 * V2) / C1;
    out.diluent = V2 - out.V1;
    out.df = C1 / C2;
    if (out.V1 > V2 * (1 + EPS)) {
      out.errors.push({
        code: 'v1_exceeds',
        title: '원액 부피가 최종 부피보다 큽니다',
        text: '필요한 원액량이 최종 부피보다 큽니다. 입력값을 확인하세요.'
      });
      return out;
    }
    out.flags.same = Math.abs(C1 - C2) <= C1 * EPS;
    out.flags.small = !out.flags.same && out.V1 < SMALL_ML - 1e-12;
    out.flags.massBasis = usesMassBasis(p.u1, p.u2);
    return out;
  }

  const MASS_BASIS_NOTE = '%, ppm, ppb, ppt는 수용액(밀도 ≈ 1 g/mL)으로 가정하여 mg/L로 환산했습니다.';

  function describeDilution(calc, o) {
    const rep = { status: 'ok', callouts: [] };
    calc.errors.forEach(e => rep.callouts.push({ level: 'error', ...e }));
    if (calc.errors.length) { rep.status = 'error'; return rep; }

    const d = o.decimals;
    const std = o.kind === 'standard';
    const v1 = fmtVol(calc.V1, d);
    const dil = fmtVol(calc.diluent, d);
    const nm = o.name ? o.name + ' ' : '';
    const stock = o.c1Str + ' ' + o.u1;
    const target = o.c2Str + ' ' + o.u2;
    const finalStr = o.v2Str + ' ' + o.vu;
    const dfStr = trimNum(calc.df, 6);
    const dilKo = o.diluent ? '희석액(' + o.diluent + ')' : '희석액';
    const dilEn = o.diluent ? 'diluent (' + o.diluent + ')' : 'diluent';
    const sameUnit = o.u1 === o.u2;

    if (calc.flags.same) {
      rep.callouts.push({ level: 'info', code: 'same', title: '희석이 필요하지 않습니다', text: '목표 농도가 Stock 농도와 같습니다. 희석배수는 1배입니다.' });
    }
    if (calc.flags.small) {
      rep.callouts.push({
        level: 'warn', code: 'small_volume', title: '취급량이 매우 작습니다',
        text: '계산된 취급량이 매우 작습니다(' + volLabel(v1) + '). 피펫의 정확도를 고려하여 단계 희석을 권장합니다.'
      });
    }
    if (calc.flags.massBasis) {
      rep.callouts.push({ level: 'info', code: 'mass_basis', title: '단위 환산 가정', text: MASS_BASIS_NOTE });
    }

    const unitLine = (label, str, unit, mgL) => {
      const base = trimNum(mgL, 6) + ' mg/L';
      return unit === 'mg/L' ? label + ' = ' + str + ' ' + unit : label + ' = ' + str + ' ' + unit + ' = ' + base;
    };
    const v2Base = trimNum(calc.V2, 6) + ' mL';
    const v2Line = o.vu === 'mL' ? 'V₂ = ' + finalStr : 'V₂ = ' + finalStr + ' = ' + v2Base;

    rep.procedure = {
      ko: nm + stock + ' 표준액 **' + v1.text + '**를 취하여 ' +
        (isFlask(calc.V2) ? finalStr + ' 메스플라스크에 넣고 ' + dilKo + '으로 표선까지 정용합니다.'
          : dilKo + '으로 희석하여 최종 부피 ' + finalStr + '가 되도록 합니다.'),
      en: 'Take **' + v1.text + '** of ' + nm + stock + ' standard solution and dilute to ' + finalStr + ' with ' + dilEn + '.'
    };
    rep.metrics = [
      { label: std ? '필요한 Stock 양 (V₁)' : '필요한 원액 부피 (V₁)', value: v1.text, sub: v1.alt || (std ? 'Stock standard' : 'Stock solution') },
      { label: '필요한 희석액 부피', value: '약 ' + dil.text, sub: 'Diluent (표선까지 정용)' },
      { label: '최종 부피 (V₂)', value: finalStr, sub: 'Final volume' },
      { label: '희석배수', value: dfStr + '×', sub: 'Dilution factor' }
    ];
    rep.steps = [
      '단위 통일 (mg/L, mL 기준)',
      unitLine('C₁', o.c1Str, o.u1, calc.C1),
      unitLine('C₂', o.c2Str, o.u2, calc.C2),
      v2Line,
      'V₁ = (C₂ × V₂) ÷ C₁ = (' + trimNum(calc.C2, 6) + ' × ' + trimNum(calc.V2, 6) + ') ÷ ' + trimNum(calc.C1, 6) + ' = ' + v1.text,
      '희석액 = V₂ − V₁ = ' + trimNum(calc.V2, 6) + ' − ' + trimNum(calc.V1, 6) + ' ≈ ' + dil.text,
      '희석배수 = C₁ ÷ C₂ = ' + trimNum(calc.C1, 6) + ' ÷ ' + trimNum(calc.C2, 6) + ' = ' + dfStr
    ];

    const head = std ? 'Standard Preparation' : 'Dilution';
    const headKo = std ? '표준용액 제조' : '희석 계산';
    rep.copy = {
      en: [
        '[' + head + ']', '',
        'Stock: ' + nm + stock,
        'Target: ' + nm + target,
        'Final volume: ' + finalStr, '',
        (std ? 'Stock required: ' : 'Stock volume required: ') + v1.text,
        'Diluent: approximately ' + dil.text + (o.diluent ? ' (' + o.diluent + ')' : ''),
        'Dilution factor: ' + dfStr + '×', '',
        'Procedure:', stripMarks(rep.procedure.en)
      ].join('\n'),
      ko: [
        '[' + headKo + ']', '',
        'Stock: ' + nm + stock,
        '목표 농도: ' + nm + target,
        '최종 부피: ' + finalStr, '',
        (std ? '필요한 Stock 양: ' : '필요한 원액 부피: ') + v1.text,
        '희석액: 약 ' + dil.text + (o.diluent ? ' (' + o.diluent + ')' : ''),
        '희석배수: ' + dfStr + '배', '',
        '제조 방법:', stripMarks(rep.procedure.ko)
      ].join('\n')
    };
    rep.history = {
      title: std ? '표준용액 제조' : '희석 계산',
      summary: nm + o.c1Str + (sameUnit ? '' : ' ' + o.u1) + ' → ' + o.c2Str + ' ' + o.u2 + ' / ' + finalStr
    };
    rep.catalogQuery = std ? { element: o.name || '', concentration: o.c1Str, unit: o.u1 } : null;
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Serial dilution                                                     */
  /* ------------------------------------------------------------------ */

  const NICE = [2, 2.5, 4, 5, 8, 10, 20, 25, 40, 50, 80, 100, 200, 250, 400, 500, 800, 1000, 2000, 2500, 5000, 10000];
  const isPow10 = x => Math.abs(Math.log10(x) - Math.round(Math.log10(x))) < 1e-9;
  const isNice = x => NICE.some(n => Math.abs(n - x) < 1e-9 * n);

  function volumesFor(f, finalMl, stepMl) {
    const n = f.length;
    const vols = new Array(n);
    const aliq = new Array(n);
    vols[n - 1] = finalMl;
    for (let i = n - 1; i >= 0; i--) {
      aliq[i] = vols[i] / f[i];
      if (i > 0) vols[i - 1] = Math.max(stepMl, aliq[i]);
    }
    return { vols, aliq };
  }

  function cmpScore(a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const diff = a[i] - b[i];
      if (Math.abs(diff) > 1e-9 * Math.max(1, Math.abs(a[i]))) return diff > 0 ? 1 : -1;
    }
    return 0;
  }

  function chooseFactors(total, maxDf, finalMl, stepMl) {
    let n = 1;
    while (Math.pow(maxDf, n) < total * (1 - 1e-12)) n++;
    if (n === 1) return [total];
    const nice = NICE.filter(x => x <= maxDf * (1 + 1e-9));
    if (n > 6 || !nice.length) {
      const f = new Array(n - 1).fill(maxDf);
      f.push(total / Math.pow(maxDf, n - 1));
      return f;
    }
    let best = null;
    let count = 0;
    const cur = [];
    const consider = f => {
      const minA = Math.min(...volumesFor(f, finalMl, stepMl).aliq);
      const score = [
        Math.min(minA, 1),
        f.filter(isPow10).length,
        f.filter(isNice).length,
        minA,
        ...f
      ];
      if (!best || cmpScore(score, best.score) > 0) best = { f, score };
    };
    const rec = (k, p) => {
      if (count > 300000) return;
      if (k === n - 1) {
        const last = total / p;
        if (last < 2 - 1e-9 || last > maxDf * (1 + 1e-9)) return;
        count++;
        consider(cur.concat([last]));
        return;
      }
      for (const x of nice) {
        const p2 = p * x;
        if (p2 > (total / 2) * (1 + 1e-9)) break;
        if (p2 * Math.pow(maxDf, n - 1 - k) < total * (1 - 1e-9)) continue;
        cur.push(x);
        rec(k + 1, p2);
        cur.pop();
      }
    };
    rec(0, 1);
    if (best) return best.f;
    const f = new Array(n - 1).fill(maxDf);
    f.push(total / Math.pow(maxDf, n - 1));
    return f;
  }

  function planSerial(p) {
    const C1 = toMgL(p.c1, p.u1);
    const C2 = toMgL(p.c2, p.u2);
    const out = { C1, C2, errors: [], flags: {}, steps: [] };
    if (C2 > C1 * (1 + EPS)) {
      out.errors.push({
        code: 'target_higher',
        title: '목표 농도가 너무 높습니다',
        text: '목표 농도가 Stock 농도보다 높습니다. 더 높은 농도의 Stock solution을 사용하세요.'
      });
      return out;
    }
    out.total = C1 / C2;
    out.flags.massBasis = usesMassBasis(p.u1, p.u2);
    if (Math.abs(C1 - C2) <= C1 * EPS) { out.flags.same = true; return out; }
    const f = chooseFactors(out.total, p.maxDf, p.finalMl, p.stepMl);
    const { vols, aliq } = volumesFor(f, p.finalMl, p.stepMl);
    let src = C1;
    out.steps = f.map((fi, i) => {
      const tgt = i === f.length - 1 ? C2 : src / fi;
      const s = { index: i + 1, src, tgt, df: fi, aliquot: aliq[i], vol: vols[i], diluent: vols[i] - aliq[i] };
      src = tgt;
      return s;
    });
    out.minAliquot = Math.min(...aliq);
    out.flags.small = out.minAliquot < SMALL_ML - 1e-12;
    return out;
  }

  function describeSerial(calc, o) {
    const rep = { status: 'ok', callouts: [] };
    calc.errors.forEach(e => rep.callouts.push({ level: 'error', ...e }));
    if (calc.errors.length) { rep.status = 'error'; return rep; }
    if (calc.flags.same) {
      rep.callouts.push({ level: 'info', code: 'same', title: '희석이 필요하지 않습니다', text: '목표 농도가 Stock 농도와 같습니다.' });
      rep.status = 'error';
      return rep;
    }
    const d = o.decimals;
    const fam = familyOf(o.u1);
    const stock = o.c1Str + ' ' + o.u1;
    const target = o.c2Str + ' ' + o.u2;
    const steps = calc.steps;
    const n = steps.length;
    const label = (s, which) => {
      if (which === 'src') return s.index === 1 ? stock : fmtConcAuto(s.src, fam);
      return s.index === n ? target : fmtConcAuto(s.tgt, fam);
    };
    if (n === 1) {
      rep.callouts.push({ level: 'info', code: 'single', title: '1단계 희석으로 충분합니다', text: '최대 희석배수 이내이므로 단계 희석 없이 한 번에 조제할 수 있습니다.' });
    }
    if (calc.flags.small) {
      rep.callouts.push({
        level: 'warn', code: 'small_volume', title: '취급량이 작은 단계가 있습니다',
        text: '가장 작은 취급량이 ' + volLabel(fmtVol(calc.minAliquot, d)) + '입니다. 최대 희석배수를 낮추거나 최종 필요량을 늘리면 취급량이 커집니다.'
      });
    }
    if (calc.flags.massBasis) {
      rep.callouts.push({ level: 'info', code: 'mass_basis', title: '단위 환산 가정', text: MASS_BASIS_NOTE });
    }

    const dfTxt = s => trimNum(s.df, 6) + '×';
    rep.metrics = [
      { label: '총 희석배수', value: trimNum(calc.total, 6) + '×', sub: 'Total dilution factor' },
      { label: '희석 단계 수', value: String(n) + '단계', sub: steps.map(s => trimNum(s.df, 4)).join(' × ') },
      { label: '필요한 Stock 양', value: fmtVol(steps[0].aliquot, d).text, sub: 'Stock consumption' }
    ];
    rep.table = {
      head: ['단계', '원액 농도', '목표 농도', '취할 원액량', '희석액량', '최종 부피', '희석배수'],
      rows: steps.map(s => ({
        warn: s.aliquot < SMALL_ML - 1e-12,
        cells: [
          String(s.index) + '단계',
          label(s, 'src'),
          label(s, 'tgt'),
          fmtVol(s.aliquot, d).text,
          '약 ' + fmtVol(s.diluent, d).text,
          fmtVol(s.vol, d).text,
          dfTxt(s)
        ]
      }))
    };
    const stepKo = s => {
      const a = fmtVol(s.aliquot, d).text;
      const vol = trimNum(s.vol, 6) + ' mL';
      return s.index + '단계: ' + label(s, 'src') + ' 용액 **' + a + '**를 취하여 ' +
        (isFlask(s.vol) ? vol + ' 메스플라스크에 넣고 희석액으로 표선까지 정용합니다' : '희석액으로 최종 ' + vol + '가 되도록 희석합니다') +
        ' (→ ' + label(s, 'tgt') + ').';
    };
    const stepEn = s => {
      const a = fmtVol(s.aliquot, d).text;
      return 'Step ' + s.index + ': Take **' + a + '** of ' + label(s, 'src') + ' solution and dilute to ' +
        trimNum(s.vol, 6) + ' mL with diluent (→ ' + label(s, 'tgt') + ').';
    };
    rep.procList = steps.map(s => ({ ko: stepKo(s), en: stepEn(s) }));
    rep.steps = [
      '총 희석배수 = C₀ ÷ Cₙ = ' + trimNum(calc.C1, 6) + ' ÷ ' + trimNum(calc.C2, 6) + ' = ' + trimNum(calc.total, 6),
      '단계별 희석배수: ' + steps.map(s => trimNum(s.df, 6)).join(' × ') + ' = ' + trimNum(steps.reduce((a, s) => a * s.df, 1), 6),
      '각 단계 취할 원액량 = 단계 최종 부피 ÷ 단계 희석배수',
      '마지막 단계 최종 부피 = 최종 필요량 = ' + trimNum(steps[n - 1].vol, 6) + ' mL',
      '각 단계에서 취한 부피는 앞 단계 용액에서 채취하므로 앞 단계 부피 ≥ 다음 단계 취할 양이 되도록 계산'
    ];
    const enLines = steps.map(s => 'Step ' + s.index + ': ' + label(s, 'src') + ' → ' + label(s, 'tgt') +
      ' | take ' + fmtVol(s.aliquot, d).text + ', dilute to ' + trimNum(s.vol, 6) + ' mL (' + dfTxt(s) + ')');
    const koLines = steps.map(s => s.index + '단계: ' + label(s, 'src') + ' → ' + label(s, 'tgt') +
      ' | ' + fmtVol(s.aliquot, d).text + ' 취하여 ' + trimNum(s.vol, 6) + ' mL로 희석 (' + trimNum(s.df, 6) + '배)');
    rep.copy = {
      en: ['[Serial Dilution]', '', 'Stock: ' + stock, 'Target: ' + target, 'Final volume: ' + o.finStr + ' ' + o.finU,
        'Total dilution factor: ' + trimNum(calc.total, 6) + '×', '', ...enLines].join('\n'),
      ko: ['[단계 희석]', '', 'Stock: ' + stock, '목표 농도: ' + target, '최종 필요량: ' + o.finStr + ' ' + o.finU,
        '총 희석배수: ' + trimNum(calc.total, 6) + '배', '', ...koLines].join('\n')
    };
    rep.history = { title: '단계 희석', summary: stock + ' → ' + target + ' / ' + n + '단계 (' + o.finStr + ' ' + o.finU + ')' };
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Mixed standard                                                      */
  /* ------------------------------------------------------------------ */

  function mixStandard(p) {
    const Vf = p.vf * VOL[p.vu];
    const out = { Vf, rows: [], errors: [], flags: {}, total: 0 };
    let bad = 0;
    p.rows.forEach((r, i) => {
      const C1 = toMgL(r.c1, r.u1);
      const C2 = toMgL(r.c2, r.u2);
      const row = { i, el: r.el, C1, C2, src: r };
      if (C2 > C1 * (1 + EPS)) {
        row.error = '목표 농도가 Stock 농도보다 높습니다. 더 높은 농도의 Stock solution을 사용하세요.';
        bad++;
      } else {
        row.V1 = (C2 * Vf) / C1;
        row.df = C1 / C2;
        out.total += row.V1;
      }
      out.rows.push(row);
    });
    if (bad) {
      out.errors.push({
        code: 'row_error', title: '목표 농도가 Stock 농도보다 높은 행이 있습니다',
        text: '해당 행에는 더 높은 농도의 Stock solution을 사용하세요.'
      });
      return out;
    }
    out.diluent = Vf - out.total;
    if (out.total > Vf * (1 + EPS)) {
      out.errors.push({
        code: 'sum_exceeds', title: 'Stock 합계가 최종 부피를 초과합니다',
        text: '필요한 Stock 부피의 합(' + trimNum(out.total, 6) + ' mL)이 최종 부피(' + trimNum(Vf, 6) + ' mL)보다 큽니다. 더 높은 농도의 Stock을 사용하거나 최종 부피를 늘리세요.'
      });
      return out;
    }
    out.flags.small = out.rows.some(r => r.V1 < SMALL_ML - 1e-12);
    out.flags.crowded = out.total > Vf * 0.9;
    out.flags.massBasis = p.rows.some(r => usesMassBasis(r.u1, r.u2));
    return out;
  }

  function describeMixed(calc, o) {
    const rep = { status: 'ok', callouts: [] };
    calc.errors.forEach(e => rep.callouts.push({ level: 'error', ...e }));
    const d = o.decimals;
    const finalStr = o.vfStr + ' ' + o.vu;
    const nameOf = r => r.el || '—';
    if (calc.errors.length) {
      rep.status = 'error';
      rep.rowErrors = calc.rows.filter(r => r.error).map(r => ({ i: r.i, text: r.error }));
      return rep;
    }
    const rows = calc.rows;
    const tot = fmtVol(calc.total, d);
    const dil = fmtVol(calc.diluent, d);
    if (calc.flags.small) {
      const smalls = rows.filter(r => r.V1 < SMALL_ML - 1e-12).map(r => nameOf(r) + ' ' + volLabel(fmtVol(r.V1, d))).join(', ');
      rep.callouts.push({
        level: 'warn', code: 'small_volume', title: '취급량이 매우 작은 원소가 있습니다',
        text: '계산된 취급량이 매우 작습니다(' + smalls + '). 피펫의 정확도를 고려하여 중간 농도의 Stock을 먼저 만들어 사용하세요.'
      });
    }
    if (calc.flags.crowded) {
      rep.callouts.push({
        level: 'warn', code: 'crowded', title: '희석액 비율이 낮습니다',
        text: 'Stock 합계가 최종 부피의 90%를 넘습니다. Stock의 산 매질이 목표 매질과 달라질 수 있으니 확인하세요.'
      });
    }
    if (calc.flags.massBasis) {
      rep.callouts.push({ level: 'info', code: 'mass_basis', title: '단위 환산 가정', text: MASS_BASIS_NOTE });
    }
    rep.callouts.push({
      level: 'info', code: 'compat', title: '혼합 전 확인',
      text: '원소 간 호환성(침전·안정성)과 Stock의 산 매질은 각 제품의 CoA/SDS와 분석법을 확인하세요.'
    });

    rep.procedure = {
      ko: '각 Stock standard를 위의 양만큼 취한 후 희석액으로 최종 **' + finalStr + '**까지 정용합니다.',
      en: 'Combine the Stock standard volumes listed above and dilute to **' + finalStr + '** with diluent.'
    };
    rep.metrics = [
      { label: '총 Stock 용액 부피', value: tot.text, sub: rows.length + '개 원소 합계' },
      { label: '필요한 희석액 부피', value: '약 ' + dil.text, sub: 'Diluent (표선까지 정용)' },
      { label: '최종 부피', value: finalStr, sub: 'Final volume' }
    ];
    rep.table = {
      head: ['원소', 'Stock 농도', '목표 농도', '취할 Stock 부피', '희석배수'],
      rows: rows.map(r => ({
        warn: r.V1 < SMALL_ML - 1e-12,
        cells: [nameOf(r), r.src.c1Str + ' ' + r.src.u1, r.src.c2Str + ' ' + r.src.u2, volLabel(fmtVol(r.V1, d)), trimNum(r.df, 6) + '×']
      })),
      foot: ['합계', '', '', tot.text, '']
    };
    rep.steps = [
      '각 원소: V₁ = (C₂ × V_final) ÷ C₁',
      ...rows.map(r => nameOf(r) + ': (' + trimNum(r.C2, 6) + ' × ' + trimNum(calc.Vf, 6) + ') ÷ ' + trimNum(r.C1, 6) + ' = ' + fmtVol(r.V1, d).text),
      '총 Stock 부피 = ' + rows.map(r => trimNum(r.V1, 6)).join(' + ') + ' = ' + trimNum(calc.total, 6) + ' mL',
      '희석액 = V_final − 총 Stock = ' + trimNum(calc.Vf, 6) + ' − ' + trimNum(calc.total, 6) + ' ≈ ' + dil.text
    ];
    const enRows = rows.map(r => '  ' + nameOf(r) + ' (' + r.src.c1Str + ' ' + r.src.u1 + ' → ' + r.src.c2Str + ' ' + r.src.u2 + '): ' + fmtVol(r.V1, d).text);
    rep.copy = {
      en: ['[Mixed Standard Preparation]', '', 'Final volume: ' + finalStr, '', 'Stock volumes:', ...enRows, '',
        'Total stock volume: ' + tot.text, 'Diluent: approximately ' + dil.text, '', 'Procedure:', stripMarks(rep.procedure.en)].join('\n'),
      ko: ['[혼합 표준용액 제조]', '', '최종 부피: ' + finalStr, '', '필요한 Stock 부피:', ...enRows, '',
        '총 Stock 부피: ' + tot.text, '희석액: 약 ' + dil.text, '', '제조 방법:', stripMarks(rep.procedure.ko)].join('\n')
    };
    rep.history = {
      title: '혼합 표준용액',
      summary: rows.map(nameOf).join('/') + ' / ' + finalStr
    };
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Sample concentration                                                */
  /* ------------------------------------------------------------------ */

  const SAMPLE_RESULT_F = { 'mg/L': 1, 'μg/L': 1e-3, 'ppm': 1, 'ppb': 1e-3 };
  const SAMPLE_OUT_F = { 'mg/kg': 1, 'μg/kg': 1e-3, 'ppm': 1, 'ppb': 1e-3, 'mg/L': 1, 'μg/L': 1e-3 };
  const AMOUNT_KIND = { g: 'mass', mg: 'mass', kg: 'mass', mL: 'volume', L: 'volume' };

  function sampleConc(p) {
    const out = { errors: [], flags: {} };
    const kind = AMOUNT_KIND[p.au];
    const err = (code, title, text) => out.errors.push({ code, title, text });
    if (!(p.ru in SAMPLE_RESULT_F)) {
      err('result_unit', '기기 결과 단위가 맞지 않습니다',
        '기기 결과 단위(' + p.ru + ')는 질량 대 질량 단위라 최종 부피·시료량으로 환산할 수 없습니다. 용액 농도 단위(mg/L, μg/L, ppm, ppb)를 선택하세요.');
    }
    if (kind === 'mass' && (p.ou === 'mg/L' || p.ou === 'μg/L')) {
      err('basis_mismatch', '결과 단위와 시료량 단위가 맞지 않습니다',
        '시료량이 무게(' + p.au + ') 기준인데 결과 단위(' + p.ou + ')가 부피 기준입니다. mg/kg, μg/kg, ppm, ppb 중 하나를 선택하거나 시료량을 부피로 입력하세요.');
    }
    if (kind === 'volume' && (p.ou === 'mg/kg' || p.ou === 'μg/kg')) {
      err('basis_mismatch', '결과 단위와 시료량 단위가 맞지 않습니다',
        '시료량이 부피(' + p.au + ') 기준인데 결과 단위(' + p.ou + ')가 무게 기준입니다. 밀도 변환은 자동으로 하지 않으므로 mg/L, μg/L, ppm, ppb를 선택하거나 시료 무게를 입력하세요.');
    }
    if (p.df < 1) {
      err('df_low', '희석배수가 1보다 작습니다', '추가 희석배수는 1 이상이어야 합니다. (희석하지 않았다면 1)');
    }
    if (out.errors.length) return out;

    out.kind = kind;
    out.cMeas = p.result * SAMPLE_RESULT_F[p.ru];
    out.cSol = out.cMeas * p.df;
    out.Vl = (p.vol * VOL[p.vu]) / 1000;
    out.massMg = out.cSol * out.Vl;
    if (kind === 'mass') {
      out.amountBase = (p.amount * MASS[p.au]) / 1000;
      out.baseUnit = 'mg/kg';
    } else {
      out.amountBase = (p.amount * (p.au === 'L' ? 1 : 1e-3));
      out.baseUnit = 'mg/L';
    }
    out.base = out.massMg / out.amountBase;
    out.value = out.base / SAMPLE_OUT_F[p.ou];
    out.flags.aqueous = kind === 'volume' && (p.ou === 'ppm' || p.ou === 'ppb');
    return out;
  }

  function describeSample(calc, o) {
    const rep = { status: 'ok', callouts: [] };
    calc.errors.forEach(e => rep.callouts.push({ level: 'error', ...e }));
    if (calc.errors.length) { rep.status = 'error'; return rep; }
    if (calc.flags.aqueous) {
      rep.callouts.push({ level: 'info', code: 'aqueous', title: '수용액 가정',
        text: '부피 기준 시료에서 ppm/ppb는 mg/L, μg/L와 같은 것으로 간주했습니다.' });
    }
    const valTxt = trimNum(calc.value, 6) + ' ' + o.ou;
    const massBase = calc.kind === 'mass';
    const eq = [];
    if (massBase) {
      eq.push(trimNum(calc.base, 6) + ' mg/kg', trimNum(calc.base * 1e3, 6) + ' μg/kg',
        trimNum(calc.base, 6) + ' ppm', trimNum(calc.base * 1e3, 6) + ' ppb', trimNum(calc.base / 1e4, 6) + ' %');
    } else {
      eq.push(trimNum(calc.base, 6) + ' mg/L', trimNum(calc.base * 1e3, 6) + ' μg/L');
    }
    const resStr = o.resStr + ' ' + o.ru;
    const volStr = o.volStr + ' ' + o.vu;
    const amtStr = o.amtStr + ' ' + o.au;
    const dfStr = trimNum(o.dfVal, 6) + '×';

    rep.procedure = {
      ko: '원시료 농도는 **' + valTxt + '** 입니다.',
      en: 'Sample concentration: **' + valTxt + '**.'
    };
    rep.metrics = [
      { label: '원시료 농도', value: trimNum(calc.value, 6) + ' ' + o.ou, sub: eq.filter(e => e.split(' ')[1] !== o.ou).slice(0, 2).join(' = ') },
      { label: '측정 용액 농도 (×희석배수)', value: trimNum(calc.cSol, 6) + ' mg/L', sub: '기기 결과 × ' + dfStr },
      { label: '용액 내 분석원소 질량', value: trimNum(calc.massMg, 6) + ' mg', sub: trimNum(calc.cSol, 6) + ' mg/L × ' + trimNum(calc.Vl, 6) + ' L' }
    ];
    const amountLine = massBase
      ? trimNum(calc.massMg, 6) + ' mg ÷ ' + trimNum(calc.amountBase, 6) + ' kg = ' + trimNum(calc.base, 6) + ' mg/kg'
      : trimNum(calc.massMg, 6) + ' mg ÷ ' + trimNum(calc.amountBase, 6) + ' L = ' + trimNum(calc.base, 6) + ' mg/L';
    const convLine = o.ou === calc.baseUnit ? null : trimNum(calc.base, 6) + ' ' + calc.baseUnit + ' = ' + valTxt;
    rep.steps = [
      '측정 용액 농도 = ' + trimNum(calc.cMeas, 6) + ' mg/L × ' + trimNum(o.dfVal, 6) + ' = ' + trimNum(calc.cSol, 6) + ' mg/L',
      '용액 내 질량 = ' + trimNum(calc.cSol, 6) + ' mg/L × ' + trimNum(calc.Vl, 6) + ' L (' + volStr + ') = ' + trimNum(calc.massMg, 6) + ' mg',
      (massBase ? '시료 무게 ' + amtStr + ' = ' + trimNum(calc.amountBase, 6) + ' kg' : '시료 부피 ' + amtStr + ' = ' + trimNum(calc.amountBase, 6) + ' L'),
      '원시료 농도 = ' + amountLine
    ];
    if (convLine) rep.steps.push('단위 변환: ' + convLine);
    const label = o.label || 'Sample';
    rep.copy = {
      en: ['[Sample Concentration]', '', 'Sample: ' + label, 'Instrument result: ' + resStr, 'Final volume: ' + volStr,
        'Sample amount: ' + amtStr, 'Additional dilution factor: ' + dfStr, '', 'Sample concentration: ' + valTxt +
        ' (= ' + eq.join(' = ') + ')', '', 'Calculation:',
        trimNum(calc.cMeas, 6) + ' mg/L × ' + trimNum(o.dfVal, 6) + ' = ' + trimNum(calc.cSol, 6) + ' mg/L',
        trimNum(calc.cSol, 6) + ' mg/L × ' + trimNum(calc.Vl, 6) + ' L = ' + trimNum(calc.massMg, 6) + ' mg', amountLine].join('\n'),
      ko: ['[시료 농도 역산]', '', '시료: ' + label, '기기 결과: ' + resStr, '최종 부피: ' + volStr,
        '시료량: ' + amtStr, '추가 희석배수: ' + trimNum(o.dfVal, 6) + '배', '', '원시료 농도: ' + valTxt +
        ' (= ' + eq.join(' = ') + ')', '', '계산 과정:',
        trimNum(calc.cMeas, 6) + ' mg/L × ' + trimNum(o.dfVal, 6) + ' = ' + trimNum(calc.cSol, 6) + ' mg/L',
        trimNum(calc.cSol, 6) + ' mg/L × ' + trimNum(calc.Vl, 6) + ' L = ' + trimNum(calc.massMg, 6) + ' mg', amountLine].join('\n')
    };
    rep.history = { title: '시료 농도 역산', summary: label + ' / ' + valTxt };
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Dilution factor                                                     */
  /* ------------------------------------------------------------------ */

  function dilutionFactor(p) {
    const Vs = p.vs * VOL[p.us];
    const Vf = p.vf * VOL[p.uf];
    const out = { Vs, Vf, errors: [] };
    if (Vs > Vf * (1 + EPS)) {
      out.errors.push({
        code: 'sample_exceeds', title: '원액 부피가 최종 부피보다 큽니다',
        text: '원액 부피가 최종 부피보다 큽니다. 두 값을 확인하세요.'
      });
      return out;
    }
    out.df = Vf / Vs;
    out.diluent = Vf - Vs;
    return out;
  }

  function describeFactor(calc, o) {
    const rep = { status: 'ok', callouts: [] };
    calc.errors.forEach(e => rep.callouts.push({ level: 'error', ...e }));
    if (calc.errors.length) { rep.status = 'error'; return rep; }
    const dfStr = trimNum(calc.df, 6);
    const same = Math.abs(calc.df - 1) < 1e-12;
    const ratio = trimNum(calc.Vs, 6) + ' : ' + trimNum(calc.diluent, 6);
    const vsStr = o.vsStr + ' ' + o.us;
    const vfStr = o.vfStr + ' ' + o.uf;
    rep.big = { ko: same ? '희석 없음 (1배)' : dfStr + '배 희석', en: dfStr + '× dilution', sub: vsStr + ' → ' + vfStr };
    rep.metrics = [
      { label: '희석배수', value: dfStr + '×', sub: 'Dilution factor' },
      { label: '원액 : 희석액 (mL 기준)', value: ratio, sub: '원액 ' + trimNum(calc.Vs, 6) + ' mL + 희석액 ' + trimNum(calc.diluent, 6) + ' mL' }
    ];
    rep.steps = [
      'Dilution Factor = Final Volume ÷ Sample Volume',
      '= ' + trimNum(calc.Vf, 6) + ' mL ÷ ' + trimNum(calc.Vs, 6) + ' mL = ' + dfStr
    ];
    const label = o.label || 'Sample';
    rep.copy = {
      en: ['[Dilution Factor]', '', 'Sample: ' + label, 'Sample volume: ' + vsStr, 'Final volume: ' + vfStr, '',
        'Dilution factor: ' + dfStr + '× (' + ratio + ')'].join('\n'),
      ko: ['[희석배수 계산]', '', '시료: ' + label, '원액 부피: ' + vsStr, '최종 부피: ' + vfStr, '',
        '희석배수: ' + dfStr + '배 (' + ratio + ')'].join('\n')
    };
    rep.history = { title: '희석배수', summary: label + ' / ' + dfStr + '× dilution' };
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Concentration converter                                             */
  /* ------------------------------------------------------------------ */

  const BASIS_NAME = { v: '질량/부피', m: '질량/질량' };
  const UNIT_ORDER = {
    v: ['mg/L', 'μg/L', 'ng/L', 'mg/mL', 'μg/mL'],
    m: ['%', 'ppm', 'ppb', 'ppt', 'mg/kg', 'μg/kg']
  };

  function convertAll(value, unit, density) {
    const mgL = toMgL(value, unit, density);
    const inBasis = CONC[unit].basis;
    const rows = [];
    ['v', 'm'].forEach(b => {
      UNIT_ORDER[b].forEach(u => {
        rows.push({ unit: u, basis: b, value: fromMgL(mgL, u, density), same: b === inBasis, input: u === unit });
      });
    });
    return rows;
  }

  function describeConvert(p) {
    const rep = { status: 'ok', callouts: [] };
    const inBasis = CONC[p.unit].basis;
    const other = inBasis === 'v' ? 'm' : 'v';
    const rows = convertAll(p.value, p.unit, p.density);
    const dTxt = trimNum(p.density, 6);
    const groups = [
      {
        title: BASIS_NAME[inBasis] + ' 계열 · 정확한 환산',
        note: '같은 기준 단위끼리는 밀도와 관계없이 정확히 환산됩니다.',
        exact: true,
        rows: rows.filter(r => r.basis === inBasis).map(r => ({ unit: r.unit, text: trimNum(r.value, 7), input: r.input }))
      },
      {
        title: BASIS_NAME[other] + ' 계열 · 밀도 가정 필요',
        note: '밀도 ' + dTxt + ' g/mL를 가정한 값입니다. 질량/부피와 질량/질량은 시료 밀도에 따라 달라집니다.',
        exact: false,
        rows: rows.filter(r => r.basis === other).map(r => ({ unit: r.unit, text: trimNum(r.value, 7), input: false }))
      }
    ];
    rep.groups = groups;
    if (Math.abs(p.density - 1) > 1e-9) {
      rep.callouts.push({ level: 'info', code: 'density', title: '밀도 적용됨', text: 'mg/L = mg/kg × 밀도(g/mL). 현재 밀도 ' + dTxt + ' g/mL를 적용했습니다.' });
    }
    const line = r => trimNum(r.value, 7) + ' ' + r.unit;
    const inLine = trimNum(p.value, 7) + ' ' + p.unit;
    const same = rows.filter(r => r.same && !r.input).map(line);
    const cross = rows.filter(r => !r.same).map(line);
    rep.copy = {
      en: ['[Concentration Conversion]', '', 'Input: ' + inLine, '', 'Same basis (' + BASIS_NAME[inBasis] + ', exact):', ...same.map(s => '= ' + s), '',
        'Other basis (' + BASIS_NAME[other] + ', assuming density ' + dTxt + ' g/mL):', ...cross.map(s => '≈ ' + s)].join('\n'),
      ko: ['[농도 단위 변환]', '', '입력: ' + inLine, '', '같은 기준 (' + BASIS_NAME[inBasis] + ', 정확한 환산):', ...same.map(s => '= ' + s), '',
        '다른 기준 (' + BASIS_NAME[other] + ', 밀도 ' + dTxt + ' g/mL 가정):', ...cross.map(s => '≈ ' + s)].join('\n')
    };
    rep.history = { title: '농도 변환', summary: inLine + ' (밀도 ' + dTxt + ' g/mL)' };
    return rep;
  }

  /* ------------------------------------------------------------------ */
  /* Elements                                                            */
  /* ------------------------------------------------------------------ */

  const ELEMENTS = [
    [1, 'H', 'Hydrogen', ['수소'], '1.008'],
    [2, 'He', 'Helium', ['헬륨'], '4.0026'],
    [3, 'Li', 'Lithium', ['리튬'], '6.94'],
    [4, 'Be', 'Beryllium', ['베릴륨'], '9.0122'],
    [5, 'B', 'Boron', ['붕소'], '10.81'],
    [6, 'C', 'Carbon', ['탄소'], '12.011'],
    [7, 'N', 'Nitrogen', ['질소'], '14.007'],
    [8, 'O', 'Oxygen', ['산소'], '15.999'],
    [9, 'F', 'Fluorine', ['플루오린', '불소'], '18.998'],
    [10, 'Ne', 'Neon', ['네온'], '20.180'],
    [11, 'Na', 'Sodium', ['소듐', '나트륨'], '22.990'],
    [12, 'Mg', 'Magnesium', ['마그네슘'], '24.305'],
    [13, 'Al', 'Aluminium', ['알루미늄', 'aluminum'], '26.982'],
    [14, 'Si', 'Silicon', ['규소', '실리콘'], '28.085'],
    [15, 'P', 'Phosphorus', ['인'], '30.974'],
    [16, 'S', 'Sulfur', ['황', 'sulphur'], '32.06'],
    [17, 'Cl', 'Chlorine', ['염소'], '35.45'],
    [18, 'Ar', 'Argon', ['아르곤'], '39.948'],
    [19, 'K', 'Potassium', ['포타슘', '칼륨'], '39.098'],
    [20, 'Ca', 'Calcium', ['칼슘'], '40.078'],
    [21, 'Sc', 'Scandium', ['스칸듐'], '44.956'],
    [22, 'Ti', 'Titanium', ['타이타늄', '티타늄'], '47.867'],
    [23, 'V', 'Vanadium', ['바나듐'], '50.942'],
    [24, 'Cr', 'Chromium', ['크로뮴', '크롬'], '51.996'],
    [25, 'Mn', 'Manganese', ['망가니즈', '망간'], '54.938'],
    [26, 'Fe', 'Iron', ['철'], '55.845'],
    [27, 'Co', 'Cobalt', ['코발트'], '58.933'],
    [28, 'Ni', 'Nickel', ['니켈'], '58.693'],
    [29, 'Cu', 'Copper', ['구리'], '63.546'],
    [30, 'Zn', 'Zinc', ['아연'], '65.38'],
    [31, 'Ga', 'Gallium', ['갈륨'], '69.723'],
    [32, 'Ge', 'Germanium', ['저마늄', '게르마늄'], '72.630'],
    [33, 'As', 'Arsenic', ['비소'], '74.922'],
    [34, 'Se', 'Selenium', ['셀레늄'], '78.971'],
    [35, 'Br', 'Bromine', ['브로민', '브롬'], '79.904'],
    [36, 'Kr', 'Krypton', ['크립톤'], '83.798'],
    [37, 'Rb', 'Rubidium', ['루비듐'], '85.468'],
    [38, 'Sr', 'Strontium', ['스트론튬'], '87.62'],
    [39, 'Y', 'Yttrium', ['이트륨'], '88.906'],
    [40, 'Zr', 'Zirconium', ['지르코늄'], '91.224'],
    [41, 'Nb', 'Niobium', ['나이오븀', '니오븀'], '92.906'],
    [42, 'Mo', 'Molybdenum', ['몰리브데넘', '몰리브덴'], '95.95'],
    [43, 'Tc', 'Technetium', ['테크네튬'], '[98]'],
    [44, 'Ru', 'Ruthenium', ['루테늄'], '101.07'],
    [45, 'Rh', 'Rhodium', ['로듐'], '102.91'],
    [46, 'Pd', 'Palladium', ['팔라듐'], '106.42'],
    [47, 'Ag', 'Silver', ['은'], '107.87'],
    [48, 'Cd', 'Cadmium', ['카드뮴'], '112.41'],
    [49, 'In', 'Indium', ['인듐'], '114.82'],
    [50, 'Sn', 'Tin', ['주석'], '118.71'],
    [51, 'Sb', 'Antimony', ['안티모니'], '121.76'],
    [52, 'Te', 'Tellurium', ['텔루륨', '텔루르'], '127.60'],
    [53, 'I', 'Iodine', ['아이오딘', '요오드'], '126.90'],
    [54, 'Xe', 'Xenon', ['제논', '크세논'], '131.29'],
    [55, 'Cs', 'Caesium', ['세슘', 'cesium'], '132.91'],
    [56, 'Ba', 'Barium', ['바륨'], '137.33'],
    [57, 'La', 'Lanthanum', ['란타넘', '란탄'], '138.91'],
    [58, 'Ce', 'Cerium', ['세륨'], '140.12'],
    [59, 'Pr', 'Praseodymium', ['프라세오디뮴'], '140.91'],
    [60, 'Nd', 'Neodymium', ['네오디뮴'], '144.24'],
    [61, 'Pm', 'Promethium', ['프로메튬'], '[145]'],
    [62, 'Sm', 'Samarium', ['사마륨'], '150.36'],
    [63, 'Eu', 'Europium', ['유로퓸'], '151.96'],
    [64, 'Gd', 'Gadolinium', ['가돌리늄'], '157.25'],
    [65, 'Tb', 'Terbium', ['터븀', '테르븀'], '158.93'],
    [66, 'Dy', 'Dysprosium', ['디스프로슘'], '162.50'],
    [67, 'Ho', 'Holmium', ['홀뮴'], '164.93'],
    [68, 'Er', 'Erbium', ['어븀', '에르븀'], '167.26'],
    [69, 'Tm', 'Thulium', ['툴륨'], '168.93'],
    [70, 'Yb', 'Ytterbium', ['이터븀'], '173.05'],
    [71, 'Lu', 'Lutetium', ['루테튬'], '174.97'],
    [72, 'Hf', 'Hafnium', ['하프늄'], '178.49'],
    [73, 'Ta', 'Tantalum', ['탄탈럼', '탄탈'], '180.95'],
    [74, 'W', 'Tungsten', ['텅스텐'], '183.84'],
    [75, 'Re', 'Rhenium', ['레늄'], '186.21'],
    [76, 'Os', 'Osmium', ['오스뮴'], '190.23'],
    [77, 'Ir', 'Iridium', ['이리듐'], '192.22'],
    [78, 'Pt', 'Platinum', ['백금'], '195.08'],
    [79, 'Au', 'Gold', ['금'], '196.97'],
    [80, 'Hg', 'Mercury', ['수은'], '200.59'],
    [81, 'Tl', 'Thallium', ['탈륨'], '204.38'],
    [82, 'Pb', 'Lead', ['납'], '207.2'],
    [83, 'Bi', 'Bismuth', ['비스무트'], '208.98'],
    [84, 'Po', 'Polonium', ['폴로늄'], '[209]'],
    [85, 'At', 'Astatine', ['아스타틴'], '[210]'],
    [86, 'Rn', 'Radon', ['라돈'], '[222]'],
    [87, 'Fr', 'Francium', ['프랑슘'], '[223]'],
    [88, 'Ra', 'Radium', ['라듐'], '[226]'],
    [89, 'Ac', 'Actinium', ['악티늄'], '[227]'],
    [90, 'Th', 'Thorium', ['토륨'], '232.04'],
    [91, 'Pa', 'Protactinium', ['프로트악티늄'], '231.04'],
    [92, 'U', 'Uranium', ['우라늄'], '238.03'],
    [93, 'Np', 'Neptunium', ['넵투늄'], '[237]'],
    [94, 'Pu', 'Plutonium', ['플루토늄'], '[244]'],
    [95, 'Am', 'Americium', ['아메리슘'], '[243]'],
    [96, 'Cm', 'Curium', ['퀴륨'], '[247]'],
    [97, 'Bk', 'Berkelium', ['버클륨'], '[247]'],
    [98, 'Cf', 'Californium', ['캘리포늄'], '[251]'],
    [99, 'Es', 'Einsteinium', ['아인슈타이늄'], '[252]'],
    [100, 'Fm', 'Fermium', ['페르뮴'], '[257]'],
    [101, 'Md', 'Mendelevium', ['멘델레븀'], '[258]'],
    [102, 'No', 'Nobelium', ['노벨륨'], '[259]'],
    [103, 'Lr', 'Lawrencium', ['로렌슘'], '[266]'],
    [104, 'Rf', 'Rutherfordium', ['러더포듐'], '[267]'],
    [105, 'Db', 'Dubnium', ['더브늄'], '[268]'],
    [106, 'Sg', 'Seaborgium', ['시보귬'], '[269]'],
    [107, 'Bh', 'Bohrium', ['보륨'], '[270]'],
    [108, 'Hs', 'Hassium', ['하슘'], '[269]'],
    [109, 'Mt', 'Meitnerium', ['마이트너륨'], '[278]'],
    [110, 'Ds', 'Darmstadtium', ['다름슈타튬'], '[281]'],
    [111, 'Rg', 'Roentgenium', ['뢴트게늄'], '[282]'],
    [112, 'Cn', 'Copernicium', ['코페르니슘'], '[285]'],
    [113, 'Nh', 'Nihonium', ['니호늄'], '[286]'],
    [114, 'Fl', 'Flerovium', ['플레로븀'], '[289]'],
    [115, 'Mc', 'Moscovium', ['모스코븀'], '[290]'],
    [116, 'Lv', 'Livermorium', ['리버모륨'], '[293]'],
    [117, 'Ts', 'Tennessine', ['테네신'], '[294]'],
    [118, 'Og', 'Oganesson', ['오가네손'], '[294]']
  ].map(r => {
    const bracket = r[4].charAt(0) === '[';
    return {
      z: r[0], symbol: r[1], name: r[2], ko: r[3], aliases: r[3].slice(1),
      weight: r[4], hasStdWeight: !bracket,
      massNumber: bracket ? r[4].slice(1, -1) : null
    };
  });

  function elementPos(z) {
    if (z === 1) return [1, 1];
    if (z === 2) return [1, 18];
    if (z <= 4) return [2, z - 2];
    if (z <= 10) return [2, z + 8];
    if (z <= 12) return [3, z - 10];
    if (z <= 18) return [3, z];
    if (z <= 36) return [4, z - 18];
    if (z <= 54) return [5, z - 36];
    if (z <= 56) return [6, z - 54];
    if (z <= 71) return [9, z - 54];
    if (z <= 86) return [6, z - 68];
    if (z <= 88) return [7, z - 86];
    if (z <= 103) return [10, z - 86];
    return [7, z - 100];
  }

  function elementPlace(z) {
    if (z >= 57 && z <= 71) return { period: 6, group: '란타넘족 (Lanthanide)' };
    if (z >= 89 && z <= 103) return { period: 7, group: '악티늄족 (Actinide)' };
    const p = elementPos(z);
    return { period: p[0], group: String(p[1]) };
  }

  function searchElements(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const scored = [];
    ELEMENTS.forEach(e => {
      const names = [e.name.toLowerCase()].concat(e.ko, e.aliases.map(a => a.toLowerCase()));
      const sym = e.symbol.toLowerCase();
      let s = 0;
      if (sym === q || String(e.z) === q) s = 100;
      else if (names.some(n => n === q)) s = 90;
      else if (sym.indexOf(q) === 0) s = 60;
      else if (names.some(n => n.indexOf(q) === 0)) s = 50;
      else if (q.length >= 2 && names.some(n => n.indexOf(q) >= 0)) s = 30;
      if (s) scored.push({ z: e.z, s });
    });
    scored.sort((a, b) => b.s - a.s || a.z - b.z);
    return scored.map(x => x.z);
  }

  return {
    CONC, VOL, MASS, FLASKS, ELEMENTS, MSG,
    parseNum, trimNum, pickDecimals, fmtVol, volLabel, isFlask, flaskKo,
    toMgL, fromMgL, fmtConcAuto,
    dilute, describeDilution,
    planSerial, describeSerial, chooseFactors,
    mixStandard, describeMixed,
    sampleConc, describeSample,
    dilutionFactor, describeFactor,
    convertAll, describeConvert,
    elementPos, elementPlace, searchElements
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Core;
