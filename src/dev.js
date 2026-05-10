import express from 'express';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import chokidar from 'chokidar';
import open from 'open';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import { resolveImports } from './model-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function scanFiles(inputPaths) {
  const modelMap = new Map();
  inputPaths.forEach(inputPath => {
    const absolutePath = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(absolutePath)) return;
    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      fs.readdirSync(absolutePath).forEach(file => {
        if ((file.endsWith('.yaml') || file.endsWith('.yml')) && file !== 'spec-config.yaml') {
          modelMap.set(path.parse(file).name, path.join(absolutePath, file));
        }
      });
    } else if (stats.isFile() && (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml'))) {
      modelMap.set(path.parse(absolutePath).name, absolutePath);
    }
  });
  return modelMap;
}

// Tab definitions for spec viewer mode
const SPEC_TABS = [
  { id: 'spec',      label: 'Spec',      file: 'spec.html' },
  { id: 'design',    label: 'Design',    file: 'design.html' },
  { id: 'tasks',     label: 'Tasks',     file: 'tasks.html' },
  { id: 'questions', label: 'Questions', file: 'questions.html' },
];

const LIGHT_MODE_CSS = `<style>
/* ── Base ── */
html, body { background: #f8fafc !important; color: #334155 !important; }

/* ── Typography ── */
h1 { color: #0f172a !important; }
h2 { color: #475569 !important; border-color: #e2e8f0 !important; }
h3, h4 { color: #64748b !important; }
p, li, .ac-text, .q-text, .task-text, .impact-desc, .finding-item, .decision-item p, .stakeholder-group .name { color: #475569 !important; }
ul li::before { color: #94a3b8 !important; }
.stakeholder-group label { color: #94a3b8 !important; }

/* ── Layout borders ── */
header, footer { border-color: #e2e8f0 !important; }
footer { color: #94a3b8 !important; }

/* ── Cards / containers ── */
.card, .ac-item, .source-chip, .rel-item,
.table-card, .impact-item,
.decision-item, .findings-box, .skipped-section,
.task-item, .q-item, .filter-btn {
  background: #ffffff !important;
  background-color: #ffffff !important;
  border-color: #e2e8f0 !important;
}
.table-card-header { border-color: #e2e8f0 !important; background: #f8fafc !important; }
.column-list { background: #ffffff !important; }
.column-row { background: #ffffff !important; color: #334155 !important; }
.column-row:hover { background: #f1f5f9 !important; }
.col-name { color: #334155 !important; }
.col-type { color: #64748b !important; }
.table-name { color: #0f172a !important; }

/* ── Progress bar ── */
.progress-bar-track { background: #e2e8f0 !important; }
.phase-line { background: #e2e8f0 !important; }
.progress-label { color: #64748b !important; }
.phase-title { color: #0f172a !important; }
.phase-count { color: #94a3b8 !important; }

/* ── Task items ── */
.task-item.done { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
.task-item.done .task-text { color: #94a3b8 !important; }
.task-checkbox { border-color: #cbd5e1 !important; }
.task-id { background: #dbeafe !important; color: #1d4ed8 !important; }
.task-deps { color: #94a3b8 !important; }
.skipped-item { color: #94a3b8 !important; }

/* ── AC items (spec) ── */
.ac-id { background: #dbeafe !important; color: #1d4ed8 !important; }
.ac-item.done { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
.ac-item.done .ac-id { background: #dcfce7 !important; color: #166534 !important; }

/* ── Impact badges ── */
.impact-direct    { background: #fee2e2 !important; color: #b91c1c !important; }
.impact-implement { background: #ffedd5 !important; color: #c2410c !important; }
.impact-context   { background: #f8fafc !important; color: #64748b !important; border-color: #cbd5e1 !important; }
.impact-item.direct    { border-color: #f87171 !important; }
.impact-item.implement { border-color: #fb923c !important; }
.impact-item.context   { border-color: #cbd5e1 !important; }
.impact-item .impact-id { color: #334155 !important; }

/* ── Kind badges ── */
.kind-fact      { background: #dbeafe !important; color: #1d4ed8 !important; }
.kind-dimension { background: #dcfce7 !important; color: #166534 !important; }
.kind-mart      { background: #f3e8ff !important; color: #6b21a8 !important; }
.kind-staging   { background: #f5f5f4 !important; color: #44403c !important; }
.kind-hub       { background: #ecfeff !important; color: #0e7490 !important; }
.kind-link      { background: #fffbeb !important; color: #92400e !important; }
.kind-satellite { background: #f5f3ff !important; color: #5b21b6 !important; }

/* ── Status badges (spec) ── */
.badge-status  { background: #dbeafe !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }
.badge-tool    { background: #dcfce7 !important; color: #166534 !important; border-color: #86efac !important; }
.badge-owner   { background: #f3e8ff !important; color: #6b21a8 !important; border-color: #c4b5fd !important; }
.badge-design  { background: #dbeafe !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }

/* ── Questions ── */
.q-item.open     { border-color: #e2e8f0 !important; border-left-color: #f87171 !important; }
.q-item.assumed  { border-color: #e2e8f0 !important; border-left-color: #fb923c !important; }
.q-item.answered { border-color: #e2e8f0 !important; border-left-color: #4ade80 !important; }
.q-text  { color: #334155 !important; }
.q-table { background: #f1f5f9 !important; color: #64748b !important; }
.q-date  { color: #94a3b8 !important; }
.q-id-open     { background: #fee2e2 !important; color: #b91c1c !important; }
.q-id-assumed  { background: #ffedd5 !important; color: #c2410c !important; }
.q-id-answered { background: #dcfce7 !important; color: #166534 !important; }
.q-answer      { background: #f0fdf4 !important; color: #166534 !important; border-color: #bbf7d0 !important; }
.q-assumption  { background: #fff7ed !important; color: #c2410c !important; border-color: #fed7aa !important; }
.pill-open     { background: #fee2e2 !important; color: #b91c1c !important; border-color: #f87171 !important; }
.pill-assumed  { background: #ffedd5 !important; color: #c2410c !important; border-color: #fb923c !important; }
.pill-answered { background: #dcfce7 !important; color: #166534 !important; border-color: #4ade80 !important; }

/* ── Code blocks ── */
pre { background: #f6f8fa !important; border-color: #d0d7de !important; color: #24292f !important; }
code { background: #f1f5f9 !important; color: #0550ae !important; border-color: #e2e8f0 !important; }
pre code { background: none !important; color: inherit !important; border: none !important; }

/* ── Filter buttons ── */
.filter-btn { background: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #64748b !important; }
.filter-btn:hover, .filter-btn.active { background: #3b82f6 !important; color: #ffffff !important; border-color: #3b82f6 !important; }

/* ── Relationship arrows (spec) ── */
.rel-arrow { color: #2563eb !important; }
.rel-card-label { color: #94a3b8 !important; }

</style>`;

