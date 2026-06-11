import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import express from 'express';
import chokidar from 'chokidar';
import open from 'open';
import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { mdToHtml } from './md-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPECS_DIR = '.modscape/specs';

// ── Data loaders ─────────────────────────────────────────────────────────────

export function scanSpecsDir() {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  if (!fs.existsSync(baseDir)) return null;
  const result = [];
  for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const slugDir = path.join(baseDir, entry.name);
    const seen = new Set();
    const tables = [];
    for (const file of fs.readdirSync(slugDir)) {
      if (file.startsWith('_')) continue;
      if (file.endsWith('.html') || file.endsWith('.md')) {
        const id = file.replace(/\.(html|md)$/, '');
        if (!seen.has(id)) { seen.add(id); tables.push(id); }
      }
    }
    if (tables.length > 0) result.push({ modelSlug: entry.name, tables });
  }
  return result;
}

function loadYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try { return yaml.load(fs.readFileSync(filePath, 'utf8')) || null; } catch { return null; }
}

function loadContext() {
  return loadYaml(path.resolve(process.cwd(), `${SPECS_DIR}/_context.yaml`));
}

function loadGlossary() {
  return loadYaml(path.resolve(process.cwd(), `${SPECS_DIR}/_glossary.yaml`));
}

function loadQuestions() {
  return loadYaml(path.resolve(process.cwd(), `${SPECS_DIR}/_questions.yaml`));
}

// ── Browser UI ────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function badge(text, cls) {
  return `<span class="badge ${cls}">${esc(text)}</span>`;
}

function renderDecisionCards(decisions) {
  if (!decisions.length) return '<p class="list-empty">No decisions yet</p>';
  return decisions.map(d => {
    const meta = [
      d.date ? badge(d.date, 'badge-date') : '',
      d.change ? badge('Change: ' + d.change, 'badge-change') : '',
    ].filter(Boolean).join(' ');
    return `<div class="card">
      <div class="card-header">
        <span class="card-id decision">${esc(d.id)}</span>
        <span class="card-title">${esc(d.summary || '')}</span>
      </div>
      ${meta ? `<div class="card-meta">${meta}</div>` : ''}
      ${d.rationale ? `<div class="field-block"><div class="field-label">Rationale</div><div class="field-value">${esc(d.rationale)}</div></div>` : ''}
    </div>`;
  }).join('');
}

function renderQACards(questions) {
  if (!questions.length) return '<p class="list-empty">No questions yet</p>';
  return questions.map(q => {
    const statusClass = 'badge-status-' + (q.status || 'open');
    const idClass = 'qa-' + (q.status || 'open');
    const meta = [
      badge(q.status || 'open', statusClass),
      q.date ? badge(q.date, 'badge-date') : '',
      q.change ? badge('Change: ' + q.change, 'badge-change') : '',
      q.ids?.length ? q.ids.map(id => badge(id, 'badge-table')).join(' ') : '',
    ].filter(Boolean).join(' ');
    const answerBlock = q.answer
      ? `<div class="field-block"><div class="field-label">Answer</div><div class="answer-box">${esc(q.answer)}</div></div>`
      : '';
    const assumptionBlock = q.assumption
      ? `<div class="field-block"><div class="field-label">Assumption</div><div class="assumption-box">${esc(q.assumption)}</div></div>`
      : '';
    return `<div class="card">
      <div class="card-header">
        <span class="card-id ${idClass}">${esc(q.id)}</span>
        <span class="card-title">${esc(q.question || '')}</span>
      </div>
      <div class="card-meta">${meta}</div>
      ${answerBlock}${assumptionBlock}
    </div>`;
  }).join('');
}

