import yaml from 'js-yaml'
import type { Schema } from '../types/schema'

export function normalizeSchema(data: any): Schema {
  // Basic validation and mapping
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid YAML: Root must be an object')
  }

  // Normalization: Ensure tables, relationships, domains, consumers and annotations are always arrays
  const schema: Schema = {
    version: typeof data.version === 'string' ? data.version : undefined,
    tables: Array.isArray(data.tables) ? data.tables : [],
    relationships: Array.isArray(data.relationships) ? data.relationships : [],
    lineage: Array.isArray(data.lineage) ? data.lineage : [],
    domains: Array.isArray(data.domains) ? data.domains : [],
    consumers: Array.isArray(data.consumers) ? data.consumers : [],
    annotations: Array.isArray(data.annotations) ? data.annotations : [],
    layout: data.layout || {}
  }

  // Normalize relationships: filter out type='lineage' entries, normalize column to string[], auto-generate id
  schema.relationships = schema.relationships!.filter((rel: any) => {
    if (rel.type === 'lineage') {
      console.warn(`[modscape] Relationship with type='lineage' is invalid and has been ignored. Use the lineage section instead. (from: ${rel.from?.table}, to: ${rel.to?.table})`)
      return false
    }
    return true
  }).map((rel: any) => {
    const fromCols: string[] | undefined = rel.from?.column != null
      ? (Array.isArray(rel.from.column) ? rel.from.column : [rel.from.column])
      : undefined
    const toCols: string[] | undefined = rel.to?.column != null
      ? (Array.isArray(rel.to.column) ? rel.to.column : [rel.to.column])
      : undefined

    let id: string = rel.id
    if (!id) {
      if (fromCols && toCols) {
        id = `rel-${rel.from.table}.${fromCols.join('+')}-${rel.to.table}.${toCols.join('+')}`
      } else {
        id = `rel-${rel.from.table}-${rel.to.table}-${rel.type || 'unknown'}`
      }
    }

    return {
      ...rel,
      id,
      from: { ...rel.from, column: fromCols },
      to: { ...rel.to, column: toCols },
    }
  })

  // Normalize lineage: auto-generate id if missing
  schema.lineage = schema.lineage!.map((edge: any) => {
    if (edge.id) return edge
    return { ...edge, id: `lin-${edge.from}-${edge.to}` }
  })

  // Normalize domains: support both `members` (new) and `tables` (legacy) field names
  schema.domains = schema.domains!.map((domain: any) => ({
    ...domain,
    members: Array.isArray(domain.members)
      ? domain.members
      : Array.isArray(domain.tables)
        ? domain.tables
        : [],
    tables: undefined,
  }))

  // Auto-repair: Sync layout.parentId with domain.members membership
  if (schema.domains && schema.layout) {
    schema.domains.forEach(domain => {
      domain.members.forEach(memberId => {
        if (schema.layout![memberId]) {
          schema.layout![memberId].parentId = domain.id;
        } else {
          // If no layout exists for this member, create a placeholder so it has a parent
          schema.layout![memberId] = { x: 0, y: 0, parentId: domain.id };
        }
      });
    });
  }

  // Further normalization for each table
  schema.tables = schema.tables.map((table: any) => {
    let sampleData = table.sampleData;

    // Detect and remove header row in sampleData (exact match with column id list)
    if (Array.isArray(sampleData) && sampleData.length > 0 && Array.isArray(table.columns)) {
      const firstRow = sampleData[0]
      const colIds = (table.columns as any[]).map((c: any) => c.id)
      if (
        Array.isArray(firstRow) &&
        firstRow.length === colIds.length &&
        firstRow.every((v: any) => typeof v === 'string') &&
        firstRow.every((v: any, i: number) => v === colIds[i])
      ) {
        console.warn(`[modscape] sampleData for table "${table.id}" contains a header row matching column IDs. The header row has been removed.`)
        sampleData = sampleData.slice(1)
      }
    }

    // Migrate legacy format { columns: [...], rows: [[...]] } to new [[...]] format
    if (sampleData && typeof sampleData === 'object' && !Array.isArray(sampleData)) {
      const legacyColumns = Array.isArray(sampleData.columns) ? sampleData.columns : [];
      const legacyRows = Array.isArray(sampleData.rows) ? sampleData.rows : [];

      if (legacyColumns.length > 0 && legacyRows.length > 0) {
        // Map legacy columns (ID list) to current table column order
        const currentColumns = Array.isArray(table.columns) ? table.columns : [];
        sampleData = legacyRows.map((row: any[]) => {
          return currentColumns.map((col: any) => {
            const colIndex = legacyColumns.indexOf(col.id);
            return colIndex !== -1 ? row[colIndex] : null;
          });
        });
      } else if (legacyRows.length > 0) {
        sampleData = legacyRows;
      } else {
        sampleData = [];
      }
    }

    const appearance = table.appearance ? { ...table.appearance } : undefined;
    if (appearance) {
      // Compatibility mapping: sub_type (if type0-7) -> scd
      if (appearance.sub_type && /^type[0-7]$/.test(appearance.sub_type) && !appearance.scd) {
        appearance.scd = appearance.sub_type;
        appearance.sub_type = undefined;
      }
    }

    return {
      ...table,
      id: table.id || 'unknown',
      name: table.name !== undefined ? table.name : (table.id || 'Unnamed Table'),
      logical_name: table.logical_name,
      physical_name: table.physical_name,
      appearance,
      lineage: undefined, // Explicitly clear legacy lineage if present
      implementation: table.implementation ? {
        ...table.implementation,
        // Normalize unique_key: YAML may have a single string or an array
        unique_key: table.implementation.unique_key
          ? (Array.isArray(table.implementation.unique_key)
              ? table.implementation.unique_key
              : [table.implementation.unique_key])
          : undefined,
        // Normalize partition_by: YAML may have a single object or an array
        partition_by: table.implementation.partition_by
          ? (Array.isArray(table.implementation.partition_by)
              ? table.implementation.partition_by
              : [table.implementation.partition_by])
          : undefined,
      } : undefined,
      columns: Array.isArray(table.columns) ? table.columns.map((col: any) => ({
        ...col,
        logical: col.logical ? { ...col.logical } : undefined,
        physical: col.physical ? { ...col.physical } : undefined
      })) : [],
      sampleData: Array.isArray(sampleData) ? sampleData : []
    }
  })

  return schema
}

export function parseYAML(input: string): Schema {
  try {
    const data = yaml.load(input) as any
    return normalizeSchema(data)
  } catch (e: any) {
    throw new Error(`YAML Parsing Error: ${e.message}`)
  }
}
