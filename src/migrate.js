import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ── Version chain ──────────────────────────────────────────────────────────
// To add a future migration (e.g. v2→v3), append to this array:
//   { from: '2.0.0', to: '3.0.0', migrate: migrateV2toV3 }

const MIGRATIONS = [
  { from: '1.0.0', to: '2.0.0', migrate: migrateV1toV2 },
];

const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].to;

function detectVersion(data) {
  if (typeof data.version === 'string') return data.version;
  return '1.0.0'; // treat unversioned as v1
}

function migrateToLatest(data) {
  let current = data;
  let version = detectVersion(current);

  for (const step of MIGRATIONS) {
    if (version === step.from) {
      current = step.migrate(current);
      version = step.to;
    }
  }

  return current;
}

// ── v1 → v2 migration ─────────────────────────────────────────────────────

function migrateV1toV2(data) {
  const result = { version: '2.0.0' };

  if (data.imports) result.imports = data.imports;

  // Domains: color → display.color
  if (Array.isArray(data.domains)) {
    result.domains = data.domains.map(domain => {
      const d = { ...domain };
      if (d.color !== undefined) {
        d.display = { color: d.color };
        delete d.color;
      }
      return d;
    });
  }

  // Tables
  if (Array.isArray(data.tables)) {
    result.tables = data.tables.map(migrateTable);
  }

  if (Array.isArray(data.relationships)) result.relationships = data.relationships;
  if (Array.isArray(data.lineage)) result.lineage = data.lineage;

  // Consumers: appearance → display
  if (Array.isArray(data.consumers)) {
    result.consumers = data.consumers.map(consumer => {
      const c = { ...consumer };
      if (c.appearance !== undefined) {
        c.display = c.appearance;
        delete c.appearance;
      }
      return c;
    });
  }

  // Annotations: targetId+targetType → target, type廃止, color → display.color
  if (Array.isArray(data.annotations)) {
    result.annotations = data.annotations.map(annotation => {
      const a = { ...annotation };
      // type (sticky/callout) is removed
      delete a.type;
      // targetId + targetType → target
      if (a.targetId !== undefined || a.targetType !== undefined) {
        if (a.targetId) {
          a.target = { id: a.targetId, type: a.targetType || 'table' };
        }
        delete a.targetId;
        delete a.targetType;
      }
      // color → display.color
      if (a.color !== undefined) {
        a.display = { color: a.color };
        delete a.color;
      }
      return a;
    });
  }

  // Layout: strip parentId (domain membership is in domains.members)
  if (data.layout && typeof data.layout === 'object') {
    const layout = {};
    for (const [key, val] of Object.entries(data.layout)) {
      const { parentId, ...rest } = val;
      layout[key] = rest;
    }
    result.layout = layout;
  }

  return result;
}

