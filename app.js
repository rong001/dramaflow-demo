/* AI 短剧工作台 · 前端原型（纯前端，无依赖）。数据来自 window.APP_DATA（由 scripts/build_data.py 生成） */
(function () {
'use strict';
const D = window.APP_DATA;
const LS_PROJECT = 'dramaos.project.v1', LS_MINE = 'dramaos.mytemplates.v1';
const $app = document.getElementById('app');

// ---------- 索引 ----------
const CARD = Object.fromEntries(D.cards.map(c => [c.id, c]));
const DIM = Object.fromEntries(D.dimensions.map(d => [d.id, d]));
const SKILL = Object.fromEntries(D.skills.map(s => [s.node, s]));
const GENRE = Object.fromEntries(D.genres.map(g => [g.id, g]));
const NODE_ORDER = D.skills.map(s => s.node);
const REGION_LABEL = { cn: '国内区', global: '海外区' };
const EDGES = { 'N1.1':['N1.2'], 'N1.2':['N2.1'], 'N2.1':['N2.2'], 'N2.2':['N2.3'], 'N2.3':['N3.1','N3.2','N3.3'],
  'N3.2':['N3.1'], 'N3.3':['N3.4'], 'N3.1':['N4.1'], 'N3.4':['N4.1'], 'N4.1':['N4.2'], 'N4.2':['N5.1'],
  'N5.1':['N6.1','N7.1'], 'N6.1':['N6.2'], 'N6.2':['N7.1'], 'N7.1':['N7.2'], 'N7.2':['N8.1'], 'N8.1':['N8.2','N9.1'],
  'N8.2':['N9.1'], 'N9.1':[] };
const NODE_GATE = { 'N1.2':'G0', 'N2.3':'G1', 'N3.4':'G2', 'N7.1':'G3', 'N8.1':'G4' };

// ---------- 工具 ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const ids = sel => sel == null ? [] : Array.isArray(sel) ? sel : typeof sel === 'object' ? Object.values(sel) : [sel];
const cardName = id => CARD[id] ? CARD[id].name : `［缺失卡 ${id}］`;
const regionTag = r => `<span class="tag region"><i>${r === 'cn' ? 'CN' : 'GL'}</i>${REGION_LABEL[r]}</span>`;
const genreNames = gs => (gs || []).map(g => GENRE[g] ? GENRE[g].name : g);
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const ICON = {
  lib: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
  flow: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="4" cy="3.5" r="1.6"/><circle cx="4" cy="12.5" r="1.6"/><circle cx="12" cy="8" r="1.6"/><path d="M4 5.1v5.8M5.5 4.2 10.5 7.3M5.5 11.8l5-3"/></svg>',
  gear: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>',
  book: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.5 3h4a1.5 1.5 0 0 1 1.5 1.5V13a1.2 1.2 0 0 0-1.2-1.2H2.5zM13.5 3h-4A1.5 1.5 0 0 0 8 4.5V13a1.2 1.2 0 0 1 1.2-1.2h4.3z"/></svg>',
  star: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 2.5h10v11l-5-3-5 3z"/></svg>',
  doc: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 1.8h5.5L12.5 5v9.2H4z"/><path d="M6 8h4.5M6 10.5h4.5"/></svg>',
  mark: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" stroke-width="1.6" aria-hidden="true"><path d="M2.5 7.5h13v8h-13z"/><path d="M2.5 7.5 3.6 3.2l12 2.8-.6 1.5"/><path d="M6.6 4.1 5.7 7.5M10.6 5 9.7 7.5"/></svg>',
  menu: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 5h12M3 9h12M3 13h12"/></svg>',
  chev: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3.5 2 6.5 5l-3 3"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2.2 14.5 13.5h-13z"/><path d="M8 6.5v3.2M8 11.4v.4"/></svg>',
  gate: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 14V2.5M3 3h9l-2 3 2 3H3"/></svg>',
  film: '<svg class="ill" width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="6" y="9" width="28" height="22" rx="2"/><path d="M11 9v22M29 9v22M6 15h5M6 20h5M6 25h5M29 15h5M29 20h5M29 25h5"/></svg>',
  play: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.8" y="3" width="12.4" height="10" rx="1.5"/><path d="m6.5 6 3.5 2-3.5 2z"/></svg>',
  map: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1.8 3.5 6 2l4 1.5 4.2-1.5v10.5L10 14l-4-1.5-4.2 1.5z"/><path d="M6 2v10.5M10 3.5V14"/></svg>',
  lock: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="10" height="7" rx="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>',
};

// ---------- 状态 ----------
let EXT = null;
let mine = load(LS_MINE, []);
let project = load(LS_PROJECT, null);
const ui = { navOpen: false, tplRegion: 'all', tplGenre: null, node: 'N1.1', focus: {}, filt: {}, modal: null, exportTab: 'template' };

function blankProject(region) {
  region = region || 'cn';
  const nodes = {};
  NODE_ORDER.forEach(n => nodes[n] = { enabled: !(n === 'N8.2' && region === 'cn'), selections: {}, unlocked: {} });
  return { id: 'prj_' + Date.now().toString(36), name: '未命名短剧项目', region, genre: region === 'cn' ? 'bazong' : 'werewolf',
    episodes: 80, aspect: '9:16', base: null, nodes, dirty: false };
}
function projectFromTemplate(t) {
  const nodes = {};
  NODE_ORDER.forEach(n => {
    const tn = t.nodes.find(x => x.node === n);
    nodes[n] = { enabled: !!tn, selections: tn ? clone(tn.selections) : {}, unlocked: {} };
  });
  const eps = typeof (t.format || {}).episodes === 'number' ? t.format.episodes : 80;
  return { id: 'prj_' + Date.now().toString(36), name: t.name.replace(/（.*?）/g, '') + ' · 新项目', region: t.region,
    genre: (t.genres || [])[0] || 'bazong', episodes: eps, aspect: (t.format || {}).aspect || '9:16',
    base: clone(t), nodes, dirty: false };
}
function persist() { save(LS_PROJECT, project); }
function touch() { project.dirty = true; persist(); }

// 某维度在当前项目里的约束
function dimRule(node, dim) {
  const b = project.base;
  const lk = b && (b.locked || []).find(l => l.dimension === dim);
  const tn = b && b.nodes.find(n => n.node === node);
  const alts = (tn && tn.alternatives && tn.alternatives[dim]) || [];
  if (lk) return { locked: lk.reason, fixed: false, alts };
  const fixed = !!(tn && !(tn.replaceable || []).includes(dim) && !project.nodes[node].unlocked[dim]);
  return { locked: null, fixed, alts };
}
function nodeStatus(n) {
  const st = project.nodes[n];
  if (!st.enabled) return 'off';
  const all = SKILL[n].dimensions.flatMap(d => ids(st.selections[d]));
  if (all.some(id => !CARD[id] || !CARD[id].regions.includes(project.region))) return 'conflict';
  return SKILL[n].dimensions.some(d => ids(st.selections[d]).length) ? 'done' : 'todo';
}
function issues() {
  const out = [];
  NODE_ORDER.forEach(n => {
    const st = project.nodes[n]; if (!st.enabled) return;
    SKILL[n].dimensions.forEach(d => {
      const s = ids(st.selections[d]);
      s.forEach(id => {
        if (!CARD[id]) out.push(`${n} ${DIM[d].label}：引用了不存在的风格卡 ${id}`);
        else if (!CARD[id].regions.includes(project.region)) out.push(`${n} ${DIM[d].label}：「${CARD[id].name}」在${REGION_LABEL[project.region]}不可用`);
      });
    });
    if (!SKILL[n].dimensions.some(d => ids(st.selections[d]).length)) out.push(`${n} ${SKILL[n].title}：尚未选择风格卡`);
  });
  if (project.base && project.base.region !== project.region) out.push(`模板「${project.base.name}」属于${REGION_LABEL[project.base.region]}，当前项目为${REGION_LABEL[project.region]}`);
  return out;
}

// ---------- 选择操作 ----------
function setSel(node, dim, fn) {
  const st = project.nodes[node];
  const v = fn(st.selections[dim]);
  if (v == null || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) delete st.selections[dim];
  else st.selections[dim] = v;
  touch(); render();
}
function replaceCard(node, dim, id) { setSel(node, dim, () => DIM[dim].selection_mode === 'multi' ? [id] : id); toast(`已替换为「${CARD[id].name}」`); }
function stackCard(node, dim, id) { setSel(node, dim, cur => { const a = ids(cur); return a.includes(id) ? a : a.concat(id); }); toast(`已叠加「${CARD[id].name}」`); }
function removeCard(node, dim, id, role) {
  setSel(node, dim, cur => {
    if (role) { const o = Object.assign({}, cur); delete o[role]; return o; }
    if (Array.isArray(cur)) return cur.filter(x => x !== id);
    return null;
  });
}
function assignRole(node, dim, role, id) { setSel(node, dim, cur => Object.assign({}, (cur && typeof cur === 'object' && !Array.isArray(cur)) ? cur : {}, { [role]: id })); toast(`${roleLabel(dim, role)}声线：${CARD[id].name}`); }
const roleLabel = (dim, r) => ((DIM[dim].roles || []).find(x => x.id === r) || { label: r }).label;

// ---------- 导出 ----------
function normSel(dim, v) {
  if (Array.isArray(v)) return v.length === 1 ? v[0] : v.slice();
  return clone(v);
}
function exportTemplate(overrideName) {
  const b = project.base;
  const name = overrideName || project.name;
  const nodes = NODE_ORDER.filter(n => project.nodes[n].enabled).map(n => {
    const st = project.nodes[n], sk = SKILL[n], tn = b && b.nodes.find(x => x.node === n);
    const selections = {};
    sk.dimensions.forEach(d => { if (ids(st.selections[d]).length) selections[d] = normSel(d, st.selections[d]); });
    const replaceable = sk.dimensions.filter(d => { const r = dimRule(n, d); return !r.locked && !r.fixed; });
    const alternatives = tn ? clone(tn.alternatives || {}) : {};
    return { node: n, skill: sk.skill, title: sk.title, selections, replaceable, alternatives };
  });
  return {
    schema: '../schema.json#/$defs/Template',
    id: 'tpl-my-' + (project.id.replace(/^prj_/, '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'x'),
    name,
    region: project.region,
    genres: [project.genre].concat(b ? b.genres.filter(g => g !== project.genre) : []),
    description: b ? `基于「${b.name}」定制。${b.description || ''}` : '从空白开始自选的整套流程。',
    format: Object.assign({}, b ? b.format : {}, { aspect: project.aspect, episodes: project.episodes }),
    usage: b ? clone(b.usage || {}) : { one_click: '整套直接使用：按 nodes 里的 selections 执行全流程' },
    locked: b ? clone(b.locked || []) : [],
    notes: b && b.notes ? b.notes : '',
    nodes,
  };
}
function exportEnvelopes() {
  const tpl = exportTemplate(); const now = new Date().toISOString();
  const on = n => project.nodes[n].enabled;
  const inputsOf = n => NODE_ORDER.filter(m => on(m) && (EDGES[m] || []).includes(n));
  return tpl.nodes.map(tn => ({
    envelope_version: '1.0', project_id: project.id, region: project.region, node: tn.node, skill: tn.skill,
    artifact_id: `art_${tn.node.replace('.', '_')}_draft`, version: 1, template_id: project.base ? project.base.id : tpl.id,
    style_selection: tn.selections,
    inputs: inputsOf(tn.node).map(m => ({ node: m, artifact_id: `art_${m.replace('.', '_')}_draft`, version: 1 })),
    payload: {}, qc: { checklist: [], issues: [], gate: NODE_GATE[tn.node] || null },
    provenance: { models: [], operator: 'demo_user', created_at: now }, approved_by: null,
    next: (EDGES[tn.node] || []).filter(on),
  }));
}
function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

// ---------- 提示 ----------
function toast(msg) {
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = ICON.check + '<span></span>'; t.lastChild.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- 路由 ----------
function route() {
  const h = (location.hash || '#/pipeline').slice(2).split('/');
  return { page: h[0] || 'pipeline', arg: decodeURIComponent(h[1] || '') };
}
const go = h => { location.hash = h; };

// ---------- 渲染：外壳 ----------
function shell(r, crumbs, body, opts) {
  opts = opts || {};
  const nav = [
    ['pipeline', '生产流水线', ICON.play, project && project.pipe ? `${Object.values(project.pipe.steps).filter(x => x.status === 'done').length}/12` : ''],
    ['templates', '模板库', ICON.lib, D.templates.length],
    ['editor', '流程编辑器', ICON.flow, project ? `${NODE_ORDER.filter(n => project.nodes[n].enabled).length} 节点` : ''],
    ['settings', '项目设置', ICON.gear, ''],
    ['skills', '岗位 Skill', ICON.book, D.skills.length],
    ['mine', '我的模板', ICON.star, mine.length],
    ['overview', 'SOP 总览', ICON.doc, ''],
    ['panorama', '系统全景', ICON.map, ''],
  ];
  const cur = r.page === 'card' ? 'skills' : r.page === 'new' ? 'pipeline' : r.page;
  const proj = project ? `<div>当前项目</div><div class="row"><b title="${esc(project.name)}">${esc(project.name)}</b></div>
    <div class="row"><span>${regionTag(project.region)}</span><span class="num">${esc(project.episodes)} 集 · ${esc(project.aspect)}</span></div>` :
    `<div>尚未创建项目</div><div class="row"><a href="#/templates">从模板开始</a></div>`;
  const navItem = ([k, l, ic, c]) => `<a href="#/${k}" ${k === cur ? 'aria-current="page"' : ''}>${ic}<span>${l}</span><span class="count num">${c}</span></a>`;
  return `${EXT ? EXT.banner() : ''}<div class="app ${ui.navOpen ? 'nav-open' : ''}">
  <aside class="side" id="side-nav">
    <div class="brand"><span class="mark">${ICON.mark}</span><div><b>剧链 DramaFlow</b><span>AI 短剧生产工作台</span></div></div>
    <nav class="nav" aria-label="主导航"><div class="nav-l">制作</div>${nav.slice(0, 4).map(navItem).join('')}<div class="nav-l">资料库</div>${nav.slice(4).map(navItem).join('')}</nav>
    <div class="side-foot">${proj}${EXT && EXT.session() ? `<div class="row user"><span>${esc(EXT.session().name)}</span><button class="btn link sm" data-act="logout">退出</button></div>` : ''}</div>
  </aside>
  <div class="scrim-nav" data-act="nav-close"></div>
  <div class="main">
    <header class="topbar"><button class="menu-btn" data-act="nav-toggle" aria-label="打开导航" aria-controls="side-nav" aria-expanded="${ui.navOpen}">${ICON.menu}</button><div class="crumbs">${crumbs}</div><div class="spacer"></div><div class="acts">${opts.actions || ''}</div></header>
    <main class="content" data-keep="content">${body}</main>
  </div></div>${ui.modal ? modalHtml() : ''}`;
}

// ---------- 模板封面（抽象场景 SVG，不描绘真实人物） ----------
const COVER_KEY = { 'tpl-cn-bazong-sweet': 'city', 'tpl-cn-palace-revenge': 'palace', 'tpl-cn-suspense-twist': 'noir', 'tpl-gl-werewolf-billionaire': 'moon',
  'tpl-cn-era-warm': 'era', 'tpl-cn-xianxia-motion-comic': 'xian', 'tpl-cn2gl-localize': 'dub' };
const GENRE_COVER = { bazong: 'city', tianchong: 'city', gongdou: 'palace', chongsheng: 'palace', xuanyi: 'noir', werewolf: 'moon', billionaire: 'city', niandai: 'era', danvzhu: 'era', xianxia: 'xian', nixi: 'city', zhanshen: 'city' };
function coverSvg(t) {
  const k = COVER_KEY[t.id] || GENRE_COVER[(t.genres || [])[0]] || 'city';
  const uid = 'g' + Math.abs([...t.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
  const sky = (a, b, c) => `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="400" height="140" fill="url(#${uid})"/>`;
  const rnd = (() => { let x = uid.length * 97 + 13; return () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; })();
  let body = '';
  if (k === 'city' || k === 'dub') {
    body = sky(k === 'dub' ? '#1B2433' : '#2A2433', k === 'dub' ? '#3A4E66' : '#8E4A4F', k === 'dub' ? '#6F8AA3' : '#E59A7D');
    body += '<circle cx="300" cy="74" r="18" fill="#F6C9A8" opacity=".85"/>';
    let x = 0; while (x < 400) { const w = 16 + rnd() * 30, h = 34 + rnd() * 70; body += `<rect x="${x.toFixed(1)}" y="${(140 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#14161C"/>`;
      for (let wy = 140 - h + 6; wy < 134; wy += 9) for (let wx = x + 4; wx < x + w - 4; wx += 7) if (rnd() > .62) body += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="4" fill="#F2C38B" opacity="${(.5 + rnd() * .5).toFixed(2)}"/>`;
      x += w + 2; }
    if (k === 'dub') body += '<rect x="110" y="104" width="180" height="9" rx="4.5" fill="#fff" opacity=".9"/><rect x="140" y="119" width="120" height="9" rx="4.5" fill="#fff" opacity=".55"/>';
  } else if (k === 'palace') {
    body = sky('#2A0B10', '#6B1A21', '#B5462F') + '<circle cx="84" cy="56" r="22" fill="#E8B04A" opacity=".9"/>';
    body += '<path d="M0 140V112h400v28z" fill="#160608"/><path d="M60 112h280l-14-14H74z" fill="#160608"/><path d="M40 100c40-6 70-14 90-26h140c20 12 50 20 90 26z" fill="#1E080B"/><path d="M110 74h180l-10-10H120z" fill="#1E080B"/><path d="M150 64c10-10 30-18 50-22 20 4 40 12 50 22z" fill="#1E080B"/>';
    for (let i = 0; i < 5; i++) body += `<rect x="${120 + i * 38}" y="80" width="8" height="12" rx="2" fill="#E8742F" opacity=".9"/>`;
  } else if (k === 'noir') {
    body = sky('#0B1418', '#16292E', '#264247');
    body += '<rect x="230" y="22" width="120" height="118" fill="#0A1013"/><rect x="40" y="56" width="90" height="84" fill="#0D1519"/>';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) body += `<rect x="${242 + c * 22}" y="${32 + r * 17}" width="10" height="9" fill="${r === 2 && c === 3 ? '#F2D27A' : '#1A262B'}"/>`;
    for (let i = 0; i < 26; i++) { const x = rnd() * 420, y = rnd() * 140; body += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}l-6 16" stroke="#9FB7BC" stroke-width=".8" opacity=".35"/>`; }
    body += '<rect y="104" width="400" height="14" fill="#9FB7BC" opacity=".08"/><rect y="118" width="400" height="22" fill="#9FB7BC" opacity=".05"/>';
  } else if (k === 'moon') {
    body = sky('#070D1C', '#14223D', '#2C3E5E') + '<circle cx="268" cy="54" r="30" fill="#EDEBDF"/><circle cx="258" cy="46" r="5" fill="#D9D6C6"/><circle cx="279" cy="63" r="3.5" fill="#D9D6C6"/>';
    for (let i = 0; i < 30; i++) body += `<circle cx="${(rnd() * 400).toFixed(1)}" cy="${(rnd() * 70).toFixed(1)}" r="${(rnd() * .9 + .3).toFixed(2)}" fill="#fff" opacity=".7"/>`;
    let x = -10; while (x < 410) { const h = 40 + rnd() * 50, w = 18 + rnd() * 14; body += `<path d="M${x.toFixed(1)} 140L${(x + w / 2).toFixed(1)} ${(140 - h).toFixed(1)}L${(x + w).toFixed(1)} 140z" fill="#050913"/>`; x += w * .7; }
  } else if (k === 'era') {
    body = sky('#3C3A2A', '#8C7444', '#D6B074') + '<circle cx="320" cy="92" r="20" fill="#F1D08F" opacity=".9"/>';
    body += '<path d="M0 30 400 48M0 38 400 56" stroke="#2A2618" stroke-width="1"/>';
    [[30, 60, 120], [170, 44, 90], [270, 76, 110]].forEach(([x, y, w]) => { body += `<rect x="${x}" y="${y}" width="${w}" height="${140 - y}" fill="#2A2618"/>`;
      for (let yy = y + 8; yy < 132; yy += 14) { body += `<rect x="${x + 4}" y="${yy + 8}" width="${w - 8}" height="2" fill="#4A4229"/>`; for (let xx = x + 8; xx < x + w - 10; xx += 16) if (rnd() > .55) body += `<rect x="${xx}" y="${yy}" width="7" height="6" fill="#E9B866" opacity=".75"/>`; } });
  } else {
    body = sky('#0E2420', '#2F5A50', '#9CC2B1');
    body += '<circle cx="290" cy="40" r="26" fill="none" stroke="#E7F1EA" stroke-width="1.2" opacity=".7"/><circle cx="290" cy="40" r="17" fill="none" stroke="#E7F1EA" stroke-width=".8" opacity=".5"/>';
    body += '<path d="M0 140V92l50-30 40 22 50-40 60 46 50-30 60 36 50-24 40 20v64z" fill="#1E3F38" opacity=".9"/><path d="M0 140v-30l60-18 50 16 70-28 60 30 60-20 100 22v28z" fill="#12302A"/><rect y="100" width="400" height="10" fill="#E7F1EA" opacity=".12"/>';
  }
  return `<div class="cover" aria-hidden="true"><svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" role="presentation">${body}</svg></div>`;
}

// ---------- 模板库 ----------
function sopBar(t) {
  const on = new Set(t.nodes.map(n => n.node));
  const lockedNodes = new Set((t.locked || []).map(l => DIM[l.dimension] && DIM[l.dimension].node));
  return `<div class="sopbar" role="img" aria-label="覆盖 ${on.size}/19 个岗位，${lockedNodes.size} 个含锁定项">${D.stages.map(s => `<div class="st" title="${esc(s.id + ' ' + s.name)}">${s.nodes.map(n => `<i class="${on.has(n) ? (lockedNodes.has(n) ? 'lk' : 'on') : ''}"></i>`).join('')}</div>`).join('')}</div>
  <div class="sopbar-l"><span>立项</span><span>覆盖 <b class="num">${on.size}</b>/19 岗位</span><span>发行</span></div>`;
}
function tplCard(t, isMine) {
  const eps = t.format && t.format.episodes;
  const len = t.format && t.format.episode_length_s;
  const cards = t.nodes.reduce((a, n) => a + Object.values(n.selections).reduce((x, v) => x + ids(v).length, 0), 0);
  return `<article class="tpl" data-tpl="${esc(t.id)}" aria-labelledby="tt-${esc(t.id)}">
    ${coverSvg(t)}
    <div class="tpl-b">
      <div class="tags">${regionTag(t.region)}${genreNames(t.genres).map(g => `<span class="tag">${esc(g)}</span>`).join('')}${(t.locked || []).length ? `<span class="tag lock">${ICON.lock}锁定 ${t.locked.length} 项</span>` : ''}</div>
      <h3 id="tt-${esc(t.id)}">${esc(t.name)}</h3>
      <p title="${esc(t.description || '')}">${esc(t.description || '')}</p>
      <div class="meta num">${eps == null && !len ? '<span>集数与时长<b style="margin-left:2px">沿用原剧</b></span>' : `<span><b>${esc(eps == null ? '沿用' : eps)}</b>集</span><span><b>${len ? esc(Array.isArray(len) ? len.join('-') + 's' : len) : '沿用'}</b>单集</span>`}<span><b>${cards}</b>张预选风格卡</span></div>
      ${sopBar(t)}
    </div>
    <div class="tpl-f">
      <button class="btn sm ghost" data-act="preview-tpl" data-id="${esc(t.id)}">查看配置</button>
      ${isMine ? `<button class="btn sm ghost danger" data-act="del-mine" data-id="${esc(t.id)}">删除</button>` : ''}
      <span class="spacer"></span>
      <button class="btn primary sm" data-act="apply-tpl" data-id="${esc(t.id)}">一键套用</button>
    </div>
  </article>`;
}
function pageTemplates(r) {
  const inRegion = D.templates.filter(t => ui.tplRegion === 'all' || t.region === ui.tplRegion);
  const genresInTpl = [...new Set(inRegion.flatMap(t => t.genres))];
  if (ui.tplGenre && !genresInTpl.includes(ui.tplGenre)) ui.tplGenre = null;
  const list = D.templates.filter(t => (ui.tplRegion === 'all' || t.region === ui.tplRegion) && (!ui.tplGenre || t.genres.includes(ui.tplGenre)));
  const body = `<div class="page">
    <div class="page-h"><div><h1>模板库</h1><p>${D.templates.length} 套整套流程模板，覆盖 SOP 全部 9 个阶段。套用后可在流程编辑器里逐节点替换风格，合规等锁定项保持不变。</p></div></div>
    <div class="toolbar" role="toolbar" aria-label="筛选模板">
      <div class="seg" role="group" aria-label="区域">${[['all', '全部区域'], ['cn', '国内区'], ['global', '海外区']].map(([k, l]) => `<button data-act="tpl-region" data-v="${k}" aria-pressed="${ui.tplRegion === k}">${l}</button>`).join('')}</div>
      <div class="chipset" role="group" aria-label="题材">${genresInTpl.map(g => `<button class="chip" data-act="tpl-genre" data-v="${g}" aria-pressed="${ui.tplGenre === g}">${esc(GENRE[g] ? GENRE[g].name : g)}<span class="n num">${inRegion.filter(t => t.genres.includes(g)).length}</span></button>`).join('')}</div>
      <div class="legend" style="width:100%"><span aria-hidden="true">SOP 覆盖条：</span><span aria-hidden="true"><i class="on"></i>已覆盖岗位</span><span aria-hidden="true"><i class="lk"></i>含锁定项</span><span aria-hidden="true"><i></i>未启用</span><span class="count num" role="status">显示 ${list.length} / ${D.templates.length} 套</span></div>
    </div>
    <div class="tpl-grid">
      ${list.map(t => tplCard(t)).join('')}
      ${!list.length ? `<div class="empty boxed" style="grid-column:1/-1">${ICON.film}<b>没有符合筛选条件的模板</b>换个题材或区域试试。<br><button class="btn" data-act="tpl-clear">清除筛选</button></div>` : ''}
      <div class="tpl blank"><h3>从空白开始</h3><p style="margin:0 0 16px;-webkit-line-clamp:3">不套模板，按 SOP 顺序在每个岗位自选风格卡，所有维度都可替换。</p>
        <div class="acts"><button class="btn" data-act="blank" data-v="cn">国内区空白项目</button><button class="btn" data-act="blank" data-v="global">海外区空白项目</button></div></div>
    </div>
    ${mine.length ? `<div class="section-t">我的模板 <span class="muted num">${mine.length}</span></div><div class="tpl-grid">${mine.map(t => tplCard(t, true)).join('')}</div>` : ''}
  </div>`;
  return shell(r, `<b>模板库</b>`, body, { actions: project ? `<button class="btn" data-act="goto" data-v="#/editor">继续编辑当前项目</button>` : '' });
}

// ---------- 流程编辑器 ----------
function rail() {
  const total = NODE_ORDER.filter(n => project.nodes[n].enabled);
  const done = total.filter(n => nodeStatus(n) === 'done').length;
  return `<nav class="rail" data-keep="rail" aria-label="SOP 流程">
    <div class="rail-h"><div class="row"><span>SOP 流程</span><span class="num"><b>${done}</b>/${total.length} 节点已配置</span></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total.length}" aria-valuenow="${done}" aria-label="节点配置进度"><i style="width:${total.length ? done / total.length * 100 : 0}%"></i></div></div>
    ${D.stages.map(s => `<div class="stage"><div class="stage-h"><span class="sid">${s.id}</span><b>${esc(s.name)}</b></div>
      ${s.nodes.map(n => {
        const st = nodeStatus(n), sk = SKILL[n];
        const names = sk.dimensions.flatMap(d => ids(project.nodes[n].selections[d]).map(cardName));
        const locked = sk.dimensions.some(d => dimRule(n, d).locked);
        return `<button class="node ${st}" data-act="node" data-v="${n}" ${ui.node === n ? 'aria-current="true"' : ''}>
          <div class="t"><span class="id">${n}</span>${esc(sk.title.replace(/（.*?）/, ''))}${locked ? `<span class="lk" title="含锁定项">${ICON.lock}<span class="sr-only">含锁定项</span></span>` : ''}</div>
          <div class="sel">${st === 'off' ? '本流程未启用' : names.length ? esc(names.join(' + ')) : '<span class="muted">待选择风格卡</span>'}${st === 'conflict' ? ' · 区域冲突' : ''}</div></button>`;
      }).join('')}
      ${s.gate ? `<div class="gate">${ICON.gate}${esc(s.gate)}</div>` : ''}</div>`).join('')}
  </nav>`;
}
function cardDetail(c, ctx) {
  const params = Object.entries(c.params || {});
  const pf = c.prompt_fragments || {};
  return `<h4>${esc(c.name)}</h4><span class="mono cid">${esc(c.id)}</span>
    <div class="tags" style="margin-top:10px">${c.regions.map(regionTag).join('')}<span class="tag outline">${esc(c.dimension_label)}</span>${(c.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <p class="sum">${esc(c.summary)}</p>
    <div class="lbl">适用题材</div><div class="tags">${genreNames(c.applicable_genres).map(g => `<span class="tag ${ctx && GENRE[project.genre] && GENRE[project.genre].name === g ? 'accent' : ''}">${esc(g)}</span>`).join('')}</div>
    <div class="lbl">参数</div><div class="kv">${params.map(([k, v]) => `<div>${esc(k)}</div><div>${esc(typeof v === 'object' ? JSON.stringify(v) : v)}</div>`).join('')}</div>
    <div class="lbl">提示词片段</div><div class="prompt">${pf.zh ? `<div><span>中文</span><code>${esc(pf.zh)}</code></div>` : ''}${pf.en ? `<div class="en"><span>EN</span><code>${esc(pf.en)}</code></div>` : ''}${c.negative_prompt ? `<div class="neg"><span>负面</span><code>${esc(c.negative_prompt)}</code></div>` : ''}</div>
    <div class="lbl">示例</div><div class="ex"><div class="pos"><b>正例</b>${esc(c.positive_example)}</div><div class="neg"><b>反例</b>${esc(c.negative_example)}</div></div>
    ${(c.inspired_by || []).length ? `<div class="lbl">灵感来源（流派/作品手法，不代表真人）</div><div style="font-size:13px">${c.inspired_by.map(i => i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.label || i.ref)}</a>` : esc(i.label || i.ref)).join('；')}</div>` : ''}`;
}
function dimBlock(n, d) {
  const dim = DIM[d], st = project.nodes[n], rule = dimRule(n, d), mode = dim.selection_mode;
  const sel = st.selections[d], selIds = ids(sel);
  const canEdit = !rule.locked && !rule.fixed;
  const key = n + '|' + d;
  const f = ui.filt[key] || (ui.filt[key] = { q: '', scope: 'avail' });
  const pool = dim.card_ids.map(id => CARD[id]).filter(Boolean);
  const avail = c => c.regions.includes(project.region);
  const fit = c => c.applicable_genres.includes(project.genre);
  let list = pool.filter(c => {
    if (f.scope === 'avail' && !avail(c)) return false;
    if (f.scope === 'fit' && !(avail(c) && fit(c))) return false;
    if (f.scope === 'rec' && !rule.alts.includes(c.id)) return false;
    if (f.q && !(c.name + c.summary + c.id).toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
  const focusId = ui.focus[key] && list.some(c => c.id === ui.focus[key]) ? ui.focus[key] : (list.find(c => selIds.includes(c.id)) || list[0] || {}).id;
  const fc = CARD[focusId];
  const modeLabel = mode === 'multi' ? '可多选叠加（按场景组合）' : mode === 'role_map' ? '按角色分配' : '单选';
  const picks = mode === 'role_map'
    ? Object.entries(sel && typeof sel === 'object' ? sel : {}).map(([role, id]) => pickHtml(n, d, id, rule, role))
    : selIds.map((id, i) => pickHtml(n, d, id, rule, null, mode === 'multi' && selIds.length > 1 ? i + 1 : 0));
  let actions = '';
  if (fc) {
    const isSel = selIds.includes(fc.id), na = !avail(fc);
    if (rule.locked) actions = `<span class="tag lock">${ICON.lock}锁定维度，不能替换</span>`;
    else if (rule.fixed) actions = `<span class="muted" style="font-size:12px">模板未开放此维度替换</span><button class="btn sm" data-act="unlock" data-n="${n}" data-d="${d}">解除模板约束</button>`;
    else if (na) actions = `<span class="tag warn">${REGION_LABEL[project.region]}不可用（仅限${fc.regions.map(x => REGION_LABEL[x]).join('、')}）</span>`;
    else if (mode === 'role_map') actions = (dim.roles || []).map(ro => `<button class="btn sm ${sel && sel[ro.id] === fc.id ? '' : ''}" data-act="role" data-n="${n}" data-d="${d}" data-r="${ro.id}" data-id="${fc.id}" ${sel && sel[ro.id] === fc.id ? 'disabled' : ''}>设为${esc(ro.label)}</button>`).join('');
    else if (mode === 'multi') actions = `<button class="btn primary sm" data-act="stack" data-n="${n}" data-d="${d}" data-id="${fc.id}" ${isSel ? 'disabled' : ''}>${isSel ? '已在组合中' : '叠加到组合'}</button><button class="btn sm" data-act="replace" data-n="${n}" data-d="${d}" data-id="${fc.id}" ${isSel && selIds.length === 1 ? 'disabled' : ''}>仅用此卡替换全部</button>`;
    else actions = `<button class="btn primary sm" data-act="replace" data-n="${n}" data-d="${d}" data-id="${fc.id}" ${isSel ? 'disabled' : ''}>${isSel ? '当前已选用' : '替换为此卡'}</button>`;
  }
  const naCount = pool.filter(c => !avail(c)).length;
  return `<section class="dim" id="dim-${d}">
    <div class="dim-h"><h3 title="${esc(d)}">${esc(dim.label)}</h3><span class="mode">${modeLabel}</span><span class="spacer"></span>
      ${rule.locked ? `<span class="tag lock">${ICON.lock}已锁定</span>` : rule.fixed ? `<span class="tag">模板固定</span>` : `<span class="tag ok">可替换</span>`}</div>
    ${rule.locked ? `<div class="lockbar">${ICON.lock}<div><b>锁定原因：</b>${esc(rule.locked)}</div></div>` : ''}
    ${rule.alts.length ? `<div class="infobar">模板推荐替换：${rule.alts.map(id => `<button class="btn sm link" data-act="focus" data-k="${esc(key)}" data-id="${id}">${esc(cardName(id))}</button>`).join('')}</div>` : ''}
    <div class="current"><span class="lbl-in">当前选用</span>${picks.length ? picks.join('') : `<span class="empty-pick">尚未选择，在下方浏览并${mode === 'role_map' ? '为角色分配声线' : '选用一张风格卡'}</span>`}</div>
    <div class="browser">
      <div class="blist">
        <div class="bfilter">
          <div class="seg sm" role="group" aria-label="范围">${[['avail', '区域可用'], ['fit', '适合题材'], ['rec', '模板推荐'], ['all', '全部']].map(([k, l]) => `<button data-act="scope" data-k="${esc(key)}" data-v="${k}" aria-pressed="${f.scope === k}">${l}</button>`).join('')}</div>
          <input class="input" type="search" placeholder="搜索风格卡" value="${esc(f.q)}" data-act="q" data-k="${esc(key)}" id="q-${esc(key)}" aria-label="搜索${esc(dim.label)}风格卡">
        </div>
        <div class="citems" data-keep="ci-${esc(key)}" role="listbox" aria-label="${esc(dim.label)}风格卡">
          ${list.map(c => {
            const isSel = selIds.includes(c.id), rec = rule.alts.includes(c.id);
            return `<button class="citem ${avail(c) ? '' : 'na'}" role="option" aria-selected="${c.id === focusId}" data-act="focus" data-k="${esc(key)}" data-id="${c.id}">
              <div class="n">${esc(c.name)}<span class="st">${isSel ? '<span class="tag accent">已选</span>' : rec ? '<span class="tag">推荐</span>' : !avail(c) ? `<span class="tag warn">${c.regions.includes('cn') ? '仅国内' : '仅海外'}</span>` : fit(c) ? '' : '<span class="tag outline">题材外</span>'}</span></div>
              <div class="s">${esc(c.summary)}</div></button>`;
          }).join('')}
          ${!list.length ? `<div class="empty" role="status"><b>${f.scope === 'rec' ? '模板没有为此维度推荐替换卡' : '没有匹配的风格卡'}</b>${naCount && f.scope !== 'all' ? `另有 ${naCount} 张卡仅限其他区域。` : ''}<br><button class="btn sm" data-act="scope" data-k="${esc(key)}" data-v="all">查看全部</button></div>` : ''}
        </div>
      </div>
      <div class="cdetail">${fc ? cardDetail(fc, true) + `<div class="cactions">${actions}</div>` : '<div class="empty"><b>选择左侧风格卡查看详情</b></div>'}</div>
    </div>
  </section>`;
}
function pickHtml(n, d, id, rule, role, ord) {
  const c = CARD[id], bad = !c || !c.regions.includes(project.region);
  const canRm = !rule.locked && !rule.fixed;
  return `<span class="pick ${rule.locked ? 'locked' : ''} ${bad ? 'bad' : ''} ${canRm ? '' : 'norm'}" title="${bad ? (c ? '当前区域不可用' : '风格卡缺失') : ''}">
    ${role ? `<span class="role">${esc(roleLabel(d, role))}</span>` : ''}${ord ? `<span class="ord">${ord}</span>` : ''}
    ${rule.locked ? ICON.lock : ''}<span data-act="focus" data-k="${esc(n + '|' + d)}" data-id="${esc(id)}" style="cursor:pointer">${esc(cardName(id))}</span>
    ${canRm ? `<button aria-label="移除${esc(cardName(id))}" data-act="rm" data-n="${n}" data-d="${d}" data-id="${esc(id)}" data-r="${esc(role || '')}">×</button>` : ''}</span>`;
}
function pageEditor(r) {
  if (!project) return shell(r, '<b>流程编辑器</b>', `<div class="page"><div class="empty boxed" style="padding:72px 16px">${ICON.film}<b>还没有项目</b>先在模板库套用一套模板，或从空白开始。<br><button class="btn primary" data-act="goto" data-v="#/templates">去模板库</button></div></div>`);
  if (r.arg && SKILL[r.arg]) ui.node = r.arg;
  const n = ui.node, sk = SKILL[n], st = project.nodes[n];
  const anyLocked = sk.dimensions.some(d => dimRule(n, d).locked);
  const panel = `<div class="panel" data-keep="panel">
    <div class="panel-h"><div class="eyebrow"><span class="mono">${n}</span> · ${esc(sk.stage)} ${esc(sk.stage_name)}${anyLocked ? ` · <span style="color:var(--c-lock)">含合规锁定项</span>` : ''}</div>
      <div class="title-row"><h2>${esc(sk.title)}</h2><span class="spacer"></span><div class="acts">
      <a class="btn sm ghost" href="#/skills/${n}">查看岗位 Skill</a>
      ${st.enabled ? (anyLocked ? '' : `<button class="btn sm" data-act="toggle-node" data-v="${n}">停用此节点</button>`) : ''}</div></div>
      <div class="steps" aria-label="子步骤">${sk.subnodes.map((s, i) => `${i ? ICON.chev : ''}<span>${esc(s)}</span>`).join('')}</div>
      <p class="desc" title="${esc(sk.description)}">${esc(sk.description)}</p></div>
    <div class="panel-b">${st.enabled ? sk.dimensions.map(d => dimBlock(n, d)).join('') :
      `<div class="offnode">${ICON.film}<b style="display:block">${esc(sk.title)}未在当前流程中启用</b><p style="font-size:13px">${project.base ? `模板「${esc(project.base.name)}」不包含此节点。` : ''}${n === 'N8.2' ? '本地化节点用于出海发行包，国内区项目通常不需要。' : ''}</p><button class="btn primary" data-act="toggle-node" data-v="${n}">启用此节点</button></div>`}</div>
  </div>`;
  const iss = issues();
  const crumbs = `<a href="#/templates">${esc(project.base ? project.base.name : '空白项目')}</a><span class="sep">/</span><b>${esc(project.name)}</b>
    <span class="tags">${regionTag(project.region)}<span class="tag">${esc(GENRE[project.genre] ? GENRE[project.genre].name : project.genre)}</span><span class="tag num">${esc(project.episodes)} 集</span>
    ${iss.length ? `<span class="tag warn">${iss.length} 项待处理</span>` : '<span class="tag ok">配置完整</span>'}</span>`;
  return shell(r, crumbs, `<div class="editor">${rail()}${panel}</div>`, { actions: `<button class="btn" data-act="goto" data-v="#/settings">项目设置</button><button class="btn primary" data-act="export">导出配置</button>` });
}

// ---------- 项目设置 ----------
function pageSettings(r) {
  if (!project) project = blankProject('cn'), persist();
  const p = project;
  const g = GENRE[p.genre];
  const opt = reg => D.genres.filter(x => x.region === reg).map(x => `<option value="${x.id}" ${x.id === p.genre ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  const body = `<div class="page"><div class="page-h"><div><h1>项目设置</h1><p>区域决定可用的模型、风格卡和合规档案，两区数据完全隔离。</p></div></div>
    <div class="settings-grid"><form class="formcard" id="settings-form" novalidate>
      <div class="sec"><h2 class="sec-t">基本信息</h2>
        <div class="field full"><label for="f-name">项目名</label><input class="input" id="f-name" name="name" value="${esc(p.name)}" maxlength="40" required><span class="hint" id="err-name"></span></div>
        <div class="field"><span class="label" id="lbl-region">区域</span><div class="seg" role="radiogroup" aria-labelledby="lbl-region">${['cn', 'global'].map(k => `<button type="button" role="radio" data-act="set-region" data-v="${k}" aria-checked="${p.region === k}">${REGION_LABEL[k]}</button>`).join('')}</div>
          <span class="hint">${p.base && p.base.region !== p.region ? `<span style="color:var(--c-warn)">当前模板属于${REGION_LABEL[p.base.region]}，切换后部分卡会被标为冲突。</span>` : '切换区域后，不可用的风格卡会在流程编辑器中标出。'}</span></div>
        <div class="field"><label for="f-genre">题材</label><select class="select" id="f-genre" name="genre"><optgroup label="国内题材">${opt('cn')}</optgroup><optgroup label="海外题材">${opt('global')}</optgroup></select><span class="hint">用于「适合题材」筛选。</span></div>
        <div class="field"><label for="f-eps">集数</label><input class="input num" id="f-eps" name="episodes" type="number" min="1" max="300" step="1" value="${esc(p.episodes)}" required><span class="hint" id="err-eps">1-300 集</span></div>
        <div class="field"><label for="f-aspect">画幅</label><select class="select" id="f-aspect" name="aspect">${['9:16', '16:9', '3:4'].map(a => `<option ${a === p.aspect ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
        ${g ? `<div class="genre-note"><div class="gh"><b>${esc(g.name)}</b>${g.audience ? `<span class="muted">${esc(g.audience)}</span>` : ''}</div><dl><dt>核心爽点</dt><dd>${esc(g.core_payoff)}</dd><dt>前 3 秒钩子</dt><dd>${esc(g.rhythm.first_3s_hook)}</dd><dt>付费卡点</dt><dd>${esc(g.rhythm.paywall)}</dd></dl></div>` : ''}
      </div>
      <div class="foot"><button type="button" class="btn" data-act="goto" data-v="#/editor">返回编辑器</button><button type="submit" class="btn primary">保存设置</button></div>
    </form>
    <aside class="note-card"><h4>区域会影响什么</h4><ul><li><b>国内区</b>：只接入已备案模型，人民币计费，合规档案按《微短剧发展管理办法》分级。</li><li><b>海外区</b>：接入海外模型与 Stripe，导出默认包含本地化节点。</li><li>切换区域不会删除已选风格卡，不可用的卡会在流程编辑器中标为冲突。</li></ul></aside></div></div>`;
  return shell(r, `<a href="#/editor">${esc(p.name)}</a><span class="sep">/</span><b>项目设置</b>`, body);
}

// ---------- 岗位 Skill ----------
function pageSkills(r) {
  if (r.arg && SKILL[r.arg]) {
    const s = SKILL[r.arg];
    const cards = s.dimensions.flatMap(d => DIM[d].card_ids);
    const body = `<div class="page"><div class="two"><article class="doc">${s.html}</article>
      <aside class="aside"><h4>${esc(s.node)} ${esc(s.title)}</h4><div class="muted" style="font-size:12px;margin-bottom:10px">${esc(s.stage)} ${esc(s.stage_name)} · <span class="mono">${esc(s.skill)}</span></div>
        <a class="btn primary sm" href="#/editor/${s.node}">在流程中编辑此节点</a>
        <div class="lbl">风格卡（${cards.length}）</div><ul>${cards.map(id => `<li><a href="#/card/${id}">${esc(cardName(id))}</a><span style="margin-left:auto">${CARD[id].regions.map(x => `<span class="tag region"><i>${x === 'cn' ? 'CN' : 'GL'}</i></span>`).join(' ')}</span></li>`).join('')}</ul>
        ${(s.masters || []).length ? `<div class="lbl">代表手法（${s.masters.length}）</div><div class="masters">${s.masters.map(m => `<details class="mst"><summary><b>${esc(m.neutral_name)}</b><span class="tag">${m.region_scope === 'cn' ? '中国' : '国际'}</span></summary>
          <div class="mst-b"><ol>${m.techniques.map(t => `<li>${esc(t)}</li>`).join('')}</ol><div class="mono" style="font-size:11px">${esc(m.prompt_fragment)}</div>
          <div class="muted" style="font-size:12px;margin-top:6px">方法来源：${esc(m.method_name)}（${esc(m.name)}，${esc(m.representative_works.join('；'))}）</div>
          <div style="font-size:12px">${m.sources.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('<br>')}</div>
          <div class="muted" style="font-size:11px;margin-top:4px">${esc(m.disclaimer)}</div></div></details>`).join('')}</div>
          <div class="muted" style="font-size:11px">默认只显示中性手法名；展开后才显示参考人物与来源。</div>` : ''}</aside></div></div>`;
    return shell(r, `<a href="#/skills">岗位 Skill</a><span class="sep">/</span><b>${esc(s.title)}</b>`, body);
  }
  const body = `<div class="page"><div class="page-h"><div><h1>岗位 Skill</h1><p>短剧从 0 到 1 的 19 个岗位，每个岗位是一个专家 Skill，含工作方法、检查清单、提示词模板和输出格式。</p></div></div>
    ${D.stages.map(st => `<div class="section-t"><span class="mono">${st.id}</span> ${esc(st.name)}${st.gate ? ` <span class="tag lock">${ICON.gate}${esc(st.gate)}</span>` : ''}</div>
      <div class="skills-grid">${st.nodes.map(n => { const s = SKILL[n]; const c = s.dimensions.reduce((a, d) => a + DIM[d].card_ids.length, 0);
        return `<a class="sk" href="#/skills/${n}"><div class="t"><span class="id">${n}</span>${esc(s.title)}<span class="c num">${c} 张风格卡</span></div><p>${esc(s.description)}</p></a>`; }).join('')}</div>`).join('')}</div>`;
  return shell(r, `<b>岗位 Skill</b>`, body);
}
function pageCard(r) {
  const c = CARD[r.arg];
  if (!c) return shell(r, '<b>风格卡</b>', `<div class="page"><div class="empty boxed"><b>找不到风格卡 ${esc(r.arg)}</b><a href="#/skills">返回岗位列表</a></div></div>`);
  const s = SKILL[c.node];
  return shell(r, `<a href="#/skills">岗位 Skill</a><span class="sep">/</span><a href="#/skills/${c.node}">${esc(s.title)}</a><span class="sep">/</span><b>${esc(c.name)}</b>`,
    `<div class="page"><div class="doc" style="max-width:820px">${cardDetail(c, false)}</div></div>`);
}
function pageOverview(r) { return shell(r, '<b>SOP 总览</b>', `<div class="page"><article class="doc">${D.overview_html}</article></div>`); }

// ---------- 我的模板 ----------
function pageMine(r) {
  const body = `<div class="page"><div class="page-h"><div><h1>我的模板</h1><p>在导出弹窗中「另存为我的模板」，保存在本浏览器（localStorage）。</p></div></div>
    ${mine.length ? `<div class="tpl-grid">${mine.map(t => tplCard(t, true)).join('')}</div>` :
    `<div class="empty boxed" style="padding:72px 16px">${ICON.film}<b>还没有保存的模板</b>套用一套模板并按需替换风格后，在「导出配置」里另存为我的模板。<br><button class="btn primary" data-act="goto" data-v="#/templates">去模板库</button></div>`}</div>`;
  return shell(r, '<b>我的模板</b>', body);
}

// ---------- 弹窗 ----------
function modalHtml() {
  const m = ui.modal;
  if (m.type === 'export') {
    const tpl = exportTemplate(), env = exportEnvelopes(), iss = issues();
    const nCards = tpl.nodes.reduce((a, n) => a + Object.values(n.selections).reduce((x, v) => x + ids(v).length, 0), 0);
    const json = ui.exportTab === 'template' ? tpl : ui.exportTab === 'envelopes' ? env : { project: { id: project.id, name: project.name, region: project.region, genre: project.genre, episodes: project.episodes, aspect: project.aspect }, template: tpl, handoff_envelopes: env };
    return `<div class="scrim" data-act="close-modal-bg"><div class="modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="mh">
      <div class="modal-h"><h2 id="mh">导出整条流程配置</h2>${regionTag(project.region)}<button class="x" data-act="close-modal" aria-label="关闭">×</button></div>
      <div class="modal-b">
        <div class="verdict ${iss.length ? 'bad' : 'ok'}" role="status">${iss.length ? ICON.warn : ICON.check}<div><b>${iss.length ? `还有 ${iss.length} 项待处理` : '配置完整，可以导出'}</b><div style="font-size:12px">${iss.length ? '可以先导出草稿，问题会随配置一起带出。' : '结构已通过 Template / HandoffEnvelope 校验。'}</div></div>
          <div class="stats num"><span><b>${tpl.nodes.length}</b>节点</span><span><b>${nCards}</b>风格卡</span><span><b>${tpl.locked.length}</b>锁定</span></div></div>
        ${iss.slice(0, 4).map(i => `<div class="issue">${esc(i)}</div>`).join('')}${iss.length > 4 ? `<div class="muted" style="font-size:12px;margin-bottom:8px">另有 ${iss.length - 4} 项…</div>` : ''}
        <div class="tabs" role="tablist">${[['template', '模板结构 Template'], ['envelopes', `交接信封 HandoffEnvelope（${env.length}）`], ['bundle', '完整包']].map(([k, l]) => `<button role="tab" data-act="etab" data-v="${k}" aria-selected="${ui.exportTab === k}">${l}</button>`).join('')}</div>
        <pre class="code" id="export-json">${esc(JSON.stringify(json, null, 2))}</pre>
        <p class="schema-note">结构符合 <span class="mono">schema.json#/$defs/${ui.exportTab === 'envelopes' ? 'HandoffEnvelope' : 'Template'}</span>，可直接交给编排引擎执行。</p>
      </div>
      <div class="modal-f"><div class="saverow"><label for="save-name">模板名称</label><input class="input" id="save-name" value="${esc(m.saveName || project.name)}" maxlength="40"><button class="btn" data-act="save-mine">另存为我的模板</button></div>
        <span class="spacer"></span><button class="btn" data-act="copy-json">复制</button><button class="btn primary" data-act="dl-json">下载 JSON</button></div>
    </div></div>`;
  }
  if (m.type === 'preview') {
    const t = findTpl(m.id);
    return `<div class="scrim" data-act="close-modal-bg"><div class="modal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="mh">
      <div class="modal-h"><h2 id="mh">${esc(t.name)}</h2>${regionTag(t.region)}<button class="x" data-act="close-modal" aria-label="关闭">×</button></div>
      <div class="modal-b"><p style="margin-top:0;color:var(--c-text-2);font-size:13px">${esc(t.description || '')}</p>
        ${(t.locked || []).map(l => `<div class="lockbar" style="border-radius:6px;margin-bottom:6px;border:1px solid var(--c-lock-line)">${ICON.lock}<div><b>${esc(DIM[l.dimension].label)}</b> 锁定：${esc(l.reason)}</div></div>`).join('')}
        <table class="ptable"><thead><tr><th>岗位节点</th><th>维度</th><th>预选风格卡</th><th>可替换</th></tr></thead><tbody>
        ${t.nodes.flatMap((n, i) => { const sg = SKILL[n.node].stage, prev = i ? SKILL[t.nodes[i - 1].node].stage : null;
          return (sg !== prev ? [`<tr class="stg"><td colspan="4"><span class="mono">${esc(sg)}</span>${esc(SKILL[n.node].stage_name)}</td></tr>`] : []).concat(Object.entries(n.selections).map(([d, v]) => `<tr><td><span class="mono">${n.node}</span>${esc(SKILL[n.node].title.replace(/（.*?）/, ''))}</td><td>${esc(DIM[d].label)}</td><td>${Array.isArray(v) ? v.map(cardName).map(esc).join(' + ') : typeof v === 'object' ? Object.entries(v).map(([r, id]) => `${esc(roleLabel(d, r))}：${esc(cardName(id))}`).join('；') : esc(cardName(v))}</td><td>${(t.locked || []).some(l => l.dimension === d) ? '<span class="tag lock">锁定</span>' : (n.replaceable || []).includes(d) ? '<span class="tag ok">可替换</span>' : '<span class="tag">固定</span>'}</td></tr>`)); }).join('')}
        </tbody></table></div>
      <div class="modal-f"><span class="spacer"></span><button class="btn" data-act="close-modal">关闭</button><button class="btn primary" data-act="apply-tpl" data-id="${esc(t.id)}">一键套用</button></div></div></div>`;
  }
  if (m.type === 'confirm') {
    return `<div class="scrim" data-act="close-modal-bg"><div class="modal sm" tabindex="-1" role="alertdialog" aria-modal="true" aria-labelledby="mh">
      <div class="modal-h"><h2 id="mh">${esc(m.title)}</h2><button class="x" data-act="close-modal" aria-label="关闭">×</button></div>
      <div class="modal-b" style="font-size:13px;color:var(--c-text-2)">${esc(m.text)}</div>
      <div class="modal-f"><span class="spacer"></span><button class="btn" data-act="close-modal">取消</button><button class="btn primary" data-act="confirm-ok">${esc(m.ok)}</button></div></div></div>`;
  }
  return '';
}
const findTpl = id => D.templates.find(t => t.id === id) || mine.find(t => t.id === id);

// ---------- 渲染 ----------
function render() {
  const keep = {};
  document.querySelectorAll('[data-keep]').forEach(el => keep[el.dataset.keep] = [el.scrollTop, el.scrollLeft]);
  const act = document.activeElement, actId = act && act.id, selStart = act && act.selectionStart;
  const r = route();
  const pages = Object.assign({ templates: pageTemplates, editor: pageEditor, settings: pageSettings, skills: pageSkills, card: pageCard, mine: pageMine, overview: pageOverview }, EXT ? EXT.pages : {});
  const authed = !EXT || EXT.session();
  if (!authed && r.page !== 'login') { history.replaceState(null, '', '#/login'); r.page = 'login'; }
  if (authed && r.page === 'login') { history.replaceState(null, '', '#/pipeline'); r.page = 'pipeline'; }
  $app.innerHTML = (pages[r.page] || pages.pipeline || pageTemplates)(r);
  document.querySelectorAll('[data-keep]').forEach(el => { const k = keep[el.dataset.keep]; if (k) { el.scrollTop = k[0]; el.scrollLeft = k[1]; } });
  if (actId) { const el = document.getElementById(actId); if (el) { el.focus(); try { if (selStart != null) el.setSelectionRange(selStart, selStart); } catch (e) {} } }
  document.title = '剧链 DramaFlow · AI 短剧工作台（体验版）';
  // 弹窗：焦点移入；关闭后回到触发按钮
  const modal = document.querySelector('.modal');
  if (modal && !modal.contains(document.activeElement)) modal.focus({ preventScroll: true });
  if (!modal && ui.lastOpener) { const o = document.querySelector(ui.lastOpener); ui.lastOpener = null; if (o) o.focus({ preventScroll: true }); }
  // 流程轨道：当前节点保持可见
  if (ui.scrollRail) { ui.scrollRail = false; const cur = document.querySelector('.rail .node[aria-current="true"]'); if (cur) { const rl = cur.closest('.rail'), a = cur.getBoundingClientRect(), b = rl.getBoundingClientRect();
    if (rl.scrollWidth > rl.clientWidth + 4) rl.scrollLeft += a.left - b.left - 12; else if (a.top < b.top + 8 || a.bottom > b.bottom - 8) rl.scrollTop += a.top - b.top - b.height / 3; } }
}
function applyTemplate(id) {
  const t = findTpl(id);
  const doIt = () => { project = projectFromTemplate(t); ui.node = 'N1.1'; ui.focus = {}; ui.filt = {}; ui.modal = null; persist(); toast(`已套用「${t.name}」`); go('#/editor'); render(); };
  if (project && project.dirty) { ui.modal = { type: 'confirm', title: '覆盖当前项目？', text: `当前项目「${project.name}」有未导出的修改，套用「${t.name}」会覆盖它们。`, ok: '覆盖并套用', onOk: doIt }; render(); }
  else doIt();
}

// ---------- 事件 ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, v = el.dataset.v;
  if (EXT && EXT.onClick(a, el, e)) return;
  if (a === 'close-modal-bg') { if (e.target === el) { ui.modal = null; render(); } return; }
  switch (a) {
    case 'nav-toggle': ui.navOpen = !ui.navOpen; render(); break;
    case 'nav-close': ui.navOpen = false; render(); break;
    case 'goto': go(v); break;
    case 'tpl-region': ui.tplRegion = v; render(); break;
    case 'tpl-genre': ui.tplGenre = ui.tplGenre === v ? null : v; render(); break;
    case 'tpl-clear': ui.tplRegion = 'all'; ui.tplGenre = null; render(); break;
    case 'apply-tpl': applyTemplate(el.dataset.id); break;
    case 'preview-tpl': ui.lastOpener = `[data-act='preview-tpl'][data-id='${el.dataset.id}']`; ui.modal = { type: 'preview', id: el.dataset.id }; render(); break;
    case 'del-mine': { const t = findTpl(el.dataset.id); ui.modal = { type: 'confirm', title: '删除模板？', text: `「${t.name}」将从本浏览器移除，无法恢复。`, ok: '删除', onOk: () => { mine = mine.filter(x => x.id !== t.id); save(LS_MINE, mine); ui.modal = null; toast('已删除'); render(); } }; render(); break; }
    case 'blank': { const doIt = () => { project = blankProject(v); ui.node = 'N1.1'; ui.modal = null; persist(); toast(`已创建${REGION_LABEL[v]}空白项目`); go('#/settings'); render(); };
      if (project && project.dirty) { ui.modal = { type: 'confirm', title: '覆盖当前项目？', text: `当前项目「${project.name}」有未导出的修改。`, ok: '覆盖并新建', onOk: doIt }; render(); } else doIt(); break; }
    case 'confirm-ok': ui.modal.onOk(); break;
    case 'close-modal': ui.modal = null; render(); break;
    case 'node': ui.node = v; ui.scrollRail = true; history.replaceState(null, '', '#/editor/' + v); render(); { const p = document.querySelector('.panel'); if (p) p.scrollTop = 0; } break;
    case 'focus': ui.focus[el.dataset.k] = el.dataset.id; render(); break;
    case 'scope': ui.filt[el.dataset.k].scope = v; render(); break;
    case 'replace': replaceCard(el.dataset.n, el.dataset.d, el.dataset.id); break;
    case 'stack': stackCard(el.dataset.n, el.dataset.d, el.dataset.id); break;
    case 'rm': e.stopPropagation(); removeCard(el.dataset.n, el.dataset.d, el.dataset.id, el.dataset.r); break;
    case 'role': assignRole(el.dataset.n, el.dataset.d, el.dataset.r, el.dataset.id); break;
    case 'unlock': project.nodes[el.dataset.n].unlocked[el.dataset.d] = true; touch(); toast('已解除模板约束，此维度可自由替换'); render(); break;
    case 'toggle-node': project.nodes[v].enabled = !project.nodes[v].enabled; touch(); render(); break;
    case 'set-region': if (project.region !== v) { project.region = v; if (GENRE[project.genre].region !== v && !(project.base && project.base.genres.includes(project.genre))) project.genre = D.genres.find(g => g.region === v).id; if (v === 'global' && !project.base) project.nodes['N8.2'].enabled = true; touch(); render(); } break;
    case 'export': ui.lastOpener = "[data-act='export']"; ui.modal = { type: 'export' }; render(); break;
    case 'etab': ui.exportTab = v; render(); break;
    case 'copy-json': { const t = document.getElementById('export-json').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('已复制到剪贴板'), () => toast('复制失败，请手动选择文本')); break; }
    case 'dl-json': { const name = { template: 'template', envelopes: 'handoff-envelopes', bundle: 'bundle' }[ui.exportTab]; download(`${project.id}-${name}.json`, JSON.parse(document.getElementById('export-json').textContent)); toast('已下载 JSON'); break; }
    case 'save-mine': {
      const nm = (document.getElementById('save-name').value || '').trim();
      if (!nm) { toast('请填写模板名称'); return; }
      const t = exportTemplate(nm); t.id = 'tpl-my-' + Date.now().toString(36); t.x_saved_at = new Date().toISOString();
      mine.unshift(t); save(LS_MINE, mine); project.dirty = false; persist(); ui.modal.saveName = nm; toast(`已保存到「我的模板」：${nm}`); render(); break;
    }
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (EXT && EXT.onInput(e)) return;
  if (el.dataset.act === 'q') { ui.filt[el.dataset.k].q = el.value; render(); }
  if (el.id === 'save-name' && ui.modal) ui.modal.saveName = el.value;
});
document.addEventListener('submit', e => {
  if (EXT && EXT.onSubmit(e)) return;
  if (e.target.id !== 'settings-form') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const name = String(f.get('name') || '').trim(), eps = Number(f.get('episodes'));
  let ok = true;
  const en = document.getElementById('err-name'), ee = document.getElementById('err-eps');
  en.textContent = ''; ee.textContent = '1-300 集'; ee.style.color = ''; en.style.color = '';
  if (!name) { en.textContent = '请填写项目名'; en.style.color = 'var(--c-danger)'; ok = false; }
  if (!Number.isInteger(eps) || eps < 1 || eps > 300) { ee.textContent = '集数需为 1-300 的整数'; ee.style.color = 'var(--c-danger)'; ok = false; }
  if (!ok) return;
  Object.assign(project, { name, episodes: eps, genre: f.get('genre'), aspect: f.get('aspect') }); touch(); toast('项目设置已保存'); render();
});
document.addEventListener('change', e => { if (EXT && EXT.onChange(e)) return; if (e.target.id === 'f-genre') { project.genre = e.target.value; touch(); render(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.modal) { ui.modal = null; render(); } });
window.addEventListener('hashchange', () => { ui.navOpen = false; if (route().page === 'editor') ui.scrollRail = true; render(); });

// 体验版扩展：登录 / 新建项目 / 生产流水线 / 系统全景（pipeline.js）
EXT = window.DF_PIPELINE ? window.DF_PIPELINE({ D, CARD, DIM, SKILL, GENRE, ICON, REGION_LABEL, esc, shell, render, go, toast, regionTag, coverSvg, blankProject, projectFromTemplate, exportTemplate, exportEnvelopes,
  persist, get project() { return project; }, setProject(p) { project = p; ui.node = 'N1.1'; ui.focus = {}; ui.filt = {}; } }) : null;
// 测试钩子（供自动化校验使用）
window.__proto = { D, get project() { return project; }, exportTemplate, exportEnvelopes, issues, applyTemplate: id => { project = projectFromTemplate(findTpl(id)); persist(); render(); } };
render();
})();
