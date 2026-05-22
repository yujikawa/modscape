import { memo } from 'react'
import type { Metric } from '../types/schema'

const METRIC_COLOR = '#10b981'
const DEFAULT_ICON = '📐'

interface MetricCardProps {
  metric: Metric
  isSelected: boolean
  isDimmed: boolean
  theme: 'dark' | 'light'
}

const MetricCard = ({ metric, isSelected, isDimmed, theme }: MetricCardProps) => {
  const color = METRIC_COLOR
  const dark = theme === 'dark'

  return (
    <div
      style={{
        width: '220px',
        borderRadius: '10px',
        border: `2px solid ${isSelected ? color : dark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        boxShadow: isSelected
          ? `0 0 0 3px ${color}40, 0 4px 16px ${color}25`
          : dark
          ? '0 2px 8px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        opacity: isDimmed ? 0.25 : 1,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '3px', backgroundColor: color }} />

      {/* Body */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: metric.expression ? '8px' : 0 }}>
          {/* Icon */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
              border: `1px solid ${color}40`,
            }}
          >
            {DEFAULT_ICON}
          </div>

          {/* Name + badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: dark ? '#f1f5f9' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {metric.name}
            </div>
            <div
              style={{
                marginTop: '2px',
                display: 'inline-block',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: dark ? `${color}20` : `${color}15`,
                color: color,
                border: `1px solid ${color}40`,
              }}
            >
              METRIC
            </div>
          </div>
        </div>

        {/* Expression preview */}
        {metric.expression && (
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: dark ? '#94a3b8' : '#64748b',
              backgroundColor: dark ? '#1e293b' : '#f8fafc',
              border: `1px solid ${dark ? '#334155' : '#e2e8f0'}`,
              borderRadius: '4px',
              padding: '4px 6px',
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
  )
}

export default memo(MetricCard)
