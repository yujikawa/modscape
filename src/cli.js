import path from 'path';
import { Command } from 'commander';
import { outputError, outputWarn, outputOk } from './model-utils.js';
import { listTables, getTable, addTable, updateTable, removeTable } from './operations/table.js';
import { listColumns, addColumn, updateColumn, removeColumn } from './operations/column.js';
import { listRelationships, addRelationship, updateRelationship, removeRelationship } from './operations/relationship.js';
import { listLineages, addLineage, updateLineage, removeLineage } from './operations/lineage.js';
import { listDomains, getDomain, addDomain, updateDomain, removeDomain, addDomainMember, removeDomainMember } from './operations/domain.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(json, fn) {
  try {
    return fn();
  } catch (e) {
    outputError(json, e.message);
  }
}

// ── Table commands ────────────────────────────────────────────────────────────

export function tableCommand() {
  const cmd = new Command('table').description('Manage tables in a YAML model');

  cmd
    .command('list <file>')
    .description('List all tables in the model')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const tables = listTables(file);
        if (opts.json) {
          console.log(JSON.stringify(tables));
        } else {
          if (tables.length === 0) console.log('  (no tables)');
          else tables.forEach(t => console.log(`  ${t.id}  ${t.name || ''}`));
        }
      });
    });

  cmd
    .command('get <file>')
    .description('Get a table definition by ID')
    .requiredOption('--id <id>', 'table ID')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const table = getTable(file, opts.id);
        console.log(opts.json ? JSON.stringify(table) : JSON.stringify(table, null, 2));
      });
    });

  cmd
    .command('add <file>')
    .description('Add a new table to the model')
    .requiredOption('--id <id>', 'table ID (snake_case)')
    .requiredOption('--name <name>', 'conceptual name')
    .option('--type <type>', 'appearance type (fact|dimension|mart|hub|link|satellite|table)')
    .option('--logical-name <name>', 'logical (business) name')
    .option('--physical-name <name>', 'physical (database) table name')
    .option('--description <text>', 'conceptual description')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        addTable(file, { id: opts.id, name: opts.name, type: opts.type, logicalName: opts.logicalName, physicalName: opts.physicalName, description: opts.description });
        outputOk(opts.json, 'add', 'table', opts.id);
      });
    });

  cmd
    .command('update <file>')
    .description('Update fields of an existing table')
    .requiredOption('--id <id>', 'table ID to update')
    .option('--name <name>', 'conceptual name')
    .option('--type <type>', 'appearance type')
    .option('--logical-name <name>', 'logical (business) name')
    .option('--physical-name <name>', 'physical (database) table name')
    .option('--description <text>', 'conceptual description')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        updateTable(file, { id: opts.id, name: opts.name, type: opts.type, logicalName: opts.logicalName, physicalName: opts.physicalName, description: opts.description });
        outputOk(opts.json, 'update', 'table', opts.id);
      });
    });

  cmd
    .command('remove <file>')
    .description('Remove a table from the model')
    .requiredOption('--id <id>', 'table ID to remove')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeTable(file, opts.id);
        outputOk(opts.json, 'remove', 'table', opts.id);
      });
    });

  return cmd;
}

// ── Column commands ───────────────────────────────────────────────────────────

export function columnCommand() {
  const cmd = new Command('column').description('Manage columns in a table');

  cmd
    .command('add <file>')
    .description('Add a column to a table')
    .requiredOption('--table <tableId>', 'target table ID')
    .requiredOption('--id <id>', 'column ID (snake_case)')
    .requiredOption('--name <name>', 'logical name')
    .option('--type <type>', 'logical type (Int|String|Decimal|Date|Timestamp|Boolean|...)')
    .option('--primary-key', 'mark as primary key')
    .option('--foreign-key', 'mark as foreign key')
    .option('--physical-name <name>', 'physical column name')
    .option('--physical-type <type>', 'physical column type (e.g. BIGINT)')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        addColumn(file, { tableId: opts.table, id: opts.id, name: opts.name, type: opts.type, isPrimaryKey: opts.primaryKey, isForeignKey: opts.foreignKey, physicalName: opts.physicalName, physicalType: opts.physicalType });
        outputOk(opts.json, 'add', 'column', `${opts.table}.${opts.id}`);
      });
    });

  cmd
    .command('update <file>')
    .description('Update a column in a table')
    .requiredOption('--table <tableId>', 'target table ID')
    .requiredOption('--id <id>', 'column ID to update')
    .option('--name <name>', 'logical name')
    .option('--type <type>', 'logical type')
    .option('--primary-key <bool>', 'set isPrimaryKey (true|false)')
    .option('--foreign-key <bool>', 'set isForeignKey (true|false)')
    .option('--physical-name <name>', 'physical column name')
    .option('--physical-type <type>', 'physical column type')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        updateColumn(file, { tableId: opts.table, id: opts.id, name: opts.name, type: opts.type, isPrimaryKey: opts.primaryKey, isForeignKey: opts.foreignKey, physicalName: opts.physicalName, physicalType: opts.physicalType });
        outputOk(opts.json, 'update', 'column', `${opts.table}.${opts.id}`);
      });
    });

  cmd
    .command('remove <file>')
    .description('Remove a column from a table')
    .requiredOption('--table <tableId>', 'target table ID')
    .requiredOption('--id <id>', 'column ID to remove')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeColumn(file, { tableId: opts.table, id: opts.id });
        outputOk(opts.json, 'remove', 'column', `${opts.table}.${opts.id}`);
      });
    });

  return cmd;
}

