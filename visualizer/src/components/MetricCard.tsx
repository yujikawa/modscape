import { memo } from 'react'
import type { Metric } from '../types/schema'

const METRIC_COLOR = '#10b981'

interface MetricCardProps {
  metric: Metric
  isSelected: boolean
  isDimmed: boolean
  theme: 'dark' | 'light'
  isConnectMode?: boolean
  isPendingSource?: boolean
}

const MetricCard = ({ metric, isSelected, isDimmed, theme, isConnectMode = false, isPendingSource = false }: MetricCardProps) => {
  const color = METRIC_COLOR
  const dark = theme === 'dark'

  const borderColor = isPendingSource ? '#22c55e' : isSelected ? color : isConnectMode ? '#22c55e' : dark ? '#334155' : '#e2e8f0'
  const boxShadow = isPendingSource
    ? '0 0 0 3px #22c55e, 0 0 16px 4px rgba(34, 197, 94, 0.45)'
    : isSelected
    ? `0 0 0 3px ${color}40, 0 4px 16px ${color}25`
    : isConnectMode
    ? '0 0 0 1px #22c55e40'
    : dark
    ? '0 2px 8px rgba(0,0,0,0.4)'
    : '0 2px 8px rgba(0,0,0,0.08)'

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {isPendingSource && (
        <div style={{ position: 'absolute', top: '-10px', right: '8px', padding: '0 6px', height: '14px', backgroundColor: '#22c55e', color: '#fff', fontSize: '8px', fontWeight: 900, borderRadius: '4px', display: 'flex', alignItems: 'center', letterSpacing: '0.05em', textTransform: 'uppercase', zIndex: 2, pointerEvents: 'none' }}>
          FROM
        </div>
      )}

      {/* Type tab — same style as TableCard kind badge */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '12px',
          height: '14px',
          padding: '0 6px',
          backgroundColor: color,
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
        METRIC
      </div>

      <div
        style={{
          width: '220px',
          borderRadius: '8px',
          borderLeft: `2px solid ${borderColor}`,
          borderRight: `2px solid ${borderColor}`,
          borderBottom: `2px solid ${borderColor}`,
          borderTop: `4px solid ${color}`,
          backgroundColor: dark ? '#0f172a' : '#ffffff',
          boxShadow,
          opacity: isDimmed ? 0.25 : 1,
          overflow: 'hidden',
          transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
          pointerEvents: 'none',
        }}
      >
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: dark ? '#f1f5f9' : '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {metric.name}
          </span>

          {metric.expression && (
            <div
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                color: dark ? '#e2e8f0' : '#3f6212',
                backgroundColor: dark ? '#1e293b' : '#f1f5f9',
                borderRadius: '4px',
                padding: '3px 6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {metric.expression}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(MetricCard)
