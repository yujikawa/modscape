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
import { mdToHtml } from './md-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tab definitions for spec viewer mode
const SPEC_TABS = [
  { id: 'spec',          label: 'Spec',          file: 'spec.html' },
  { id: 'design',        label: 'Design',        file: 'design.html' },
  { id: 'tasks',         label: 'Tasks',         file: 'tasks.html' },
  { id: 'questions',     label: 'Questions',     file: 'questions.html' },
  { id: 'glossary',      label: 'Glossary',      file: 'glossary.html' },
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

  app.use(express.json({ limit: '10mb' }));

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

  app.post('/api/save', (req, res) => {
    try {
      const incoming = yaml.load(req.body.yaml) || {};
      if (Array.isArray(incoming.tables)) {
        incoming.tables = incoming.tables.filter(t => !t.isImported);
      }
      const original = fs.existsSync(specModelPath) ? (yaml.load(fs.readFileSync(specModelPath, 'utf8')) || {}) : {};
      if (Array.isArray(original.imports)) {
        incoming.imports = original.imports;
      }
      fs.writeFileSync(specModelPath, yaml.dump(incoming, { lineWidth: -1 }), 'utf8');
      res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/spec/tabs', (_req, res) => {
    const tabs = SPEC_TABS.map(tab => {
      const htmlPath = path.join(specDir, tab.file);
      const mdPath = htmlPath.replace(/\.html$/, '.md');
      return { ...tab, available: fs.existsSync(htmlPath) || fs.existsSync(mdPath) };
    });
    res.json(tabs);
  });

  app.get('/api/spec/:file', (req, res) => {
    const file = req.params.file;
    if (!file.endsWith('.html')) return res.status(400).send('Only .html files are served here');
    const htmlPath = path.join(specDir, file);
    if (fs.existsSync(htmlPath)) {
      try {
        const content = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(content);
      } catch (e) { return res.status(500).send(e.message); }
    }
    const mdPath = htmlPath.replace(/\.html$/, '.md');
    if (fs.existsSync(mdPath)) {
      try {
        const content = fs.readFileSync(mdPath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(mdToHtml(content));
      } catch (e) { return res.status(500).send(e.message); }
    }
    res.status(404).send('Not found');
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
    const isMd = changedPath.endsWith('.md');
    const isYaml = changedPath.endsWith('.yaml') || changedPath.endsWith('.yml');
    if (!isHtml && !isMd && !isYaml) return;
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

export function specList(opts = {}) {
  if (!fs.existsSync(CHANGES_DIR)) {
    if (opts.json) { console.log(JSON.stringify([])); return; }
    console.log('  (no specs found — run `modscape spec new <name>` to create one)');
    return;
  }

  const entries = fs.readdirSync(CHANGES_DIR)
    .filter(e => fs.statSync(path.join(CHANGES_DIR, e)).isDirectory())
    .sort();

  if (entries.length === 0) {
    if (opts.json) { console.log(JSON.stringify([])); return; }
    console.log('  (no specs found — run `modscape spec new <name>` to create one)');
    return;
  }

  const specs = entries.map(name => {
    const dir = path.join(CHANGES_DIR, name);
    const specMdPath = path.join(dir, 'spec.md');
    const tasksMdPath = path.join(dir, 'tasks.md');

    const title = (() => {
      if (!fs.existsSync(specMdPath)) return null;
      const content = fs.readFileSync(specMdPath, 'utf8');
      const m = content.match(/^#\s+(.+)/m);
      return m ? m[1].trim() : null;
    })();

    const taskProgress = (() => {
      if (!fs.existsSync(tasksMdPath)) return null;
      const content = fs.readFileSync(tasksMdPath, 'utf8');
      const done = (content.match(/- \[x\]/gi) || []).length;
      const total = done + (content.match(/- \[ \]/g) || []).length;
      return { done, total };
    })();

    const docs = ['spec.md', 'design.md', 'tasks.md', 'questions.md'].filter(
      f => fs.existsSync(path.join(dir, f))
    );

    return { name, title, docs, taskProgress };
  });

  if (opts.json) {
    console.log(JSON.stringify(specs, null, 2));
    return;
  }

  console.log(`\n  Specs in ${CHANGES_DIR}/\n`);
  for (const s of specs) {
    const label = s.title ? `${s.name}  (${s.title})` : s.name;
    const progress = s.taskProgress
      ? `  [${s.taskProgress.done}/${s.taskProgress.total} tasks]`
      : '';
    const docs = s.docs.length ? `  docs: ${s.docs.join(', ')}` : '';
    console.log(`  • ${label}${progress}${docs}`);
  }
  console.log('');
}

export function specNew(name) {
  const dir = path.join(CHANGES_DIR, name);

  if (fs.existsSync(dir)) {
    console.error(`  ❌ ${dir} already exists. Choose a different name.`);
    process.exit(1);
  }

  ensureDir(dir);

  console.log(`\n  📁 Scaffolding spec: ${name}\n`);

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

  // design.md
  writeIfNotExists(
    path.join(dir, 'design.md'),
    `# Design: ${name}\n\n## Design Decisions\n\n## Affected Tables\n\n### Direct Impact\n\n### Indirect Impact\n\n## Findings\n\n### Requires Model Change\n\n### Implementation Notes\n`
  );

  // tasks.md
  writeIfNotExists(
    path.join(dir, 'tasks.md'),
    `# Pipeline Tasks\n> Generated from: .modscape/changes/${name}/spec-model.yaml\n> Spec: .modscape/changes/${name}/spec.md\n> Progress: 0 / 0\n\n## Phase 1: Staging\n\n## Phase 2: Core\n\n## Phase 3: Mart\n\n## Phase 4: Tests\n`
  );

  // questions.md
  writeIfNotExists(
    path.join(dir, 'questions.md'),
    `# Questions: ${name}\n\n## Pipeline-level\n\n## Table-level\n`
  );

  console.log(`\n  ✅ Scaffold complete: ${dir}/`);
  console.log(`\n  Next: run /modscape:spec:requirements to fill in spec.md\n`);
}
