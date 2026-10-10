/* 剧链 DramaFlow 体验版 · 登录 / 新建项目 / 生产流水线 / 系统全景
   纯前端模拟：所有「生成」都是本地模拟的异步任务，内容取自 mock.js 并按所选模板与风格卡变化。 */
window.DF_PIPELINE = function (C) {
'use strict';
const { D, CARD, SKILL, GENRE, esc, ICON } = C;
const M = window.MOCK;
const LS_SESSION = 'dramaflow.session.v1';
const FAST = /[?&]fast=1/.test(location.search) || localStorage.getItem('dramaflow.fast') === '1';
const DEMO = { email: 'demo@dramaflow.app', password: 'demo2026', name: '演示制片人' };
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const ids = sel => sel == null ? [] : Array.isArray(sel) ? sel : typeof sel === 'object' ? Object.values(sel) : [sel];
const P = () => C.project;
const pick = (a, n) => a[((n % a.length) + a.length) % a.length];

// ---------- 会话 ----------
const session = () => load(LS_SESSION, null);
function login(email) { save(LS_SESSION, { email, name: DEMO.name, at: new Date().toISOString() }); }
function logout() { localStorage.removeItem(LS_SESSION); }

// ---------- 流水线定义 ----------
const STEPS = [
  { id: 'idea', no: '01', title: '一句话创意', short: '创意', nodes: ['N1.1'], manual: true, desc: '用一句话描述你的故事，系统据此生成选题报告。' },
  { id: 'market', no: '02', title: '市场选题报告', short: '选题', nodes: ['N1.1', 'N1.2'], gate: 'G0', desc: '分析平台受众与题材热度，给出差异化切口和立项建议。' },
  { id: 'script', no: '03', title: '剧本与分集大纲', short: '剧本', nodes: ['N2.1', 'N2.2', 'N2.3'], gate: 'G1', desc: '故事架构、分集大纲（含每集卡点与付费点）和第 1 集剧本。' },
  { id: 'cast', no: '04', title: '角色与服装设定', short: '角色', nodes: ['N3.1', 'N3.2', 'N3.3'], desc: '角色小传、定妆设定、服装与场景美术。' },
  { id: 'board', no: '05', title: '分镜表', short: '分镜', nodes: ['N4.1', 'N4.2', 'N3.4'], gate: 'G2', desc: '镜头号、景别、运镜、构图、色调、台词与时长。' },
  { id: 'visual', no: '06', title: '画面生成', short: '画面', nodes: ['N5.1'], desc: '按分镜逐镜头生成画面（体验版用抽象占位帧代替）。' },
  { id: 'audio', no: '07', title: '配音配乐', short: '声音', nodes: ['N6.1', 'N6.2'], desc: '角色声线分配、音效设计与配乐提示。' },
  { id: 'edit', no: '08', title: '剪辑时间线', short: '剪辑', nodes: ['N7.1'], gate: 'G3', desc: '按剪辑节奏卡拼接画面、对白、音乐、音效与字幕轨。' },
  { id: 'pack', no: '09', title: '字幕包装', short: '包装', nodes: ['N7.2', 'N8.2'], desc: '字幕样式、片头片尾、AI 生成标识与多语种字幕。' },
  { id: 'review', no: '10', title: '合规审核', short: '合规', nodes: ['N8.1'], gate: 'G4', desc: '逐项检查 AI 生成标识、台词与画面、内容分级。未通过不能导出。' },
  { id: 'export', no: '11', title: '成片预览与导出', short: '导出', nodes: ['N7.1', 'N7.2'], desc: '预览第 1 集成片并导出成片包。' },
  { id: 'growth', no: '12', title: '投放与数据看板', short: '投放', nodes: ['N9.1'], desc: '投放素材变体与数据看板（演示数据）。' },
];
const STEP = Object.fromEntries(STEPS.map(s => [s.id, s]));
const stepIdx = id => STEPS.findIndex(s => s.id === id);

function pipe() {
  const p = P(); if (!p) return null;
  if (!p.pipe) { p.pipe = { idea: '', steps: {}, aiLabel: true, fixed: false, exportOpts: { res: '1080×1920', subs: 'burn' }, created: new Date().toISOString() }; C.persist(); }
  STEPS.forEach(s => { if (!p.pipe.steps[s.id]) p.pipe.steps[s.id] = { status: 'idle', seed: 0, progress: 0, log: [] }; });
  return p.pipe;
}
const st = id => pipe().steps[id];
const isDone = id => st(id).status === 'done';
const available = id => STEPS.slice(0, stepIdx(id)).every(s => isDone(s.id));
const currentStep = () => (STEPS.find(s => !isDone(s.id)) || STEPS[STEPS.length - 1]).id;
// 重新加载时中断的任务回到待生成
function healRunning() { const p = P(); if (p && p.pipe) Object.values(p.pipe.steps).forEach(s => { if (s.status === 'running') { s.status = 'idle'; s.progress = 0; } }); }

// ---------- 上下文：按模板 / 题材 / 风格卡取模拟素材 ----------
function ctx() {
  const p = P();
  const baseKey = p.base && M.tplKey[p.base.id];
  const key = baseKey || M.genreKey[p.genre] || (p.region === 'global' ? 'werewolf' : 'bazong');
  const S = M.sets[key];
  const sel = (node, dim) => p.nodes[node] && p.nodes[node].enabled !== false ? ids((p.nodes[node].selections || {})[dim]).filter(id => CARD[id]) : [];
  const names = (node, dim) => sel(node, dim).map(id => CARD[id].name);
  return { p, S, key, sel, names, pipe: pipe() };
}
const fmtLogline = (c, v) => pick(c.S.logline, v).replace('{idea}', (c.pipe.idea || pick(c.S.ideas, 0)).replace(/[。.]$/, ''));
const isPay = (c, ep, hook) => /付费点|Paywall/i.test(hook) || ((c.p.base && c.p.base.format && c.p.base.format.paywall_eps) || []).includes(ep);

// ---------- 抽象分镜帧（不描绘真人：几何剪影，无五官） ----------
const PAL = { 'cl-teal-orange': ['#12343B', '#E07A3F', '#F3C9A5'], 'cl-high-key-sweet': ['#E9B8BE', '#FFF4E6', '#C2707D'], 'cl-neon-saturated': ['#2A0F3D', '#E8358C', '#5BC0EB'],
  'cl-muted-palace': ['#4E4A40', '#C9B79C', '#8A3B2E'], 'cl-noir-contrast': ['#0E0F12', '#6B7078', '#D9DCE1'], 'cl-warm-film': ['#6B4320', '#E8C07D', '#B5602C'], 'cl-moon-blue': ['#0B1A33', '#4E78B5', '#CFE0F5'] };
const palette = c => { const id = c.sel('N3.4', 'color_lighting')[0]; return PAL[id] || ({ city: PAL['cl-teal-orange'], palace: PAL['cl-muted-palace'], noir: PAL['cl-noir-contrast'], moon: PAL['cl-moon-blue'], era: PAL['cl-warm-film'], xian: PAL['cl-moon-blue'] })[c.S.scene]; };
const SIZE_SCALE = { '远景': .35, 'Wide': .35, '全景': .55, 'Full': .55, '中景': .8, 'Medium': .8, '近景': 1.2, 'Close': 1.2, '特写': 1.6, 'Close-up': 1.6, '大特写': 2 };
const ROLE_TONE = { female_lead: .92, male_lead: .18, villain: .5, emperor: .28, detective: .22, suspect: .6, child: .8 };
function sceneLayer(scene, a, b, v) {
  const o = v % 3 * 6;
  switch (scene) {
    case 'palace': return `<path d="M-10 190 Q90 150 190 190 L190 200 L-10 200Z" fill="${b}" opacity=".55"/><path d="M20 170 Q90 135 160 170" stroke="${b}" stroke-width="6" fill="none" opacity=".6"/>${[40, 70, 110, 140].map(x => `<rect x="${x + o / 2}" y="175" width="6" height="70" fill="${b}" opacity=".45"/>`).join('')}`;
    case 'noir': return `${Array.from({ length: 22 }, (_, i) => `<path d="M${(i * 17 + o * 3) % 190} ${(i * 37) % 120} l-8 26" stroke="${b}" stroke-width="1" opacity=".5"/>`).join('')}<rect x="${130 - o}" y="120" width="4" height="140" fill="${b}" opacity=".6"/><circle cx="${132 - o}" cy="118" r="10" fill="${b}" opacity=".35"/>`;
    case 'moon': return `<circle cx="${130 - o}" cy="70" r="30" fill="${b}" opacity=".75"/>${[10, 40, 150, 175].map((x, i) => `<path d="M${x} 250 l18 -${70 + i * 8} l18 ${70 + i * 8}z" fill="${a}" opacity=".9"/>`).join('')}`;
    case 'era': return `${[0, 60, 120].map(x => `<path d="M${x + o} 230 l30 -26 l30 26 v40 h-60z" fill="${b}" opacity=".45"/>`).join('')}<rect x="150" y="110" width="3" height="150" fill="${b}" opacity=".5"/><path d="M110 120 L190 112" stroke="${b}" opacity=".5"/>`;
    case 'xian': return `<path d="M-10 240 L40 150 L80 210 L120 120 L190 230 L190 260 L-10 260Z" fill="${b}" opacity=".4"/><ellipse cx="${60 + o * 2}" cy="200" rx="50" ry="8" fill="#fff" opacity=".25"/><ellipse cx="140" cy="170" rx="40" ry="6" fill="#fff" opacity=".2"/>`;
    default: return `${[0, 22, 46, 70, 98, 124, 150].map((x, i) => `<rect x="${x}" y="${150 - ((i * 37 + o * 5) % 70)}" width="20" height="${130 + ((i * 37 + o * 5) % 70)}" fill="${b}" opacity=".35"/>`).join('')}`;
  }
}
function frameSvg(c, shot, i, opts) {
  opts = opts || {};
  const [a, b, acc] = palette(c), v = st('visual').seed + i;
  const sc = SIZE_SCALE[shot[1]] || .8, chars = shot[4] || [];
  const figs = chars.map((r, k) => {
    const n = chars.length, cx = 90 + (k - (n - 1) / 2) * 60 * Math.min(sc, 1.2) + (v % 2 ? 8 : -8);
    const tone = ROLE_TONE[r] == null ? .5 : ROLE_TONE[r], fill = `hsl(220 8% ${Math.round(12 + tone * 70)}%)`;
    const h = 120 * sc, w = 46 * sc, y = 300 - h * .7;
    return `<g opacity=".95"><rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${w / 2.2}" fill="${fill}"/><circle cx="${cx}" cy="${y - 20 * sc}" r="${17 * sc}" fill="${fill}"/></g>`;
  }).join('');
  const prop = !chars.length && sc >= 1.2 ? `<rect x="55" y="170" width="70" height="46" rx="4" fill="${acc}" opacity=".85"/><rect x="63" y="180" width="54" height="3" fill="${a}" opacity=".5"/><rect x="63" y="188" width="40" height="3" fill="${a}" opacity=".5"/>` : '';
  const sub = opts.sub && shot[2] ? `<foreignObject x="8" y="246" width="164" height="60"><div xmlns="http://www.w3.org/1999/xhtml" class="fsub ${opts.subCls || ''}">${esc(shot[2])}</div></foreignObject>` : '';
  const badge = pipe().aiLabel ? `<g><rect x="118" y="8" width="54" height="16" rx="3" fill="#000" opacity=".55"/><text x="145" y="19.5" font-size="9" text-anchor="middle" fill="#fff" font-family="sans-serif">AI 生成</text></g>` : '';
  return `<svg viewBox="0 0 180 320" class="frame" role="img" aria-label="分镜 ${i + 1}：${esc(shot[0])}（抽象占位帧）"><defs><linearGradient id="g${i}${opts.k || ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="180" height="320" fill="url(#g${i}${opts.k || ''})"/>${sceneLayer(c.S.scene, a, b, v)}<rect y="260" width="180" height="60" fill="${a}" opacity=".35"/>${figs}${prop}
    <text x="8" y="19" font-size="9" fill="#fff" opacity=".8" font-family="monospace">S${String(i + 1).padStart(2, '0')} · ${esc(shot[1])}</text>${badge}${sub}</svg>`;
}
function avatarSvg(role, k) {
  const tone = ROLE_TONE[role] == null ? .5 : ROLE_TONE[role], fill = `hsl(220 8% ${Math.round(12 + tone * 70)}%)`;
  return `<svg viewBox="0 0 120 120" class="ava" aria-hidden="true"><rect width="120" height="120" fill="hsl(${(k * 47 + 20) % 360} 18% 90%)"/>${[30, 60, 90].map((x, j) => `<g opacity="${j === 1 ? 1 : .45}"><circle cx="${x}" cy="44" r="${j === 1 ? 12 : 8}" fill="${fill}"/><rect x="${x - (j === 1 ? 16 : 11)}" y="${j === 1 ? 60 : 56}" width="${j === 1 ? 32 : 22}" height="${j === 1 ? 52 : 40}" rx="${j === 1 ? 14 : 10}" fill="${fill}"/></g>`).join('')}<text x="60" y="116" font-size="8" text-anchor="middle" fill="#5F646D" font-family="sans-serif">正 · 侧 · 背（剪影）</text></svg>`;
}

// ---------- 各步骤的模拟产出 ----------
const H = {};
const chip = id => `<a class="tag outline" href="#/card/${esc(id)}">${esc(CARD[id].name)}</a>`;
const none = () => `<span class="muted">未选</span>`;
const kvs = rows => `<dl class="pl-kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

H.idea = c => {
  const ed = !isDone('idea');
  return `<div class="pl-card"><label class="pl-label" for="idea-input">一句话创意</label>
    <textarea id="idea-input" class="input pl-idea" rows="3" maxlength="120" placeholder="例如：${esc(c.S.ideas[0])}" ${ed ? '' : 'disabled'}>${esc(c.pipe.idea)}</textarea>
    <div class="pl-hint">${ed ? '可直接点一条灵感填入：' : '创意已锁定。如需修改，点「重新编辑」。'}</div>
    ${ed ? `<div class="pl-ideas">${c.S.ideas.map((s, i) => `<button class="chip" data-act="pl-idea" data-i="${i}">${esc(s)}</button>`).join('')}</div>` : ''}</div>
    <div class="pl-card">${kvs([['题材', esc((GENRE[c.p.genre] || {}).name || c.p.genre)], ['区域', C.REGION_LABEL[c.p.region]], ['风格方案', c.p.base ? esc(c.p.base.name) : '自配风格'], ['集数 / 画幅', `${esc(c.p.episodes)} 集 · ${esc(c.p.aspect)}`]])}</div>`;
};
H.market = c => {
  const m = c.S.market, v = st('market').seed, g = GENRE[c.p.genre] || {};
  const prod = c.sel('N1.2', 'production_mode')[0];
  return `<div class="pl-card pl-hero"><div class="pl-eyebrow">选题卡</div><h3>《${esc(pick(c.S.title, v))}》</h3><p>${esc(fmtLogline(c, v))}</p></div>
  <div class="pl-grid2"><div class="pl-card"><h4>平台与受众</h4>${kvs([['目标平台', m.platforms.map(esc).join('、')], ['受众画像', esc(m.audience)], ['市场定位', c.names('N1.1', 'market_target').map(esc).join('、') || none()]])}</div>
  <div class="pl-card"><h4>题材热度 <span class="tag warn">模拟指数</span></h4>${m.heat.map(([k, n], i) => { const val = Math.max(30, Math.min(99, n + ((v * 7 + i * 3) % 9) - 4)); return `<div class="pl-bar"><span>${esc(k)}</span><i><b style="width:${val}%"></b></i><em class="num">${val}</em></div>`; }).join('')}</div></div>
  <div class="pl-card"><h4>对标拆解</h4><table class="pl-table"><thead><tr><th>对标模式</th><th>可复用打法</th></tr></thead><tbody>${m.bench.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>
  <div class="pl-grid2"><div class="pl-card"><h4>差异化切口</h4><p>${esc(m.angle)}</p><h4>主要风险</h4><p>${esc(m.risk)}</p></div>
  <div class="pl-card"><h4>立项建议（制片人）</h4>${kvs([['核心爽点', esc(g.core_payoff || '—')], ['制作模式', prod ? chip(prod) : none()], ['建议集数', prod ? esc(CARD[prod].params.episodes || c.p.episodes) : esc(c.p.episodes)], ['预算档位', prod ? esc(CARD[prod].params.budget_tier || '—') : '—'], ['G0 立项关口', '<span class="tag ok">建议立项</span>']])}</div></div>`;
};
H.script = c => {
  const v = st('script').seed, hook = c.sel('N2.2', 'hook_structure')[0], tone = c.sel('N2.3', 'dialogue_tone')[0];
  const rows = c.S.outline.filter(o => o[0] <= c.p.episodes || typeof c.p.episodes !== 'number');
  return `<div class="pl-card">${kvs([['剧名', `《${esc(pick(c.S.title, v))}》`], ['故事一句话', esc(fmtLogline(c, v))], ['题材风格', c.sel('N2.1', 'genre_style').map(chip).join(' ') || none()], ['卡点结构', hook ? chip(hook) : none()], ['台词腔调', tone ? chip(tone) : none()]])}</div>
  <div class="pl-card"><h4>分集大纲 <span class="muted">节选 ${rows.length} 集 / 共 ${esc(c.p.episodes)} 集</span></h4>
  <table class="pl-table pl-outline"><thead><tr><th class="num">集</th><th>标题</th><th>剧情</th><th>结尾卡点</th></tr></thead><tbody>
  ${rows.map(([ep, t, beat, hk]) => `<tr><td class="num"><b>${ep}</b></td><td>${esc(t)}</td><td>${esc(beat)}</td><td>${isPay(c, ep, hk) ? '<span class="tag accent">付费点</span> ' : '<span class="tag">卡点</span> '}${esc(hk.replace(/【付费点】|\[Paywall\]\s*/g, ''))}</td></tr>`).join('')}</tbody></table></div>
  <div class="pl-card"><h4>第 1 集剧本（节选）</h4><div class="pl-script">${c.S.script.map((sc, i) => `<div class="sc-h">场 ${i + 1}　${esc(sc.loc)}</div>${sc.lines.map(([who, line, note]) => `<div class="sc-l"><b>${esc(who)}</b><span>${esc(line)}${note ? `<em class="${c.S.bilingual ? 'tr' : ''}">${c.S.bilingual ? esc(note) : '（' + esc(note) + '）'}</em>` : ''}</span></div>`).join('')}`).join('')}</div></div>`;
};
H.cast = c => {
  const cs = c.sel('N3.1', 'character_style')[0], cos = c.sel('N3.2', 'costume_style');
  return `<div class="pl-card">${kvs([['角色风格', cs ? chip(cs) : none()], ['服装风格', cos.map(chip).join(' ') || none()], ['美术风格', c.sel('N3.3', 'art_style').map(chip).join(' ') || none()], ['文化风格', c.sel('N3.3', 'culture_style').map(chip).join(' ') || none()]])}</div>
  <div class="pl-cast">${c.S.cast.map((ch, k) => `<article class="pl-card pl-ch">${avatarSvg(ch.role, k)}<div><h4>${esc(ch.name)} <span class="tag">${esc(ch.tag)}</span></h4>
    ${kvs([['人物弧光', esc(ch.arc)], ['定妆要点', esc(ch.look) + (cs ? `<br><span class="muted">按「${esc(CARD[cs].name)}」：${esc(CARD[cs].summary.slice(0, 40))}…</span>` : '')], ['服装', esc(ch.costume) + (cos.length ? `<br><span class="muted">风格：${cos.map(id => esc(CARD[id].name)).join(' + ')}</span>` : '')]])}</div></article>`).join('')}</div>
  <p class="pl-note">定妆图为抽象剪影占位，体验版不生成任何真人或拟真人像。</p>`;
};
function shotRows(c) {
  const cams = c.names('N4.2', 'camera_movement'), comp = c.names('N4.1', 'composition'), cl = c.names('N3.4', 'color_lighting');
  const rh = c.sel('N7.1', 'edit_rhythm')[0], k = rh === 'edit-viral-fast' ? .8 : rh === 'edit-emotional-breath' ? 1.25 : 1;
  return c.S.shots.map((s, i) => ({ s, i, cam: cams.length ? pick(cams, i + st('board').seed) : '固定机位', comp: comp.length ? pick(comp, i) : '居中构图', cl: cl.length ? pick(cl, i) : '标准', dur: Math.max(1, Math.round(s[3] * k * 10) / 10) }));
}
H.board = c => {
  const rows = shotRows(c), total = rows.reduce((a, r) => a + r.dur, 0);
  return `<div class="pl-card">${kvs([['构图', c.sel('N4.1', 'composition').map(chip).join(' ') || none()], ['运镜', c.sel('N4.2', 'camera_movement').map(chip).join(' ') || none()], ['色调光影', c.sel('N3.4', 'color_lighting').map(chip).join(' ') || none()], ['镜头数 / 时长', `<span class="num">${rows.length} 镜 · ${total.toFixed(1)} 秒（第 1 集开场段）</span>`]])}</div>
  <div class="pl-card pl-scroll"><table class="pl-table pl-board"><thead><tr><th>镜号</th><th>景别</th><th>运镜</th><th>构图</th><th>色调</th><th>画面内容</th><th>台词</th><th class="num">时长</th></tr></thead><tbody>
  ${rows.map(r => `<tr><td class="mono">S${String(r.i + 1).padStart(2, '0')}</td><td>${esc(r.s[1])}</td><td>${esc(r.cam)}</td><td>${esc(r.comp)}</td><td>${esc(r.cl)}</td><td>${esc(r.s[0])}</td><td>${esc(r.s[2] || '—')}</td><td class="num">${r.dur}s</td></tr>`).join('')}</tbody></table></div>`;
};
H.visual = c => {
  const gm = c.sel('N5.1', 'generation_mode')[0], takes = gm ? String(CARD[gm].params.takes_per_shot || CARD[gm].params.takes || '2–4') : '2–4';
  return `<div class="pl-card">${kvs([['生成模式', gm ? chip(gm) : none()], ['模型', '<span class="tag warn">模拟模型 · 未调用真实接口</span>'], ['每镜抽卡', esc(takes) + ' 次（模拟）'], ['角色一致性', `<span class="num">${92 + st('visual').seed % 5}%</span>（模拟评分）`]])}</div>
  <div class="pl-frames">${c.S.shots.map((s, i) => `<figure>${frameSvg(c, s, i)}<figcaption><b class="mono">S${String(i + 1).padStart(2, '0')}</b> ${esc(s[0])}</figcaption></figure>`).join('')}</div>
  <p class="pl-note">占位帧用几何剪影表示角色位置与景别，配色取自所选色调光影卡；不描绘任何真人。</p>`;
};
H.audio = c => {
  const vm = (c.p.nodes['N6.1'] && c.p.nodes['N6.1'].selections || {}).voice_timbre || {};
  const sd = c.sel('N6.1', 'sound_design')[0], ms = c.sel('N6.2', 'music_style')[0];
  const wave = (n, h) => `<svg viewBox="0 0 200 28" class="wave" aria-hidden="true">${Array.from({ length: 50 }, (_, i) => { const y = 3 + Math.abs(Math.sin(i * .7 + n) * Math.cos(i * .23 + h)) * 11; return `<rect x="${i * 4}" y="${14 - y}" width="2.4" height="${y * 2}" rx="1"/>`; }).join('')}</svg>`;
  return `<div class="pl-card"><h4>角色声线</h4><table class="pl-table"><thead><tr><th>角色</th><th>声线卡</th><th>试听（模拟波形）</th></tr></thead><tbody>
    ${c.S.cast.map((ch, i) => { const id = typeof vm === 'object' && !Array.isArray(vm) ? vm[ch.role] : null; return `<tr><td>${esc(ch.name)}</td><td>${id && CARD[id] ? chip(id) : '<span class="muted">默认声线</span>'}</td><td>${wave(i, i * 2)}</td></tr>`; }).join('')}</tbody></table>
    <p class="pl-note">声线均为 AI 合成音色，不克隆、不模仿任何真人声音。</p></div>
  <div class="pl-grid2"><div class="pl-card"><h4>配乐</h4>${kvs([['配乐风格', ms ? chip(ms) : none()], ['主题', esc(c.S.music.theme)]])}<ul class="pl-list">${c.S.music.cues.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="pl-card"><h4>音效</h4>${kvs([['音效设计', sd ? chip(sd) : none()], ['响度', '-14 LUFS（短视频平台标准）'], ['对白清晰度', '已做人声增强（模拟）']])}${wave(3, 5)}</div></div>`;
};
H.edit = c => {
  const rows = shotRows(c), total = rows.reduce((a, r) => a + r.dur, 0), pct = d => (d / total * 100).toFixed(2);
  let t = 0; const vid = rows.map(r => { const x = t; t += r.dur; return { ...r, x }; });
  const block = (r, txt, cls) => `<i class="${cls || ''}" style="left:${pct(r.x)}%;width:${pct(r.dur)}%" title="${esc(txt)}">${esc(txt)}</i>`;
  return `<div class="pl-card">${kvs([['剪辑节奏', c.sel('N7.1', 'edit_rhythm').map(chip).join(' ') || none()], ['成片时长', `<span class="num">${total.toFixed(1)} 秒（开场段）</span>`], ['G3 粗剪关口', '<span class="tag ok">节奏合格 · 结尾卡点已对齐</span>']])}</div>
  <div class="pl-card"><div class="pl-tl"><div class="ruler">${Array.from({ length: Math.ceil(total / 5) + 1 }, (_, i) => `<span style="left:${Math.min(100, i * 5 / total * 100)}%">${i * 5}s</span>`).join('')}</div>
    <div class="trk"><b>画面</b><div>${vid.map(r => block(r, 'S' + String(r.i + 1).padStart(2, '0') + ' ' + r.s[1], 'v')).join('')}</div></div>
    <div class="trk"><b>对白</b><div>${vid.filter(r => r.s[2]).map(r => block(r, r.s[2], 'd')).join('')}</div></div>
    <div class="trk"><b>音乐</b><div>${c.S.music.cues.map((cu, i) => block({ x: total / 3 * i, dur: total / 3 }, cu, 'm')).join('')}</div></div>
    <div class="trk"><b>音效</b><div>${vid.filter((r, i) => i % 3 === 0).map(r => block({ x: r.x, dur: Math.min(1.2, r.dur) }, '音效', 's')).join('')}</div></div>
    <div class="trk"><b>字幕</b><div>${vid.filter(r => r.s[2]).map(r => block(r, '字幕', 't')).join('')}</div></div>
    <div class="lane"><div class="hook" style="left:${pct(total - rows[rows.length - 1].dur)}%"><span>结尾卡点</span></div></div></div></div>`;
};
const subCls = c => ({ 'pkg-viral-text': 'viral', 'pkg-calligraphy': 'callig', 'pkg-cinema-minimal': 'minimal', 'pkg-en-platform': 'enplat' })[c.sel('N7.2', 'packaging_style')[0]] || 'minimal';
function srt(c) {
  let t = 0; const ts = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
  const out = []; let n = 1;
  shotRows(c).forEach(r => { if (r.s[2]) out.push(`${n++}\n${ts(t)} --> ${ts(t + r.dur)}\n${r.s[2]}\n`); t += r.dur; });
  return out.join('\n');
}
H.pack = c => {
  const pk = c.sel('N7.2', 'packaging_style')[0], loc = c.p.nodes['N8.2'] && c.p.nodes['N8.2'].enabled ? c.sel('N8.2', 'localization_mode')[0] : null;
  const s = c.S.shots.findIndex(x => x[2]), ed = st('pack').status === 'review';
  const langs = c.p.region === 'global' ? (c.key === 'localize' ? ['en-US', 'es', 'pt-BR', 'id'] : ['en-US']) : ['zh-CN'];
  return `<div class="pl-grid2"><div class="pl-card"><h4>字幕样式预览</h4><div class="pl-preview sm">${frameSvg(c, c.S.shots[s], s, { sub: true, subCls: subCls(c), k: 'p' })}</div></div>
  <div class="pl-card"><h4>包装方案</h4>${kvs([['包装风格', pk ? chip(pk) : none()], ['片头', `3 秒剧名卡《${esc(pick(c.S.title, st('script').seed))}》`], ['片尾', '下集预告 + 追剧引导'], ['本地化', loc ? chip(loc) : (c.p.region === 'cn' ? '<span class="muted">国内区不启用</span>' : none())], ['字幕语种', langs.join(' / ')]])}
    <label class="pl-switch"><input type="checkbox" id="ai-label" data-act="pl-ailabel" ${c.pipe.aiLabel ? 'checked' : ''} ${ed ? '' : 'disabled'}><span>添加 AI 生成显式标识（画面角标 + 片头提示）</span></label>
    <p class="pl-note">${ed ? '关闭后合规审核会判定为不通过。' : '审核阶段可修改。'}隐式标识（文件元数据）导出时自动写入。</p></div></div>
  <div class="pl-card"><h4>字幕文件预览（SRT）</h4><pre class="pl-pre">${esc(srt(c))}</pre></div>`;
};
function checks(c) {
  const prof = c.sel('N8.1', 'compliance_profile')[0], cn = c.p.region === 'cn';
  const list = [
    { id: 'ai-explicit', name: 'AI 生成内容显式标识', basis: cn ? '《人工智能生成合成内容标识办法》' : 'Platform AIGC label / EU AI Act Art. 50', ok: c.pipe.aiLabel, msg: c.pipe.aiLabel ? '画面角标「AI 生成」与片头提示均已添加' : '未检测到画面角标与片头提示', fix: 'pl-fix-ai', fixLabel: '一键添加标识' },
    { id: 'ai-implicit', name: 'AI 生成内容隐式标识（元数据）', basis: cn ? '《人工智能生成合成内容标识办法》' : 'C2PA / platform metadata', ok: true, msg: '导出时写入生成方、模型与内容 ID（模拟）' },
    { id: 'line', name: '台词与文案', basis: cn ? '平台审核规范 / 广告法' : 'Platform community guidelines', ok: c.pipe.fixed, msg: c.pipe.fixed ? `已修改：「${c.S.sensitive.fix}」` : `「${c.S.sensitive.line}」— ${c.S.sensitive.why}`, fix: 'pl-fix-line', fixLabel: '采用建议修改' },
    { id: 'grade', name: cn ? '内容分级 / 备案类别' : 'Rating & disclosure', basis: cn ? '《微短剧发展管理办法》' : 'CA AI transparency / app store rating', ok: true, msg: prof ? `档案：${CARD[prof].name}` : '未设置合规档案，默认按一般题材处理' },
    { id: 'voice', name: '声音与肖像', basis: '不克隆真人声音、不生成真人肖像', ok: true, msg: '声线为合成音色；画面为抽象占位帧' },
    { id: 'minor', name: '未成年人保护 / 价值导向', basis: cn ? '网络视听节目内容审核通则' : 'Platform policy', ok: true, msg: '未发现问题（模拟抽检）' },
  ];
  return list;
}
const gatePass = c => checks(c).every(x => x.ok);
H.review = c => {
  const L = checks(c), bad = L.filter(x => !x.ok).length, prof = c.sel('N8.1', 'compliance_profile')[0];
  return `<div class="verdict ${bad ? 'bad' : 'ok'}">${bad ? ICON.warn : ICON.check}<div><b>G4 合规关口：${bad ? `未通过，${bad} 项待处理` : '已通过'}</b><div>${bad ? '处理完所有问题后才能「通过关口」并导出成片。' : '可以通过关口，进入成片导出。'}</div></div>
    <div class="stats"><span><b class="num">${L.length - bad}</b> 通过</span><span><b class="num">${bad}</b> 待处理</span></div></div>
  <div class="pl-card">${kvs([['合规档案', prof ? chip(prof) + ' <span class="tag lock">' + ICON.lock + ' 模板锁定</span>' : none()], ['审核方式', 'AI 预审 + 人工复核（体验版为模拟结果）']])}</div>
  <div class="pl-card"><table class="pl-table pl-checks"><thead><tr><th>检查项</th><th>依据</th><th>结果</th><th></th></tr></thead><tbody>
  ${L.map(x => `<tr data-check="${x.id}" class="${x.ok ? '' : 'bad'}"><td><b>${esc(x.name)}</b></td><td class="muted">${esc(x.basis)}</td><td>${x.ok ? '<span class="tag ok">通过</span>' : '<span class="tag danger">不通过</span>'} ${esc(x.msg)}</td><td>${!x.ok && x.fix && st('review').status === 'review' ? `<button class="btn sm" data-act="${x.fix}">${x.fixLabel}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
  <p class="pl-note">法规名称仅作体验展示，正式上线前须由法务逐条复核。</p>`;
};
H.export = c => {
  const o = c.pipe.exportOpts, s = st('export'), rows = shotRows(c), total = rows.reduce((a, r) => a + r.dur, 0);
  const fi = ui.playIdx % c.S.shots.length;
  return `<div class="pl-grid2 pl-exp"><div class="pl-card"><h4>成片预览 <span class="muted">第 1 集开场段 · ${total.toFixed(1)} 秒</span></h4>
    <div class="pl-preview" id="pl-player">${frameSvg(c, c.S.shots[fi], fi, { sub: true, subCls: subCls(c), k: 'x' })}</div>
    <div class="pl-ctrl"><button class="btn sm" data-act="pl-play">${ui.playing ? '暂停' : '播放预览'}</button><span class="mono">${String(fi + 1).padStart(2, '0')} / ${String(c.S.shots.length).padStart(2, '0')}</span><input type="range" min="0" max="${c.S.shots.length - 1}" value="${fi}" data-act="pl-seek" aria-label="预览进度"></div></div>
  <div class="pl-card"><h4>导出设置</h4>
    <div class="field"><label for="exp-res">分辨率</label><select class="select" id="exp-res" data-act="pl-opt" data-k="res">${['1080×1920', '720×1280', '2160×3840'].map(x => `<option ${x === o.res ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label for="exp-subs">字幕</label><select class="select" id="exp-subs" data-act="pl-opt" data-k="subs"><option value="burn" ${o.subs === 'burn' ? 'selected' : ''}>烧录进画面</option><option value="srt" ${o.subs === 'srt' ? 'selected' : ''}>外挂 SRT</option></select></div>
    ${kvs([['编码', 'H.264 / AAC（模拟）'], ['AI 标识', '<span class="tag lock">' + ICON.lock + ' 显式 + 隐式，强制写入</span>'], ['合规关口', gatePass(c) ? '<span class="tag ok">G4 已通过</span>' : '<span class="tag danger">未通过</span>']])}
    ${s.status === 'review' || s.status === 'done' ? `<div class="pl-files"><div class="pl-label">成片包（模拟文件）</div>
      <button class="btn" data-act="pl-dl" data-k="manifest">${ICON.check} 成片包清单 .json</button><button class="btn" data-act="pl-dl" data-k="srt">字幕 .srt</button><button class="btn" data-act="pl-dl" data-k="csv">分镜表 .csv</button><button class="btn" data-act="pl-dl" data-k="config">流程配置 .json</button>
      <p class="pl-note">体验版不渲染真实视频，导出的是成片包清单、字幕、分镜表和流程配置。</p></div>` : ''}</div></div>`;
};
function rand(seed) { let x = seed * 9301 + 49297; return () => (x = (x * 9301 + 49297) % 233280) / 233280; }
H.growth = c => {
  const r = rand(st('growth').seed + c.key.length * 13), cn = c.p.region === 'cn', ads = c.names('N9.1', 'ad_creative');
  const days = Array.from({ length: 7 }, (_, i) => Math.round((cn ? 80 : 40) * (1 + i * .45) * (.85 + r() * .3)));
  const max = Math.max(...days), pts = days.map((d, i) => `${20 + i * 60},${150 - d / max * 120}`).join(' ');
  const kpi = [['累计播放', (days.reduce((a, b) => a + b, 0) / 10).toFixed(1) + ' 万'], ['第 1 集完播率', Math.round(52 + r() * 18) + '%'], ['付费/解锁率', (3 + r() * 4).toFixed(1) + '%'], ['投放 ROI', (1.1 + r() * .9).toFixed(2)], [cn ? '千次曝光成本' : 'CPM', cn ? '¥' + (18 + r() * 12).toFixed(1) : '$' + (6 + r() * 5).toFixed(2)]];
  return `<div class="pl-demo"><b>演示数据</b>以下数字均为随机生成的模拟数据，不代表任何真实投放结果。</div>
  <div class="pl-kpis">${kpi.map(([k, v]) => `<div class="pl-card"><span>${k}</span><b class="num">${v}</b><em>演示数据</em></div>`).join('')}</div>
  <div class="pl-grid2"><div class="pl-card"><h4>近 7 天播放（万次 · 演示数据）</h4><svg viewBox="0 0 400 170" class="pl-chart" role="img" aria-label="演示数据折线图"><path d="M20 150H400" stroke="#C9CCD2"/><polyline points="${pts}" fill="none" stroke="var(--c-accent)" stroke-width="2.5"/>${days.map((d, i) => `<circle cx="${20 + i * 60}" cy="${150 - d / max * 120}" r="3.5" fill="var(--c-accent)"/><text x="${20 + i * 60}" y="166" font-size="10" text-anchor="middle" fill="#5F646D">D${i + 1}</text>`).join('')}</svg></div>
  <div class="pl-card"><h4>渠道分布（演示数据）</h4>${(cn ? ['抖音', '快手', '微信小程序', '其他'] : ['TikTok', 'Meta', 'YouTube Shorts', 'Other']).map((k, i) => { const v = Math.round([42, 26, 20, 12][i] + r() * 6 - 3); return `<div class="pl-bar"><span>${k}</span><i><b style="width:${v * 2}%"></b></i><em class="num">${v}%</em></div>`; }).join('')}</div></div>
  <div class="pl-card"><h4>投放素材变体</h4><table class="pl-table"><thead><tr><th>素材</th><th>素材风格卡</th><th class="num">CTR</th><th class="num">3 秒留存</th><th>建议</th></tr></thead><tbody>
  ${c.S.ad.map((a, i) => { const ctr = (1.2 + r() * 2.4).toFixed(2), hold = Math.round(45 + r() * 30); return `<tr><td>${esc(a)}</td><td>${esc(ads.length ? pick(ads, i) : '默认')}</td><td class="num">${ctr}%</td><td class="num">${hold}%</td><td>${i === 0 ? '<span class="tag ok">加量</span>' : hold < 55 ? '<span class="tag warn">换钩子</span>' : '<span class="tag">观察</span>'}</td></tr>`; }).join('')}</tbody></table></div>`;
};

// ---------- 异步任务模拟 ----------
const ui = { playIdx: 0, playing: false, np: null, auto: false };
let timers = {};
function taskLines(s) {
  const c = ctx(), out = [];
  s.nodes.forEach(n => {
    const k = SKILL[n]; if (!k || (c.p.nodes[n] && c.p.nodes[n].enabled === false)) return;
    const cards = k.dimensions.flatMap(d => c.sel(n, d)).map(id => CARD[id].name);
    out.push(`[${n} ${k.title}] 载入 skill ${k.skill}${cards.length ? ' · 风格卡：' + cards.join('、') : ' · 使用岗位默认手法'}`);
    (k.subnodes || []).forEach(sn => out.push(`[${n}] ${sn} … 完成`));
  });
  if (s.id === 'export') out.push('渲染画面轨 … 完成', '混音与响度标准化 … 完成', '写入 AI 生成隐式标识（元数据） … 完成', '封装成片包 … 完成');
  out.push('模拟生成结束，等待人工审核');
  return out;
}
function runStep(id) {
  return new Promise(res => {
    const s = STEP[id], t = st(id); if (t.status === 'running' || !available(id)) return res();
    const lines = taskLines(s), total = FAST ? 300 : 1800 + lines.length * 120, tick = Math.max(40, total / lines.length);
    Object.assign(t, { status: 'running', progress: 0, log: [] }); C.persist(); C.render();
    let k = 0;
    timers[id] = setInterval(() => {
      if (!P() || !P().pipe) { clearInterval(timers[id]); return res(); }
      t.log.push(lines[k]); k++; t.progress = Math.round(k / lines.length * 100);
      if (k >= lines.length) { clearInterval(timers[id]); t.status = 'review'; t.at = new Date().toISOString(); C.persist(); C.render(); C.toast(`「${s.title}」已生成，请审核`); return res(); }
      C.render();
    }, tick);
  });
}
function resetAfter(id) { STEPS.slice(stepIdx(id) + 1).forEach(s => { const t = st(s.id); if (t.status !== 'idle') Object.assign(t, { status: 'idle', progress: 0, log: [] }); }); }
function regen(id) { const t = st(id); t.seed++; resetAfter(id); return runStep(id); }
function approve(id) {
  const c = ctx();
  if (id === 'review' && !gatePass(c)) { C.toast('合规关口未通过，请先处理问题项'); return false; }
  if (id === 'export' && !gatePass(c)) { C.toast('合规关口未通过，不能导出'); return false; }
  st(id).status = 'done'; C.persist();
  const nx = STEPS[stepIdx(id) + 1];
  C.toast(nx ? `已通过「${STEP[id].title}」` : '全流程完成！');
  if (!ui.auto) C.go('#/pipeline/' + (nx ? nx.id : id));
  C.render(); return true;
}
function submitIdea(text) {
  const el = document.getElementById('idea-input'), v = String(text != null ? text : el ? el.value : pipe().idea || '').trim();
  if (v.length < 4) { C.toast('请至少写 4 个字的创意'); return false; }
  pipe().idea = v; st('idea').status = 'done'; st('idea').progress = 100; C.persist(); if (!ui.auto) C.go('#/pipeline/market'); C.render(); return true;
}
async function autoRun() {
  if (ui.auto) return; ui.auto = true; C.render();
  try {
    if (!isDone('idea')) { const el = document.getElementById('idea-input'); const v = (el && el.value.trim()) || pipe().idea || ctx().S.ideas[0]; if (!submitIdea(v)) return; }
    for (const s of STEPS.slice(1)) {
      if (isDone(s.id)) continue;
      C.go('#/pipeline/' + s.id);
      if (st(s.id).status !== 'review') await runStep(s.id);
      if (s.id === 'review' && !gatePass(ctx())) { C.toast('合规关口发现问题，自动运行已暂停，请人工处理'); break; }
      approve(s.id);
      if (s.id === 'export') break;
    }
  } finally { ui.auto = false; C.render(); }
}

// ---------- 页面：登录 ----------
const banner = () => `<div class="demo-banner" role="note"><b>体验版</b><span>生成内容为模拟，不调用真实模型；投放数据为演示数据。</span></div>`;
function pageLogin() {
  return `${banner()}<div class="login"><div class="login-art" aria-hidden="true"><div class="la-in"><div class="la-k mono">DRAMAFLOW · 体验版</div><h2>从一句话创意，<br>到一集可导出的短剧。</h2>
    <ol class="la-steps">${STEPS.map(x => `<li><span class="mono">${x.no}</span>${esc(x.short)}</li>`).join('')}</ol>
    <div class="la-covers">${D.templates.map(t => `<div><span>${C.coverSvg(t)}</span><b>${esc(t.name.replace(/（.*?）/g, ''))}</b></div>`).join('')}</div>
    <p>19 个岗位 Skill · 111 张风格卡 · 7 套整流程模板</p></div></div>
  <form class="login-card" id="login-form" novalidate><div class="brand dark"><span class="mark">${ICON.mark}</span><div><b>剧链 DramaFlow</b><span>AI 短剧生产工作台 · 体验版</span></div></div>
    <h1>登录工作台</h1><p class="muted">从一句话创意到成片导出，12 个生产步骤全流程体验。所有生成内容均为模拟。</p>
    <button type="button" class="btn primary lg" data-act="demo-login">使用演示账号一键登录</button>
    <div class="or"><span>或输入演示账号</span></div>
    <div class="field"><label for="lg-email">邮箱</label><input class="input" id="lg-email" name="email" value="${DEMO.email}" autocomplete="username"></div>
    <div class="field"><label for="lg-pw">密码</label><input class="input" id="lg-pw" name="pw" type="password" value="${DEMO.password}" autocomplete="current-password"><span class="hint" id="lg-err">演示账号：${DEMO.email} / ${DEMO.password}</span></div>
    <button type="submit" class="btn">登录</button></form></div>`;
}

// ---------- 页面：新建项目 ----------
function pageNew(r) {
  const np = ui.np || (ui.np = { region: 'cn', genre: 'bazong', tpl: 'tpl-cn-bazong-sweet', name: '', episodes: 80 });
  const tpls = D.templates.filter(t => t.region === np.region);
  const body = `<div class="page"><div class="page-h"><div><h1>新建项目</h1><p>选择区域、题材和集数，再套用一套整流程模板或自己配风格。创建后进入生产流水线。</p></div></div>
  <form class="formcard np" id="np-form" novalidate><div class="sec"><h2 class="sec-t">1 · 基本信息</h2>
    <div class="field full"><label for="np-name">项目名</label><input class="input" id="np-name" value="${esc(np.name)}" placeholder="例如：契约期满，沈总他不放手" maxlength="40"><span class="hint" id="np-err-name"></span></div>
    <div class="field"><span class="label" id="np-l-region">区域</span><div class="seg" role="radiogroup" aria-labelledby="np-l-region">${['cn', 'global'].map(k => `<button type="button" role="radio" data-act="np-region" data-v="${k}" aria-checked="${np.region === k}">${C.REGION_LABEL[k]}</button>`).join('')}</div><span class="hint">${np.region === 'cn' ? '国内：已备案模型、人民币计费' : '海外：海外模型、Stripe、默认含本地化'}</span></div>
    <div class="field"><label for="np-genre">题材</label><select class="select" id="np-genre">${D.genres.filter(g => g.region === np.region).map(g => `<option value="${g.id}" ${g.id === np.genre ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="field"><label for="np-eps">集数</label><input class="input num" id="np-eps" type="number" min="1" max="300" value="${esc(np.episodes)}"><span class="hint" id="np-err-eps">1-300 集</span></div></div>
  <div class="sec"><h2 class="sec-t">2 · 风格方案</h2><div class="np-tpls" role="radiogroup" aria-label="风格方案">
    ${tpls.map(t => `<button type="button" role="radio" class="np-tpl" data-act="np-tpl" data-v="${t.id}" aria-checked="${np.tpl === t.id}"><span class="cv">${C.coverSvg(t)}</span><b>${esc(t.name)}</b><span class="muted">${esc((t.genres || []).map(g => (GENRE[g] || {}).name || g).join(' / '))}</span></button>`).join('')}
    <button type="button" role="radio" class="np-tpl custom" data-act="np-tpl" data-v="custom" aria-checked="${np.tpl === 'custom'}"><span class="cv ph">${ICON.flow}</span><b>自配风格</b><span class="muted">不套模板，到流程编辑器逐岗位挑风格卡</span></button></div></div>
  <div class="foot"><button type="button" class="btn" data-act="goto" data-v="#/pipeline">取消</button><button type="button" class="btn primary" data-act="np-create">创建项目并进入流水线</button></div></form></div>`;
  return C.shell(r, '<a href="#/pipeline">生产流水线</a><span class="sep">/</span><b>新建项目</b>', body);
}
function createProject() {
  const np = ui.np, name = (document.getElementById('np-name').value || '').trim(), eps = Number(document.getElementById('np-eps').value);
  np.genre = document.getElementById('np-genre').value; np.name = name; np.episodes = eps;
  let ok = true; const en = document.getElementById('np-err-name'), ee = document.getElementById('np-err-eps');
  en.textContent = ''; ee.textContent = '1-300 集'; ee.style.color = '';
  if (!name) { en.textContent = '请填写项目名'; en.style.color = 'var(--c-danger)'; ok = false; }
  if (!Number.isInteger(eps) || eps < 1 || eps > 300) { ee.textContent = '集数需为 1-300 的整数'; ee.style.color = 'var(--c-danger)'; ok = false; }
  if (!ok) return;
  Object.values(timers).forEach(clearInterval); timers = {};
  let p;
  if (np.tpl === 'custom') p = C.blankProject(np.region);
  else p = C.projectFromTemplate(D.templates.find(t => t.id === np.tpl));
  Object.assign(p, { name, episodes: eps, genre: np.genre, region: np.region, mode: np.tpl === 'custom' ? 'custom' : 'template' });
  if (np.region === 'global' && p.nodes['N8.2']) p.nodes['N8.2'].enabled = true;
  C.setProject(p); pipe(); C.persist(); ui.np = null; ui.playIdx = 0;
  C.toast(`已创建「${name}」`); C.go('#/pipeline/idea');
}

// ---------- 页面：生产流水线 ----------
function drivers(s, c) {
  const nodes = s.nodes.filter(n => SKILL[n] && !(c.p.nodes[n] && c.p.nodes[n].enabled === false));
  return `<div class="pl-drv"><div class="pl-label">本步由以下岗位 Skill 与风格卡驱动</div>${nodes.map(n => { const k = SKILL[n];
    const cards = k.dimensions.flatMap(d => c.sel(n, d));
    return `<div class="drv"><a class="drv-skill" href="#/skills/${n}"><span class="mono">${n}</span><b>${esc(k.title)}</b><span class="mono muted">${esc(k.skill)}</span></a>
      <div class="drv-cards">${cards.length ? cards.map(chip).join('') : '<span class="muted">未选风格卡，按岗位默认手法</span>'}<a class="btn link sm" href="#/editor/${n}">换风格</a></div>
      ${(k.masters || []).length ? `<div class="drv-m muted">代表手法：${k.masters.slice(0, 2).map(m => esc(m.neutral_name)).join('、')}</div>` : ''}</div>`; }).join('')}</div>`;
}
function stepActions(s, c) {
  const t = st(s.id), av = available(s.id);
  if (!av) return `<span class="muted">请先完成上一步</span>`;
  if (s.manual) return isDone('idea') ? `<button class="btn" data-act="pl-reidea">重新编辑</button>` : `<button class="btn primary" data-act="pl-submit-idea">提交创意</button>`;
  if (t.status === 'running') return `<button class="btn" disabled>生成中 ${t.progress}%</button>`;
  if (t.status === 'idle') {
    if (s.id === 'export' && !gatePass(c)) return `<button class="btn primary" disabled>开始导出成片</button><span class="muted">合规关口未通过</span>`;
    return `<button class="btn primary" data-act="pl-run" data-v="${s.id}">${s.id === 'export' ? '开始导出成片' : s.id === 'review' ? '开始合规审核' : '开始生成'}</button>`;
  }
  const passOk = !(s.id === 'review' || s.id === 'export') || gatePass(c);
  const regenLabel = s.id === 'review' ? '重新审核' : s.id === 'export' ? '重新导出' : '重新生成';
  if (t.status === 'review') return `<button class="btn" data-act="pl-regen" data-v="${s.id}">${regenLabel}</button><button class="btn primary" data-act="pl-approve" data-v="${s.id}" ${passOk ? '' : 'disabled'}>${s.id === 'review' ? '通过合规关口' : s.id === 'growth' ? '完成项目' : '审核通过'}</button>`;
  return `<span class="tag ok">${ICON.check} 已通过</span><button class="btn" data-act="pl-regen" data-v="${s.id}">${regenLabel}</button>${STEPS[stepIdx(s.id) + 1] ? `<button class="btn primary" data-act="goto" data-v="#/pipeline/${STEPS[stepIdx(s.id) + 1].id}">下一步</button>` : ''}`;
}
const STATUS = { idle: ['待生成', ''], running: ['生成中', 'warn'], review: ['待审核', 'accent'], done: ['已通过', 'ok'] };
function pagePipeline(r) {
  if (!P()) return C.shell(r, '<b>生产流水线</b>', `<div class="page"><div class="empty boxed">${ICON.film}<b>还没有项目</b>新建一个项目，从一句话创意开始走完整条生产流水线。<br><button class="btn primary" data-act="goto" data-v="#/new">新建项目</button></div></div>`);
  const c = ctx(), id = STEP[r.arg] ? r.arg : currentStep(), s = STEP[id], t = st(id);
  const done = STEPS.filter(x => isDone(x.id)).length;
  const railHtml = `<nav class="pl-rail" data-keep="plrail" aria-label="生产步骤"><div class="pl-proj"><b title="${esc(c.p.name)}">${esc(c.p.name)}</b>
      <div class="tags">${C.regionTag(c.p.region)}<span class="tag">${c.p.base ? esc(c.p.base.name.replace(/（.*?）/g, '')) : '自配风格'}</span></div>
      <div class="progress" aria-label="完成 ${done}/${STEPS.length}"><i style="width:${done / STEPS.length * 100}%"></i></div><div class="muted num">${done} / ${STEPS.length} 步已通过</div></div>
    <ol class="pl-pre-steps"><li class="ok">${ICON.check}登录</li><li class="ok">${ICON.check}新建项目</li><li class="ok">${ICON.check}${c.p.base ? '套用模板' : '自配风格'}</li></ol>
    <ol class="pl-steps">${STEPS.map(x => { const tt = st(x.id), [lb, cls] = STATUS[tt.status]; const lock = !available(x.id);
      return `<li><a href="#/pipeline/${x.id}" class="pl-step ${tt.status} ${lock ? 'locked' : ''}" data-step="${x.id}" ${x.id === id ? 'aria-current="step"' : ''}><span class="no mono">${x.no}</span><span class="t">${esc(x.title)}${x.gate ? `<span class="pl-gate mono">${x.gate}</span>` : ''}</span><span class="tag ${cls}">${lock && tt.status === 'idle' ? '未解锁' : lb}</span></a></li>`; }).join('')}</ol></nav>`;
  const body = !available(id) ? `<div class="empty boxed">${ICON.lock}<b>此步骤尚未解锁</b>请按顺序完成前面的步骤。<br><button class="btn" data-act="goto" data-v="#/pipeline/${currentStep()}">前往当前步骤</button></div>`
    : t.status === 'running' ? `<div class="pl-run"><div class="pl-label">正在模拟生成…</div><div class="progress big"><i style="width:${t.progress}%"></i></div><ol class="pl-log mono">${t.log.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>`
    : (s.manual || t.status !== 'idle') ? H[id](c) + (t.log.length && !s.manual ? `<details class="pl-logbox"><summary>任务日志（${t.log.length} 条）</summary><ol class="pl-log mono">${t.log.map(l => `<li>${esc(l)}</li>`).join('')}</ol></details>` : '')
    : `<div class="empty boxed">${ICON.film}<b>${esc(s.title)}</b>${esc(s.desc)}<br>${id === 'export' && !gatePass(c) ? '<span style="color:var(--c-danger)">合规关口未通过，不能导出。</span>' : '点「开始生成」后将模拟调用以下岗位 Skill。'}</div>`;
  const panel = `<section class="pl-panel" data-keep="plpanel"><header class="pl-h"><div class="pl-eyebrow"><span class="mono">STEP ${s.no}</span>${s.gate ? `<span class="tag lock">${ICON.gate} 质量关口 ${s.gate}</span>` : ''}<span class="tag ${STATUS[t.status][1]}" id="pl-status">${STATUS[t.status][0]}</span></div>
      <div class="pl-title"><h2>${esc(s.title)}</h2><div class="spacer"></div><div class="acts">${stepActions(s, c)}</div></div><p class="muted">${esc(s.desc)}</p>${drivers(s, c)}</header>
    <div class="pl-body">${body}</div></section>`;
  return C.shell(r, `<a href="#/pipeline">生产流水线</a><span class="sep">/</span><b>${esc(s.title)}</b>`, `<div class="pl">${railHtml}${panel}</div>`,
    { actions: `<button class="btn" data-act="goto" data-v="#/new">新建项目</button><button class="btn keep" data-act="pl-auto" ${ui.auto ? 'disabled' : ''}>${ui.auto ? '自动运行中…' : '一键跑完（演示）'}</button>` });
}
function pagePanorama(r) {
  return C.shell(r, '<b>系统全景</b>', `<div class="pano"><iframe src="panorama.html" title="短剧专家 Skill 体系 · 系统全景"></iframe></div>`, { actions: `<a class="btn" href="panorama.html" target="_blank" rel="noopener">新窗口打开</a>` });
}

// ---------- 下载 ----------
function dl(kind) {
  const c = ctx(), name = c.p.id;
  const blob = (txt, type, fn) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  if (kind === 'srt') return blob(srt(c), 'text/plain', `${name}-ep01.srt`);
  if (kind === 'csv') { const rows = shotRows(c); return blob('\ufeff镜号,景别,运镜,构图,色调,画面,台词,时长\n' + rows.map(x => [`S${x.i + 1}`, x.s[1], x.cam, x.comp, x.cl, x.s[0], x.s[2], x.dur].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv', `${name}-storyboard.csv`); }
  if (kind === 'config') return blob(JSON.stringify({ template: C.exportTemplate(), envelopes: C.exportEnvelopes() }, null, 2), 'application/json', `${name}-config.json`);
  const man = { x_demo: '体验版模拟成片包：不含真实视频', project: { id: c.p.id, name: c.p.name, region: c.p.region, genre: c.p.genre, episodes: c.p.episodes, template: c.p.base ? c.p.base.id : null },
    title: pick(c.S.title, st('script').seed), idea: c.pipe.idea, export: c.pipe.exportOpts, ai_label: { explicit: c.pipe.aiLabel, implicit: true },
    compliance: checks(c).map(x => ({ id: x.id, ok: x.ok })), shots: shotRows(c).map(x => ({ id: `S${x.i + 1}`, size: x.s[1], camera: x.cam, duration_s: x.dur, line: x.s[2] })), exported_at: new Date().toISOString() };
  blob(JSON.stringify(man, null, 2), 'application/json', `${name}-ep01-package.json`);
}

// ---------- 事件 ----------
let playTimer = null;
function onClick(a, el, e) {
  const v = el.dataset.v;
  switch (a) {
    case 'demo-login': login(DEMO.email); C.toast(`欢迎，${DEMO.name}`); C.go(P() ? '#/pipeline' : '#/new'); C.render(); return true;
    case 'logout': logout(); Object.values(timers).forEach(clearInterval); C.go('#/login'); C.render(); return true;
    case 'np-region': ui.np.region = v; ui.np.name = document.getElementById('np-name').value; ui.np.episodes = document.getElementById('np-eps').value;
      ui.np.genre = D.genres.find(g => g.region === v).id; ui.np.tpl = (D.templates.find(t => t.region === v) || {}).id || 'custom'; C.render(); return true;
    case 'np-tpl': { ui.np.tpl = v; ui.np.name = document.getElementById('np-name').value; ui.np.episodes = document.getElementById('np-eps').value; ui.np.genre = document.getElementById('np-genre').value;
      const t = D.templates.find(x => x.id === v); if (t) { if (t.genres[0] && GENRE[t.genres[0]] && GENRE[t.genres[0]].region === ui.np.region) ui.np.genre = t.genres[0]; if (typeof t.format.episodes === 'number') ui.np.episodes = t.format.episodes; } C.render(); return true; }
    case 'np-create': createProject(); return true;
    case 'pl-idea': { const el2 = document.getElementById('idea-input'); el2.value = ctx().S.ideas[Number(el.dataset.i)]; pipe().idea = el2.value; C.persist(); return true; }
    case 'pl-submit-idea': submitIdea(); return true;
    case 'pl-reidea': st('idea').status = 'idle'; resetAfter('idea'); C.persist(); C.render(); return true;
    case 'pl-run': runStep(v); return true;
    case 'pl-regen': regen(v); return true;
    case 'pl-approve': approve(v); return true;
    case 'pl-auto': autoRun(); return true;
    case 'pl-ailabel': pipe().aiLabel = el.checked; C.persist(); C.toast(el.checked ? '已开启 AI 生成标识' : '已关闭 AI 生成标识：合规审核将不通过'); C.render(); return true;
    case 'pl-fix-ai': pipe().aiLabel = true; C.persist(); C.toast('已添加 AI 生成显式标识'); C.render(); return true;
    case 'pl-fix-line': pipe().fixed = true; C.persist(); C.toast('已采用建议修改'); C.render(); return true;
    case 'pl-play': ui.playing = !ui.playing; clearInterval(playTimer);
      if (ui.playing) playTimer = setInterval(() => { if (!document.getElementById('pl-player')) { ui.playing = false; return clearInterval(playTimer); } ui.playIdx = (ui.playIdx + 1) % ctx().S.shots.length; C.render(); }, 1400);
      C.render(); return true;
    case 'pl-dl': dl(el.dataset.k); C.toast('已下载（模拟文件）'); return true;
  }
  return false;
}
function onInput(e) {
  const el = e.target;
  if (el.dataset && el.dataset.act === 'pl-seek') { ui.playIdx = Number(el.value); C.render(); return true; }
  if (el.id === 'idea-input' && P()) { pipe().idea = el.value; C.persist(); return true; }
  return false;
}
function onChange(e) {
  const el = e.target;
  if (el.dataset && el.dataset.act === 'pl-opt') { pipe().exportOpts[el.dataset.k] = el.value; C.persist(); return true; }
  if (el.id === 'np-genre' && ui.np) { ui.np.genre = el.value; return true; }
  return false;
}
function onSubmit(e) {
  if (e.target.id !== 'login-form') return false;
  e.preventDefault();
  const em = document.getElementById('lg-email').value.trim(), pw = document.getElementById('lg-pw').value;
  if (em.toLowerCase() !== DEMO.email || pw !== DEMO.password) { const er = document.getElementById('lg-err'); er.textContent = `账号或密码不正确。演示账号：${DEMO.email} / ${DEMO.password}`; er.style.color = 'var(--c-danger)'; return true; }
  login(em); C.go(P() ? '#/pipeline' : '#/new'); C.render(); return true;
}

healRunning();
window.__pipe = { STEPS, ctx, checks: () => checks(ctx()), gatePass: () => gatePass(ctx()), get state() { return P() && P().pipe; }, autoRun, runStep, approve };
return { pages: { login: pageLogin, new: pageNew, pipeline: pagePipeline, panorama: pagePanorama }, session, banner, onClick, onInput, onChange, onSubmit, logout };
};
