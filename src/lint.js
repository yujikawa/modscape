import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { readYaml, resolveImports } from './model-utils.js';

// Default: all fields at warn, no kind filter
const DEFAULT_REQUIRE = {
  'conceptual.description': { severity: 'warn' },
  'physical.name':           { severity: 'warn' },
  'conceptual.tags':         { severity: 'warn' },
  'columns[].type':          { severity: 'warn' },
  'columns[].isPrimaryKey':  { severity: 'warn' },
};

function loadRequire(rulesPath) {
  if (!rulesPath || !fs.existsSync(rulesPath)) return DEFAULT_REQUIRE;
  const raw = yaml.load(fs.readFileSync(rulesPath, 'utf8')) || {};
  const result = { ...DEFAULT_REQUIRE };
  for (const [fieldPath, cfg] of Object.entries(raw.require || {})) {
    result[fieldPath] = typeof cfg === 'string' ? { severity: cfg } : { severity: 'warn', ...cfg };
  }
  return result;
}

function loadCrossFileRules(rulesPath) {
  const defaults = { 'no-duplicate-table-ids': 'warn' };
  if (!rulesPath || !fs.existsSync(rulesPath)) return defaults;
  const raw = yaml.load(fs.readFileSync(rulesPath, 'utf8')) || {};
  return {
    'no-duplicate-table-ids': raw['no-duplicate-table-ids']?.severity ?? 'warn',
  };
}

// Collect model YAML files from a path. Directories are expanded; non-model YAMLs are skipped.
function collectModelFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (!stat.isDirectory()) return [inputPath];
  return fs.readdirSync(inputPath)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => path.join(inputPath, f))
    .filter(f => {
      try {
        const raw = yaml.load(fs.readFileSync(f, 'utf8'));
        return raw != null && 'version' in raw;
      } catch { return false; }
    });
}

// Returns a Set of tableIds legitimately imported into filePath via its imports: section.
function getImportedTableIds(rawYaml, filePath) {
  const importedIds = new Set();
  const basePath = path.dirname(path.resolve(filePath));
  for (const imp of (rawYaml?.imports || [])) {
    if (!imp.from) continue;
    const sourceFile = path.resolve(basePath, imp.from);
    try {
      const sourceRaw = yaml.load(fs.readFileSync(sourceFile, 'utf8'));
      const sourceTables = (sourceRaw?.tables || []).map(t => t.id).filter(Boolean);
      const allowed = (imp.ids && imp.ids.length > 0) ? imp.ids : sourceTables;
      allowed.forEach(id => importedIds.add(id));
    } catch { /* skip unresolvable imports */ }
  }
  return importedIds;
}

function lintCrossFile(filePaths, opts = {}) {
  const crossFileRules = loadCrossFileRules(opts.rulesPath);
  const warnings = [];

  if (crossFileRules['no-duplicate-table-ids'] === 'off') return { warnings };

  const tableFileMap = new Map(); // tableId → Set<filePath>
  const rawYamls = new Map();     // filePath → rawYaml

  for (const filePath of filePaths) {
    try {
      const raw = yaml.load(fs.readFileSync(filePath, 'utf8'));
      rawYamls.set(filePath, raw);
      for (const table of (raw?.tables || [])) {
        if (!table.id) continue;
        if (!tableFileMap.has(table.id)) tableFileMap.set(table.id, new Set());
        tableFileMap.get(table.id).add(filePath);
      }
    } catch { /* skip unreadable files */ }
  }

  for (const [tableId, files] of tableFileMap) {
    if (files.size <= 1) continue;
    const fileList = [...files];

    const legitimateConsumers = new Set();
    for (const filePath of fileList) {
      const raw = rawYamls.get(filePath);
      if (!raw) continue;
      const imported = getImportedTableIds(raw, filePath);
      if (imported.has(tableId)) legitimateConsumers.add(filePath);
    }

    const ownerFiles = fileList.filter(f => !legitimateConsumers.has(f));
    if (ownerFiles.length > 1) {
      warnings.push({
        rule: 'no-duplicate-table-ids',
        field: `tables[${tableId}]`,
        message: `Table ID "${tableId}" is defined in multiple files without import relationship`,
        files: ownerFiles,
      });
    }
  }

  return { warnings };
}

function getField(obj, dotPath) {
  return dotPath.split('.').reduce((cur, key) => cur?.[key], obj);
}

/**
 * Lint a model YAML file against configurable require rules.
 * @param {string} filePath
 * @param {object} [opts]
 * @param {string} [opts.rulesPath]
 * @returns {{ valid: boolean, errors: object[], warnings: object[] }}
 */
