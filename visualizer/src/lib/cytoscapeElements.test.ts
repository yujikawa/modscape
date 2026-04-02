import { describe, it, expect } from 'vitest'
import { yamlToElements, buildTypeLabel } from './cytoscapeElements'
import type { Schema } from '../types/schema'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSchema(overrides: Partial<Schema> = {}): Schema {
  return {
    tables: [],
    relationships: [],
    domains: [],
    annotations: [],
    layout: {},
    ...overrides,
  }
}

// ── yamlToElements ────────────────────────────────────────────────────────────

describe('yamlToElements', () => {
  it('returns one node per table', () => {
    const schema = makeSchema({
      tables: [
        { id: 'tbl_a', name: 'A', appearance: { type: 'fact' }, columns: [] },
        { id: 'tbl_b', name: 'B', appearance: { type: 'dimension' }, columns: [] },
      ],
    })
    const elements = yamlToElements(schema)
    const nodes = elements.filter(e => !e.classes)
    expect(nodes).toHaveLength(2)
    expect(nodes.map(n => n.data.id)).toEqual(['tbl_a', 'tbl_b'])
  })

  it('includes table object in node data', () => {
    const table = { id: 'tbl_x', name: 'X', appearance: { type: 'mart' as const }, columns: [] }
    const elements = yamlToElements(makeSchema({ tables: [table] }))
    const node = elements.find(e => e.data.id === 'tbl_x')!
    expect(node.data.table).toEqual(table)
  })

  it('uses schema.layout coordinates when available', () => {
    const schema = makeSchema({
      tables: [{ id: 'tbl_a', name: 'A', appearance: { type: 'table' }, columns: [] }],
      layout: { tbl_a: { x: 100, y: 200 } },
    })
    const elements = yamlToElements(schema)
    expect(elements[0].position).toEqual({ x: 100, y: 200 })
  })

  it('treats layout coordinates as absolute even when parentId is present', () => {
    const schema = makeSchema({
      tables: [{ id: 'tbl_a', name: 'A', appearance: { type: 'fact' }, columns: [] }],
      domains: [{ id: 'dom1', name: 'Domain 1', color: '#fff', members: ['tbl_a'] }],
      layout: {
        dom1: { x: 500, y: 300 },
        tbl_a: { x: 60, y: 60, parentId: 'dom1' },
      },
    })
    const elements = yamlToElements(schema)
    // parentId is semantic metadata only — x/y are always absolute
    expect(elements[0].position).toEqual({ x: 60, y: 60 })
  })

  it('falls back to grid positions when layout is absent', () => {
    const schema = makeSchema({
      tables: [
        { id: 'a', name: 'A', appearance: { type: 'table' }, columns: [] },
        { id: 'b', name: 'B', appearance: { type: 'table' }, columns: [] },
        { id: 'c', name: 'C', appearance: { type: 'table' }, columns: [] },
        { id: 'd', name: 'D', appearance: { type: 'table' }, columns: [] },
      ],
    })
    const elements = yamlToElements(schema)
    // First 3 in row 0 (y=0), 4th starts row 1 (y>0)
    expect(elements[0].position!.y).toBe(0)
    expect(elements[3].position!.y).toBeGreaterThan(0)
  })

  it('creates lineage edges from lineage.upstream', () => {
    const schema = makeSchema({
      tables: [
        { id: 'src', name: 'Source', appearance: { type: 'fact' }, columns: [] },
        { id: 'mart', name: 'Mart', appearance: { type: 'mart' }, columns: [] },
      ],
      lineage: [{ id: 'lin1', from: 'src', to: 'mart' }],
    })
    const elements = yamlToElements(schema)
    const edges = elements.filter(e => e.classes === 'lineage-edge')
    expect(edges).toHaveLength(1)
    expect(edges[0].data.id).toBe('lin1')
    expect(edges[0].data.source).toBe('src')
    expect(edges[0].data.target).toBe('mart')
    expect(edges[0].data.kind).toBe('lineage')
  })

  it('creates ER edges from relationships', () => {
    const schema = makeSchema({
      tables: [
        { id: 'dim', name: 'Dim', appearance: { type: 'dimension' }, columns: [] },
        { id: 'fct', name: 'Fact', appearance: { type: 'fact' }, columns: [] },
      ],
      relationships: [
        {
          id: 'rel1',
          from: { table: 'dim', column: ['id'] },
          to: { table: 'fct', column: ['dim_id'] },
          type: 'one-to-many',
        },
      ],
    })
    const elements = yamlToElements(schema)
    const erEdges = elements.filter(e => e.classes === 'er-edge')
    expect(erEdges).toHaveLength(1)
    expect(erEdges[0].data.id).toBe('rel1')
    expect(erEdges[0].data.kind).toBe('er')
    expect(erEdges[0].data.source).toBe('dim')
    expect(erEdges[0].data.target).toBe('fct')
    expect(erEdges[0].data.sourceLabel).toBe('1')
    expect(erEdges[0].data.targetLabel).toBe('N')
    expect(erEdges[0].data.fromColumn).toEqual(['id'])
    expect(erEdges[0].data.toColumn).toEqual(['dim_id'])
    expect(erEdges[0].data.relType).toBe('one-to-many')
  })

  it('handles composite columns in relationships', () => {
    const schema = makeSchema({
      tables: [
        { id: 'orders', name: 'Orders', appearance: { type: 'fact' }, columns: [] },
        { id: 'lines', name: 'Lines', appearance: { type: 'fact' }, columns: [] },
      ],
      relationships: [
        {
          id: 'rel-composite',
          from: { table: 'orders', column: ['order_id', 'line_no'] },
          to: { table: 'lines', column: ['order_id', 'line_no'] },
          type: 'one-to-many',
        },
      ],
    })
    const elements = yamlToElements(schema)
    const erEdges = elements.filter(e => e.classes === 'er-edge')
    expect(erEdges[0].data.fromColumn).toEqual(['order_id', 'line_no'])
    expect(erEdges[0].data.toColumn).toEqual(['order_id', 'line_no'])
  })

  it('maps domain membership to domainId on nodes', () => {
    const schema = makeSchema({
      tables: [
        { id: 'tbl_a', name: 'A', appearance: { type: 'fact' }, columns: [] },
        { id: 'tbl_b', name: 'B', appearance: { type: 'table' }, columns: [] },
      ],
      domains: [{ id: 'dom1', name: 'Domain 1', color: '#fff', members: ['tbl_a'] }],
    })
    const elements = yamlToElements(schema)
    const nodeA = elements.find(e => e.data.id === 'tbl_a')!
    const nodeB = elements.find(e => e.data.id === 'tbl_b')!
    expect(nodeA.data.domainId).toBe('dom1')
    expect(nodeB.data.domainId).toBeNull()
  })

  it('produces no edges for empty relationships and no lineage', () => {
    const schema = makeSchema({
      tables: [{ id: 't', name: 'T', appearance: { type: 'table' }, columns: [] }],
    })
    const elements = yamlToElements(schema)
    const edges = elements.filter(e => e.classes)
    expect(edges).toHaveLength(0)
  })

  it('handles multiple lineage upstreams', () => {
    const schema = makeSchema({
      tables: [
        { id: 'a', name: 'A', appearance: { type: 'fact' }, columns: [] },
        { id: 'b', name: 'B', appearance: { type: 'fact' }, columns: [] },
        { id: 'mart', name: 'Mart', appearance: { type: 'mart' }, columns: [] },
      ],
      lineage: [{ from: 'a', to: 'mart' }, { from: 'b', to: 'mart' }],
    })
    const elements = yamlToElements(schema)
    const lineageEdges = elements.filter(e => e.classes === 'lineage-edge')
    expect(lineageEdges).toHaveLength(2)
  })
})

// ── buildTypeLabel ────────────────────────────────────────────────────────────

describe('buildTypeLabel', () => {
  it('returns uppercase type name for basic types', () => {
    const table = { id: 't', name: 'T', appearance: { type: 'dimension' as const }, columns: [] }
    expect(buildTypeLabel(table)).toBe('DIMENSION')
  })

  it('appends SCD label when scd is present', () => {
    const table = {
      id: 't', name: 'T',
      appearance: { type: 'dimension' as const, scd: 'type2' },
      columns: [],
    }
    expect(buildTypeLabel(table)).toBe('DIMENSION / SCD T2')
  })

  it('formats fact sub_type correctly', () => {
    const table = {
      id: 't', name: 'T',
      appearance: { type: 'fact' as const, sub_type: 'transaction' },
      columns: [],
    }
    expect(buildTypeLabel(table)).toBe('FACT (Trans.)')
  })

  it('returns empty string when appearance is missing', () => {
    const table = { id: 't', name: 'T', columns: [] } as unknown as Parameters<typeof buildTypeLabel>[0]
    expect(buildTypeLabel(table)).toBe('')
  })
})
