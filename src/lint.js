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
