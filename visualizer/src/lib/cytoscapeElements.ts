import type { Schema, Table } from '../types/schema'
import { CONSUMER_DEFAULT_COLOR } from './colors'

// Minimal element definition shape for Cytoscape
export interface CyElementDefinition {
  data: Record<string, unknown>
  position?: { x: number; y: number }
  classes?: string
}

export const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  fact: { color: '#f87171', icon: '📊', label: 'FACT' },
  dimension: { color: '#60a5fa', icon: '🏷️', label: 'DIM' },
  hub: { color: '#fbbf24', icon: '🌐', label: 'HUB' },
  link: { color: '#34d399', icon: '🔗', label: 'LINK' },
  satellite: { color: '#a78bfa', icon: '🛰️', label: 'SAT' },
  mart: { color: '#f5700b', icon: '📈', label: 'MART' },
  table: { color: '#64748b', icon: '📋', label: 'TABLE' },
}

const CONSUMER_DEFAULT_ICON = '📊'

export function buildTypeLabel(table: Table): string {
  const typeConfig = table.appearance?.type ? TYPE_CONFIG[table.appearance.type] : null
  let typeLabel = typeConfig?.label || ''
  const subType = table.appearance?.sub_type
  const scd = table.appearance?.scd

  if (table.appearance?.type === 'fact' && subType) {
    const strategyMap: Record<string, string> = {
      transaction: 'Trans.',
      periodic: 'Periodic',
      accumulating: 'Accum.',
      factless: 'Factless',
    }
    typeLabel = `FACT (${strategyMap[subType] || subType})`
  } else if (table.appearance?.type && subType) {
    typeLabel = `${table.appearance.type.toUpperCase()} (${subType})`
  } else if (table.appearance?.type) {
    typeLabel = table.appearance.type.toUpperCase()
  }

  if (scd) {
    const scdLabel = `SCD ${scd.replace('type', 'T')}`
    typeLabel = typeLabel ? `${typeLabel} / ${scdLabel}` : scdLabel
  }

  return typeLabel
}

function cardinalityLabels(type: string | undefined): { sourceLabel: string; targetLabel: string } {
  switch (type) {
    case 'one-to-many':  return { sourceLabel: '1', targetLabel: 'N' }
    case 'many-to-one':  return { sourceLabel: 'N', targetLabel: '1' }
    case 'many-to-many': return { sourceLabel: 'N', targetLabel: 'N' }
    case 'one-to-one':   return { sourceLabel: '1', targetLabel: '1' }
    default:             return { sourceLabel: '',  targetLabel: ''  }
  }
}

/**
 * Convert a parsed YAML schema to Cytoscape element definitions.
 * Tables → nodes, consumers → consumer-node nodes,
 * lineage[] → lineage edges, relationships[] → ER edges.
 * Does NOT mutate the schema.
 */
export function yamlToElements(schema: Schema): CyElementDefinition[] {
  const elements: CyElementDefinition[] = []

  // Build domain membership map for quick lookup (tables and consumers)
  const domainByMemberId = new Map<string, string>()
  schema.domains?.forEach(domain => {
    domain.members.forEach(memberId => {
      domainByMemberId.set(memberId, domain.id)
    })
  })

  // Auto-layout fallback positions
  const TABLE_WIDTH = 280
  const TABLE_HEIGHT = 200
  const GRID_COLS = 3

  // Table nodes
  schema.tables.forEach((table, index) => {
    const layout = schema.layout?.[table.id]
    const col = index % GRID_COLS
    const row = Math.floor(index / GRID_COLS)

    // Always treat layout x/y as absolute canvas coordinates.
    // parentId in layout is semantic metadata only (domain membership), not used for coordinate math.
    const x = layout?.x ?? col * (TABLE_WIDTH + 40)
    const y = layout?.y ?? row * (TABLE_HEIGHT + 40)

    const typeConfig = table.appearance?.type ? TYPE_CONFIG[table.appearance.type] : null
    const typeColor = table.appearance?.color || typeConfig?.color || '#334155'

    elements.push({
      data: {
        id: table.id,
        table,
        domainId: domainByMemberId.get(table.id) ?? null,
        typeColor,
        typeLabel: buildTypeLabel(table),
        typeIcon: table.appearance?.icon || typeConfig?.icon || '',
      },
      position: { x, y },
    })
  })

  // Consumer nodes
  const usecaseIdSet = new Set((schema.consumers ?? []).map(u => u.id))
  schema.consumers?.forEach((consumer, index) => {
    const layout = schema.layout?.[consumer.id]
    const x = layout?.x ?? (schema.tables.length + index) * (TABLE_WIDTH + 40)
    const y = layout?.y ?? Math.floor(index / GRID_COLS) * (TABLE_HEIGHT + 40)

    const color = consumer.appearance?.color || CONSUMER_DEFAULT_COLOR
    const icon = consumer.appearance?.icon || CONSUMER_DEFAULT_ICON

    elements.push({
      data: {
        id: consumer.id,
        consumer,
        domainId: domainByMemberId.get(consumer.id) ?? null,
        typeColor: color,
        typeIcon: icon,
        label: consumer.name,
      },
      position: { x, y },
      classes: 'consumer-node',
    })
  })

  // Build set of all node IDs (tables + consumers) for edge validation
  const tableIdSet = new Set(schema.tables.map(t => t.id))
  const allNodeIdSet = new Set([...tableIdSet, ...usecaseIdSet])

  // Lineage edges (from top-level schema.lineage[])
  // `to` can reference either a table or a consumer node
  schema.lineage?.forEach((edge) => {
    if (!allNodeIdSet.has(edge.from) || !allNodeIdSet.has(edge.to)) return // skip dangling edges
    elements.push({
      data: {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        kind: 'lineage',
        description: edge.description ?? null,
      },
      classes: 'lineage-edge',
    })
  })

  // ER edges (from relationships[])
  schema.relationships?.forEach((rel) => {
    if (!tableIdSet.has(rel.from.table) || !tableIdSet.has(rel.to.table)) return // skip dangling edges
    elements.push({
      data: {
        id: rel.id,
        source: rel.from.table,
        target: rel.to.table,
        kind: 'er',
        ...cardinalityLabels(rel.type),
        fromColumn: rel.from.column ?? null,
        toColumn: rel.to.column ?? null,
        relType: rel.type ?? null,
      },
      classes: 'er-edge',
    })
  })

  return elements
}
