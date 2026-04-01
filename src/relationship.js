import path from 'path';
import { Command } from 'commander';
import { readYaml, writeYaml, findTableById, resolveImports, outputError, outputWarn, outputOk } from './model-utils.js';

// Parse "table.column" or "table" into { tableId, columnId }
function parseRef(ref) {
  const parts = ref.split('.');
  return { tableId: parts[0], columnId: parts[1] || null };
}

function sameRel(r, fromTableId, toTableId) {
  return r.from?.table === fromTableId && r.to?.table === toTableId;
}

export function relationshipCommand() {
  const cmd = new Command('relationship').description('Manage relationships in a YAML model');

  // list
  cmd
    .command('list <file>')
    .description('List all relationships')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const rels = data.relationships || [];
      if (opts.json) {
        console.log(JSON.stringify(rels));
      } else {
        if (rels.length === 0) {
          console.log('  (no relationships)');
        } else {
          rels.forEach(r => {
            const from = r.from?.column ? `${r.from.table}.${r.from.column}` : r.from?.table;
            const to = r.to?.column ? `${r.to.table}.${r.to.column}` : r.to?.table;
            console.log(`  ${from} --[${r.type}]--> ${to}`);
          });
        }
      }
    });

  // get
  cmd
    .command('get <file>')
    .description('Get a single relationship by ID or from/to tables')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--from <ref>', 'source table (table.column or table)')
    .option('--to <ref>', 'target table (table.column or table)')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const rels = data.relationships || [];
      let rel = null;
      if (opts.id) {
        rel = rels.find(r => r.id === opts.id);
      } else if (opts.from && opts.to) {
        const from = parseRef(opts.from);
        const to = parseRef(opts.to);
        rel = rels.find(r => sameRel(r, from.tableId, to.tableId));
      } else {
        return outputError(opts.json, 'Specify --id or both --from and --to');
      }
      if (!rel) {
        return outputError(opts.json, `Relationship not found`);
      }
      if (opts.json) {
        console.log(JSON.stringify(rel));
      } else {
        const from = rel.from?.column ? `${rel.from.table}.${Array.isArray(rel.from.column) ? rel.from.column.join(', ') : rel.from.column}` : rel.from?.table;
        const to = rel.to?.column ? `${rel.to.table}.${Array.isArray(rel.to.column) ? rel.to.column.join(', ') : rel.to.column}` : rel.to?.table;
        console.log(`  id:   ${rel.id || '(none)'}`);
        console.log(`  from: ${from}`);
        console.log(`  to:   ${to}`);
        console.log(`  type: ${rel.type || '(none)'}`);
        if (rel.description) console.log(`  desc: ${rel.description}`);
      }
    });

  // add
  cmd
    .command('add <file>')
    .description('Add a relationship between two tables')
    .requiredOption('--from <ref>', 'source table (table.column or table)')
    .requiredOption('--to <ref>', 'target table (table.column or table)')
    .requiredOption('--type <type>', 'cardinality (one-to-one|one-to-many|many-to-one|many-to-many)')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--description <text>', 'description of the relationship')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const { schema: resolved } = resolveImports(data, path.dirname(path.resolve(file)));
      const from = parseRef(opts.from);
      const to = parseRef(opts.to);
      if (!findTableById(resolved, from.tableId)) {
        return outputError(opts.json, `Table "${from.tableId}" not found`);
      }
      if (!findTableById(resolved, to.tableId)) {
        return outputError(opts.json, `Table "${to.tableId}" not found`);
      }
      const rels = data.relationships || [];
      const id = opts.id || (from.columnId && to.columnId
        ? `rel-${from.tableId}.${from.columnId}-${to.tableId}.${to.columnId}`
        : `rel-${from.tableId}-${to.tableId}-${opts.type}`);

      if (rels.some(r => r.id === id || sameRel(r, from.tableId, to.tableId))) {
        return outputWarn(opts.json, `Relationship "${id}" already exists, skipped`);
      }
      const rel = {
        id,
        from: { table: from.tableId, ...(from.columnId ? { column: from.columnId } : {}) },
        to: { table: to.tableId, ...(to.columnId ? { column: to.columnId } : {}) },
        type: opts.type,
        ...(opts.description ? { description: opts.description } : {}),
      };
      data.relationships = [...rels, rel];
      writeYaml(file, data);
      outputOk(opts.json, 'add', 'relationship', id);
    });

  // update
  cmd
    .command('update <file>')
    .description('Update a relationship (e.g. change type or description)')
    .option('--from <ref>', 'source table (table.column or table)')
    .option('--to <ref>', 'target table (table.column or table)')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--type <type>', 'cardinality (one-to-one|one-to-many|many-to-one|many-to-many)')
    .option('--description <text>', 'description of the relationship')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const rels = data.relationships || [];
      const from = opts.from ? parseRef(opts.from) : null;
      const to = opts.to ? parseRef(opts.to) : null;

      let idx = -1;
      if (opts.id) {
        idx = rels.findIndex(r => r.id === opts.id);
      } else if (from && to) {
        const matches = rels.reduce((acc, r, i) => sameRel(r, from.tableId, to.tableId) ? [...acc, i] : acc, []);
        if (matches.length > 1) {
          return outputError(opts.json, `Multiple relationships found between "${from.tableId}" and "${to.tableId}". Use --id to specify which one.`);
        }
        idx = matches[0] ?? -1;
      } else {
        return outputError(opts.json, 'Specify --id or both --from and --to');
      }

      if (idx === -1) {
        return outputError(opts.json, `Relationship not found`);
      }

      const updated = { ...rels[idx] };
      if (opts.type !== undefined) updated.type = opts.type;
      if (opts.description !== undefined) {
        if (opts.description === '') {
          delete updated.description;
        } else {
          updated.description = opts.description;
        }
      }
      data.relationships = [...rels.slice(0, idx), updated, ...rels.slice(idx + 1)];
      writeYaml(file, data);
      outputOk(opts.json, 'update', 'relationship', updated.id || `${opts.from} → ${opts.to}`);
    });

  // remove
  cmd
    .command('remove <file>')
    .description('Remove a relationship')
    .option('--from <ref>', 'source table (table.column or table)')
    .option('--to <ref>', 'target table (table.column or table)')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const from = opts.from ? parseRef(opts.from) : null;
      const to = opts.to ? parseRef(opts.to) : null;
      const id = opts.id || (from && to ? (from.columnId && to.columnId
        ? `rel-${from.tableId}.${from.columnId}-${to.tableId}.${to.columnId}`
        : `rel-${from.tableId}-${to.tableId}`) : null);

      if (!id && !(from && to)) return outputError(opts.json, 'Specify --id or both --from and --to');

      const before = (data.relationships || []).length;
      data.relationships = (data.relationships || []).filter(r => {
        if (id && r.id === id) return false;
        if (from && to && sameRel(r, from.tableId, to.tableId)) return false;
        return true;
      });
      if (data.relationships.length === before) {
        return outputWarn(opts.json, `Relationship "${id || opts.from + ' → ' + opts.to}" not found, nothing removed`);
      }
      writeYaml(file, data);
      outputOk(opts.json, 'remove', 'relationship', id || `${opts.from} → ${opts.to}`);
    });

  return cmd;
}