// ── Relationship commands ─────────────────────────────────────────────────────

export function relationshipCommand() {
  const cmd = new Command('relationship').description('Manage relationships in a YAML model');

  cmd
    .command('list <file>')
    .description('List all relationships')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const rels = listRelationships(file);
        if (opts.json) {
          console.log(JSON.stringify(rels));
        } else {
          if (rels.length === 0) console.log('  (no relationships)');
          else rels.forEach(r => {
            const from = r.from?.column ? `${r.from.table}.${r.from.column}` : r.from?.table;
            const to = r.to?.column ? `${r.to.table}.${r.to.column}` : r.to?.table;
            console.log(`  ${from} --[${r.type}]--> ${to}`);
          });
        }
      });
    });

  cmd
    .command('get <file>')
    .description('Get a single relationship by ID or from/to tables')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--from <ref>', 'source table (table.column or table)')
    .option('--to <ref>', 'target table (table.column or table)')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const rels = listRelationships(file);
        let rel = null;
        if (opts.id) {
          rel = rels.find(r => r.id === opts.id);
        } else if (opts.from && opts.to) {
          const fromId = opts.from.split('.')[0];
          const toId = opts.to.split('.')[0];
          rel = rels.find(r => r.from?.table === fromId && r.to?.table === toId);
        } else {
          return outputError(opts.json, 'Specify --id or both --from and --to');
        }
        if (!rel) return outputError(opts.json, 'Relationship not found');
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
    });

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
      run(opts.json, () => {
        const { id } = addRelationship(file, { from: opts.from, to: opts.to, type: opts.type, id: opts.id, description: opts.description });
        outputOk(opts.json, 'add', 'relationship', id);
      });
    });

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
      run(opts.json, () => {
        updateRelationship(file, { id: opts.id, from: opts.from, to: opts.to, type: opts.type, description: opts.description });
        outputOk(opts.json, 'update', 'relationship', opts.id || `${opts.from} → ${opts.to}`);
      });
    });

  cmd
    .command('remove <file>')
    .description('Remove a relationship')
    .option('--from <ref>', 'source table (table.column or table)')
    .option('--to <ref>', 'target table (table.column or table)')
    .option('--id <id>', 'stable identifier for this relationship')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeRelationship(file, { id: opts.id, from: opts.from, to: opts.to });
        outputOk(opts.json, 'remove', 'relationship', opts.id || `${opts.from} → ${opts.to}`);
      });
    });

  return cmd;
}

// ── Lineage commands ──────────────────────────────────────────────────────────

