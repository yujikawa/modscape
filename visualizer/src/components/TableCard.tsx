import { memo } from 'react'
import type { Table, ContextTableEntry } from '../types/schema'
import { TYPE_CONFIG, buildTypeLabel } from '../lib/cytoscapeElements'
import { LINEAGE_BASE } from '../lib/colors'

interface TableCardProps {
  table: Table
  isSelected: boolean
  isDimmed: boolean
  isHighlighted: boolean
  isHovered: boolean
  zoom: number
  theme: 'dark' | 'light'
  hoveredColumnId: string | null
  isCompact: boolean
  isConnectMode?: boolean
  isPendingSource?: boolean
  contextEntry?: ContextTableEntry
}

const MAX_COLUMNS = 6

const TableCard = ({
  table,
  isSelected,
  isDimmed: _isDimmed,
  isHighlighted,
  isHovered,
  zoom,
  theme,
  hoveredColumnId,
  isCompact,
  isConnectMode = false,
  isPendingSource = false,
  contextEntry,
}: TableCardProps) => {
  const typeConfig = table.conceptual?.kind ? TYPE_CONFIG[table.conceptual.kind] : null
  const themeColor = table.display?.color || typeConfig?.color || '#334155'
  const icon = table.display?.icon || typeConfig?.icon || ''
  const typeLabel = buildTypeLabel(table)
  const hasColumns = table.columns && table.columns.length > 0
  const isMinimal = zoom < 0.35   // reduces header size at low zoom
  const hideColumns = isMinimal || isCompact  // hides column list

  const borderColor = isPendingSource ? '#22c55e' : isSelected ? LINEAGE_BASE : isHovered ? themeColor : isConnectMode ? '#22c55e' : 'var(--border-main)'
  const boxShadow = isPendingSource
    ? '0 0 0 3px #22c55e, 0 0 16px 4px rgba(34, 197, 94, 0.45)'
    : isSelected
    ? `0 0 0 3px ${LINEAGE_BASE}, 0 0 16px 4px rgba(59, 130, 246, 0.45)`
    : isHovered
    ? `0 0 0 2px ${themeColor}, 0 0 20px 6px ${themeColor}80`
    : isHighlighted
    ? '0 0 12px 3px rgba(59, 130, 246, 0.35)'
    : isConnectMode
    ? '0 0 0 1px #22c55e40'
    : theme === 'dark'
    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
    : '0 4px 12px -2px rgba(0, 0, 0, 0.1)'

  return (
    <div
      data-testid="table-node"
      data-table-id={table.id}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '220px',
        position: 'relative',
        cursor: 'default',
        opacity: _isDimmed ? 0.15 : 1,
        transition: 'opacity 0.2s ease-in-out',
        userSelect: 'none',
      }}
    >
      {/* Connect mode: pending source badge */}
      {isPendingSource && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '8px',
            padding: '0 6px',
            height: '14px',
            backgroundColor: '#22c55e',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 900,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          FROM
        </div>
      )}

      {/* SDD context badges */}
      {contextEntry && (contextEntry.open_questions ?? 0) > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: contextEntry.has_spec ? '30px' : '8px',
            padding: '0 5px',
            height: '14px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 900,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          title={`${contextEntry.open_questions} open question(s)`}
        >
          ❓{contextEntry.open_questions}
        </div>
      )}
      {contextEntry?.has_spec && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '8px',
            padding: '0 5px',
            height: '14px',
            backgroundColor: '#10b981',
            color: '#fff',
            fontSize: '8px',
            fontWeight: 900,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            zIndex: 2,
            pointerEvents: 'none',
          }}
          title="Spec available"
        >
          📝
        </div>
      )}

      {/* Type badge tab */}
      {typeLabel && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '12px',
            height: '14px',
            padding: '0 6px',
            backgroundColor: themeColor,
            color: '#ffffff',
            fontSize: '8px',
            fontWeight: 900,
            borderRadius: '4px 4px 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          {typeLabel}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--node-bg)',
          borderLeft: `2px solid ${borderColor}`,
          borderRight: `2px solid ${borderColor}`,
          borderBottom: `2px solid ${borderColor}`,
          borderTop: `4px solid ${themeColor}`,
          borderRadius: '8px',
          overflow: 'hidden',
          color: 'var(--text-primary)',
          boxShadow,
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isMinimal ? '8px 10px' : '12px',
            backgroundColor:
              theme === 'dark'
                ? 'rgba(15, 23, 42, 0.8)'
                : 'rgba(241, 245, 249, 0.9)',
            borderBottom:
              hasColumns && !hideColumns ? '1px solid var(--border-main)' : 'none',
            flexShrink: 0,
            cursor: 'grab',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && (
              <span style={{ fontSize: isMinimal ? '14px' : '18px' }}>{icon}</span>
            )}
            <div
              style={{
                fontSize: isMinimal ? '12px' : '16px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: '1.2',
                wordBreak: 'break-all',
              }}
            >
              {table.conceptual?.name ?? table.id}
            </div>
          </div>

          {!isMinimal && (
            <>
              {table.logical?.name && table.logical.name !== table.conceptual?.name && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    paddingLeft: icon ? '26px' : '0',
                    opacity: 0.8,
                  }}
                >
                  {table.logical.name}
                </div>
              )}
              <div
                title={table.physical?.name || table.id}
                style={{
                  fontSize: '9px',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                  paddingLeft: icon ? '26px' : '0',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {table.physical?.name || table.id}
              </div>
            </>
          )}
        </div>

        {/* Columns — only when not minimal */}
        {!hideColumns && hasColumns && (
          <div style={{ padding: 0, overflowY: 'auto', flex: 1, cursor: 'default' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                {table.columns!.slice(0, MAX_COLUMNS).map((col, index) => {
                  const logicalName = col.name || col.id
                  const physicalName = col.physical?.name || col.id
                  const showPhysical = logicalName !== physicalName

                  return (
                    <tr
                      key={col.id}
                      style={{
                        borderBottom: '1px solid var(--border-main)',
                        backgroundColor:
                          hoveredColumnId === col.id
                            ? theme === 'dark'
                              ? 'rgba(30, 58, 138, 0.6)'
                              : 'rgba(191, 219, 254, 0.4)'
                            : 'transparent',
                      }}
                    >
                      <td
                        style={{
                          padding: '6px 12px',
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              color: 'var(--text-secondary)',
                              marginRight: '6px',
                              fontSize: '9px',
                              fontFamily: 'monospace',
                              width: '14px',
                              textAlign: 'right',
                              opacity: 0.6,
                              marginTop: '2px',
                            }}
                          >
                            {index + 1}.
                          </span>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              {col.isPrimaryKey && (
                                <span style={{ color: '#eab308' }}>🔑</span>
                              )}
                              {col.isForeignKey && (
                                <span style={{ opacity: 0.8 }}>🔩</span>
                              )}
                              {col.isPartitionKey && (
                                <span style={{ opacity: 0.8 }}>📂</span>
                              )}
                              {col.additivity === 'fully' && (
                                <span style={{ color: '#4ade80' }} title="Fully Additive">
                                  Σ
                                </span>
                              )}
                              {col.additivity === 'semi' && (
                                <span style={{ color: '#fbbf24' }} title="Semi-Additive">
                                  Σ~
                                </span>
                              )}
                              {col.additivity === 'non' && (
                                <span style={{ color: '#f87171' }} title="Non-Additive">
                                  ⊘
                                </span>
                              )}
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={col.description || logicalName}
                              >
                                {logicalName}
                              </span>
                            </div>
                            {showPhysical && (
                              <div
                                style={{
                                  fontSize: '8px',
                                  fontFamily: 'monospace',
                                  opacity: 0.6,
                                  marginTop: '1px',
                                  paddingLeft: '2px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={physicalName}
                              >
                                {physicalName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '6px 12px',
                          textAlign: 'right',
                          fontStyle: 'italic',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '120px',
                          verticalAlign: 'top',
                          opacity: 0.8,
                        }}
                      >
                        {col.type || 'Unknown'}
                      </td>
                    </tr>
                  )
                })}
                {table.columns!.length > MAX_COLUMNS && (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: '4px 12px',
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                        opacity: 0.6,
                      }}
                    >
                      +{table.columns!.length - MAX_COLUMNS} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TableCard)