function migrateTable(table) {
  const t = { id: table.id };

  if (table.isImported !== undefined) t.isImported = table.isImported;

  // ── conceptual ────────────────────────────────────────────────────────────
  const conceptual = {};
  // name → conceptual.name
  if (table.name !== undefined) conceptual.name = table.name;
  // appearance.type → conceptual.kind
  if (table.appearance?.type !== undefined) conceptual.kind = table.appearance.type;
  // conceptual.description stays
  if (table.conceptual?.description !== undefined) conceptual.description = table.conceptual.description;
  if (Object.keys(conceptual).length > 0) t.conceptual = conceptual;

  // ── logical ───────────────────────────────────────────────────────────────
  const logical = {};
  // logical_name → logical.name
  if (table.logical_name !== undefined) logical.name = table.logical_name;
  // implementation.grain → logical.grain
  if (table.implementation?.grain !== undefined) logical.grain = table.implementation.grain;
  // appearance.scd + implementation.scd2 → logical.scd
  const scdType = table.appearance?.scd;
  const scd2 = table.implementation?.scd2;
  if (scdType || scd2) {
    logical.scd = {};
    if (scdType) logical.scd.type = scdType;
    if (scd2) {
      if (!logical.scd.type && scd2.type) logical.scd.type = scd2.type;
      if (scd2.business_key !== undefined) logical.scd.business_key = scd2.business_key;
      if (scd2.valid_from !== undefined) logical.scd.valid_from = scd2.valid_from;
      if (scd2.valid_to !== undefined) logical.scd.valid_to = scd2.valid_to;
      if (scd2.current_flag !== undefined) logical.scd.current_flag = scd2.current_flag;
    }
  }
  if (Object.keys(logical).length > 0) t.logical = logical;

  // ── physical ──────────────────────────────────────────────────────────────
  const physical = {};
  // physical_name → physical.name
  const physicalName = table.physical_name ?? table.physical?.name;
  if (physicalName !== undefined) physical.name = physicalName;
  if (table.physical?.schema !== undefined) physical.schema = table.physical.schema;

  if (table.implementation) {
    const impl = table.implementation;
    // materialization → strategy (rename values too: ephemeral stays, table/view/incremental stay)
    if (impl.materialization !== undefined) physical.strategy = impl.materialization;
    // incremental_strategy → update_mode (delete+insert → delete_insert)
    if (impl.incremental_strategy !== undefined) {
      physical.update_mode = impl.incremental_strategy === 'delete+insert'
        ? 'delete_insert'
        : impl.incremental_strategy;
    }
    // unique_key → merge_key
    if (impl.unique_key !== undefined) {
      physical.merge_key = Array.isArray(impl.unique_key) ? impl.unique_key : [impl.unique_key];
    }
    // partition_by → partition (take first element if array)
    if (impl.partition_by !== undefined) {
      physical.partition = Array.isArray(impl.partition_by) ? impl.partition_by[0] : impl.partition_by;
    }
    // cluster_by → cluster
    if (impl.cluster_by !== undefined) physical.cluster = impl.cluster_by;
    // incremental_key → filter_key
    if (impl.incremental_key !== undefined) physical.filter_key = impl.incremental_key;
    // incremental_lookback → lookback
    if (impl.incremental_lookback !== undefined) physical.lookback = impl.incremental_lookback;
    // measures: dropped (use column.expression instead)
  }
  if (Object.keys(physical).length > 0) t.physical = physical;

  // ── display ───────────────────────────────────────────────────────────────
  const display = {};
  if (table.appearance?.icon !== undefined) display.icon = table.appearance.icon;
  if (table.appearance?.color !== undefined) display.color = table.appearance.color;
  if (Object.keys(display).length > 0) t.display = display;

  // ── metadata ──────────────────────────────────────────────────────────────
  // conceptual.tags → metadata.tags
  const metadata = { ...(table.metadata || {}) };
  if (table.conceptual?.tags !== undefined) {
    metadata.tags = table.conceptual.tags;
  }
  if (Object.keys(metadata).length > 0) t.metadata = metadata;

  // ── sampleData ────────────────────────────────────────────────────────────
  if (table.sampleData !== undefined) t.sampleData = table.sampleData;

  // ── columns ───────────────────────────────────────────────────────────────
  if (Array.isArray(table.columns)) {
    t.columns = table.columns.map(migrateColumn);
  }

  return t;
}

function migrateColumn(col) {
  const c = { id: col.id };

  // Flatten logical.* to top level
  if (col.logical) {
    if (col.logical.name !== undefined) c.name = col.logical.name;
    if (col.logical.type !== undefined) c.type = col.logical.type;
    if (col.logical.description !== undefined) c.description = col.logical.description;
    if (col.logical.isPrimaryKey !== undefined) c.isPrimaryKey = col.logical.isPrimaryKey;
    if (col.logical.isForeignKey !== undefined) c.isForeignKey = col.logical.isForeignKey;
    if (col.logical.isPartitionKey !== undefined) c.isPartitionKey = col.logical.isPartitionKey;
    if (col.logical.additivity !== undefined) c.additivity = col.logical.additivity;
  }

  if (col.expression !== undefined) c.expression = col.expression;

  // physical stays as-is
  if (col.physical) c.physical = col.physical;

  return c;
}

// ── CLI command ──────────────────────────────────────────────────────────────

export function migrateModel(filePath, options = {}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`Error: File not found: ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  let data;
  try {
    data = yaml.load(raw);
  } catch (e) {
    console.error(`Error: Failed to parse YAML: ${e.message}`);
    process.exit(1);
  }

  const currentVersion = detectVersion(data);

  if (currentVersion === LATEST_VERSION) {
    console.log(`✓ Already at latest schema version (${LATEST_VERSION}). No migration needed.`);
    return;
  }

  const migrated = migrateToLatest(data);
  const output = yaml.dump(migrated, { lineWidth: 120, noRefs: true, quotingType: '"' });

  if (options.dryRun) {
    console.log(`--- Migration preview: ${absPath} ---`);
    console.log(`Schema: v${currentVersion} → v${LATEST_VERSION}`);
    console.log('');
    console.log(output);
    return;
  }

  const outPath = options.out ? path.resolve(options.out) : absPath;

  // Create backup unless writing to a different file
  if (!options.out) {
    const backupPath = absPath + '.bak';
    fs.writeFileSync(backupPath, raw, 'utf8');
    console.log(`✓ Backup created: ${backupPath}`);
  }

  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`✓ Migrated: v${currentVersion} → v${LATEST_VERSION} → ${outPath}`);
}

// Exported for testing
export { migrateV1toV2, migrateToLatest, detectVersion };
