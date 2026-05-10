import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import express from 'express';
import chokidar from 'chokidar';
import open from 'open';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';
import { readSpecConfig, resolveImports } from './model-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
h1 { color: #0f172a !important; }
h2 { color: #475569 !important; border-color: #e2e8f0 !important; }
h3, h4 { color: #64748b !important; }
p, li, .ac-text, .q-text, .task-text, .impact-desc, .finding-item, .decision-item p, .stakeholder-group .name { color: #475569 !important; }
ul li::before { color: #94a3b8 !important; }
.stakeholder-group label { color: #94a3b8 !important; }
header, footer { border-color: #e2e8f0 !important; }
footer { color: #94a3b8 !important; }
.card, .ac-item, .source-chip, .rel-item, .table-card, .impact-item, .decision-item, .findings-box, .skipped-section, .task-item, .q-item, .filter-btn { background: #ffffff !important; background-color: #ffffff !important; border-color: #e2e8f0 !important; }
.table-card-header { border-color: #e2e8f0 !important; background: #f8fafc !important; }
.column-list { background: #ffffff !important; }
.column-row { background: #ffffff !important; color: #334155 !important; }
.column-row:hover { background: #f1f5f9 !important; }
.col-name { color: #334155 !important; }
.col-type { color: #64748b !important; }
.table-name { color: #0f172a !important; }
.progress-bar-track { background: #e2e8f0 !important; }
.phase-line { background: #e2e8f0 !important; }
.progress-label { color: #64748b !important; }
.phase-title { color: #0f172a !important; }
.phase-count { color: #94a3b8 !important; }
.task-item.done { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
.task-item.done .task-text { color: #94a3b8 !important; }
.task-checkbox { border-color: #cbd5e1 !important; }
.task-id { background: #dbeafe !important; color: #1d4ed8 !important; }
.task-deps { color: #94a3b8 !important; }
.skipped-item { color: #94a3b8 !important; }
.ac-id { background: #dbeafe !important; color: #1d4ed8 !important; }
.ac-item.done { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
.ac-item.done .ac-id { background: #dcfce7 !important; color: #166534 !important; }
.impact-direct { background: #fee2e2 !important; color: #b91c1c !important; }
.impact-implement { background: #ffedd5 !important; color: #c2410c !important; }
.impact-context { background: #f8fafc !important; color: #64748b !important; border-color: #cbd5e1 !important; }
.impact-item.direct { border-color: #f87171 !important; }
.impact-item.implement { border-color: #fb923c !important; }
.impact-item.context { border-color: #cbd5e1 !important; }
.impact-item .impact-id { color: #334155 !important; }
.kind-fact { background: #dbeafe !important; color: #1d4ed8 !important; }
.kind-dimension { background: #dcfce7 !important; color: #166534 !important; }
.kind-mart { background: #f3e8ff !important; color: #6b21a8 !important; }
.kind-staging { background: #f5f5f4 !important; color: #44403c !important; }
.kind-hub { background: #ecfeff !important; color: #0e7490 !important; }
.kind-link { background: #fffbeb !important; color: #92400e !important; }
.kind-satellite { background: #f5f3ff !important; color: #5b21b6 !important; }
.badge-status { background: #dbeafe !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }
.badge-tool { background: #dcfce7 !important; color: #166534 !important; border-color: #86efac !important; }
.badge-owner { background: #f3e8ff !important; color: #6b21a8 !important; border-color: #c4b5fd !important; }
.badge-design { background: #dbeafe !important; color: #1d4ed8 !important; border-color: #93c5fd !important; }
.q-item.open { border-color: #e2e8f0 !important; border-left-color: #f87171 !important; }
.q-item.assumed { border-color: #e2e8f0 !important; border-left-color: #fb923c !important; }
.q-item.answered { border-color: #e2e8f0 !important; border-left-color: #4ade80 !important; }
.q-text { color: #334155 !important; }
.q-table { background: #f1f5f9 !important; color: #64748b !important; }
.q-date { color: #94a3b8 !important; }
.q-id-open { background: #fee2e2 !important; color: #b91c1c !important; }
.q-id-assumed { background: #ffedd5 !important; color: #c2410c !important; }
.q-id-answered { background: #dcfce7 !important; color: #166534 !important; }
.q-answer { background: #f0fdf4 !important; color: #166534 !important; border-color: #bbf7d0 !important; }
.q-assumption { background: #fff7ed !important; color: #c2410c !important; border-color: #fed7aa !important; }
.pill-open { background: #fee2e2 !important; color: #b91c1c !important; border-color: #f87171 !important; }
.pill-assumed { background: #ffedd5 !important; color: #c2410c !important; border-color: #fb923c !important; }
.pill-answered { background: #dcfce7 !important; color: #166534 !important; border-color: #4ade80 !important; }
pre { background: #f6f8fa !important; border-color: #d0d7de !important; color: #24292f !important; }
code { background: #f1f5f9 !important; color: #0550ae !important; border-color: #e2e8f0 !important; }
pre code { background: none !important; color: inherit !important; border: none !important; }
.filter-btn { background: #f1f5f9 !important; border-color: #e2e8f0 !important; color: #64748b !important; }
.filter-btn:hover, .filter-btn.active { background: #3b82f6 !important; color: #ffffff !important; border-color: #3b82f6 !important; }
.rel-arrow { color: #2563eb !important; }
.rel-card-label { color: #94a3b8 !important; }
</style>`;

export async function startSpecDevServer(specName) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const distPath = path.resolve(__dirname, '../visualizer-dist');

  const broadcast = (msg) => {
    const data = JSON.stringify(msg);
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  };

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

  app.get('/api/spec/tabs', (_req, res) => {
    const tabs = SPEC_TABS.map(tab => ({
      ...tab,
      available: fs.existsSync(path.join(specDir, tab.file)),
    }));
    res.json(tabs);
  });

  app.get('/api/spec/:file', (req, res) => {
    const file = req.params.file;
    if (!file.endsWith('.html')) return res.status(400).send('Only .html files are served here');
    const filePath = path.join(specDir, file);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (req.query.theme === 'light') content = content.replace('</body>', `${LIGHT_MODE_CSS}</body>`);
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
}

const CHANGES_DIR = '.modscape/changes';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`  ⏭  ${filePath} already exists — skipped`);
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ ${filePath}`);
  return true;
}

export function specNew(name) {
  const dir = path.join(CHANGES_DIR, name);

  if (fs.existsSync(dir)) {
    console.error(`  ❌ ${dir} already exists. Choose a different name.`);
    process.exit(1);
  }

  ensureDir(dir);

  const html = readSpecConfig().output_format === 'html';
  const ext = html ? 'html' : 'md';
  console.log(`\n  📁 Scaffolding spec: ${name} (format: ${ext})\n`);

  // spec-config.yaml
  const config = {
    main_yamls: [
      { path: 'model.yaml', tables: [] },
    ],
  };
  writeIfNotExists(
    path.join(dir, 'spec-config.yaml'),
    yaml.dump(config, { lineWidth: -1 })
  );

  // spec-model.yaml
  writeIfNotExists(
    path.join(dir, 'spec-model.yaml'),
    `version: "${MODEL_FORMAT_VERSION}"\ntables: []\n`
  );

  // design.md / design.html
  writeIfNotExists(
    path.join(dir, `design.${ext}`),
    html
      ? `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Design: ${name}</title></head><body><h1>Design: ${name}</h1><p>Run /modscape:spec:design to fill in this file.</p></body></html>\n`
      : `# Design: ${name}\n\n## Design Decisions\n\n## Affected Tables\n\n### Direct Impact\n\n### Indirect Impact\n\n## Findings\n\n### Requires Model Change\n\n### Implementation Notes\n`
  );

  // tasks.md / tasks.html
  writeIfNotExists(
    path.join(dir, `tasks.${ext}`),
    html
      ? `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Tasks: ${name}</title></head><body><h1>Tasks: ${name}</h1><p>Run /modscape:spec:tasks to fill in this file.</p></body></html>\n`
      : `# Pipeline Tasks\n> Generated from: .modscape/changes/${name}/spec-model.yaml\n> Spec: .modscape/changes/${name}/spec.md\n> Progress: 0 / 0\n\n## Phase 1: Staging\n\n## Phase 2: Core\n\n## Phase 3: Mart\n\n## Phase 4: Tests\n`
  );

  // questions.md / questions.html
  writeIfNotExists(
    path.join(dir, `questions.${ext}`),
    html
      ? `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>Questions: ${name}</title></head><body><h1>Questions: ${name}</h1><p>Run /modscape:spec:requirements to fill in this file.</p></body></html>\n`
      : `# Questions: ${name}\n\n## Pipeline-level\n\n## Table-level\n`
  );

  console.log(`\n  ✅ Scaffold complete: ${dir}/`);
  console.log(`\n  Next: run /modscape:spec:requirements to fill in spec.${ext}\n`);
}