function renderGlossaryCards(terms) {
  if (!terms.length) return '<p class="list-empty">No terms yet</p>';
  const chips = (arr) => arr && arr.length
    ? `<div class="table-chips">${arr.map(s => `<span class="table-chip">${esc(s)}</span>`).join('')}</div>`
    : '';
  return terms.map(t => {
    const meta = [
      t.date ? badge(t.date, 'badge-date') : '',
      t.change ? badge('Change: ' + t.change, 'badge-change') : '',
    ].filter(Boolean).join(' ');
    return `<div class="card">
      <div class="card-header">
        <span class="card-id glossary">${esc(t.id)}</span>
        <span class="card-title">${esc(t.label || t.id)}</span>
      </div>
      ${meta ? `<div class="card-meta">${meta}</div>` : ''}
      <div class="field-block"><div class="field-label">Definition</div><div class="field-value">${esc(t.definition || '')}</div></div>
      ${t.ids && t.ids.length ? `<div class="field-block"><div class="field-label">Related Tables</div>${chips(t.ids)}</div>` : ''}
      ${t.columns && t.columns.length ? `<div class="field-block"><div class="field-label">Related Columns</div>${chips(t.columns)}</div>` : ''}
    </div>`;
  }).join('');
}

function buildBrowserHtml(specIndex, contextData, glossaryData, questionsData) {
  const faviconPath = path.resolve(__dirname, '../visualizer/public/favicon.svg');
  const faviconHref = fs.existsSync(faviconPath)
    ? 'data:image/svg+xml,' + encodeURIComponent(fs.readFileSync(faviconPath, 'utf8'))
    : '';

  const topbarIcon = `<svg width="22" height="22" viewBox="0 0 512 512" fill="none" style="flex-shrink:0;border-radius:5px;box-shadow:0 1px 4px rgba(0,0,0,.4)">
    <rect width="512" height="512" rx="112" fill="#FFFFFF"/>
    <path d="M120 350 L120 160 L256 310 L392 160 L392 350" stroke="#CBD5E1" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="80" y="310" width="80" height="80" rx="16" fill="#8b5cf6"/>
    <rect x="80" y="120" width="80" height="80" rx="16" fill="#f59e0b"/>
    <rect x="216" y="270" width="80" height="80" rx="16" fill="#ef4444"/>
    <rect x="352" y="120" width="80" height="80" rx="16" fill="#10b981"/>
    <rect x="352" y="310" width="80" height="80" rx="16" fill="#3b82f6"/>
  </svg>`;

  const decisions = contextData?.decisions ?? [];
  const questions = questionsData?.questions ?? [];
  const terms = glossaryData?.terms ?? [];

  const specTreeHtml = (specIndex || []).map(({ modelSlug, tables, tableFiles = {} }) => {
    const items = tables.map(t => {
      const hasHtml = !!(tableFiles[t]?.html);
      const hasMd = !!(tableFiles[t]?.md);
      return `<li><a class="nav-item" href="#" data-type="spec" data-slug="${modelSlug}" data-table="${t}" data-has-html="${hasHtml}" data-has-md="${hasMd}">${t}</a></li>`;
    }).join('');
    return `<div class="nav-group"><div class="nav-group-label"><span>📂</span>${modelSlug}</div><ul>${items}</ul></div>`;
  }).join('') || '<p class="spec-tree-empty">No specs found</p>';

  const specCount = (specIndex || []).reduce((n, g) => n + (g.tables || []).length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Modscape Spec Browser</title>
${faviconHref ? `<link rel="icon" type="image/svg+xml" href="${faviconHref}">` : ''}
<style>
:root {
  --bg: #0b1120;
  --surface: #111827;
  --surface2: #1e293b;
  --border: rgba(255,255,255,0.07);
  --text: #e2e8f0;
  --text-muted: #64748b;
  --text-dim: #475569;
  --accent: #3b82f6;
  --accent-dim: rgba(59,130,246,0.15);
  --green: #22c55e;
  --green-dim: rgba(34,197,94,0.15);
  --yellow: #eab308;
  --yellow-dim: rgba(234,179,8,0.12);
  --red: #ef4444;
  --red-dim: rgba(239,68,68,0.12);
  --sidebar-w: 240px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);font-size:13px}

#app{display:flex;height:100vh;flex-direction:column}

/* ── Topbar ── */
#topbar{display:flex;align-items:center;gap:12px;padding:0 20px;height:52px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0}
#topbar-title{font-size:14px;font-weight:700;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px}
#topbar-title span{color:var(--accent)}
#search-wrap{flex:1;max-width:380px;display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 12px}
#search-wrap svg{flex-shrink:0;opacity:.5}
#search{background:none;border:none;outline:none;color:var(--text);font-size:13px;width:100%}
#search::placeholder{color:var(--text-dim)}
#live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);flex-shrink:0;margin-left:auto}

#main{display:flex;flex:1;overflow:hidden}

/* ── Sidebar ── */
#sidebar{width:var(--sidebar-w);border-right:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;overflow:hidden}
.tab-bar{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface)}
.tab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 2px 7px;border:none;background:none;color:var(--text-dim);cursor:pointer;font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;transition:color .15s,background .15s;border-bottom:2px solid transparent;margin-bottom:-1px}
.tab-btn:hover{color:var(--text);background:rgba(255,255,255,0.04)}
.tab-btn.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-icon{font-size:14px;line-height:1.2}
.tab-count{font-size:9px;padding:1px 5px;border-radius:8px;background:var(--surface2);color:var(--text-muted);font-weight:600;min-width:16px;text-align:center}
.tab-btn.active .tab-count{background:var(--accent-dim);color:var(--accent)}

