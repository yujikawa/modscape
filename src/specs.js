import fs from 'fs';
import path from 'path';
import express from 'express';
import chokidar from 'chokidar';
import open from 'open';
import http from 'http';
import { WebSocketServer } from 'ws';

const SPECS_DIR = '.modscape/specs';

// Task 4.1: Scan .modscape/specs/ for model-slug subdirectories with .html/.md files
export function scanSpecsDir() {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  if (!fs.existsSync(baseDir)) return null;

  const result = [];
  let entries;
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch (e) {
    return null;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const slugDir = path.join(baseDir, entry.name);
    const files = fs.readdirSync(slugDir);
    const tables = [];
    for (const file of files) {
      if (file.startsWith('_')) continue;
      if (file.endsWith('.html') || file.endsWith('.md')) {
        const tableId = file.replace(/\.(html|md)$/, '');
        if (!tables.includes(tableId)) tables.push(tableId);
      }
    }
    if (tables.length > 0) {
      result.push({ modelSlug: entry.name, tables });
    }
  }
  return result;
}

// Task 4.3: Browser UI HTML for spec open
function buildBrowserHtml(specIndex) {
  const nav = specIndex.map(({ modelSlug, tables }) => {
    const items = tables.map(tableId =>
      `<li><a href="#" onclick="loadSpec('${modelSlug}','${tableId}');return false;" data-slug="${modelSlug}" data-table="${tableId}">${tableId}</a></li>`
    ).join('\n');
    return `<details open><summary>${modelSlug}</summary><ul>${items}</ul></details>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Modscape Spec Browser</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { display: flex; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #cbd5e1; }
#sidebar { width: 260px; min-width: 200px; border-right: 1px solid rgba(255,255,255,0.08); overflow-y: auto; padding: 16px 0; flex-shrink: 0; }
#sidebar h1 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #475569; padding: 0 16px 12px; }
details summary { cursor: pointer; padding: 6px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; user-select: none; }
details summary:hover { color: #94a3b8; }
details ul { list-style: none; padding: 0; }
details ul li a { display: block; padding: 5px 16px 5px 28px; font-size: 12px; color: #94a3b8; text-decoration: none; }
details ul li a:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
details ul li a.active { background: rgba(59,130,246,0.15); color: #60a5fa; }
#content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
#toolbar { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #475569; }
#pane { flex: 1; overflow: auto; }
iframe#spec-frame { width: 100%; height: 100%; border: none; }
pre#spec-pre { padding: 20px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #cbd5e1; }
#empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #334155; font-size: 14px; }
</style>
</head>
<body>
<div id="sidebar">
  <h1>Spec Browser</h1>
  ${nav}
</div>
<div id="content">
  <div id="toolbar" id="current-label">Select a table from the left panel</div>
  <div id="pane">
    <div id="empty">Select a table to view its spec</div>
    <iframe id="spec-frame" style="display:none"></iframe>
    <pre id="spec-pre" style="display:none"></pre>
  </div>
</div>
<script>
const ws = new WebSocket('ws://' + location.host);
ws.onmessage = () => location.reload();

function loadSpec(slug, tableId) {
  document.querySelectorAll('#sidebar a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector('[data-slug="' + slug + '"][data-table="' + tableId + '"]');
  if (link) link.classList.add('active');
  document.getElementById('toolbar').textContent = slug + ' / ' + tableId;

  const frame = document.getElementById('spec-frame');
  const pre = document.getElementById('spec-pre');
  const empty = document.getElementById('empty');
  empty.style.display = 'none';

  fetch('/api/spec-index').then(r => r.json()).then(index => {
    const entry = index.find(e => e.modelSlug === slug);
    if (!entry) return;

    const hasHtml = entry.tableFiles && entry.tableFiles[tableId] && entry.tableFiles[tableId].html;
    if (hasHtml) {
      pre.style.display = 'none';
      frame.style.display = 'block';
      frame.src = '/api/table-spec/' + encodeURIComponent(slug) + '/' + encodeURIComponent(tableId);
    } else {
      frame.style.display = 'none';
      frame.src = '';
      fetch('/api/table-spec-md/' + encodeURIComponent(slug) + '/' + encodeURIComponent(tableId))
        .then(r => r.text())
        .then(text => {
          pre.style.display = 'block';
          pre.textContent = text;
        });
    }
  });
}
</script>
</body>
</html>`;
}

// Task 4.2: modscape spec open
export async function startSpecOpenServer() {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const broadcast = () => {
    const data = JSON.stringify({ type: 'reload' });
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  };

  app.get('/api/spec-index', (_req, res) => {
    const index = scanSpecsDir();
    if (!index) return res.json([]);
    // Augment with per-table file availability info
    const augmented = index.map(({ modelSlug, tables }) => {
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
    res.json(augmented);
  });

  app.get('/api/table-spec/:modelSlug/:tableId', (req, res) => {
    const { modelSlug, tableId } = req.params;
    const filePath = path.join(baseDir, modelSlug, `${tableId}.html`);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/api/table-spec-md/:modelSlug/:tableId', (req, res) => {
    const { modelSlug, tableId } = req.params;
    const filePath = path.join(baseDir, modelSlug, `${tableId}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    try {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { res.status(500).send(e.message); }
  });

  app.get('/', (_req, res) => {
    const index = scanSpecsDir();
    if (!index) {
      res.send('<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#94a3b8"><h1>specs ディレクトリが見つかりません</h1><p>.modscape/specs/ を作成してください。</p></body></html>');
      return;
    }
    // Augment with tableFiles for the browser UI
    const augmented = index.map(({ modelSlug, tables }) => {
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
    res.send(buildBrowserHtml(augmented));
  });

  if (!fs.existsSync(baseDir)) {
    console.warn(`\n  ⚠️  .modscape/specs/ が見つかりません。`);
  }

  server.listen(5174, () => {
    console.log(`\n  🚀 Modscape Spec Browser: http://localhost:5174`);
    open('http://localhost:5174');
  });

  if (fs.existsSync(baseDir)) {
    let watchTimeout = null;
    chokidar.watch(baseDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
    }).on('all', (event, changedPath) => {
      if (watchTimeout) clearTimeout(watchTimeout);
      watchTimeout = setTimeout(() => {
        console.log(`  ✨ File ${event}: ${path.relative(process.cwd(), changedPath)}`);
        broadcast();
      }, 300);
    });
  }
}

// Task 4.4: modscape spec build
export async function buildSpecs(outDir = 'dist/specs') {
  const baseDir = path.resolve(process.cwd(), SPECS_DIR);
  if (!fs.existsSync(baseDir)) {
    console.error('\n  ❌ .modscape/specs/ が見つかりません。\n');
    process.exit(1);
  }

  const index = scanSpecsDir();
  if (!index || index.length === 0) {
    console.error('\n  ❌ .modscape/specs/ に spec ファイルが見つかりません。\n');
    process.exit(1);
  }

  const absoluteOutDir = path.resolve(process.cwd(), outDir);
  fs.mkdirSync(absoluteOutDir, { recursive: true });

  console.log(`\n  📦 Building spec browser to ${outDir}...`);

  // Copy spec files and collect full index
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

  // Generate static index.html (inline spec serving via relative paths)
  const staticHtml = buildStaticBrowserHtml(augmented);
  fs.writeFileSync(path.join(absoluteOutDir, 'index.html'), staticHtml, 'utf8');
  console.log(`  ✅ index.html`);
  console.log(`\n  ✅ Build complete! → ${outDir}/\n`);
}

function buildStaticBrowserHtml(specIndex) {
  const nav = specIndex.map(({ modelSlug, tables, tableFiles }) => {
    const items = tables.map(tableId => {
      const hasHtml = tableFiles[tableId] && tableFiles[tableId].html;
      const hasMd = tableFiles[tableId] && tableFiles[tableId].md;
      return `<li><a href="#" onclick="loadSpec('${modelSlug}','${tableId}',${hasHtml},${hasMd});return false;" data-slug="${modelSlug}" data-table="${tableId}">${tableId}</a></li>`;
    }).join('\n');
    return `<details open><summary>${modelSlug}</summary><ul>${items}</ul></details>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Modscape Spec Browser</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { display: flex; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #cbd5e1; }
#sidebar { width: 260px; min-width: 200px; border-right: 1px solid rgba(255,255,255,0.08); overflow-y: auto; padding: 16px 0; flex-shrink: 0; }
#sidebar h1 { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #475569; padding: 0 16px 12px; }
details summary { cursor: pointer; padding: 6px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; user-select: none; }
details summary:hover { color: #94a3b8; }
details ul { list-style: none; padding: 0; }
details ul li a { display: block; padding: 5px 16px 5px 28px; font-size: 12px; color: #94a3b8; text-decoration: none; }
details ul li a:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
details ul li a.active { background: rgba(59,130,246,0.15); color: #60a5fa; }
#content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
#toolbar { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #475569; }
#pane { flex: 1; overflow: auto; }
iframe#spec-frame { width: 100%; height: 100%; border: none; }
pre#spec-pre { padding: 20px; font-size: 12px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #cbd5e1; }
#empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #334155; font-size: 14px; }
</style>
</head>
<body>
<div id="sidebar">
  <h1>Spec Browser</h1>
  ${nav}
</div>
<div id="content">
  <div id="toolbar">Select a table from the left panel</div>
  <div id="pane">
    <div id="empty">Select a table to view its spec</div>
    <iframe id="spec-frame" style="display:none"></iframe>
    <pre id="spec-pre" style="display:none"></pre>
  </div>
</div>
<script>
function loadSpec(slug, tableId, hasHtml, hasMd) {
  document.querySelectorAll('#sidebar a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector('[data-slug="' + slug + '"][data-table="' + tableId + '"]');
  if (link) link.classList.add('active');
  document.getElementById('toolbar').textContent = slug + ' / ' + tableId;

  const frame = document.getElementById('spec-frame');
  const pre = document.getElementById('spec-pre');
  const empty = document.getElementById('empty');
  empty.style.display = 'none';

  if (hasHtml) {
    pre.style.display = 'none';
    frame.style.display = 'block';
    frame.src = slug + '/' + tableId + '.html';
  } else if (hasMd) {
    frame.style.display = 'none';
    frame.src = '';
    fetch(slug + '/' + tableId + '.md')
      .then(r => r.text())
      .then(text => {
        pre.style.display = 'block';
        pre.textContent = text;
      });
  }
}
</script>
</body>
</html>`;
}
