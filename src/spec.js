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
      const content = fs.readFileSync(filePath, 'utf8');
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