/* Spec tree — only shown when specs tab is active */
#spec-tree{flex:1;display:none;flex-direction:column;overflow:hidden}
#spec-tree.visible{display:flex}
.tree-search-bar{padding:10px 12px;flex-shrink:0;border-bottom:1px solid var(--border)}
#spec-tree-list{flex:1;overflow-y:auto;padding:8px 0}
#spec-tree-list::-webkit-scrollbar{width:4px}
#spec-tree-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

/* Sidebar search (non-specs tabs) */
#sidebar-search{padding:12px;flex-shrink:0;display:none;border-bottom:1px solid var(--border)}
#sidebar-search.visible{display:block}
.sidebar-search-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 12px;color:var(--text);font-size:12px;outline:none;transition:border-color .15s}
.sidebar-search-input::placeholder{color:var(--text-dim)}
.sidebar-search-input:focus{border-color:var(--accent)}
.nav-group{padding:2px 8px 6px}
.nav-group-label{display:flex;align-items:center;gap:6px;padding:6px 8px 3px;font-size:10px;font-weight:600;color:var(--text-dim);letter-spacing:.04em}
ul{list-style:none;padding:0}
a.nav-item{display:flex;flex-direction:column;padding:5px 8px 5px 24px;border-radius:6px;color:var(--text-muted);text-decoration:none;font-size:12px;font-weight:500;transition:background .1s,color .1s;cursor:pointer;user-select:none}
a.nav-item:hover{background:rgba(255,255,255,0.05);color:var(--text)}
a.nav-item.active{background:var(--accent-dim);color:var(--accent)}
.spec-tree-empty{padding:24px 16px;font-size:11px;color:var(--text-dim);text-align:center}

/* ── Content area ── */
#content{flex:1;overflow:hidden;display:flex;flex-direction:column}

/* Views — only one visible at a time */
.view{display:none;flex-direction:column;flex:1;overflow:hidden}
.view.active{display:flex}

