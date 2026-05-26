import { memo } from 'react'
import type { Consumer } from '../types/schema'
import { CONSUMER_DEFAULT_COLOR } from '../lib/colors'

const DEFAULT_COLOR = CONSUMER_DEFAULT_COLOR
const DEFAULT_ICON = '📊'

/** Returns '#ffffff' or a dark color depending on the perceived luminance of a hex color. */
function contrastColor(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#1e293b'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1e293b' : '#ffffff'
}

interface ConsumerCardProps {
  consumer: Consumer
  isSelected: boolean
  isDimmed: boolean
  theme: 'dark' | 'light'
  isConnectMode?: boolean
  isPendingSource?: boolean
}

const ConsumerCard = ({ consumer, isSelected, isDimmed, theme, isConnectMode = false, isPendingSource = false }: ConsumerCardProps) => {
  const color = consumer.display?.color || DEFAULT_COLOR
  const icon = consumer.display?.icon || DEFAULT_ICON
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
          color: contrastColor(color),
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
        CONSUMER
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: `${color}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
              border: `1px solid ${color}40`,
            }}
          >
            {icon}
          </div>

          {/* Name + Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: dark ? '#f1f5f9' : '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {consumer.name}
            </div>
            {consumer.description && (
              <div
                style={{
                  fontSize: '9px',
                  color: dark ? '#94a3b8' : '#64748b',
                  marginTop: '2px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.4',
                }}
              >
                {consumer.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ConsumerCard)
