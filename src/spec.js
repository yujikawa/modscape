import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';

const CHANGES_DIR = '.modscape/changes';
const SPECS_DIR = '.modscape/specs';
const CONTEXT_YAML_PATH = path.join(SPECS_DIR, '_context.yaml');
const CONTEXT_YAML_TEMPLATE = `# .modscape/specs/_context.yaml
# Cross-project tacit knowledge from SDD interactions.
# Do NOT store schema info here — that belongs in model.yaml.
# Per-table knowledge belongs in specs/<table-id>/spec.md and questions.md.

decisions: []

questions: []
`;

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

  // _context.yaml — create empty template if not present
  ensureDir(SPECS_DIR);
  if (!fs.existsSync(CONTEXT_YAML_PATH)) {
    fs.writeFileSync(CONTEXT_YAML_PATH, CONTEXT_YAML_TEMPLATE, 'utf8');
    console.log(`  ✅ ${CONTEXT_YAML_PATH}`);
  }

  console.log(`\n  ✅ Scaffold complete: ${dir}/`);
  console.log(`\n  Next: run /modscape:spec:requirements to fill in spec.md\n`);
}