export async function startDevServer(paths, _visualizerPath, specName = null) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '10mb' }));
  const distPath = path.resolve(__dirname, '../visualizer-dist');

  const broadcast = (msg) => {
    const data = JSON.stringify(msg);
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  };

  // ── Spec mode ────────────────────────────────────────────────────────────
  if (specName) {
    // Normalize: strip leading .modscape/changes/ prefix and trailing slash so that
    // both `billing-job-propagation` and `.modscape/changes/billing-job-propagation` work.
    let resolvedSpecName = specName.replace(/\/$/, '');
    const changesPrefixPosix = '.modscape/changes/';
    const changesPrefixNative = path.join('.modscape', 'changes') + path.sep;
    if (resolvedSpecName.startsWith(changesPrefixPosix)) {
      resolvedSpecName = resolvedSpecName.slice(changesPrefixPosix.length);
    } else if (resolvedSpecName.startsWith(changesPrefixNative)) {
      resolvedSpecName = resolvedSpecName.slice(changesPrefixNative.length);
    }
    const specDir = path.resolve(process.cwd(), '.modscape', 'changes', resolvedSpecName);

    if (!fs.existsSync(specDir)) {
      console.error(`\n  ❌ .modscape/changes/${resolvedSpecName}/ が見つかりません。`);
      console.error(`     /modscape:spec:requirements を実行してspecを作成してください。\n`);
      process.exit(1);
    }

    const specModelPath = path.join(specDir, 'spec-model.yaml');

    // Serve spec-model.yaml as the model
    app.get('/api/files', (_req, res) => {
      res.json([{ slug: resolvedSpecName, name: resolvedSpecName, path: path.relative(process.cwd(), specModelPath) }]);
    });

    app.get('/api/model', (_req, res) => {
      if (!fs.existsSync(specModelPath)) return res.json({ tables: [], relationships: [], lineage: [] });
      try {
        const raw = yaml.load(fs.readFileSync(specModelPath, 'utf8')) || {};
        const { schema } = resolveImports(raw, specDir);
        res.json(schema);
      } catch (e) { res.status(500).send(e.message); }
    });

    // Return available HTML tabs
    app.get('/api/spec/tabs', (_req, res) => {
      const tabs = SPEC_TABS.map(tab => ({
        ...tab,
        available: fs.existsSync(path.join(specDir, tab.file)),
      }));
      res.json(tabs);
    });

    // Serve individual HTML spec files
    app.get('/api/spec/:file', (req, res) => {
      const file = req.params.file;
      if (!file.endsWith('.html')) return res.status(400).send('Only .html files are served here');
      const filePath = path.join(specDir, file);
      if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        if (req.query.theme === 'light') {
          content = content.replace('</body>', `${LIGHT_MODE_CSS}</body>`);
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(content);
      } catch (e) { res.status(500).send(e.message); }
    });

    app.use(express.static(distPath, { index: false }));

    app.use((req, res) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        try {
          const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
          const injected = html.replace(
            '</head>',
            `<script>window.MODSCAPE_CLI_MODE=true;window.MODSCAPE_SPEC_MODE=true;window.MODSCAPE_SPEC_NAME=${JSON.stringify(resolvedSpecName)};</script></head>`
          );
          return res.send(injected);
        } catch (e) {}
      }
      res.status(404).send('Not Found');
    });

    server.listen(5173, () => {
      console.log(`\n  🚀 Modscape Spec Viewer: http://localhost:5173`);
      console.log(`  📁 Spec: .modscape/changes/${resolvedSpecName}/`);
      open('http://localhost:5173');
    });

    // Watch spec dir for .html and .yaml changes
    let watchTimeout = null;
    chokidar.watch(specDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
    }).on('all', (event, changedPath) => {
      const isHtml = changedPath.endsWith('.html');
      const isYaml = changedPath.endsWith('.yaml') || changedPath.endsWith('.yml');
      if (!isHtml && !isYaml) return;
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        console.log(`  ✨ File ${event}: ${path.relative(process.cwd(), changedPath)}`);
        broadcast(isYaml ? { type: 'update' } : { type: 'spec-update' });
      }, 300);
    });

    return;
  }

  // ── Normal model mode ─────────────────────────────────────────────────────
  const inputPaths = Array.isArray(paths) ? paths : [paths];
  let modelMap = scanFiles(inputPaths);

  const getModelPath = (slug) => modelMap.get(slug) || modelMap.values().next().value;

  // Track import-source paths for file watching
  const importWatchedPaths = new Set();

  app.get('/api/files', (req, res) => {
    modelMap = scanFiles(inputPaths);
    res.json(Array.from(modelMap.entries()).map(([slug, fullPath]) => ({
      slug, name: slug, path: path.relative(process.cwd(), fullPath)
    })));
  });

  app.get('/api/model', (req, res) => {
    const p = getModelPath(req.query.model);
    if (!p) return res.status(404).json({ error: 'Not found' });
    try {
      const raw = yaml.load(fs.readFileSync(p, 'utf8')) || {};
      const basePath = path.dirname(p);
      const { schema, importedPaths } = resolveImports(raw, basePath);
      // Register newly discovered import sources with chokidar
      for (const ip of importedPaths) {
        if (!importWatchedPaths.has(ip)) {
          importWatchedPaths.add(ip);
          watcher.add(ip);
        }
      }
      res.json(schema);
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/context', (req, res) => {
    const contextPath = path.resolve(process.cwd(), '.modscape/specs/_context.yaml');
    if (!fs.existsSync(contextPath)) return res.status(404).send('Not found');
    try {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(contextPath, 'utf8'));
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/glossary', (req, res) => {
    const glossaryPath = path.resolve(process.cwd(), '.modscape/specs/_glossary.yaml');
    if (!fs.existsSync(glossaryPath)) return res.status(404).send('Not found');
    try {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(glossaryPath, 'utf8'));
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/questions', (req, res) => {
    const questionsPath = path.resolve(process.cwd(), '.modscape/specs/_questions.yaml');
    if (!fs.existsSync(questionsPath)) return res.status(404).send('Not found');
    try {
      res.setHeader('Content-Type', 'text/plain');
      res.send(fs.readFileSync(questionsPath, 'utf8'));
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/context/tables', (req, res) => {
    const baseSpecsDir = path.resolve(process.cwd(), '.modscape/specs');
    if (!fs.existsSync(baseSpecsDir)) return res.json({});
    try {
      const result = {};
      const modelSlug = req.query.model;
      // If model slug provided, scan specs/<slug>/ flat files; otherwise fall back to specs/ root (legacy)
      const scanDir = modelSlug ? path.join(baseSpecsDir, modelSlug) : baseSpecsDir;
      if (!fs.existsSync(scanDir)) return res.json({});
      const files = fs.readdirSync(scanDir);
      const tableMap = {};
      for (const file of files) {
        if (file.startsWith('_')) continue;
        if (file.endsWith('.html')) {
          const tableId = file.slice(0, -5);
          tableMap[tableId] = tableMap[tableId] || {};
          tableMap[tableId].htmlFile = file;
        } else if (file.endsWith('.md')) {
          const tableId = file.slice(0, -3);
          tableMap[tableId] = tableMap[tableId] || {};
          tableMap[tableId].mdFile = file;
        }
      }
      for (const [tableId, files] of Object.entries(tableMap)) {
        const entry = {};
        if (files.htmlFile) {
          entry.spec = fs.readFileSync(path.join(scanDir, files.htmlFile), 'utf8');
          entry.specIsHtml = true;
        } else if (files.mdFile) {
          entry.spec = fs.readFileSync(path.join(scanDir, files.mdFile), 'utf8');
          entry.specIsHtml = false;
        }
        if (entry.spec) result[tableId] = entry;
      }
      res.json(result);
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/table-spec/:modelSlug/:tableId', (req, res) => {
    const { modelSlug, tableId } = req.params;
    const filePath = path.resolve(process.cwd(), '.modscape/specs', modelSlug, `${tableId}.html`);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (req.query.theme === 'light') {
        content = content.replace('</body>', `${LIGHT_MODE_CSS}</body>`);
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(content);
    } catch (e) { res.status(500).send(e.message); }
  });

  app.post('/api/save', (req, res) => {
    const p = getModelPath(req.query.model);
    try {
      // Strip imported tables before saving — they belong to the source YAML, not this file
      const incoming = yaml.load(req.body.yaml) || {};
      if (Array.isArray(incoming.tables)) {
        incoming.tables = incoming.tables.filter(t => !t.isImported);
      }
      // Preserve the imports: section from the original file
      const original = yaml.load(fs.readFileSync(p, 'utf8')) || {};
      if (Array.isArray(original.imports)) {
        incoming.imports = original.imports;
      }
      fs.writeFileSync(p, yaml.dump(incoming, { lineWidth: -1 }), 'utf8');
      res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
  });

  app.use(express.static(distPath, { index: false }));

  app.use((req, res) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      try {
        const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
        return res.send(html.replace('</head>', '<script>window.MODSCAPE_CLI_MODE=true;</script></head>'));
      } catch (e) {}
    }
    res.status(404).send('Not Found');
  });

  server.listen(5173, () => {
    console.log(`\n  🚀 Modscape Visualizer: http://localhost:5173`);
    console.log(`  👀 Watching: ${inputPaths.join(', ')}`);
    open('http://localhost:5173');
  });

  // Debounced file watcher (kept in variable so import paths can be added dynamically)
  const contextYamlPath = path.resolve(process.cwd(), '.modscape/specs/_context.yaml');
  const questionsYamlPath = path.resolve(process.cwd(), '.modscape/specs/_questions.yaml');
  let watchTimeout = null;
  const watcher = chokidar.watch([...inputPaths, contextYamlPath, questionsYamlPath], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
  }).on('all', (event, changedPath) => {
    if (!changedPath.endsWith('.yaml') && !changedPath.endsWith('.yml')) return;

    const isContext = changedPath === contextYamlPath || changedPath === questionsYamlPath;
    if (watchTimeout) clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      console.log(`  ✨ File ${event}: ${path.relative(process.cwd(), changedPath)}`);
      broadcast(isContext ? { type: 'context-update' } : { type: 'update' });
    }, 300);
  });
}
