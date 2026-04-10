import { describe, it, expect, vi } from 'vitest'
import { normalizeSchema, parseYAML } from './parser'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal valid v2 schema wrapper */
function v2(extra: object = {}): any {
  return { version: '2.0.0', tables: [], ...extra }
}

// ── T37: v2 YAML の正常パース ─────────────────────────────────────────────────

describe('T37: v2 YAML normal parse', () => {
  it('parses version: "2.0.0" without error', () => {
    const schema = normalizeSchema(v2())
    expect(schema.version).toBe('2.0.0')
  })

  it('reads conceptual / logical / physical / display fields on tables', () => {
    const data = v2({
      tables: [{
        id: 'fct_orders',
        conceptual: { name: 'Orders', kind: 'fact', description: 'One row per order.' },
        logical: { name: 'Order Transactions', grain: ['month_key'] },
        physical: { name: 'fct_orders', strategy: 'incremental', merge_key: 'order_id' },
        display: { icon: '🛒', color: '#e0f2fe' },
      }]
    })
    const schema = normalizeSchema(data)
    const t = schema.tables[0]
    expect(t.conceptual?.name).toBe('Orders')
    expect(t.conceptual?.kind).toBe('fact')
    expect(t.conceptual?.description).toBe('One row per order.')
    expect(t.logical?.name).toBe('Order Transactions')
    expect(t.logical?.grain).toEqual(['month_key'])
    expect(t.physical?.name).toBe('fct_orders')
    expect(t.physical?.strategy).toBe('incremental')
    expect(t.display?.icon).toBe('🛒')
    expect(t.display?.color).toBe('#e0f2fe')
  })

  it('reads annotation.target.{id, type}', () => {
    const data = v2({
      annotations: [{
        id: 'note_1',
        text: 'Grain note',
        target: { id: 'fct_orders', type: 'table' },
      }]
    })
    const schema = normalizeSchema(data)
    const a = schema.annotations![0]
    expect(a.target?.id).toBe('fct_orders')
    expect(a.target?.type).toBe('table')
  })

  it('reads flat column structure (no logical: wrapper)', () => {
    const data = v2({
      tables: [{
        id: 't1',
        columns: [{
          id: 'order_id',
          name: 'Order ID',
          type: 'Int',
          isPrimaryKey: true,
          isForeignKey: false,
          additivity: 'fully',
        }]
      }]
    })
    const schema = normalizeSchema(data)
    const col = schema.tables[0].columns![0]
    expect(col.name).toBe('Order ID')
    expect(col.type).toBe('Int')
    expect(col.isPrimaryKey).toBe(true)
    expect(col.additivity).toBe('fully')
  })

  it('reads domain display.color', () => {
    const data = v2({
      domains: [{
        id: 'sales',
        name: 'Sales',
        display: { color: 'rgba(59, 130, 246, 0.1)' },
        members: [],
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.domains![0].display?.color).toBe('rgba(59, 130, 246, 0.1)')
  })

  it('reads consumer display.icon and display.color', () => {
    const data = v2({
      consumers: [{
        id: 'dash_1',
        name: 'Sales Dashboard',
        display: { icon: '📊', color: '#e0f2fe' },
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.consumers![0].display?.icon).toBe('📊')
    expect(schema.consumers![0].display?.color).toBe('#e0f2fe')
  })
})

// ── T38: v1 YAML のエラー検出 ─────────────────────────────────────────────────

describe('T38: v1 YAML error detection', () => {
  it('throws for version: "1.0.0"', () => {
    expect(() => normalizeSchema({ version: '1.0.0', tables: [] }))
      .toThrow()
  })

  it('throws for missing version field', () => {
    expect(() => normalizeSchema({ tables: [] }))
      .toThrow()
  })

  it('error message contains "modscape migrate"', () => {
    try {
      normalizeSchema({ version: '1.0.0', tables: [] })
    } catch (e: any) {
      expect(e.message).toContain('modscape migrate')
    }
  })

  it('parseYAML propagates error for v1 YAML string', () => {
    const yaml = 'version: "1.0.0"\ntables: []\n'
    expect(() => parseYAML(yaml)).toThrow()
  })

  it('version "0.9.0" (unknown) also throws', () => {
    expect(() => normalizeSchema({ version: '0.9.0', tables: [] }))
      .toThrow()
  })
})

// ── T39: v2 正規化ロジック ────────────────────────────────────────────────────

describe('T39: v2 normalization logic', () => {
  it('annotation without target is treated as undefined', () => {
    const data = v2({
      annotations: [{ id: 'note_1', text: 'No target' }]
    })
    const schema = normalizeSchema(data)
    expect(schema.annotations![0].target).toBeUndefined()
  })

  it('annotation.offset defaults to {x:0, y:0} when omitted', () => {
    const data = v2({
      annotations: [{ id: 'note_1', text: 'No offset' }]
    })
    const schema = normalizeSchema(data)
    expect(schema.annotations![0].offset).toEqual({ x: 0, y: 0 })
  })

  it('column.physical is preserved when present', () => {
    const data = v2({
      tables: [{
        id: 't1',
        columns: [{
          id: 'col1',
          name: 'Col',
          type: 'Int',
          physical: { name: 'col1_pk', type: 'BIGINT', constraints: ['NOT NULL'] }
        }]
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].columns![0].physical?.name).toBe('col1_pk')
  })

  it('column.physical is undefined when not provided', () => {
    const data = v2({
      tables: [{
        id: 't1',
        columns: [{ id: 'col1', name: 'Col', type: 'Int' }]
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].columns![0].physical).toBeUndefined()
  })

  it('parentId is injected into layout from domains.members', () => {
    const data = v2({
      domains: [{ id: 'dom1', name: 'D1', members: ['t1'] }],
      tables: [{ id: 't1', conceptual: { name: 'T1', kind: 'table' } }],
      layout: { dom1: { x: 0, y: 0, width: 480, height: 400 }, t1: { x: 80, y: 80 } }
    })
    const schema = normalizeSchema(data)
    expect((schema.layout!['t1'] as any).parentId).toBe('dom1')
  })

  it('layout entry created with parentId if table has no layout entry but is in domain', () => {
    const data = v2({
      domains: [{ id: 'dom1', name: 'D1', members: ['t1'] }],
      tables: [{ id: 't1', conceptual: { name: 'T1', kind: 'table' } }],
      layout: { dom1: { x: 0, y: 0, width: 480, height: 400 } }
    })
    const schema = normalizeSchema(data)
    expect((schema.layout!['t1'] as any).parentId).toBe('dom1')
  })

  it('normalizes relationship columns from string to array', () => {
    const data = v2({
      relationships: [{
        from: { table: 'a', column: 'id' },
        to: { table: 'b', column: 'a_id' },
        type: 'one-to-many'
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].from.column).toEqual(['id'])
    expect(schema.relationships[0].to.column).toEqual(['a_id'])
  })

  it('keeps relationship columns as array if already an array', () => {
    const data = v2({
      relationships: [{
        from: { table: 'a', column: ['id1', 'id2'] },
        to: { table: 'b', column: ['a_id1', 'a_id2'] },
        type: 'one-to-many'
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].from.column).toEqual(['id1', 'id2'])
    expect(schema.relationships[0].to.column).toEqual(['a_id1', 'a_id2'])
  })

  it('generates deterministic ID for relationships with columns', () => {
    const data = v2({
      relationships: [{
        from: { table: 'a', column: 'id' },
        to: { table: 'b', column: 'a_id' }
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].id).toBe('rel-a.id-b.a_id')
  })

  it('generates deterministic ID for lineage entries', () => {
    const data = v2({
      lineage: [{ from: 'fct_orders', to: 'mart_revenue' }]
    })
    const schema = normalizeSchema(data)
    expect(schema.lineage![0].id).toBe('lin-fct_orders-mart_revenue')
  })

  it('filters out relationships with type="lineage" and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = v2({
      relationships: [
        { from: { table: 'a' }, to: { table: 'b' }, type: 'lineage' },
        { from: { table: 'c' }, to: { table: 'd' }, type: 'one-to-one' }
      ]
    })
    const schema = normalizeSchema(data)
    expect(schema.relationships).toHaveLength(1)
    expect(schema.relationships[0].from.table).toBe('c')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('removes sampleData header row if it matches column IDs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = v2({
      tables: [{
        id: 't1',
        columns: [{ id: 'id' }, { id: 'name' }],
        sampleData: [['id', 'name'], ['1', 'Alice'], ['2', 'Bob']]
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].sampleData).toHaveLength(2)
    expect(schema.tables[0].sampleData![0]).toEqual(['1', 'Alice'])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('normalizes partition from array to single object', () => {
    const data = v2({
      tables: [{
        id: 't1',
        physical: {
          strategy: 'incremental',
          partition: [{ field: 'order_date', granularity: 'day' }]
        }
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].physical?.partition).toEqual({ field: 'order_date', granularity: 'day' })
  })

  it('normalizes merge_key from string to array', () => {
    const data = v2({
      tables: [{
        id: 't1',
        physical: { strategy: 'incremental', merge_key: 'order_id' }
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].physical?.merge_key).toEqual(['order_id'])
  })

  it('normalizes cluster from string to array', () => {
    const data = v2({
      tables: [{
        id: 't1',
        physical: { cluster: 'customer_id' }
      }]
    })
    const schema = normalizeSchema(data)
    expect(schema.tables[0].physical?.cluster).toEqual(['customer_id'])
  })

  it('parseYAML parses valid v2 YAML string', () => {
    const yaml = `
version: "2.0.0"
tables:
  - id: fct_orders
    conceptual:
      name: Orders
      kind: fact
`
    const schema = parseYAML(yaml)
    expect(schema.tables[0].id).toBe('fct_orders')
    expect(schema.tables[0].conceptual?.name).toBe('Orders')
  })
})
