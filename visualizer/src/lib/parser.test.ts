import { describe, it, expect, vi } from 'vitest'
import { normalizeSchema } from './parser'

describe('normalizeSchema', () => {
  it('normalizes relationship columns from string to string[] (Task 7.6)', () => {
    const data = {
      relationships: [
        {
          from: { table: 'a', column: 'id' },
          to: { table: 'b', column: 'a_id' }
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].from.column).toEqual(['id'])
    expect(schema.relationships[0].to.column).toEqual(['a_id'])
  })

  it('keeps relationship columns as string[] if already provided as array (Task 7.7)', () => {
    const data = {
      relationships: [
        {
          from: { table: 'a', column: ['id1', 'id2'] },
          to: { table: 'b', column: ['a_id1', 'a_id2'] }
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].from.column).toEqual(['id1', 'id2'])
    expect(schema.relationships[0].to.column).toEqual(['a_id1', 'a_id2'])
  })

  it('generates deterministic ID for relationships with columns (Task 7.8)', () => {
    const data = {
      relationships: [
        {
          from: { table: 'a', column: 'id' },
          to: { table: 'b', column: 'a_id' }
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].id).toBe('rel-a.id-b.a_id')
  })

  it('generates deterministic ID for relationships without columns (Task 7.9)', () => {
    const data = {
      relationships: [
        {
          from: { table: 'a' },
          to: { table: 'b' },
          type: 'one-to-many'
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.relationships[0].id).toBe('rel-a-b-one-to-many')
  })

  it('generates deterministic ID for lineage entries (Task 7.10)', () => {
    const data = {
      lineage: [
        { from: 'a', to: 'b' }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.lineage![0].id).toBe('lin-a-b')
  })

  it('excludes relationships with type="lineage" and warns (Task 7.11)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = {
      relationships: [
        {
          from: { table: 'a' },
          to: { table: 'b' },
          type: 'lineage'
        },
        {
          from: { table: 'c' },
          to: { table: 'd' },
          type: 'one-to-one'
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.relationships).toHaveLength(1)
    expect(schema.relationships[0].from.table).toBe('c')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('removes sampleData header row if it matches column IDs (Task 7.12)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = {
      tables: [
        {
          id: 't1',
          columns: [{ id: 'id' }, { id: 'name' }],
          sampleData: [
            ['id', 'name'],
            ['1', 'Alice'],
            ['2', 'Bob']
          ]
        }
      ]
    }
    const schema = normalizeSchema(data)
    expect(schema.tables[0].sampleData).toHaveLength(2)
    expect(schema.tables[0].sampleData![0]).toEqual(['1', 'Alice'])
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('preserves version field as schema.version (Task 7.13)', () => {
    const data = {
      version: '1.0.0',
      tables: []
    }
    const schema = normalizeSchema(data)
    expect(schema.version).toBe('1.0.0')
  })
})
