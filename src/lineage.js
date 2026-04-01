import path from 'path';
import { Command } from 'commander';
import { readYaml, writeYaml, findTableById, resolveImports, outputError, outputWarn, outputOk } from './model-utils.js';

export function lineageCommand() {
  const cmd = new Command('lineage').description('Manage data lineage in a YAML model');

  // list
  cmd
    .command('list <file>')
    .description('List all lineage entries')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const entries = data.lineage || [];
      if (opts.json) {
        console.log(JSON.stringify(entries));
      } else {
        if (entries.length === 0) {
          console.log('  (no lineage)');
        } else {
          entries.forEach(e => {
            const desc = e.description ? `  # ${e.description}` : '';
            console.log(`  ${e.from} --> ${e.to}${desc}`);
          });
        }
      }
    });

  // get
  cmd
    .command('get <file>')
    .description('Get a single lineage entry by ID or from/to tables')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const entries = data.lineage || [];
      let entry = null;
      if (opts.id) {
        entry = entries.find(e => e.id === opts.id);
      } else if (opts.from && opts.to) {
        entry = entries.find(e => e.from === opts.from && e.to === opts.to);
      } else {
        return outputError(opts.json, 'Specify --id or both --from and --to');
      }
      if (!entry) {
        return outputError(opts.json, `Lineage entry not found`);
      }
      if (opts.json) {
        console.log(JSON.stringify(entry));
      } else {
        console.log(`  id:   ${entry.id || '(none)'}`);
        console.log(`  from: ${entry.from}`);
        console.log(`  to:   ${entry.to}`);
        if (entry.description) console.log(`  desc: ${entry.description}`);
      }
    });

  // add
  cmd
    .command('add <file>')
    .description('Add a lineage entry (data flow from → to)')
    .requiredOption('--from <tableId>', 'upstream table ID')
    .requiredOption('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--description <text>', 'description of the transformation or filter')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const { schema: resolved } = resolveImports(data, path.dirname(path.resolve(file)));
      if (!findTableById(resolved, opts.from)) {
        return outputError(opts.json, `Table "${opts.from}" not found`);
      }
      if (!findTableById(resolved, opts.to)) {
        return outputError(opts.json, `Table "${opts.to}" not found`);
      }
      const entries = data.lineage || [];
      const id = opts.id || `lin-${opts.from}-${opts.to}`;
      if (entries.some(e => e.id === id || (e.from === opts.from && e.to === opts.to))) {
        return outputWarn(opts.json, `Lineage "${id}" already exists, skipped`);
      }
      const entry = { id, from: opts.from, to: opts.to };
      if (opts.description) entry.description = opts.description;
      data.lineage = [...entries, entry];
      writeYaml(file, data);
      outputOk(opts.json, 'add', 'lineage', id);
    });

  // update
  cmd
    .command('update <file>')
    .description('Update a lineage entry (e.g. set description)')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--description <text>', 'description of the transformation or filter')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const entries = data.lineage || [];
      const id = opts.id || (opts.from && opts.to ? `lin-${opts.from}-${opts.to}` : null);
      if (!id) return outputError(opts.json, 'Specify --id or both --from and --to');
      
      const idx = entries.findIndex(e => e.id === id || (e.from === opts.from && e.to === opts.to));
      if (idx === -1) {
        return outputError(opts.json, `Lineage "${id}" not found`);
      }
      const updated = { ...entries[idx] };
      if (opts.description !== undefined) {
        if (opts.description === '') {
          delete updated.description;
        } else {
          updated.description = opts.description;
        }
      }
      data.lineage = [...entries.slice(0, idx), updated, ...entries.slice(idx + 1)];
      writeYaml(file, data);
      outputOk(opts.json, 'update', 'lineage', id);
    });

  // remove
  cmd
    .command('remove <file>')
    .description('Remove a lineage entry')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      const data = readYaml(file);
      const id = opts.id || (opts.from && opts.to ? `lin-${opts.from}-${opts.to}` : null);
      if (!id) return outputError(opts.json, 'Specify --id or both --from and --to');

      const before = (data.lineage || []).length;
      data.lineage = (data.lineage || []).filter(e => !(e.id === id || (e.from === opts.from && e.to === opts.to)));
      if (data.lineage.length === before) {
        return outputWarn(opts.json, `Lineage "${id}" not found, nothing removed`);
      }
      writeYaml(file, data);
      outputOk(opts.json, 'remove', 'lineage', id);
    });

  return cmd;
}
