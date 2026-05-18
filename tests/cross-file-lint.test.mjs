/**
 * Tests for cross-file duplicate table ID lint rule and extract duplicate warning.
 *
 * Run: node tests/cross-file-lint.test.mjs
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { lintModels } from '../src/lint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'src/index.js');
const FIXTURES = path.join(ROOT, 'tests/fixtures');

const dupA = path.join(FIXTURES, 'lint-dup-a.yaml');
const dupB = path.join(FIXTURES, 'lint-dup-b.yaml');
const consumer = path.join(FIXTURES, 'lint-import-consumer.yaml');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function runCLI(args) {
  const result = spawnSync('node', [CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { stdout: result.stdout || '', stderr: result.stderr || '', status: result.status };
}

// ── no-duplicate-table-ids: lintModels API ────────────────────────────────────

console.log('\n── no-duplicate-table-ids (lintModels API) ──');

const resultDup = lintModels([dupA, dupB]);
const dupWarn = resultDup.warnings.find(w => w.rule === 'no-duplicate-table-ids' && w.field.includes('shared_table'));
assert(!!dupWarn, 'Detects shared_table duplicated in two files');
assert(dupWarn?.files?.length === 2, 'Warning includes both files in files[] array');
assert(!resultDup.warnings.find(w => w.rule === 'no-duplicate-table-ids' && w.field.includes('unique_to_a')), 'unique_to_a (only in one file) is not flagged');

const resultImport = lintModels([dupA, consumer]);
const importWarn = resultImport.warnings.find(w => w.rule === 'no-duplicate-table-ids' && w.field.includes('shared_table'));
assert(!importWarn, 'No warning when consumer imports shared_table from dupA via imports:');

const resultSingle = lintModels([dupA]);
assert(!resultSingle.warnings.find(w => w.rule === 'no-duplicate-table-ids'), 'No cross-file warning when only one file is linted');

// ── no-duplicate-table-ids: severity off ─────────────────────────────────────

console.log('\n── no-duplicate-table-ids severity: off ──');

const rulesPath = path.join(ROOT, 'tests/fixtures/tmp-lint-rules.yaml');
fs.writeFileSync(rulesPath, 'no-duplicate-table-ids:\n  severity: off\n');
try {
  const resultOff = lintModels([dupA, dupB], { rulesPath });
  assert(!resultOff.warnings.find(w => w.rule === 'no-duplicate-table-ids'), 'no-duplicate-table-ids warning suppressed when severity is off');
} finally {
  fs.unlinkSync(rulesPath);
}

// ── no-duplicate-table-ids: CLI (--json) ─────────────────────────────────────

console.log('\n── no-duplicate-table-ids (CLI --json) ──');

const cliJson = runCLI(['lint', dupA, dupB, '--json']);
try {
  const json = JSON.parse(cliJson.stdout);
  const cliDupWarn = json.warnings?.find(w => w.rule === 'no-duplicate-table-ids');
  assert(!!cliDupWarn, 'CLI --json output contains no-duplicate-table-ids warning');
  assert(Array.isArray(cliDupWarn?.files), 'Warning entry has files[] array in JSON output');
} catch {
  assert(false, 'CLI --json output is valid JSON');
}

// ── extract duplicate warning ─────────────────────────────────────────────────

console.log('\n── extract duplicate-table-id warning ──');

const extractResult = runCLI(['extract', dupA, dupB, '--tables', 'shared_table', '-o', '/dev/null']);
assert(extractResult.stderr.includes('duplicate-table-id'), 'extract emits duplicate-table-id WARN to stderr');
assert(extractResult.stderr.includes('shared_table'), 'extract WARN message includes the table ID');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
