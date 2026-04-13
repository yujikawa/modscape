/**
 * Tests for modscape extract --with-downstream
 *
 * Run: node tests/extract-downstream.test.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'src/index.js');
const TMP = path.join(ROOT, 'tests/fixtures/tmp-extract-downstream');

let passed = 0;
let failed = 0;

function run(cmd) {
  return execSync(`node ${CLI} ${cmd}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function runRaw(cmd) {
  const args = cmd.split(' ');
  const result = spawnSync('node', [CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { stdout: result.stdout || '', stderr: result.stderr || '' };
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

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

// Setup temp directory and fixture YAMLs
fs.mkdirSync(TMP, { recursive: true });

// --- Fixture: primary.yaml ---
// fct_orders → mart_monthly → report_a
//           └→ mart_weekly
const primaryYaml = {
  tables: [
    { id: 'fct_orders', name: 'Orders', appearance: { type: 'fact' } },
    { id: 'mart_monthly', name: 'Monthly', appearance: { type: 'mart' } },
    { id: 'mart_weekly', name: 'Weekly', appearance: { type: 'mart' } },
  ],
  lineage: [
    { from: 'fct_orders', to: 'mart_monthly' },
    { from: 'fct_orders', to: 'mart_weekly' },
  ],
};
fs.writeFileSync(path.join(TMP, 'primary.yaml'), yaml.dump(primaryYaml));

// --- Fixture: secondary.yaml ---
// mart_monthly → report_a (mart_monthly lives in primary.yaml but report_a lives here)
const secondaryYaml = {
  tables: [
    { id: 'report_a', name: 'Report A', appearance: { type: 'mart' } },
  ],
  lineage: [
    { from: 'mart_monthly', to: 'report_a' },
  ],
};
fs.writeFileSync(path.join(TMP, 'secondary.yaml'), yaml.dump(secondaryYaml));

// --- Fixture: multi-start.yaml ---
// hub_a → dim_a → fct_x → mart_x
// hub_b → dim_b → fct_x
const multiStartYaml = {
  tables: [
    { id: 'hub_a', name: 'Hub A', appearance: { type: 'hub' } },
    { id: 'hub_b', name: 'Hub B', appearance: { type: 'hub' } },
    { id: 'dim_a', name: 'Dim A', appearance: { type: 'dimension' } },
    { id: 'dim_b', name: 'Dim B', appearance: { type: 'dimension' } },
    { id: 'fct_x', name: 'Fact X', appearance: { type: 'fact' } },
    { id: 'mart_x', name: 'Mart X', appearance: { type: 'mart' } },
  ],
  lineage: [
    { from: 'hub_a', to: 'dim_a' },
    { from: 'hub_b', to: 'dim_b' },
    { from: 'dim_a', to: 'fct_x' },
    { from: 'dim_b', to: 'fct_x' },
    { from: 'fct_x', to: 'mart_x' },
  ],
};
fs.writeFileSync(path.join(TMP, 'multi-start.yaml'), yaml.dump(multiStartYaml));

// --- Fixture: cycle.yaml ---
// a → b → c → a  (true cycle)
const cycleYaml = {
  tables: [
    { id: 'a', name: 'A', appearance: { type: 'table' } },
    { id: 'b', name: 'B', appearance: { type: 'table' } },
    { id: 'c', name: 'C', appearance: { type: 'table' } },
  ],
  lineage: [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'a' },
  ],
};
fs.writeFileSync(path.join(TMP, 'cycle.yaml'), yaml.dump(cycleYaml));

// --- Fixture: diamond.yaml ---
// root → left → sink
//      → right → sink  (diamond — NOT a cycle)
const diamondYaml = {
  tables: [
    { id: 'root', name: 'Root', appearance: { type: 'fact' } },
    { id: 'left', name: 'Left', appearance: { type: 'mart' } },
    { id: 'right', name: 'Right', appearance: { type: 'mart' } },
    { id: 'sink', name: 'Sink', appearance: { type: 'mart' } },
  ],
  lineage: [
    { from: 'root', to: 'left' },
    { from: 'root', to: 'right' },
    { from: 'left', to: 'sink' },
    { from: 'right', to: 'sink' },
  ],
};
fs.writeFileSync(path.join(TMP, 'diamond.yaml'), yaml.dump(diamondYaml));

// ============================================================
// Test Suite
// ============================================================

console.log('\n== Test: --with-downstream basic downstream collection ==');
{
  const out = path.join(TMP, 'out-basic.yaml');
  run(`extract ${TMP}/primary.yaml --tables fct_orders --with-downstream --output ${out}`);
  const result = readYaml(out);
  const ids = result.tables.map(t => t.id).sort();
  assert(ids.includes('fct_orders'), 'starting table included');
  assert(ids.includes('mart_monthly'), 'direct downstream mart_monthly included');
  assert(ids.includes('mart_weekly'), 'direct downstream mart_weekly included');
  assert(ids.length === 3, `exactly 3 tables extracted (got ${ids.length})`);
  assert(result.lineage?.length === 2, `lineage entries included (got ${result.lineage?.length})`);
}

console.log('\n== Test: multiple starting tables — union of downstreams ==');
{
  const out = path.join(TMP, 'out-multi-start.yaml');
  run(`extract ${TMP}/multi-start.yaml --tables hub_a,hub_b --with-downstream --output ${out}`);
  const result = readYaml(out);
  const ids = result.tables.map(t => t.id).sort();
  assert(ids.includes('hub_a'), 'hub_a included');
  assert(ids.includes('hub_b'), 'hub_b included');
  assert(ids.includes('dim_a'), 'downstream dim_a included');
  assert(ids.includes('dim_b'), 'downstream dim_b included');
  assert(ids.includes('fct_x'), 'shared downstream fct_x included once');
  assert(ids.includes('mart_x'), 'transitive downstream mart_x included');
  assert(ids.length === 6, `all 6 tables extracted without duplicates (got ${ids.length})`);
}

console.log('\n== Test: diamond graph — no false cycle warning ==');
{
  const out = path.join(TMP, 'out-diamond.yaml');
  const result = runRaw(`extract ${TMP}/diamond.yaml --tables root --with-downstream --output ${out}`);
  const ids = readYaml(out).tables.map(t => t.id).sort();
  assert(!result.stderr.includes('Circular'), 'no false cycle warning for diamond graph');
  assert(ids.includes('sink'), 'sink reached via both paths');
  assert(ids.length === 4, `all 4 nodes extracted once (got ${ids.length})`);
}

console.log('\n== Test: true cycle — warning emitted, no infinite loop ==');
{
  const out = path.join(TMP, 'out-cycle.yaml');
  const result = runRaw(`extract ${TMP}/cycle.yaml --tables a --with-downstream --output ${out}`);
  assert(result.stderr.includes('Circular'), 'circular lineage warning emitted');
  const extracted = readYaml(out);
  assert(extracted.tables?.length > 0, 'tables extracted despite cycle');
}

console.log('\n== Test: without --with-downstream, existing behavior unchanged ==');
{
  const out = path.join(TMP, 'out-no-flag.yaml');
  run(`extract ${TMP}/primary.yaml --tables fct_orders --output ${out}`);
  const result = readYaml(out);
  const ids = result.tables.map(t => t.id);
  assert(ids.length === 1 && ids[0] === 'fct_orders', 'only specified table extracted (no downstream)');
  assert(!result.lineage, 'no lineage in output when both ends not in table list');
}

console.log('\n== Test: cross-YAML downstream (primary.yaml + secondary.yaml) ==');
{
  const out = path.join(TMP, 'out-cross.yaml');
  run(`extract ${TMP}/primary.yaml ${TMP}/secondary.yaml --tables fct_orders --with-downstream --output ${out}`);
  const result = readYaml(out);
  const ids = result.tables.map(t => t.id).sort();
  assert(ids.includes('fct_orders'), 'fct_orders included');
  assert(ids.includes('mart_monthly'), 'mart_monthly from primary included');
  assert(ids.includes('mart_weekly'), 'mart_weekly from primary included');
  assert(ids.includes('report_a'), 'report_a from secondary included (cross-YAML downstream)');
  assert(ids.length === 4, `4 tables across 2 YAMLs (got ${ids.length})`);
}

console.log('\n== Test: --record maps downstream tables to correct source YAML ==');
{
  const out = path.join(TMP, 'out-record.yaml');
  const cfg = path.join(TMP, 'spec-config.yaml');
  if (fs.existsSync(cfg)) fs.unlinkSync(cfg);
  run(`extract ${TMP}/primary.yaml ${TMP}/secondary.yaml --tables fct_orders --with-downstream --output ${out} --record ${cfg}`);
  const config = readYaml(cfg);
  const primaryEntry = config.main_yamls.find(e => e.path.endsWith('primary.yaml'));
  const secondaryEntry = config.main_yamls.find(e => e.path.endsWith('secondary.yaml'));
  assert(!!primaryEntry, 'primary.yaml entry exists in spec-config.yaml');
  assert(primaryEntry?.tables.includes('fct_orders'), 'fct_orders recorded under primary.yaml');
  assert(primaryEntry?.tables.includes('mart_monthly'), 'mart_monthly recorded under primary.yaml');
  assert(!!secondaryEntry, 'secondary.yaml auto-added as new entry');
  assert(secondaryEntry?.tables.includes('report_a'), 'report_a recorded under secondary.yaml');
}

// Cleanup
fs.rmSync(TMP, { recursive: true, force: true });

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
