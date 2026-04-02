import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listTables, getTable, addTable, updateTable, removeTable } from './operations/table.js';
import { listColumns, addColumn, updateColumn, removeColumn } from './operations/column.js';
import { listRelationships, addRelationship, updateRelationship, removeRelationship } from './operations/relationship.js';
import { listLineages, addLineage, updateLineage, removeLineage } from './operations/lineage.js';
import { listDomains, addDomain, updateDomain, removeDomain, addDomainMember, removeDomainMember } from './operations/domain.js';
import { validateModel } from './validate.js';
import { listAnnotations, addAnnotation, updateAnnotation, removeAnnotation } from './operations/annotation.js';
import { summarizeModel } from './operations/summarize.js';
import { listConsumers, getConsumer, addConsumer, updateConsumer, removeConsumer } from './operations/consumer.js';

// Wrap an ops call: returns MCP content or isError response
function call(fn) {
  try {
    const result = fn();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text', text: e.message }], isError: true };
  }
}

export async function startMcpServer() {
  const server = new McpServer({ name: 'modscape', version: '2.5.0' });

  // ── Table tools ───────────────────────────────────────────────────────────

  server.registerTool('list_tables',
    {
      description: 'List tables in a model.yaml file. Optionally filter by type, domain, or orphan status.',
      inputSchema: {
        file: z.string().describe('Path to model.yaml'),
        type: z.enum(['fact', 'dimension', 'mart', 'hub', 'link', 'satellite', 'table']).optional().describe('Filter by appearance type'),
        domain_id: z.string().optional().describe('Filter to tables belonging to this domain ID'),
        orphan_only: z.boolean().optional().describe('If true, return only tables not assigned to any domain'),
      },
    },
    ({ file, type, domain_id, orphan_only }) => call(() => listTables(file, { type, domainId: domain_id, orphanOnly: orphan_only }))
  );

  server.registerTool('get_table',
    { description: 'Get a table definition by ID', inputSchema: { file: z.string(), id: z.string().describe('Table ID') } },
    ({ file, id }) => call(() => getTable(file, id))
  );

  server.registerTool('add_table',
    {
      description: 'Add a new table to a model.yaml file',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Unique table ID in snake_case'),
        name: z.string().describe('Conceptual (business) name'),
        type: z.enum(['fact', 'dimension', 'mart', 'hub', 'link', 'satellite', 'table']).optional(),
        logical_name: z.string().optional().describe('Formal business name'),
        physical_name: z.string().optional().describe('Physical database table name'),
        description: z.string().optional().describe('Business context description'),
      },
    },
    ({ file, id, name, type, logical_name, physical_name, description }) =>
      call(() => { addTable(file, { id, name, type, logicalName: logical_name, physicalName: physical_name, description }); return { ok: true, id }; })
  );

  server.registerTool('update_table',
    {
      description: 'Update fields of an existing table',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Table ID to update'),
        name: z.string().optional(),
        type: z.enum(['fact', 'dimension', 'mart', 'hub', 'link', 'satellite', 'table']).optional(),
        logical_name: z.string().optional(),
        physical_name: z.string().optional(),
        description: z.string().optional(),
      },
    },
    ({ file, id, name, type, logical_name, physical_name, description }) =>
      call(() => { updateTable(file, { id, name, type, logicalName: logical_name, physicalName: physical_name, description }); return { ok: true, id }; })
  );

  server.registerTool('remove_table',
    { description: 'Remove a table from a model.yaml file', inputSchema: { file: z.string(), id: z.string().describe('Table ID to remove') } },
    ({ file, id }) => call(() => { removeTable(file, id); return { ok: true, id }; })
  );

  // ── Column tools ──────────────────────────────────────────────────────────

  server.registerTool('list_columns',
    { description: 'List all columns of a specific table', inputSchema: { file: z.string(), table_id: z.string().describe('Target table ID') } },
    ({ file, table_id }) => call(() => listColumns(file, table_id))
  );

  server.registerTool('add_column',
    {
      description: 'Add a column to an existing table',
      inputSchema: {
        file: z.string(),
        table_id: z.string().describe('Target table ID'),
        id: z.string().describe('Column ID in snake_case'),
        name: z.string().describe('Logical (business) name'),
        type: z.string().optional().describe('Logical type e.g. Int, String, Decimal, Date, Timestamp'),
        is_primary_key: z.boolean().optional(),
        is_foreign_key: z.boolean().optional(),
        physical_name: z.string().optional(),
        physical_type: z.string().optional(),
      },
    },
    ({ file, table_id, id, name, type, is_primary_key, is_foreign_key, physical_name, physical_type }) =>
      call(() => { addColumn(file, { tableId: table_id, id, name, type, isPrimaryKey: is_primary_key, isForeignKey: is_foreign_key, physicalName: physical_name, physicalType: physical_type }); return { ok: true, tableId: table_id, id }; })
  );

  server.registerTool('update_column',
    {
      description: 'Update a column in a table',
      inputSchema: {
        file: z.string(),
        table_id: z.string(),
        id: z.string().describe('Column ID to update'),
        name: z.string().optional(),
        type: z.string().optional(),
        is_primary_key: z.boolean().optional(),
        is_foreign_key: z.boolean().optional(),
        physical_name: z.string().optional(),
        physical_type: z.string().optional(),
      },
    },
    ({ file, table_id, id, name, type, is_primary_key, is_foreign_key, physical_name, physical_type }) =>
      call(() => { updateColumn(file, { tableId: table_id, id, name, type, isPrimaryKey: is_primary_key, isForeignKey: is_foreign_key, physicalName: physical_name, physicalType: physical_type }); return { ok: true, tableId: table_id, id }; })
  );

  server.registerTool('remove_column',
    { description: 'Remove a column from a table', inputSchema: { file: z.string(), table_id: z.string(), id: z.string().describe('Column ID to remove') } },
    ({ file, table_id, id }) => call(() => { removeColumn(file, { tableId: table_id, id }); return { ok: true, tableId: table_id, id }; })
  );

  // ── Relationship tools ────────────────────────────────────────────────────

  server.registerTool('list_relationships',
    { description: 'List all relationships in a model.yaml file', inputSchema: { file: z.string() } },
    ({ file }) => call(() => listRelationships(file))
  );

  server.registerTool('add_relationship',
    {
      description: 'Add a relationship between two tables',
      inputSchema: {
        file: z.string(),
        from: z.string().describe('Source table (table or table.column)'),
        to: z.string().describe('Target table (table or table.column)'),
        type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
        id: z.string().optional().describe('Stable identifier'),
        description: z.string().optional(),
      },
    },
    ({ file, from, to, type, id, description }) =>
      call(() => addRelationship(file, { from, to, type, id, description }))
  );

  server.registerTool('update_relationship',
    {
      description: 'Update a relationship',
      inputSchema: {
        file: z.string(),
        id: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']).optional(),
        description: z.string().optional(),
      },
    },
    ({ file, id, from, to, type, description }) =>
      call(() => updateRelationship(file, { id, from, to, type, description }))
  );

  server.registerTool('remove_relationship',
    {
      description: 'Remove a relationship',
      inputSchema: { file: z.string(), id: z.string().optional(), from: z.string().optional(), to: z.string().optional() },
    },
    ({ file, id, from, to }) => call(() => { removeRelationship(file, { id, from, to }); return { ok: true }; })
  );

  // ── Lineage tools ─────────────────────────────────────────────────────────

  server.registerTool('list_lineages',
    { description: 'List all lineage entries in a model.yaml file', inputSchema: { file: z.string() } },
    ({ file }) => call(() => listLineages(file))
  );

  server.registerTool('add_lineage',
    {
      description: 'Add a data lineage entry (data flow from → to)',
      inputSchema: {
        file: z.string(),
        from: z.string().describe('Upstream table ID'),
        to: z.string().describe('Downstream table ID'),
        id: z.string().optional(),
        description: z.string().optional(),
      },
    },
    ({ file, from, to, id, description }) =>
      call(() => addLineage(file, { from, to, id, description }))
  );

  server.registerTool('update_lineage',
    {
      description: 'Update a lineage entry',
      inputSchema: { file: z.string(), id: z.string().optional(), from: z.string().optional(), to: z.string().optional(), description: z.string().optional() },
    },
    ({ file, id, from, to, description }) =>
      call(() => updateLineage(file, { id, from, to, description }))
  );

  server.registerTool('remove_lineage',
    {
      description: 'Remove a lineage entry',
      inputSchema: { file: z.string(), id: z.string().optional(), from: z.string().optional(), to: z.string().optional() },
    },
    ({ file, id, from, to }) => call(() => { removeLineage(file, { id, from, to }); return { ok: true }; })
  );

  // ── Domain tools ──────────────────────────────────────────────────────────

  server.registerTool('list_domains',
    { description: 'List all domains in a model.yaml file', inputSchema: { file: z.string() } },
    ({ file }) => call(() => listDomains(file))
  );

  server.registerTool('add_domain',
    {
      description: 'Add a new domain',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Domain ID in snake_case'),
        name: z.string().describe('Display name'),
        description: z.string().optional(),
        color: z.string().optional().describe('Background color e.g. rgba(59,130,246,0.1)'),
      },
    },
    ({ file, id, name, description, color }) =>
      call(() => { addDomain(file, { id, name, description, color }); return { ok: true, id }; })
  );

  server.registerTool('update_domain',
    {
      description: 'Update fields of an existing domain',
      inputSchema: { file: z.string(), id: z.string(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional() },
    },
    ({ file, id, name, description, color }) =>
      call(() => { updateDomain(file, { id, name, description, color }); return { ok: true, id }; })
  );

  server.registerTool('remove_domain',
    { description: 'Remove a domain', inputSchema: { file: z.string(), id: z.string() } },
    ({ file, id }) => call(() => { removeDomain(file, id); return { ok: true, id }; })
  );

  server.registerTool('add_domain_member',
    {
      description: 'Add a table to a domain',
      inputSchema: { file: z.string(), domain_id: z.string().describe('Domain ID'), table_id: z.string().describe('Table ID to add') },
    },
    ({ file, domain_id, table_id }) =>
      call(() => { addDomainMember(file, { domainId: domain_id, tableId: table_id }); return { ok: true, domainId: domain_id, tableId: table_id }; })
  );

  server.registerTool('remove_domain_member',
    {
      description: 'Remove a table from a domain',
      inputSchema: { file: z.string(), domain_id: z.string(), table_id: z.string() },
    },
    ({ file, domain_id, table_id }) =>
      call(() => { removeDomainMember(file, { domainId: domain_id, tableId: table_id }); return { ok: true, domainId: domain_id, tableId: table_id }; })
  );

  // ── Summarize tool ────────────────────────────────────────────────────────

  server.registerTool('summarize_model',
    { description: 'Get a statistical summary of the entire model (table counts, domains, orphans, relationships, etc.)', inputSchema: { file: z.string().describe('Path to model.yaml') } },
    ({ file }) => call(() => summarizeModel(file))
  );

  // ── Annotation tools ──────────────────────────────────────────────────────

  server.registerTool('list_annotations',
    { description: 'List all annotations in a model.yaml file', inputSchema: { file: z.string().describe('Path to model.yaml') } },
    ({ file }) => call(() => listAnnotations(file))
  );

  server.registerTool('add_annotation',
    {
      description: 'Add an annotation (sticky note or callout) to the model',
      inputSchema: {
        file: z.string(),
        id: z.string().optional().describe('Annotation ID (auto-generated if omitted)'),
        type: z.enum(['sticky', 'callout']).optional().describe('Annotation type'),
        text: z.string().describe('Annotation text content'),
        color: z.string().optional().describe('Background color e.g. #fef9c3'),
        target_id: z.string().optional().describe('ID of the element to attach to'),
        target_type: z.enum(['table', 'domain', 'relationship', 'lineage', 'column']).optional(),
        offset_x: z.number().optional().describe('X offset from target'),
        offset_y: z.number().optional().describe('Y offset from target'),
      },
    },
    ({ file, id, type, text, color, target_id, target_type, offset_x, offset_y }) => {
      const offset = (offset_x !== undefined || offset_y !== undefined)
        ? { x: offset_x || 0, y: offset_y || 0 }
        : undefined;
      return call(() => addAnnotation(file, { id, type, text, color, targetId: target_id, targetType: target_type, offset }));
    }
  );

  server.registerTool('update_annotation',
    {
      description: 'Update an existing annotation',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Annotation ID to update'),
        type: z.enum(['sticky', 'callout']).optional(),
        text: z.string().optional(),
        color: z.string().optional(),
        target_id: z.string().optional(),
        target_type: z.enum(['table', 'domain', 'relationship', 'lineage', 'column']).optional(),
        offset_x: z.number().optional(),
        offset_y: z.number().optional(),
      },
    },
    ({ file, id, type, text, color, target_id, target_type, offset_x, offset_y }) => {
      const offset = (offset_x !== undefined || offset_y !== undefined)
        ? { x: offset_x || 0, y: offset_y || 0 }
        : undefined;
      return call(() => { updateAnnotation(file, { id, type, text, color, targetId: target_id, targetType: target_type, offset }); return { ok: true, id }; });
    }
  );

  server.registerTool('remove_annotation',
    { description: 'Remove an annotation from the model', inputSchema: { file: z.string(), id: z.string().describe('Annotation ID to remove') } },
    ({ file, id }) => call(() => { removeAnnotation(file, id); return { ok: true, id }; })
  );

  // ── Consumer tools ────────────────────────────────────────────────────────

  server.registerTool('list_consumers',
    { description: 'List all downstream consumers in a model.yaml file', inputSchema: { file: z.string().describe('Path to model.yaml') } },
    ({ file }) => call(() => listConsumers(file))
  );

  server.registerTool('get_consumer',
    { description: 'Get a consumer definition by ID', inputSchema: { file: z.string(), id: z.string().describe('Consumer ID') } },
    ({ file, id }) => call(() => getConsumer(file, id))
  );

  server.registerTool('add_consumer',
    {
      description: 'Add a new downstream consumer (BI dashboard, ML model, application, etc.)',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Consumer ID in snake_case'),
        name: z.string().describe('Display name'),
        description: z.string().optional(),
        icon: z.string().optional().describe('Icon emoji or string'),
        color: z.string().optional().describe('Color e.g. #e0f2fe'),
        url: z.string().optional().describe('URL of the consumer (e.g. dashboard link)'),
      },
    },
    ({ file, id, name, description, icon, color, url }) =>
      call(() => { addConsumer(file, { id, name, description, icon, color, url }); return { ok: true, id }; })
  );

  server.registerTool('update_consumer',
    {
      description: 'Update fields of an existing consumer',
      inputSchema: {
        file: z.string(),
        id: z.string().describe('Consumer ID to update'),
        name: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        url: z.string().optional(),
      },
    },
    ({ file, id, name, description, icon, color, url }) =>
      call(() => { updateConsumer(file, { id, name, description, icon, color, url }); return { ok: true, id }; })
  );

  server.registerTool('remove_consumer',
    { description: 'Remove a consumer from the model', inputSchema: { file: z.string(), id: z.string().describe('Consumer ID to remove') } },
    ({ file, id }) => call(() => { removeConsumer(file, id); return { ok: true, id }; })
  );

  // ── Validate tool ─────────────────────────────────────────────────────────

  server.registerTool('validate',
    { description: 'Validate a model.yaml file for structural errors', inputSchema: { file: z.string() } },
    ({ file }) => call(() => validateModel(file))
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
