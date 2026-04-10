import type { Table as TableType } from '../types/schema'
import { useStore } from '../store/useStore'

interface SampleDataGridProps {
  table: TableType;
  sampleData: any[][];
}

const SampleDataGrid = ({ table, sampleData }: SampleDataGridProps) => {
  const setHoveredColumnId = useStore(state => state.setHoveredColumnId)

  return (
    <div style={{ border: '1px solid #1e293b', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead style={{ backgroundColor: '#020617', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            {(table.columns || []).map((col) => (
              <th 
                key={col.id} 
                onMouseEnter={() => setHoveredColumnId(col.id)}
                onMouseLeave={() => setHoveredColumnId(null)}
                style={{ 
                  padding: '12px 16px', 
                  fontWeight: 'bold', 
                  color: '#f1f5f9', 
                  borderRight: '1px solid #1e293b', 
                  textAlign: 'left', 
                  cursor: 'default',
                  whiteSpace: 'nowrap'
                }}
              >
                {col.name || col.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sampleData.map((row, rowIndex) => (
            <TableRow key={rowIndex} row={row} borderStyle="1px solid #1e293b" />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Sub-component to avoid hooks inside map
const TableRow = ({ row, borderStyle }: { row: any[], borderStyle: string }) => {
  return (
    <tr style={{ borderBottom: borderStyle }}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex} style={{ padding: '8px 16px', borderRight: borderStyle, color: '#d1d5db', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px' }}>
          {String(cell)}
        </td>
      ))}
    </tr>
  )
}

export default SampleDataGrid
