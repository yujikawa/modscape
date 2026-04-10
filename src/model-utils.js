import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Resolve `imports:` entries in a schema, merging tables from referenced YAML files.
 * Local tables take precedence over imported ones (first-local-wins on duplicate IDs).
 * Returns { schema, importedPaths } where importedPaths is the list of resolved file paths.
 *
 * @param {object} schema - Parsed schema object (may contain `imports:` key)
 * @param {string} basePath - Absolute path to the directory of the main YAML file
 * @param {Set<string>} [visited] - Set of already-visited absolute paths (circular import guard)
 */
export function resolveImports(schema, basePath, visited = new Set()) {
  const importEntries = Array.isArray(schema.imports) ? schema.imports : [];
  if (importEntries.length === 0) {
    return { schema, importedPaths: [] };
  }

  const localTableIds = new Set((schema.tables || []).map(t => t.id));
  const importedTables = [];
  const importedPaths = [];

  for (const entry of importEntries) {
    if (!entry.from) {
      console.warn('  ⚠️  imports entry missing `from` field, skipping');
      continue;
    }

    const resolvedPath = path.resolve(basePath, entry.from);

    // Circular import guard
    if (visited.has(resolvedPath)) {
      console.warn(`  ⚠️  Circular import detected: ${resolvedPath}, skipping`);
      continue;
    }

    // Missing file guard
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`  ⚠️  Import file not found: ${resolvedPath}, skipping`);
      continue;
    }

    importedPaths.push(resolvedPath);

    let sourceData;
    try {
      sourceData = yaml.load(fs.readFileSync(resolvedPath, 'utf8')) || {};
    } catch (e) {
      console.warn(`  ⚠️  Failed to read import file ${resolvedPath}: ${e.message}, skipping`);
      continue;
    }

    const sourceTables = Array.isArray(sourceData.tables) ? sourceData.tables : [];
    const filterIds = Array.isArray(entry.ids) ? new Set(entry.ids) : null;

    // Warn about ids that don't exist in the source
    if (filterIds) {
      for (const id of filterIds) {
        if (!sourceTables.some(t => t.id === id)) {
          console.warn(`  ⚠️  Import id "${id}" not found in ${resolvedPath}, skipping`);
        }
      }
    }

    for (const table of sourceTables) {
      if (filterIds && !filterIds.has(table.id)) continue;
      // Local tables take precedence — skip if already defined locally
      if (localTableIds.has(table.id)) continue;
      importedTables.push({ ...table, isImported: true });
      localTableIds.add(table.id); // Prevent duplicates from multiple import entries
    }
  }

  const resolvedSchema = {
    ...schema,
    tables: [...(schema.tables || []), ...importedTables],
    imports: undefined, // Strip imports from the resolved schema
  };

  return { schema: resolvedSchema, importedPaths };
}

export function readYaml(filePath) {
  const data = yaml.load(fs.readFileSync(filePath, 'utf8'));
  return data || {};
}

const ROOT_KEY_ORDER = ['version', 'imports', 'domains', 'tables', 'lineage', 'relationships', 'annotations', 'layout', 'consumers'];
const TABLE_KEY_ORDER = ['id', 'conceptual', 'logical', 'physical', 'display', 'columns', 'metadata', 'sampleData'];
const COLUMN_KEY_ORDER = ['id', 'name', 'type', 'description', 'isPrimaryKey', 'isForeignKey', 'isPartitionKey', 'additivity', 'expression', 'physical'];

function sortKeys(obj, order) {
  const result = {};
  for (const key of order) {
    if (key in obj) result[key] = obj[key];
  }
  for (const key of Object.keys(obj)) {
    if (!(key in result)) result[key] = obj[key];
  }
  return result;
}

function normalizeSchema(data) {
  const root = sortKeys(data, ROOT_KEY_ORDER);
  if (Array.isArray(root.tables)) {
    root.tables = root.tables.map(t => {
      const table = sortKeys(t, TABLE_KEY_ORDER);
      if (Array.isArray(table.columns)) {
        table.columns = table.columns.map(c => sortKeys(c, COLUMN_KEY_ORDER));
      }
      return table;
    });
  }
  return root;
}

export function writeYaml(filePath, data) {
  fs.writeFileSync(filePath, yaml.dump(normalizeSchema(data), { lineWidth: -1 }), 'utf8');
}

export function findTableById(data, id) {
  return (data.tables || []).find(t => t.id === id) || null;
}

export function findDomainById(data, id) {
  return (data.domains || []).find(d => d.id === id) || null;
}

export function output(json, message, opts = {}) {
  if (opts.json) {
    console.log(JSON.stringify(message));
  } else {
    console.log(message);
  }
}

export function outputError(json, message, hint) {
  if (json) {
    console.error(JSON.stringify({ ok: false, error: message, hint: hint || '' }));
  } else {
    console.error(`  ❌ ${message}${hint ? '\n  💡 ' + hint : ''}`);
  }
  process.exit(1);
}

export function outputWarn(json, message) {
  if (json) {
    console.error(JSON.stringify({ ok: false, warning: message }));
  } else {
    console.warn(`  ⚠️  ${message}`);
  }
}

/**
 * Build a lineage adjacency list from an array of lineage entries.
 * @param {Array} lineageEntries - Array of { from, to } objects
 * @returns {Map<string, string[]>}
 */
export function buildLineageGraph(lineageEntries) {
  const graph = new Map();
  for (const lin of lineageEntries) {
    if (!lin.from || !lin.to) continue;
    if (!graph.has(lin.from)) graph.set(lin.from, []);
    graph.get(lin.from).push(lin.to);
  }
  return graph;
}

/**
 * Detect cycles in a lineage graph via DFS.
 * @param {Map<string, string[]>} graph
 * @returns {boolean} true if at least one cycle exists
 */
export function hasLineageCycle(graph) {
  const visited = new Set();
  const stack = new Set();

  const dfs = (node) => {
    visited.add(node);
    stack.add(node);
    for (const neighbor of graph.get(node) || []) {
      if (stack.has(neighbor)) return true;
      if (!visited.has(neighbor) && dfs(neighbor)) return true;
    }
    stack.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (!visited.has(node) && dfs(node)) return true;
  }
  return false;
}

export function outputOk(json, action, resource, id, extra = {}) {
  if (json) {
    console.log(JSON.stringify({ ok: true, action, resource, id, ...extra }));
  } else {
    const icons = { add: '✅', update: '✏️', remove: '🗑️', list: '📋', get: '🔍', member_add: '✅', member_remove: '🗑️' };
    console.log(`  ${icons[action] || '✅'} ${action} ${resource}: ${id}`);
  }
}