export function lintModel(filePath, opts = {}) {
  const raw = readYaml(filePath);
  const basePath = path.dirname(path.resolve(filePath));
  const { schema: data } = resolveImports(raw, basePath);

  const require = loadRequire(opts.rulesPath);
  const errors = [];
  const warnings = [];

  const report = (severity, field, rule, message) => {
    if (severity === 'error') errors.push({ rule, field, message });
    else warnings.push({ rule, field, message });
  };

  const tables = data.tables || [];

  for (const [fieldPath, cfg] of Object.entries(require)) {
    if (cfg.severity === 'off') continue;

    const isColumnRule = fieldPath.startsWith('columns[].');
    const colField = isColumnRule ? fieldPath.slice('columns[].'.length) : null;

    for (const table of tables) {
      if (!table.id) continue;
      if (cfg.kinds?.length && !cfg.kinds.includes(table.conceptual?.kind)) continue;

      if (isColumnRule) {
        const columns = table.columns || [];
        if (colField === 'isPrimaryKey') {
          if (!columns.some(c => c.isPrimaryKey === true)) {
            report(cfg.severity, `tables[${table.id}]`, fieldPath, 'No column with isPrimaryKey: true');
          }
        } else {
          for (const col of columns) {
            const val = getField(col, colField);
            if (val === undefined || val === null || val === '') {
              report(cfg.severity, `tables[${table.id}].columns[${col.id ?? col.name}]`, fieldPath, `Missing ${colField}`);
            }
          }
        }
      } else {
        const val = getField(table, fieldPath);
        const missing = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (missing) {
          report(cfg.severity, `tables[${table.id}]`, fieldPath, `Missing ${fieldPath}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Run lint and print results to stdout. Exits with code 1 if any errors.
 */
export function runLint(filePath, opts = {}) {
  const rulesPath = opts.rules ?? findDefaultRulesPath(filePath);
  const result = lintModel(filePath, { rulesPath });

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const total = result.errors.length + result.warnings.length;
    if (total === 0) {
      console.log(`  ✅ No issues found.`);
    } else {
      if (result.errors.length > 0) {
        console.log(`  ❌ ${result.errors.length} error(s):\n`);
        for (const e of result.errors) {
          console.log(`     [error] ${e.field}  (${e.rule}): ${e.message}`);
        }
      }
      if (result.warnings.length > 0) {
        if (result.errors.length > 0) console.log('');
        console.log(`  ⚠️  ${result.warnings.length} warning(s):\n`);
        for (const w of result.warnings) {
          console.log(`     [warn]  ${w.field}  (${w.rule}): ${w.message}`);
        }
      }
      console.log(`\n  ${total} issue(s) found.`);
    }
  }

  if (result.errors.length > 0) process.exit(1);
}

function findDefaultRulesPath(modelFilePath) {
  const candidates = [
    path.resolve(path.dirname(modelFilePath), '.modscape', 'lint-rules.yaml'),
    path.resolve(process.cwd(), '.modscape', 'lint-rules.yaml'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Lint multiple model YAML files, including cross-file duplicate checks.
 * @param {string[]} filePaths
 * @param {object} [opts]
 * @param {string} [opts.rulesPath]
 * @returns {{ valid: boolean, errors: object[], warnings: object[] }}
 */
export function lintModels(filePaths, opts = {}) {
  const allErrors = [];
  const allWarnings = [];

  for (const filePath of filePaths) {
    const result = lintModel(filePath, opts);
    allErrors.push(...result.errors.map(e => ({ ...e, file: filePath })));
    allWarnings.push(...result.warnings.map(w => ({ ...w, file: filePath })));
  }

  const { warnings: crossWarnings } = lintCrossFile(filePaths, opts);
  allWarnings.push(...crossWarnings);

  return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
}

/**
 * Run lint on one or more files/directories and print results to stdout.
 */
export function runLintMulti(inputs, opts = {}) {
  const filePaths = [];
  for (const input of inputs) {
    filePaths.push(...collectModelFiles(input));
  }

  if (filePaths.length === 0) {
    console.log('  No model YAML files found.');
    return;
  }

  const rulesPath = opts.rules ?? findDefaultRulesPath(filePaths[0]);
  const result = lintModels(filePaths, { rulesPath });

  if (opts.json) {
    console.log(JSON.stringify({ valid: result.valid, errors: result.errors, warnings: result.warnings }, null, 2));
  } else {
    const total = result.errors.length + result.warnings.length;
    if (total === 0) {
      console.log(`  ✅ No issues found.`);
    } else {
      if (result.errors.length > 0) {
        console.log(`  ❌ ${result.errors.length} error(s):\n`);
        for (const e of result.errors) {
          const fileLabel = e.file ? ` [${path.basename(e.file)}]` : '';
          console.log(`     [error]${fileLabel} ${e.field}  (${e.rule}): ${e.message}`);
        }
      }
      if (result.warnings.length > 0) {
        if (result.errors.length > 0) console.log('');
        console.log(`  ⚠️  ${result.warnings.length} warning(s):\n`);
        for (const w of result.warnings) {
          const fileLabel = w.file ? ` [${path.basename(w.file)}]` : '';
          const filesLabel = w.files ? ` → ${w.files.map(f => path.basename(f)).join(', ')}` : '';
          console.log(`     [warn] ${fileLabel}${filesLabel} ${w.field}  (${w.rule}): ${w.message}`);
        }
      }
      console.log(`\n  ${total} issue(s) found.`);
    }
  }

  if (result.errors.length > 0) process.exit(1);
}
