/**
 * Unit tests for src/migrate.js — v1→v2 migration logic
 *
 * Run: node tests/migrate.test.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

import { migrateV1toV2, migrateToLatest, detectVersion } from '../src/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'src/index.js');
const TMP = path.join(ROOT, 'tests/fixtures/tmp-migrate');

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

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    console.error(`     Expected: ${e}`);
    console.error(`     Actual:   ${a}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n▶ ${title}`);
}

// Setup temp directory
fs.mkdirSync(TMP, { recursive: true });

// ── T40: テーブルフィールドの変換 ─────────────────────────────────────────────

section('T40: Table field conversions');

{
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'fct_orders',
      name: 'Orders',
      logical_name: 'Order Transactions',
      physical_name: 'fct_retail_sales',
      appearance: { type: 'fact', icon: '💰', color: '#e0f2fe' },
    }]
  };
  const v2 = migrateV1toV2(v1);
  const t = v2.tables[0];

  assert(t.conceptual?.name === 'Orders', 'name → conceptual.name');
  assert(t.logical?.name === 'Order Transactions', 'logical_name → logical.name');
  assert(t.physical?.name === 'fct_retail_sales', 'physical_name → physical.name');
  assert(t.conceptual?.kind === 'fact', 'appearance.type → conceptual.kind');
  assert(t.display?.icon === '💰', 'appearance.icon → display.icon');
  assert(t.display?.color === '#e0f2fe', 'appearance.color → display.color');
  assert(t.name === undefined, 'top-level name removed');
  assert(t.logical_name === undefined, 'logical_name removed');
  assert(t.physical_name === undefined, 'physical_name removed');
  assert(t.appearance === undefined, 'appearance removed');
}

// ── T41: implementation の分割 ─────────────────────────────────────────────────

section('T41: implementation split into physical');

{
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'fct_orders',
      name: 'Orders',
      appearance: { type: 'fact' },
      implementation: {
        materialization: 'incremental',
        incremental_strategy: 'merge',
        unique_key: 'order_id',
        partition_by: { field: 'event_date', granularity: 'day' },
        cluster_by: ['customer_id'],
        incremental_key: 'updated_at',
        incremental_lookback: '3 days',
      }
    }]
  };
  const v2 = migrateV1toV2(v1);
  const p = v2.tables[0].physical;

  assert(p?.strategy === 'incremental', 'materialization → physical.strategy');
  assert(p?.update_mode === 'merge', 'incremental_strategy → physical.update_mode');
  assertDeepEqual(p?.merge_key, ['order_id'], 'unique_key → physical.merge_key (array)');
  assertDeepEqual(p?.partition, { field: 'event_date', granularity: 'day' }, 'partition_by → physical.partition');
  assertDeepEqual(p?.cluster, ['customer_id'], 'cluster_by → physical.cluster');
  assert(p?.filter_key === 'updated_at', 'incremental_key → physical.filter_key');
  assert(p?.lookback === '3 days', 'incremental_lookback → physical.lookback');
  assert(v2.tables[0].implementation === undefined, 'implementation removed');
}

{
  // delete+insert → delete_insert
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 't1',
      name: 'T1',
      implementation: { incremental_strategy: 'delete+insert' }
    }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.tables[0].physical?.update_mode === 'delete_insert',
    'incremental_strategy "delete+insert" → "delete_insert"');
}

{
  // measures are NOT carried over (dropped per spec)
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'mart',
      name: 'Mart',
      implementation: {
        grain: ['month_key'],
        measures: [{ column: 'rev', agg: 'sum', source_column: 'fct.amount' }]
      }
    }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.tables[0].logical?.grain !== undefined, 'implementation.grain → logical.grain preserved');
  assert(v2.tables[0].physical?.measures === undefined, 'implementation.measures dropped');
}

// ── T42: SCD統合 ──────────────────────────────────────────────────────────────

section('T42: SCD merge into logical.scd');

{
  // Full SCD2: appearance.scd + implementation.scd2
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'dim_customers',
      name: 'Customers',
      appearance: { type: 'dimension', scd: 'type2' },
      implementation: {
        scd2: {
          business_key: ['customer_id'],
          valid_from: 'valid_from',
          valid_to: 'valid_to',
          current_flag: 'is_current'
        }
      }
    }]
  };
  const v2 = migrateV1toV2(v1);
  const scd = v2.tables[0].logical?.scd;
  assert(scd?.type === 'type2', 'SCD: appearance.scd → logical.scd.type');
  assertDeepEqual(scd?.business_key, ['customer_id'], 'SCD: business_key preserved');
  assert(scd?.valid_from === 'valid_from', 'SCD: valid_from preserved');
  assert(scd?.valid_to === 'valid_to', 'SCD: valid_to preserved');
  assert(scd?.current_flag === 'is_current', 'SCD: current_flag preserved');
}

{
  // appearance.scd only (no scd2)
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 'dim', name: 'Dim', appearance: { type: 'dimension', scd: 'type2' } }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.tables[0].logical?.scd?.type === 'type2', 'appearance.scd only → logical.scd.type set');
  assert(v2.tables[0].logical?.scd?.business_key === undefined, 'no scd2 → business_key absent');
}

{
  // implementation.scd2 only (no appearance.scd)
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'dim',
      name: 'Dim',
      implementation: { scd2: { business_key: ['cid'], valid_from: 'vf', valid_to: 'vt' } }
    }]
  };
  const v2 = migrateV1toV2(v1);
  assertDeepEqual(v2.tables[0].logical?.scd?.business_key, ['cid'],
    'scd2 only → logical.scd fields set');
  assert(v2.tables[0].logical?.scd?.valid_from === 'vf', 'scd2 only → valid_from');
}

// ── T43: カラムのフラット化 ───────────────────────────────────────────────────

section('T43: Column flattening (logical: wrapper removed)');

{
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 'fct_orders',
      name: 'Orders',
      columns: [{
        id: 'order_id',
        logical: {
          name: 'Order ID',
          type: 'Int',
          description: 'Surrogate key',
          isPrimaryKey: true,
          isForeignKey: false,
          isPartitionKey: false,
          additivity: 'fully'
        },
        physical: { name: 'order_id_pk', type: 'BIGINT' }
      }]
    }]
  };
  const v2 = migrateV1toV2(v1);
  const col = v2.tables[0].columns[0];

  assert(col.name === 'Order ID', 'column.logical.name → column.name');
  assert(col.type === 'Int', 'column.logical.type → column.type');
  assert(col.description === 'Surrogate key', 'column.logical.description → column.description');
  assert(col.isPrimaryKey === true, 'column.logical.isPrimaryKey → column.isPrimaryKey');
  assert(col.isForeignKey === false, 'column.logical.isForeignKey → column.isForeignKey');
  assert(col.isPartitionKey === false, 'column.logical.isPartitionKey → column.isPartitionKey');
  assert(col.additivity === 'fully', 'column.logical.additivity → column.additivity');
  assert(col.logical === undefined, 'column.logical wrapper removed');
  assertDeepEqual(col.physical, { name: 'order_id_pk', type: 'BIGINT' }, 'column.physical preserved');
}

// ── T44: その他の変換 ─────────────────────────────────────────────────────────

section('T44: Other conversions');

{
  // conceptual.tags → metadata.tags
  const v1 = {
    version: '1.0.0',
    tables: [{
      id: 't1',
      name: 'T1',
      conceptual: { description: 'Desc', tags: ['WHO', 'WHAT'] }
    }]
  };
  const v2 = migrateV1toV2(v1);
  assertDeepEqual(v2.tables[0].metadata?.tags, ['WHO', 'WHAT'], 'conceptual.tags → metadata.tags');
  assert(v2.tables[0].conceptual?.description === 'Desc', 'conceptual.description preserved');
}

{
  // domains.color → domains.display.color
  const v1 = {
    version: '1.0.0',
    domains: [{ id: 'dom', name: 'Dom', color: 'rgba(59,130,246,0.1)', members: [] }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.domains[0].display?.color === 'rgba(59,130,246,0.1)', 'domain.color → domain.display.color');
  assert(v2.domains[0].color === undefined, 'domain.color removed');
}

{
  // consumers.appearance → consumers.display
  const v1 = {
    version: '1.0.0',
    consumers: [{ id: 'dash', name: 'Dash', appearance: { icon: '📊', color: '#e0f2fe' } }]
  };
  const v2 = migrateV1toV2(v1);
  assertDeepEqual(v2.consumers[0].display, { icon: '📊', color: '#e0f2fe' },
    'consumer.appearance → consumer.display');
  assert(v2.consumers[0].appearance === undefined, 'consumer.appearance removed');
}

{
  // annotation.targetId + targetType → target: { id, type }
  const v1 = {
    version: '1.0.0',
    annotations: [{
      id: 'note_1',
      text: 'Grain note',
      type: 'sticky',
      color: '#fef9c3',
      targetId: 'fct_orders',
      targetType: 'table',
      offset: { x: 100, y: -80 }
    }]
  };
  const v2 = migrateV1toV2(v1);
  const a = v2.annotations[0];
  assertDeepEqual(a.target, { id: 'fct_orders', type: 'table' }, 'annotation.targetId+targetType → target');
  assertDeepEqual(a.display, { color: '#fef9c3' }, 'annotation.color → annotation.display.color');
  assert(a.type === undefined, 'annotation.type (sticky/callout) removed');
  assert(a.targetId === undefined, 'annotation.targetId removed');
  assert(a.targetType === undefined, 'annotation.targetType removed');
  assert(a.color === undefined, 'annotation.color removed');
}

{
  // annotation without targetId — no target object
  const v1 = {
    version: '1.0.0',
    annotations: [{ id: 'note_1', text: 'Floating note', type: 'callout' }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.annotations[0].target === undefined, 'annotation without targetId has no target');
  assert(v2.annotations[0].type === undefined, 'callout type removed');
}

{
  // layout.parentId stripped
  const v1 = {
    version: '1.0.0',
    layout: {
      dom1: { x: 0, y: 0, width: 880, height: 400 },
      fct_orders: { x: 80, y: 80, parentId: 'dom1' },
      mart: { x: 1200, y: 200 }
    }
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.layout.fct_orders?.parentId === undefined, 'layout.parentId stripped');
  assert(v2.layout.fct_orders?.x === 80, 'layout.x preserved');
  assert(v2.layout.dom1?.width === 880, 'domain layout preserved');
}

// ── T45: エッジケース ─────────────────────────────────────────────────────────

section('T45: Edge cases');

{
  // appearance が省略されたテーブル
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1' }]
  };
  let error = null;
  try { migrateV1toV2(v1); } catch (e) { error = e; }
  assert(error === null, 'table without appearance does not throw');
}

{
  // implementation が省略されたテーブル
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1', appearance: { type: 'fact' } }]
  };
  let error = null;
  try { migrateV1toV2(v1); } catch (e) { error = e; }
  assert(error === null, 'table without implementation does not throw');
}

{
  // columns が空のテーブル
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1', columns: [] }]
  };
  let error = null;
  try { migrateV1toV2(v1); } catch (e) { error = e; }
  assert(error === null, 'table with empty columns does not throw');
}

{
  // logical/physical に内容がなければ undefined のまま
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1' }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.tables[0].logical === undefined, 'no logical fields → logical is absent');
  assert(v2.tables[0].physical === undefined, 'no physical fields → physical is absent');
}

{
  // name だけある場合 conceptual は存在するが logical は absent
  const v1 = {
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1', appearance: { type: 'table' } }]
  };
  const v2 = migrateV1toV2(v1);
  assert(v2.tables[0].conceptual !== undefined, 'conceptual created from name+kind');
  assert(v2.tables[0].logical === undefined, 'logical absent when no logical fields');
}

// ── T46: バージョンチェーンの動作 ────────────────────────────────────────────

section('T46: Version chain behavior');

{
  // v1 → migrateToLatest → v2
  const v1 = { version: '1.0.0', tables: [{ id: 't1', name: 'T1' }] };
  const result = migrateToLatest(v1);
  assert(result.version === '2.0.0', 'migrateToLatest: v1 → v2.0.0');
}

{
  // unversioned → treated as v1 → v2
  const unversioned = { tables: [{ id: 't1', name: 'T1' }] };
  const result = migrateToLatest(unversioned);
  assert(result.version === '2.0.0', 'migrateToLatest: unversioned → v2.0.0');
}

{
  // already v2 → no change
  const v2 = { version: '2.0.0', tables: [{ id: 't1', conceptual: { name: 'T1', kind: 'table' } }] };
  const result = migrateToLatest(v2);
  assert(result.version === '2.0.0', 'migrateToLatest: already v2 unchanged');
  assert(result.tables[0].conceptual?.name === 'T1', 'migrateToLatest: v2 tables preserved');
}

{
  // detectVersion: explicit version string
  assert(detectVersion({ version: '1.0.0' }) === '1.0.0', 'detectVersion: explicit 1.0.0');
  assert(detectVersion({ version: '2.0.0' }) === '2.0.0', 'detectVersion: explicit 2.0.0');
  assert(detectVersion({}) === '1.0.0', 'detectVersion: missing → 1.0.0');
}

// ── T47: CLI コマンド ─────────────────────────────────────────────────────────

section('T47: modscape migrate CLI command');

function runCli(args) {
  const result = spawnSync('node', [CLI, ...args], { cwd: ROOT, encoding: 'utf8' });
  return { stdout: result.stdout || '', stderr: result.stderr || '', status: result.status };
}

{
  // v1 ファイルを --out で変換
  const src = path.join(TMP, 'v1-sample.yaml');
  const out = path.join(TMP, 'v2-out.yaml');
  const v1Content = yaml.dump({
    version: '1.0.0',
    tables: [{ id: 'fct_orders', name: 'Orders', appearance: { type: 'fact' } }]
  });
  fs.writeFileSync(src, v1Content);

  const { status, stderr } = runCli(['migrate', src, '--out', out]);
  assert(status === 0, 'migrate --out: exit code 0');
  assert(fs.existsSync(out), 'migrate --out: output file created');

  if (fs.existsSync(out)) {
    const result = yaml.load(fs.readFileSync(out, 'utf8'));
    assert(result.version === '2.0.0', 'migrate --out: output version is 2.0.0');
    assert(result.tables[0].conceptual?.kind === 'fact', 'migrate --out: conceptual.kind set');
  }
}

{
  // --dry-run: ファイルが変更されない
  const src = path.join(TMP, 'v1-dryrun.yaml');
  const v1Content = yaml.dump({
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1' }]
  });
  fs.writeFileSync(src, v1Content);
  const before = fs.readFileSync(src, 'utf8');

  runCli(['migrate', src, '--dry-run']);
  const after = fs.readFileSync(src, 'utf8');
  assert(before === after, 'migrate --dry-run: file unchanged');
}

{
  // in-place migration: .bak バックアップが作成される
  const src = path.join(TMP, 'v1-inplace.yaml');
  const bak = src + '.bak';
  const v1Content = yaml.dump({
    version: '1.0.0',
    tables: [{ id: 't1', name: 'T1' }]
  });
  fs.writeFileSync(src, v1Content);
  if (fs.existsSync(bak)) fs.unlinkSync(bak);

  runCli(['migrate', src]);
  assert(fs.existsSync(bak), 'migrate in-place: .bak backup created');

  const result = yaml.load(fs.readFileSync(src, 'utf8'));
  assert(result.version === '2.0.0', 'migrate in-place: file updated to v2');
}

{
  // すでに v2 のファイルはスキップ
  const src = path.join(TMP, 'v2-already.yaml');
  const v2Content = yaml.dump({
    version: '2.0.0',
    tables: [{ id: 't1', conceptual: { name: 'T1', kind: 'table' } }]
  });
  fs.writeFileSync(src, v2Content);

  const { stdout } = runCli(['migrate', src]);
  assert(stdout.includes('Already') || stdout.includes('latest'), 'migrate v2: skip message shown');
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

// Cleanup
fs.rmSync(TMP, { recursive: true, force: true });

if (failed > 0) process.exit(1);
