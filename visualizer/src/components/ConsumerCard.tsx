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
    <div
      style={{
        width: '220px',
        borderRadius: '10px',
        border: `2px solid ${borderColor}`,
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        boxShadow,
        opacity: isDimmed ? 0.25 : 1,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
        pointerEvents: 'none',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '3px', backgroundColor: color }} />

      {/* Body */}
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
          {icon}
        </div>

        {/* Text */}
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
            {consumer.name}
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
              backgroundColor: dark ? `${color}20` : color,
              color: dark ? color : contrastColor(color),
              border: `1px solid ${dark ? `${color}40` : color}`,
            }}
          >
            CONSUMER
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default memo(ConsumerCard)
