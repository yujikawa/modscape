/**
 * Tests for lineage --involves filter and merge --replace-owned-lineage
 *
 * Run: node tests/lineage-replace.test.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'src/index.js');
const TMP = path.join(ROOT, 'tests/fixtures/tmp-lineage-replace');

let passed = 0;
let failed = 0;

function run(cmd) {
  return execSync(`node ${CLI} ${cmd}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function setup() {
  fs.mkdirSync(TMP, { recursive: true });
}

function cleanup() {
  fs.rmSync(TMP, { recursive: true, force: true });
}

// Base model: int_table → factA → mart, external → int_table (cross-boundary)
const BASE_MODEL = {
  version: '2.0.0',
  tables: [
    { id: 'external_table', conceptual: { name: 'External', kind: 'table' } },
    { id: 'int_table', conceptual: { name: 'Int', kind: 'table' } },
    { id: 'factA', conceptual: { name: 'FactA', kind: 'fact' } },
    { id: 'mart', conceptual: { name: 'Mart', kind: 'mart' } },
  ],
  lineage: [
    { id: 'lin-ext-int', from: 'external_table', to: 'int_table' },
    { id: 'lin-int-factA', from: 'int_table', to: 'factA' },
    { id: 'lin-factA-mart', from: 'factA', to: 'mart' },
  ],
};

// Patch model (spec-model): int_table → intA → factA, adds intA as intermediate
const PATCH_MODEL = {
  version: '2.0.0',
  tables: [
    { id: 'int_table', conceptual: { name: 'Int', kind: 'table' } },
    { id: 'intA', conceptual: { name: 'IntA', kind: 'table' } },
    { id: 'factA', conceptual: { name: 'FactA', kind: 'fact' } },
    { id: 'mart', conceptual: { name: 'Mart', kind: 'mart' } },
  ],
  lineage: [
    { id: 'lin-int-intA', from: 'int_table', to: 'intA' },
    { id: 'lin-intA-factA', from: 'intA', to: 'factA' },
    { id: 'lin-factA-mart', from: 'factA', to: 'mart' },
  ],
};

function writeYaml(filePath, data) {
  fs.writeFileSync(filePath, yaml.dump(data, { lineWidth: -1 }), 'utf8');
}

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

console.log('\n## lineage list --involves filter\n');

setup();

const baseFile = path.join(TMP, 'base.yaml');
writeYaml(baseFile, BASE_MODEL);

// 1.3: --involves filters correctly
const involvesResult = JSON.parse(run(`lineage list ${baseFile} --involves int_table --json`));
assert(involvesResult.length === 2, '--involves int_table returns 2 entries (lin-ext-int, lin-int-factA)');
assert(involvesResult.some(e => e.id === 'lin-ext-int'), 'lin-ext-int (to: int_table) is included');
assert(involvesResult.some(e => e.id === 'lin-int-factA'), 'lin-int-factA (from: int_table) is included');
assert(!involvesResult.some(e => e.id === 'lin-factA-mart'), 'lin-factA-mart (unrelated) is excluded');

const noMatchResult = JSON.parse(run(`lineage list ${baseFile} --involves unknown_table --json`));
assert(noMatchResult.length === 0, '--involves unknown_table returns empty array');

const allResult = JSON.parse(run(`lineage list ${baseFile} --json`));
assert(allResult.length === 3, 'without --involves, all 3 entries are returned');

console.log('\n## merge --patch --replace-owned-lineage\n');

// 2.5 & 2.6: --replace-owned-lineage replaces within-scope lineage
const patchFile = path.join(TMP, 'patch.yaml');
const outFile = path.join(TMP, 'merged.yaml');
writeYaml(patchFile, PATCH_MODEL);

// with --replace-owned-lineage
run(`merge ${baseFile} ${patchFile} --patch --replace-owned-lineage --output ${outFile}`);
const merged = readYaml(outFile);
const mergedLineage = merged.lineage || [];
const mergedIds = mergedLineage.map(l => l.id);

// Cross-boundary preserved
assert(mergedIds.includes('lin-ext-int'), 'cross-boundary lin-ext-int is preserved');

// Old within-scope path removed
assert(!mergedIds.includes('lin-int-factA'), 'stale lin-int-factA is removed');

// New within-scope paths added
assert(mergedIds.includes('lin-int-intA'), 'new lin-int-intA is added');
assert(mergedIds.includes('lin-intA-factA'), 'new lin-intA-factA is added');
assert(mergedIds.includes('lin-factA-mart'), 'lin-factA-mart is preserved/updated');

// 2.6: without flag, old behavior maintained
const outFileNoflag = path.join(TMP, 'merged-noflag.yaml');
writeYaml(outFileNoflag, yaml.load(fs.readFileSync(baseFile, 'utf8')));
run(`merge ${baseFile} ${patchFile} --patch --output ${outFileNoflag}`);
const mergedNoflag = readYaml(outFileNoflag);
const noflagIds = (mergedNoflag.lineage || []).map(l => l.id);
assert(noflagIds.includes('lin-int-factA'), 'without flag: stale lin-int-factA is NOT removed (old upsert behavior)');
assert(noflagIds.includes('lin-int-intA'), 'without flag: new lin-int-intA is still added');

cleanup();

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
