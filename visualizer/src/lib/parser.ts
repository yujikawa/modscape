import yaml from 'js-yaml'
import type { Schema, ContextYaml, GlossaryYaml, QuestionsYaml } from '../types/schema'

const SUPPORTED_VERSION = '2.0.0'

function detectVersion(data: any): string {
  return typeof data.version === 'string' ? data.version : '1.0.0'
}

export function normalizeSchema(data: any): Schema {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid YAML: Root must be an object')
  }

  const version = detectVersion(data)

  // v1 YAML is not supported — must be migrated first
  if (version !== SUPPORTED_VERSION) {
    throw new Error(
      `This file uses schema v${version}, but schema v${SUPPORTED_VERSION} is required.\n` +
      `Run: modscape migrate <path>`
    )
  }

  return normalizeV2(data)
}

function normalizeV2(data: any): Schema {
  const schema: Schema = {
    version: data.version,
    tables: Array.isArray(data.tables) ? data.tables : [],
    relationships: Array.isArray(data.relationships) ? data.relationships : [],
    lineage: Array.isArray(data.lineage) ? data.lineage : [],
    domains: Array.isArray(data.domains) ? data.domains : [],
    consumers: Array.isArray(data.consumers) ? data.consumers : [],
    annotations: Array.isArray(data.annotations)
      ? data.annotations.map((a: any) => ({
          ...a,
          offset: a.offset ?? { x: 0, y: 0 },
        }))
      : [],
    layout: data.layout || {},
  }

  // Normalize relationships: filter out type='lineage', normalize columns, auto-generate id
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

  // Normalize domains
  schema.domains = schema.domains!.map((domain: any) => ({
    ...domain,
    members: Array.isArray(domain.members) ? domain.members : [],
  }))

  // Sync layout with domain membership (no parentId in v2 layout, but needed internally for Cytoscape)
  if (schema.domains && schema.layout) {
    schema.domains.forEach(domain => {
      domain.members.forEach(memberId => {
        if (schema.layout![memberId]) {
          (schema.layout![memberId] as any).parentId = domain.id
        } else {
          (schema.layout![memberId] as any) = { x: 0, y: 0, parentId: domain.id }
        }
      })
    })
  }

  // Normalize tables
  schema.tables = schema.tables.map((table: any) => {
    let sampleData = table.sampleData

    // Detect and remove header row in sampleData
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

    // Normalize partition: accept both object and array (single object)
    const physical = table.physical ? { ...table.physical } : undefined
    if (physical?.partition && Array.isArray(physical.partition)) {
      physical.partition = physical.partition[0]
    }
    if (physical?.merge_key && !Array.isArray(physical.merge_key)) {
      physical.merge_key = [physical.merge_key]
    }
    if (physical?.cluster && !Array.isArray(physical.cluster)) {
      physical.cluster = [physical.cluster]
    }

    return {
      ...table,
      id: table.id || 'unknown',
      physical: physical || undefined,
      lineage: undefined,
      columns: Array.isArray(table.columns) ? table.columns.map((col: any) => ({
        ...col,
        physical: col.physical ? { ...col.physical } : undefined,
      })) : [],
      sampleData: Array.isArray(sampleData) ? sampleData : [],
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

export function parseContextYaml(input: string): ContextYaml {
  try {
    const data = yaml.load(input) as any
    if (!data || typeof data !== 'object') return {}
    return {
      decisions: Array.isArray(data.decisions) ? data.decisions.map((d: any) => ({
        ...d,
        date: d.date instanceof Date ? d.date.toISOString().slice(0, 10) : d.date,
      })) : undefined,
    }
  } catch {
    return {}
  }
}

export function parseQuestionsYaml(input: string): QuestionsYaml {
  try {
    const data = yaml.load(input) as any
    if (!data || typeof data !== 'object') return {}
    return {
      questions: Array.isArray(data.questions) ? data.questions.map((q: any) => ({
        ...q,
        date: q.date instanceof Date ? q.date.toISOString().slice(0, 10) : q.date,
        status: q.status ?? (q.answer ? 'answered' : 'open'),
      })) : undefined,
    }
  } catch {
    return {}
  }
}

export function parseGlossaryYaml(input: string): GlossaryYaml {
  try {
    const data = yaml.load(input) as any
    if (!data || typeof data !== 'object') return {}
    return {
      terms: Array.isArray(data.terms) ? data.terms.map((t: any) => ({
        ...t,
        date: t.date instanceof Date ? t.date.toISOString().slice(0, 10) : t.date,
      })) : undefined,
    }
  } catch {
    return {}
  }
}