export function lineageCommand() {
  const cmd = new Command('lineage').description('Manage data lineage in a YAML model');

  cmd
    .command('list <file>')
    .description('List all lineage entries')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const entries = listLineages(file);
        if (opts.json) {
          console.log(JSON.stringify(entries));
        } else {
          if (entries.length === 0) console.log('  (no lineage)');
          else entries.forEach(e => {
            const desc = e.description ? `  # ${e.description}` : '';
            console.log(`  ${e.from} --> ${e.to}${desc}`);
          });
        }
      });
    });

  cmd
    .command('get <file>')
    .description('Get a single lineage entry by ID or from/to tables')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const entries = listLineages(file);
        let entry = null;
        if (opts.id) entry = entries.find(e => e.id === opts.id);
        else if (opts.from && opts.to) entry = entries.find(e => e.from === opts.from && e.to === opts.to);
        else return outputError(opts.json, 'Specify --id or both --from and --to');
        if (!entry) return outputError(opts.json, 'Lineage entry not found');
        if (opts.json) {
          console.log(JSON.stringify(entry));
        } else {
          console.log(`  id:   ${entry.id || '(none)'}`);
          console.log(`  from: ${entry.from}`);
          console.log(`  to:   ${entry.to}`);
          if (entry.description) console.log(`  desc: ${entry.description}`);
        }
      });
    });

  cmd
    .command('add <file>')
    .description('Add a lineage entry (data flow from → to)')
    .requiredOption('--from <tableId>', 'upstream table ID')
    .requiredOption('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--description <text>', 'description of the transformation or filter')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const { id } = addLineage(file, { from: opts.from, to: opts.to, id: opts.id, description: opts.description });
        outputOk(opts.json, 'add', 'lineage', id);
      });
    });

  cmd
    .command('update <file>')
    .description('Update a lineage entry (e.g. set description)')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--description <text>', 'description of the transformation or filter')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const { id } = updateLineage(file, { id: opts.id, from: opts.from, to: opts.to, description: opts.description });
        outputOk(opts.json, 'update', 'lineage', id);
      });
    });

  cmd
    .command('remove <file>')
    .description('Remove a lineage entry')
    .option('--from <tableId>', 'upstream table ID')
    .option('--to <tableId>', 'downstream table ID')
    .option('--id <id>', 'stable identifier for this lineage edge')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeLineage(file, { id: opts.id, from: opts.from, to: opts.to });
        outputOk(opts.json, 'remove', 'lineage', opts.id || `${opts.from} → ${opts.to}`);
      });
    });

  return cmd;
}

// ── Domain commands ───────────────────────────────────────────────────────────

export function domainCommand() {
  const cmd = new Command('domain').description('Manage domains in a YAML model');

  cmd
    .command('list <file>')
    .description('List all domains')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const domains = listDomains(file);
        if (opts.json) {
          console.log(JSON.stringify(domains));
        } else {
          if (domains.length === 0) console.log('  (no domains)');
          else domains.forEach(d => console.log(`  ${d.id}  ${d.name || ''}`));
        }
      });
    });

  cmd
    .command('get <file>')
    .description('Get a domain definition by ID')
    .requiredOption('--id <id>', 'domain ID')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        const domain = getDomain(file, opts.id);
        console.log(opts.json ? JSON.stringify(domain) : JSON.stringify(domain, null, 2));
      });
    });

  cmd
    .command('add <file>')
    .description('Add a new domain')
    .requiredOption('--id <id>', 'domain ID (snake_case)')
    .requiredOption('--name <name>', 'display name')
    .option('--description <text>', 'description')
    .option('--color <color>', 'background color (e.g. rgba(59,130,246,0.1))')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        addDomain(file, { id: opts.id, name: opts.name, description: opts.description, color: opts.color });
        outputOk(opts.json, 'add', 'domain', opts.id);
      });
    });

  cmd
    .command('update <file>')
    .description('Update fields of an existing domain')
    .requiredOption('--id <id>', 'domain ID to update')
    .option('--name <name>', 'display name')
    .option('--description <text>', 'description')
    .option('--color <color>', 'background color')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        updateDomain(file, { id: opts.id, name: opts.name, description: opts.description, color: opts.color });
        outputOk(opts.json, 'update', 'domain', opts.id);
      });
    });

  cmd
    .command('remove <file>')
    .description('Remove a domain from the model')
    .requiredOption('--id <id>', 'domain ID to remove')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeDomain(file, opts.id);
        outputOk(opts.json, 'remove', 'domain', opts.id);
      });
    });

  // member subcommand
  const member = new Command('member').description('Manage table membership in a domain');

  member
    .command('add <file>')
    .description('Add a table to a domain')
    .requiredOption('--domain <domainId>', 'domain ID')
    .requiredOption('--table <tableId>', 'table ID to add')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        addDomainMember(file, { domainId: opts.domain, tableId: opts.table });
        outputOk(opts.json, 'member_add', 'domain', `${opts.domain} ← ${opts.table}`);
      });
    });

  member
    .command('remove <file>')
    .description('Remove a table from a domain')
    .requiredOption('--domain <domainId>', 'domain ID')
    .requiredOption('--table <tableId>', 'table ID to remove')
    .option('--json', 'output as JSON')
    .action((file, opts) => {
      run(opts.json, () => {
        removeDomainMember(file, { domainId: opts.domain, tableId: opts.table });
        outputOk(opts.json, 'member_remove', 'domain', `${opts.domain} ✕ ${opts.table}`);
      });
    });

  cmd.addCommand(member);
  return cmd;
}
