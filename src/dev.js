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
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          modelMap.set(path.parse(file).name, path.join(absolutePath, file));
        }
      });
    } else if (stats.isFile() && (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml'))) {
      modelMap.set(path.parse(absolutePath).name, absolutePath);
    }
  });
  return modelMap;
}

export async function startDevServer(paths) {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '10mb' }));
  const inputPaths = Array.isArray(paths) ? paths : [paths];
  let modelMap = scanFiles(inputPaths);
  const distPath = path.resolve(__dirname, '../visualizer-dist');

  const getModelPath = (slug) => modelMap.get(slug) || modelMap.values().next().value;

  const broadcast = (msg) => {
    const data = JSON.stringify(msg);
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(data); });
  };

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

  app.get('/api/context/tables', (req, res) => {
    const specsDir = path.resolve(process.cwd(), '.modscape/specs');
    if (!fs.existsSync(specsDir)) return res.json({});
    try {
      const result = {};
      const entries = fs.readdirSync(specsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
        const tableId = entry.name;
        const tableDir = path.join(specsDir, tableId);
        const specPath = path.join(tableDir, 'spec.md');
        const questionsPath = path.join(tableDir, 'questions.md');
        const spec = fs.existsSync(specPath) ? fs.readFileSync(specPath, 'utf8') : undefined;
        const questions = fs.existsSync(questionsPath) ? fs.readFileSync(questionsPath, 'utf8') : undefined;
        if (spec || questions) result[tableId] = { spec, questions };
      }
      res.json(result);
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
  let watchTimeout = null;
  const watcher = chokidar.watch([...inputPaths, contextYamlPath], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 100 }
  }).on('all', (event, changedPath) => {
    if (!changedPath.endsWith('.yaml') && !changedPath.endsWith('.yml')) return;

    const isContext = changedPath === contextYamlPath;
    if (watchTimeout) clearTimeout(watchTimeout);
    watchTimeout = setTimeout(() => {
      console.log(`  ✨ File ${event}: ${path.relative(process.cwd(), changedPath)}`);
      broadcast(isContext ? { type: 'context-update' } : { type: 'update' });
    }, 300);
  });
}
