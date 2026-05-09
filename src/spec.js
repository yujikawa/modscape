import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';
import { readSpecConfig } from './model-utils.js';

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
