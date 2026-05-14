import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { resolveImports } from './model-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function scanFiles(inputPaths) {
  const modelMap = new Map();
  inputPaths.forEach(inputPath => {
    const absolutePath = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`  ⚠️ Warning: Path not found: ${inputPath}`);
      return;
    }

    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(absolutePath);
      files.forEach(file => {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const slug = path.parse(file).name;
          const fullPath = path.join(absolutePath, file);
          if (modelMap.has(slug)) {
            const parentName = path.basename(absolutePath);
            modelMap.set(`${parentName}-${slug}`, fullPath);
          } else {
            modelMap.set(slug, fullPath);
          }
        }
      });
    } else if (stats.isFile() && (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml'))) {
      const slug = path.parse(absolutePath).name;
      modelMap.set(slug, absolutePath);
    }
  });
  return modelMap;
}

export async function build(paths, _visualizerPath, outputDir) {
  const modelMap = scanFiles(Array.isArray(paths) ? paths : [paths]);
  const distPath = path.resolve(__dirname, '../visualizer-dist');
  const singleFileHtml = path.join(distPath, 'index.html');

  if (modelMap.size === 0) {
    console.error('\n  ❌ Error: No YAML files found in the specified paths.');
    return;
  }

  if (!fs.existsSync(singleFileHtml)) {
    console.error('\n  ❌ Error: visualizer-dist/index.html not found. Please run "npm run build-ui" first.\n');
    return;
  }

  console.log(`\n  📦 Building with ${modelMap.size} model(s)...`);

  let html = fs.readFileSync(singleFileHtml, 'utf8');

  // Inject YAML data
  const modelsData = [];
  for (const [slug, absolutePath] of modelMap.entries()) {
    try {
      const content = fs.readFileSync(absolutePath, 'utf8');
      const raw = yaml.load(content) || {};
      const { schema } = resolveImports(raw, path.dirname(absolutePath));
      const name = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[-_]/g, ' ');
      modelsData.push({ slug, name, schema });
    } catch (e) {
      console.warn(`  ⚠️ Warning: Failed to load ${absolutePath}: ${e.message}`);
    }
  }

  const injectionData = { isMultiFile: modelsData.length > 1, models: modelsData };
  html = html.replace(
    '</head>',
    `<script>window.__MODSCAPE_DATA__ = ${JSON.stringify(injectionData)}; window.MODSCAPE_CLI_MODE = false;</script></head>`
  );

  const absoluteOutputDir = path.resolve(process.cwd(), outputDir);
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }
  const outPath = path.join(absoluteOutputDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');

  const sizeMb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n  ✅ Build complete! ${path.join(outputDir, 'index.html')} (${sizeMb} MB)`);
}