/* Spec view */
#view-specs #breadcrumb{padding:10px 24px;font-size:11px;color:var(--text-dim);border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;gap:6px;min-height:37px}
#view-specs #breadcrumb .crumb-sep{opacity:.4}
#pane{flex:1;overflow:auto;padding:24px}
#pane::-webkit-scrollbar{width:6px}
#pane::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
#empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:var(--text-dim)}
#empty .empty-icon{font-size:48px;opacity:.3}
#empty p{font-size:14px}
#spec-pre{display:none;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-word;color:var(--text-muted);font-family:ui-monospace,monospace;background:var(--surface);padding:24px;border-radius:12px;border:1px solid var(--border)}
#frame-wrap{flex:1;position:relative;overflow:hidden;display:none}
#frame-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}

/* List views (decisions, q&a, glossary) */
.list-view-header{display:flex;align-items:center;gap:10px;padding:16px 24px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.list-view-title{font-size:14px;font-weight:700;color:var(--text)}
.list-view-count{font-size:11px;padding:2px 8px;border-radius:10px;background:var(--surface2);color:var(--text-muted);font-weight:600}
.list-view-body{flex:1;overflow:auto;padding:20px 24px}
.list-view-body::-webkit-scrollbar{width:6px}
.list-view-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.list-empty{padding:40px;font-size:13px;color:var(--text-dim);text-align:center}

/* Cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px;margin-bottom:12px}
.card-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.card-id{font-size:11px;font-weight:700;font-family:monospace;padding:3px 10px;border-radius:20px;flex-shrink:0;margin-top:2px}
.card-id.decision{background:rgba(139,92,246,.2);color:#a78bfa}
.card-id.qa-open{background:var(--red-dim);color:#fca5a5}
.card-id.qa-assumed{background:var(--yellow-dim);color:#fde047}
.card-id.qa-answered{background:var(--green-dim);color:#86efac}
.card-id.glossary{background:rgba(20,184,166,.15);color:#5eead4}
.card-title{font-size:14px;font-weight:600;color:var(--text);line-height:1.4}
.card-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.badge{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;border:1px solid transparent}
.badge-status-answered{background:var(--green-dim);color:var(--green);border-color:rgba(34,197,94,.25)}
.badge-status-assumed{background:var(--yellow-dim);color:var(--yellow);border-color:rgba(234,179,8,.25)}
.badge-status-open{background:var(--red-dim);color:var(--red);border-color:rgba(239,68,68,.25)}
.badge-change{background:rgba(59,130,246,.1);color:#93c5fd;border-color:rgba(59,130,246,.2)}
.badge-date{background:var(--surface2);color:var(--text-muted);border-color:var(--border)}
.badge-table{background:rgba(168,85,247,.1);color:#c4b5fd;border-color:rgba(168,85,247,.2)}
.field-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:5px}
.field-value{font-size:13px;color:var(--text-muted);line-height:1.6}
.field-block{margin-bottom:14px}
.field-block:last-child{margin-bottom:0}
.answer-box{background:var(--green-dim);border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:#bbf7d0;line-height:1.6}
.assumption-box{background:var(--yellow-dim);border:1px solid rgba(234,179,8,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:#fef08a;line-height:1.6}
.table-chips{display:flex;flex-wrap:wrap;gap:6px}
.table-chip{font-size:11px;font-family:monospace;padding:2px 8px;border-radius:6px;background:rgba(168,85,247,.1);color:#c4b5fd;border:1px solid rgba(168,85,247,.2)}
</style>
</head>
<body>
<div id="app">
  <div id="topbar">
    <div id="topbar-title">${topbarIcon} Modscape <span>Spec Browser</span></div>
    <div id="search-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input id="search" type="text" placeholder="Search specs…" autocomplete="off">
    </div>
    <div id="live-dot" title="Live reload active"></div>
  </div>

  <div id="main">
    <!-- Sidebar: tabs + spec tree -->
    <div id="sidebar">
      <div class="tab-bar">
        <button class="tab-btn active" data-tab="specs">
          <span class="tab-icon">📄</span>
          <span>Specs</span>
          <span class="tab-count">${specCount}</span>
        </button>
        <button class="tab-btn" data-tab="decisions">
          <span class="tab-icon">📋</span>
          <span>Dec</span>
          <span class="tab-count">${decisions.length}</span>
        </button>
        <button class="tab-btn" data-tab="qa">
          <span class="tab-icon">❓</span>
          <span>Q&amp;A</span>
          <span class="tab-count">${questions.length}</span>
        </button>
        <button class="tab-btn" data-tab="glossary">
          <span class="tab-icon">📖</span>
          <span>Glossary</span>
          <span class="tab-count">${terms.length}</span>
        </button>
      </div>
      <!-- Sidebar in-view search (shown for non-specs tabs) -->
      <div id="sidebar-search">
        <input class="sidebar-search-input" id="list-search" type="text" placeholder="Search…" autocomplete="off">
      </div>
      <!-- Spec file tree (only shown for specs tab) -->
      <div id="spec-tree" class="visible">
        <div class="tree-search-bar">
          <input class="sidebar-search-input" id="tree-search" type="text" placeholder="Filter specs…" autocomplete="off">
        </div>
        <div id="spec-tree-list">${specTreeHtml}</div>
      </div>
    </div>

    <!-- Content -->
    <div id="content">
      <!-- Specs view -->
      <div id="view-specs" class="view active">
        <div id="breadcrumb"><span style="opacity:.4">Select a spec from the sidebar</span></div>
        <div id="pane">
          <div id="empty">
            <div class="empty-icon">📂</div>
            <p>Select a spec file from the sidebar</p>
          </div>
          <pre id="spec-pre"></pre>
          <div id="card-area"></div>
        </div>
        <div id="frame-wrap"><iframe id="spec-frame" title="spec"></iframe></div>
      </div>

      <!-- Decisions view -->
      <div id="view-decisions" class="view">
        <div class="list-view-header">
          <span class="list-view-title">Decisions</span>
          <span class="list-view-count">${decisions.length}</span>
        </div>
        <div class="list-view-body">${renderDecisionCards(decisions)}</div>
      </div>

      <!-- Q&A view -->
      <div id="view-qa" class="view">
        <div class="list-view-header">
          <span class="list-view-title">Q&amp;A</span>
          <span class="list-view-count">${questions.length}</span>
        </div>
        <div class="list-view-body">${renderQACards(questions)}</div>
      </div>

      <!-- Glossary view -->
      <div id="view-glossary" class="view">
        <div class="list-view-header">
          <span class="list-view-title">Glossary</span>
          <span class="list-view-count">${terms.length}</span>
        </div>
        <div class="list-view-body">${renderGlossaryCards(terms)}</div>
      </div>
    </div>
  </div>
</div>

<script>
// ── WebSocket live reload ──────────────────────────────────────────────────
(function connectWS() {
  const ws = new WebSocket('ws://' + location.host);
  ws.onmessage = () => location.reload();
  ws.onclose = () => setTimeout(connectWS, 2000);
})();

// ── Tab switching ─────────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
  document.getElementById('spec-tree').classList.toggle('visible', id === 'specs');
  const sidebarSearch = document.getElementById('sidebar-search');
  sidebarSearch.classList.toggle('visible', id !== 'specs');
  if (id !== 'specs') document.getElementById('list-search').value = '';
  applySearch();
}
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

// ── Spec navigation ────────────────────────────────────────────────────────
let activeNavEl = null;

function setActiveNav(el) {
  if (activeNavEl) activeNavEl.classList.remove('active');
  activeNavEl = el;
  if (el) el.classList.add('active');
}

function setBreadcrumb(parts) {
  document.getElementById('breadcrumb').innerHTML = parts.map((p, i) => {
    const t = String(p).replace(/&/g,'&amp;').replace(/</g,'&lt;');
    return i < parts.length - 1
      ? \`<span>\${t}</span><span class="crumb-sep">›</span>\`
      : \`<span style="color:var(--text)">\${t}</span>\`;
  }).join('');
}

function clearSpecContent() {
  document.getElementById('empty').style.display = 'none';
  document.getElementById('spec-pre').style.display = 'none';
  document.getElementById('card-area').innerHTML = '';
  document.getElementById('pane').style.display = 'block';
  document.getElementById('frame-wrap').style.display = 'none';
}

document.querySelectorAll('a.nav-item').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    setActiveNav(a);
    const { slug, table } = a.dataset;
    const hasHtml = a.dataset.hasHtml === 'true';
    const hasMd = a.dataset.hasMd === 'true';

    clearSpecContent();
    setBreadcrumb(['Specs', slug, table]);

    if (hasHtml || hasMd) {
      document.getElementById('pane').style.display = 'none';
      document.getElementById('frame-wrap').style.display = 'block';
      document.getElementById('spec-frame').src = '/api/table-spec/' + encodeURIComponent(slug) + '/' + encodeURIComponent(table);
    }
  });
});

// ── Search ────────────────────────────────────────────────────────────────
function applySearch() {
  const globalQ = document.getElementById('search').value.toLowerCase().trim();
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (activeTab === 'specs') {
    const treeQ = document.getElementById('tree-search').value.toLowerCase().trim();
    const q = treeQ || globalQ;
    document.querySelectorAll('#spec-tree-list li').forEach(li => {
      li.style.display = (!q || li.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
    document.querySelectorAll('.nav-group').forEach(g => {
      const hasVisible = [...g.querySelectorAll('li')].some(li => li.style.display !== 'none');
      g.style.display = hasVisible ? '' : 'none';
    });
  } else {
    const listQ = document.getElementById('list-search').value.toLowerCase().trim();
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    const listBody = activeView.querySelector('.list-view-body');
    if (!listBody) return;
    let anyVisible = false;
    listBody.querySelectorAll('.card').forEach(card => {
      const text = card.textContent.toLowerCase();
      const show = (!globalQ || text.includes(globalQ)) && (!listQ || text.includes(listQ));
      card.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    let noResult = listBody.querySelector('.search-no-results');
    if (!anyVisible && (globalQ || listQ)) {
      if (!noResult) {
        noResult = document.createElement('p');
        noResult.className = 'list-empty search-no-results';
        listBody.appendChild(noResult);
      }
      noResult.textContent = 'No results found';
      noResult.style.display = '';
    } else if (noResult) {
      noResult.style.display = 'none';
    }
  }
}
document.getElementById('search').addEventListener('input', applySearch);
document.getElementById('list-search').addEventListener('input', applySearch);
document.getElementById('tree-search').addEventListener('input', applySearch);
</script>
</body>
</html>`;
}

// ── modscape spec open ────────────────────────────────────────────────────────

export async function startSpecOpenServer() {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const broadcast = () => {
    const data = JSON.stringify({ type: 'reload' });
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  };

  app.get('/api/table-spec/:modelSlug/:tableId', (req, res) => {
    const { modelSlug, tableId } = req.params;
    const htmlPath = path.join(baseDir, modelSlug, `${tableId}.html`);
    const mdPath = path.join(baseDir, modelSlug, `${tableId}.md`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (fs.existsSync(htmlPath)) return res.send(fs.readFileSync(htmlPath, 'utf8'));
    if (fs.existsSync(mdPath)) return res.send(mdToHtml(fs.readFileSync(mdPath, 'utf8')));
    res.status(404).send('Not found');
  });

  app.get('/', (_req, res) => {
    const index = scanSpecsDir();
    const contextData = loadContext();
    const glossaryData = loadGlossary();
    const questionsData = loadQuestions();

    const augmented = (index || []).map(({ modelSlug, tables }) => {
      const slugDir = path.join(baseDir, modelSlug);
      const tableFiles = {};
      for (const tableId of tables) {
        tableFiles[tableId] = {
          html: fs.existsSync(path.join(slugDir, `${tableId}.html`)),
          md: fs.existsSync(path.join(slugDir, `${tableId}.md`)),
        };
      }
      return { modelSlug, tables, tableFiles };
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(buildBrowserHtml(augmented, contextData, glossaryData, questionsData));
  });

  server.listen(5174, () => {
    console.log(`\n  🚀 Modscape Spec Browser: http://localhost:5174`);
    if (!fs.existsSync(baseDir)) console.warn(`  ⚠️  .modscape/specs/ not found`);
    open('http://localhost:5174');
  });

  const watchPaths = [baseDir].filter(p => fs.existsSync(p));
  if (watchPaths.length > 0) {
    let watchTimeout = null;
    chokidar.watch(watchPaths, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 100 }
    }).on('all', (event, changedPath) => {
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        console.log(`  ✨ ${event}: ${path.relative(process.cwd(), changedPath)}`);
        broadcast();
      }, 300);
    });
  }
}

// ── modscape spec build ───────────────────────────────────────────────────────

export async function buildSpecs(outDir = 'dist/specs') {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  if (!fs.existsSync(baseDir)) {
    console.error('\n  ❌ .modscape/specs/ not found.\n');
    process.exit(1);
  }
  const index = scanSpecsDir();
  if (!index || index.length === 0) {
    console.error('\n  ❌ No spec files found in .modscape/specs/.\n');
    process.exit(1);
  }

  const absoluteOutDir = path.resolve(process.cwd(), outDir);
  fs.mkdirSync(absoluteOutDir, { recursive: true });
  console.log(`\n  📦 Building spec browser to ${outDir}...`);

  const augmented = index.map(({ modelSlug, tables }) => {
    const slugDir = path.join(baseDir, modelSlug);
    const outSlugDir = path.join(absoluteOutDir, modelSlug);
    fs.mkdirSync(outSlugDir, { recursive: true });
    const tableFiles = {};
    for (const tableId of tables) {
      tableFiles[tableId] = { html: false, md: false };
      const htmlSrc = path.join(slugDir, `${tableId}.html`);
      const mdSrc = path.join(slugDir, `${tableId}.md`);
      if (fs.existsSync(htmlSrc)) {
        fs.copyFileSync(htmlSrc, path.join(outSlugDir, `${tableId}.html`));
        tableFiles[tableId].html = true;
        console.log(`  ✅ ${modelSlug}/${tableId}.html`);
      }
      if (fs.existsSync(mdSrc)) {
        fs.copyFileSync(mdSrc, path.join(outSlugDir, `${tableId}.md`));
        tableFiles[tableId].md = true;
        console.log(`  ✅ ${modelSlug}/${tableId}.md`);
      }
    }
    return { modelSlug, tables, tableFiles };
  });

  const contextData = loadContext();
  const glossaryData = loadGlossary();
  const questionsData = loadQuestions();

  const staticHtml = buildStaticBrowserHtml(augmented, contextData, glossaryData, questionsData);
  fs.writeFileSync(path.join(absoluteOutDir, 'index.html'), staticHtml, 'utf8');
  console.log(`  ✅ index.html`);
  console.log(`\n  ✅ Build complete! → ${outDir}/\n`);
}

function buildStaticBrowserHtml(specIndex, contextData, glossaryData, questionsData) {
  const html = buildBrowserHtml(specIndex, contextData, glossaryData, questionsData);
  return html
    .replace(/\/\/ ── WebSocket live reload[\s\S]*?\}\)\(\);/, '// Static build: no live reload')
    .replace("'ws://' + location.host", 'null')
    .replace(
      "'/api/table-spec/' + encodeURIComponent(slug) + '/' + encodeURIComponent(table)",
      "slug + '/' + table + '.html'"
    )
    .replace(
      "'/api/table-spec-md/' + encodeURIComponent(slug) + '/' + encodeURIComponent(table)",
      "slug + '/' + table + '.md'"
    );
}
