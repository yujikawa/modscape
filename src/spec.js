import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import express from 'express';
import chokidar from 'chokidar';
import open from 'open';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';
import { readSpecConfig, resolveImports } from './model-utils.js';

const __hlCss = fs.readFileSync(
  new URL('../node_modules/highlight.js/styles/atom-one-light.css', import.meta.url),
  'utf8'
);

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
}));

function mdToHtml(mdContent) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
${__hlCss}
*, *::before, *::after { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; color: #334155; line-height: 1.7; padding: 2rem; max-width: 900px; margin: 0 auto; }
h1 { font-size: 1.6rem; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 0; }
h2 { font-size: 1.05rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; margin-top: 2rem; }
h3 { font-size: 1rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; }
h4 { font-size: 0.9rem; font-weight: 600; color: #475569; margin-top: 1rem; }
p { color: #475569; margin: 0.5rem 0 1rem; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
ul, ol { padding-left: 1.5rem; color: #475569; }
li { margin: 0.3rem 0; }
li input[type="checkbox"] { margin-right: 0.4rem; }
blockquote { border-left: 3px solid #cbd5e1; margin: 1rem 0; padding: 0.5rem 1rem; background: #f1f5f9; color: #64748b; border-radius: 0 0.25rem 0.25rem 0; }
blockquote p { margin: 0; }
code { font-family: 'SF Mono','Fira Code','Cascadia Code', monospace; font-size: 0.85em; background: #f1f5f9; color: #0550ae; padding: 0.15rem 0.4rem; border-radius: 0.25rem; border: 1px solid #e2e8f0; }
pre { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 0.5rem; padding: 1rem 1.25rem; overflow-x: auto; margin: 1rem 0; }
pre code { background: none; color: inherit; padding: 0; border: none; font-size: 0.85rem; line-height: 1.7; }
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
thead tr { background: #f1f5f9; }
th { text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; }
td { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; color: #475569; }
tbody tr:hover { background: #f8fafc; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
</style>
</head><body>
${marked.parse(mdContent)}
</body></html>`;
}

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
