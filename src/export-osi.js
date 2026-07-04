import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { resolveImports } from './model-utils.js';

const OSI_VERSION = '0.2.0.dev0';

/**
 * Build a map from table id → domain id by scanning domains[].members.
 */
function buildDomainMap(domains) {
  const map = new Map();
  for (const domain of domains || []) {
    for (const memberId of domain.members || []) {
      map.set(memberId, domain.id);
    }
  }
  return map;
}

/**
 * Convert a single Modscape table to an OSI dataset object.
 */
function tableToDataset(table, domainMap) {
  const physicalName = table.physical?.name || table.id;
  const columns = Array.isArray(table.columns) ? table.columns : [];

  const primaryKey = columns
    .filter(col => col.isPrimaryKey || col.logical?.isPrimaryKey)
    .map(col => col.id);

  const fields = columns.map(col => ({
    name: col.id,
    expression: { dialects: [{ dialect: 'ANSI_SQL', expression: col.id }] },
    ...(col.name || col.description ? { description: col.name || col.description } : {}),
  }));

  const dataset = {
    name: physicalName,
    source: physicalName,
    ...(table.conceptual?.name ? { description: table.conceptual.name } : {}),
    ...(primaryKey.length > 0 ? { primary_key: primaryKey } : {}),
    ...(fields.length > 0 ? { fields } : {}),
  };

  const ext = {};
  if (table.conceptual?.kind) ext.kind = table.conceptual.kind;
  const domainId = domainMap.get(table.id);
  if (domainId) ext.domain = domainId;

  if (Object.keys(ext).length > 0) {
    dataset.custom_extensions = [{ vendor_name: 'modscape', data: JSON.stringify(ext) }];
  }

  return dataset;
}

/**
 * Convert Modscape relationships to OSI relationships.
 */
function convertRelationships(relationships) {
  return (relationships || []).map(rel => ({
    name: rel.id || `${rel.from?.table}-${rel.to?.table}`,
    from: rel.from?.table,
    to: rel.to?.table,
    from_columns: Array.isArray(rel.from?.column) ? rel.from.column : [rel.from?.column].filter(Boolean),
    to_columns: Array.isArray(rel.to?.column) ? rel.to.column : [rel.to?.column].filter(Boolean),
  }));
}

/**
 * Convert Modscape metrics to OSI metrics.
 */
function convertMetrics(metrics) {
  return (metrics || []).map(metric => ({
    name: metric.name || metric.id,
    expression: { dialects: [{ dialect: 'ANSI_SQL', expression: metric.expression }] },
    ...(metric.description ? { description: metric.description } : {}),
  }));
}

/**
 * Convert a resolved Modscape schema to an OSI document object.
 */
function schemaToOsi(schema, modelName) {
  const domainMap = buildDomainMap(schema.domains);

  const datasets = (schema.tables || []).map(t => tableToDataset(t, domainMap));
  const relationships = convertRelationships(schema.relationships);
  const metrics = convertMetrics(schema.metrics);

  const semanticModel = {
    name: modelName,
    datasets,
    ...(relationships.length > 0 ? { relationships } : {}),
    ...(metrics.length > 0 ? { metrics } : {}),
  };

  return {
    version: OSI_VERSION,
    semantic_model: [semanticModel],
  };
}

/**
 * Main export function called by the CLI.
 */
export async function exportOsi(inputPath, options) {
  const absolutePath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`  ❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  let rawData;
  try {
    rawData = yaml.load(fs.readFileSync(absolutePath, 'utf8')) || {};
  } catch (e) {
    console.error(`  ❌ Failed to parse YAML: ${e.message}`);
    process.exit(1);
  }

  const { schema } = resolveImports(rawData, path.dirname(absolutePath));

  const modelName = path.parse(absolutePath).name;
  const osiDoc = schemaToOsi(schema, modelName);
  const osiYaml = yaml.dump(osiDoc, { lineWidth: -1, noRefs: true });

  const defaultOutput = path.join(
    path.dirname(absolutePath),
    `${modelName}.osi.yaml`
  );
  const outputPath = options.output
    ? path.resolve(process.cwd(), options.output)
    : defaultOutput;

  fs.writeFileSync(outputPath, osiYaml, 'utf8');
  console.log(`  ✅ Exported OSI: ${path.relative(process.cwd(), absolutePath)} -> ${path.relative(process.cwd(), outputPath)}`);
}
