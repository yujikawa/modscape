import path from 'path';
import { readYaml, resolveImports, buildLineageGraph, hasLineageCycle } from './model-utils.js';

const COORD_FIELDS = ['x', 'y', 'width', 'height'];

/**
 * Validate a model.yaml file and return { valid, errors, warnings }.
 * Each error/warning: { type: 'error'|'warning', field, message }
 */
export function validateModel(filePath) {
  const raw = readYaml(filePath);
  const { schema: data } = resolveImports(raw, path.dirname(filePath));
  const errors = [];
  const warnings = [];

  const err = (field, message) => errors.push({ type: 'error', field, message });
  const warn = (field, message) => warnings.push({ type: 'warning', field, message });

  const tables = data.tables || [];
  const domains = data.domains || [];
  const relationships = data.relationships || [];
  const lineage = data.lineage || [];
  const layout = data.layout || {};
  const consumers = data.consumers || [];
  const metrics = data.metrics || [];

  // ── ID sets ───────────────────────────────────────────────────────────────
  const tableIds = new Set();
  const domainIds = new Set();
  const relIds = new Set();
  const lineageIds = new Set();
  const consumerIds = new Set(consumers.map(c => c.id).filter(Boolean));
  const metricIds = new Set(metrics.map(m => m.id).filter(Boolean));
  const seenMetricIds = new Set();

  // ── v1 schema detection ──────────────────────────────────────────────────
  const version = typeof data.version === 'string' ? data.version : '1.0.0';
  if (!version.startsWith('2.')) {
    err('version', `Schema v${version} detected. Run: modscape migrate <path> to upgrade to v2`);
    return { valid: false, errors, warnings };
  }

  // ── Structural checks: tables ─────────────────────────────────────────────
  for (const [i, table] of tables.entries()) {
    const prefix = `tables[${i}]`;
    if (!table.id) { err(prefix, 'Missing required field: id'); continue; }
    if (!table.conceptual?.name) warn(`${prefix}(${table.id})`, 'Missing conceptual.name');

    // Duplicate ID check
    if (tableIds.has(table.id)) err(prefix, `Duplicate table id: "${table.id}"`);
    tableIds.add(table.id);

    // Coordinates must not appear inside tables
    for (const field of COORD_FIELDS) {
      if (field in table) err(`tables[${table.id}].${field}`, `Coordinate field "${field}" must be placed in layout, not inside tables`);
    }

    // v1 field detection
    if ('name' in table && !table.conceptual) warn(`tables[${table.id}]`, 'Top-level "name" field detected — this is a v1 field. Run: modscape migrate <path>');
    if ('appearance' in table) warn(`tables[${table.id}]`, '"appearance" field detected — this is a v1 field. Run: modscape migrate <path>');
    if ('implementation' in table) warn(`tables[${table.id}]`, '"implementation" field detected — this is a v1 field. Run: modscape migrate <path>');
    if ('logical_name' in table) warn(`tables[${table.id}]`, '"logical_name" field detected — this is a v1 field. Run: modscape migrate <path>');
    if ('physical_name' in table) warn(`tables[${table.id}]`, '"physical_name" field detected — this is a v1 field. Run: modscape migrate <path>');
  }

  // ── Structural checks: domains ────────────────────────────────────────────
  for (const [i, domain] of domains.entries()) {
    const prefix = `domains[${i}]`;
    if (!domain.id) { err(prefix, 'Missing required field: id'); continue; }

    if (domainIds.has(domain.id)) err(prefix, `Duplicate domain id: "${domain.id}"`);
    domainIds.add(domain.id);

    // Coordinates must not appear inside domains
    for (const field of COORD_FIELDS) {
      if (field in domain) err(`domains[${domain.id}].${field}`, `Coordinate field "${field}" must be placed in layout, not inside domains`);
    }

    // members reference check (tables, consumers, or metrics)
    for (const memberId of domain.members || []) {
      if (!tableIds.has(memberId) && !consumerIds.has(memberId) && !metricIds.has(memberId)) err(`domains[${domain.id}].members`, `Table, consumer, or metric "${memberId}" not found`);
    }
  }

  // ── Structural checks: relationships ─────────────────────────────────────
  for (const [i, rel] of relationships.entries()) {
    const prefix = `relationships[${i}]`;
    if (rel.id) {
      if (relIds.has(rel.id)) err(prefix, `Duplicate relationship id: "${rel.id}"`);
      relIds.add(rel.id);
    }
    if (!rel.from?.table) err(prefix, 'Missing from.table');
    else if (!tableIds.has(rel.from.table)) err(`${prefix}.from.table`, `Table "${rel.from.table}" not found`);
    if (!rel.to?.table) err(prefix, 'Missing to.table');
    else if (!tableIds.has(rel.to.table)) err(`${prefix}.to.table`, `Table "${rel.to.table}" not found`);
  }

  // ── Structural checks: metrics ────────────────────────────────────────────
  for (const [i, metric] of metrics.entries()) {
    const prefix = `metrics[${i}]`;
    if (!metric.id) { err(prefix, 'Missing required field: id'); continue; }
    if (!metric.name) warn(`${prefix}(${metric.id})`, 'Missing required field: name');
    if (tableIds.has(metric.id) || consumerIds.has(metric.id)) {
      err(prefix, `Duplicate id "${metric.id}": already used by a table or consumer`);
    }
    if (seenMetricIds.has(metric.id)) err(prefix, `Duplicate metric id: "${metric.id}"`);
    seenMetricIds.add(metric.id);
  }

  // ── Structural checks: lineage ────────────────────────────────────────────
  const validLineageTargets = new Set([...tableIds, ...consumerIds, ...metricIds]);
  for (const [i, entry] of lineage.entries()) {
    const prefix = `lineage[${i}]`;
    if (entry.id) {
      if (lineageIds.has(entry.id)) err(prefix, `Duplicate lineage id: "${entry.id}"`);
      lineageIds.add(entry.id);
    }
    if (!entry.from) err(prefix, 'Missing from');
    else if (!validLineageTargets.has(entry.from)) err(`${prefix}.from`, `"${entry.from}" not found in tables, consumers, or metrics`);
    if (!entry.to) err(prefix, 'Missing to');
    else if (!validLineageTargets.has(entry.to)) err(`${prefix}.to`, `"${entry.to}" not found in tables, consumers, or metrics`);
  }

  // ── Column completeness ───────────────────────────────────────────────────
  for (const table of tables) {
    for (const col of table.columns || []) {
      if (!col.name) warn(`tables[${table.id}].columns[${col.id}]`, 'Missing field: name');
      if (!col.type) warn(`tables[${table.id}].columns[${col.id}]`, 'Missing field: type');
      // v1 field detection
      if (col.logical) warn(`tables[${table.id}].columns[${col.id}]`, '"logical" wrapper detected — this is a v1 field. Run: modscape migrate <path>');
    }
  }

  // ── Lineage cycle check ───────────────────────────────────────────────────
  if (lineage.length > 0) {
    const graph = buildLineageGraph(lineage);
    if (hasLineageCycle(graph)) {
      warn('lineage', 'Circular lineage detected — lineage graph contains a cycle');
    }
  }

  // ── Layout checks ─────────────────────────────────────────────────────────
  const validLayoutIds = new Set([...tableIds, ...domainIds, ...consumerIds, ...metricIds]);
  for (const [id, coords] of Object.entries(layout)) {
    if (!validLayoutIds.has(id)) {
      warn(`layout.${id}`, `"${id}" not found in tables or domains — orphaned layout entry`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Run validation and print results to stdout/stderr.
 * Exits with code 1 if invalid.
 */
export function runValidate(filePath, opts = {}) {
  const result = validateModel(filePath);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.valid) {
      console.log(`  ✅ ${filePath} is valid`);
    } else {
      console.log(`  ❌ ${filePath} has ${result.errors.length} error(s):\n`);
      for (const e of result.errors) {
        console.log(`     [error] ${e.field}: ${e.message}`);
      }
    }
    if (result.warnings.length > 0) {
      console.log(`\n  ⚠️  ${result.warnings.length} warning(s):`);
      for (const w of result.warnings) {
        console.log(`     [warn]  ${w.field}: ${w.message}`);
      }
    }
  }

  if (!result.valid) process.exit(1);
}
