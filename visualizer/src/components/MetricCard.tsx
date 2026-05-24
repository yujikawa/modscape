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
      <div
        style={{
          width: '220px',
          borderRadius: '8px',
          border: `1.5px solid ${borderColor}`,
          backgroundColor: dark ? '#0f172a' : '#ffffff',
          boxShadow,
          opacity: isDimmed ? 0.25 : 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'stretch',
          transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
          pointerEvents: 'none',
        }}
      >
        {/* Left accent bar */}
        <div style={{ width: '3px', backgroundColor: color, flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px', minWidth: 0 }}>
          {/* Row 1: name + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: dark ? '#f1f5f9' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              {metric.name}
            </span>
            <span
              style={{
                fontSize: '8px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '1px 4px',
                borderRadius: '3px',
                backgroundColor: dark ? `${color}20` : `${color}15`,
                color: color,
                border: `1px solid ${color}40`,
                flexShrink: 0,
              }}
            >
              METRIC
            </span>
          </div>

          {/* Row 2: expression */}
          {metric.expression && (
            <div
              style={{
                fontSize: '9px',
                fontFamily: 'monospace',
                color: dark ? '#a3e635' : '#3f6212',
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
