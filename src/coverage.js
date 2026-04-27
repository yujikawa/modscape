import { readYaml } from './model-utils.js';

/**
 * Calculate model statistics (tables, relationships, lineage, isolated tables).
 * @param {object} schema - Parsed schema object
 * @returns {{ tables: number, relationships: number, lineage_edges: number, isolated_tables: string[] }}
 */
export function calculateStats(schema) {
  const tables = schema.tables || [];
  const relationships = schema.relationships || [];
  const lineage = schema.lineage || [];
  const consumers = schema.consumers || [];

  // Collect all node IDs that appear in lineage edges
  const connectedIds = new Set();
  for (const edge of lineage) {
    if (edge.from) connectedIds.add(edge.from);
    if (edge.to) connectedIds.add(edge.to);
  }

  // Isolated = tables not referenced in any lineage edge (consumers are excluded)
  const tableIds = new Set(tables.map(t => t.id).filter(Boolean));
  const isolated_tables = [...tableIds].filter(id => !connectedIds.has(id));

  return {
    tables: tables.length,
    relationships: relationships.length,
    lineage_edges: lineage.length,
    isolated_tables,
  };
}

/**
 * Calculate documentation coverage for tables and columns.
 * - Table coverage: % of tables with conceptual.description defined
 * - Column coverage: % of columns with type defined
 * - Overall: average of both
 * @param {object} schema - Parsed schema object
 * @returns {{ overall: number, tables: object, columns: object, low_coverage_tables: object[] }}
 */
export function calculateCoverage(schema) {
  const tables = schema.tables || [];

  let tablesCovered = 0;
  let totalColumns = 0;
  let columnsCovered = 0;
  const low_coverage_tables = [];

  for (const table of tables) {
    if (!table.id) continue;

    const hasDescription = !!(table.conceptual?.description);
    if (hasDescription) tablesCovered++;

    const columns = table.columns || [];
    const colTotal = columns.length;
    const colCovered = columns.filter(c => c.type != null && c.type !== '').length;
    totalColumns += colTotal;
    columnsCovered += colCovered;

    const tablePct = hasDescription ? 100 : 0;
    const colPct = colTotal > 0 ? Math.round((colCovered / colTotal) * 100) : null;
    const avgPct = colPct != null ? (tablePct + colPct) / 2 : tablePct;

    if (avgPct < 70) {
      low_coverage_tables.push({
        id: table.id,
        table_pct: tablePct,
        column_pct: colPct,
      });
    }
  }

  const totalTables = tables.length;
  const tablePct = totalTables > 0 ? Math.round((tablesCovered / totalTables) * 100) : null;
  const columnPct = totalColumns > 0 ? Math.round((columnsCovered / totalColumns) * 100) : null;

  let overall = null;
  if (tablePct != null && columnPct != null) {
    overall = Math.round((tablePct + columnPct) / 2);
  } else if (tablePct != null) {
    overall = tablePct;
  }

  // Sort low_coverage_tables by avg coverage ascending
  low_coverage_tables.sort((a, b) => {
    const aAvg = a.column_pct != null ? (a.table_pct + a.column_pct) / 2 : a.table_pct;
    const bAvg = b.column_pct != null ? (b.table_pct + b.column_pct) / 2 : b.table_pct;
    return aAvg - bAvg;
  });

  return {
    overall,
    tables: { covered: tablesCovered, total: totalTables, pct: tablePct },
    columns: { covered: columnsCovered, total: totalColumns, pct: columnPct },
    low_coverage_tables,
  };
}

/**
 * Run coverage check on a YAML file and print results.
 * @param {string} filePath - Path to the YAML model file
 * @param {{ minCoverage?: number, json?: boolean }} options
 * @returns {number} Exit code (0 = ok, 1 = below threshold or error)
 */
export function runCoverage(filePath, options = {}) {
  let schema;
  try {
    schema = readYaml(filePath);
  } catch (e) {
    console.error(`Error reading file: ${e.message}`);
    return 1;
  }

  const stats = calculateStats(schema);
  const coverage = calculateCoverage(schema);

  if (options.json) {
    const passed = options.minCoverage != null
      ? (coverage.overall != null && coverage.overall >= options.minCoverage)
      : true;
    console.log(JSON.stringify({ stats, coverage, passed }, null, 2));
    return passed ? 0 : 1;
  }

  // Human-readable output
  console.log('\nModel Stats');
  console.log(`  Tables:        ${stats.tables}`);
  console.log(`  Relationships: ${stats.relationships}`);
  console.log(`  Lineage edges: ${stats.lineage_edges}`);
  if (stats.isolated_tables.length > 0) {
    console.log(`  Isolated:      ${stats.isolated_tables.length}  (${stats.isolated_tables.join(', ')})`);
  } else {
    console.log(`  Isolated:      0`);
  }

  console.log('\nDocumentation Coverage');

  if (coverage.tables.total === 0) {
    console.log('  No tables found.');
    return 0;
  }

  const tablePctStr = coverage.tables.pct != null ? `${coverage.tables.pct}%` : 'N/A';
  const colPctStr = coverage.columns.pct != null ? `${coverage.columns.pct}%` : 'N/A';
  const overallStr = coverage.overall != null ? `${coverage.overall}%` : 'N/A';

  console.log(`  Tables:   ${coverage.tables.covered}/${coverage.tables.total}  (${tablePctStr})  [conceptual.description]`);
  console.log(`  Columns:  ${coverage.columns.covered}/${coverage.columns.total}  (${colPctStr})  [type defined]`);
  console.log(`  Overall:  ${overallStr}`);

  if (coverage.low_coverage_tables.length > 0) {
    console.log('\nLow coverage tables:');
    for (const t of coverage.low_coverage_tables) {
      const colStr = t.column_pct != null ? `columns: ${t.column_pct}%` : 'columns: N/A';
      console.log(`  ${t.id.padEnd(30)} table: ${String(t.table_pct + '%').padEnd(5)}  ${colStr}`);
    }
  }

  if (options.minCoverage != null) {
    console.log('');
    if (coverage.overall == null || coverage.overall < options.minCoverage) {
      console.log(`Coverage FAILED: ${overallStr} < ${options.minCoverage}%`);
      return 1;
    } else {
      console.log(`Coverage OK: ${overallStr} >= ${options.minCoverage}%`);
    }
  }

  return 0;
}
