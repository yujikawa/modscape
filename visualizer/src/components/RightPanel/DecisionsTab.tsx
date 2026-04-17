import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'

const DecisionsTab = memo(() => {
  const { contextData, theme } = useStore(
    useShallow((s) => ({ contextData: s.contextData, theme: s.theme }))
  )

  const decisions = contextData?.decisions ?? []

  if (decisions.length === 0) {
    return (
      <div style={{ padding: '16px', color: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: '13px' }}>
        No decisions recorded. Decisions are written to{' '}
        <code style={{ fontSize: '11px', fontFamily: 'monospace' }}>.modscape/specs/_context.yaml</code>{' '}
        when archiving a spec change.
      </div>
    )
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
      {decisions.map((d) => (
        <div
          key={d.id}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '9px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '3px',
              backgroundColor: theme === 'dark' ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
              color: '#60a5fa',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}>
              {d.id}
            </span>
            {d.date && (
              <span style={{ fontSize: '10px', color: theme === 'dark' ? '#475569' : '#94a3b8' }}>
                {d.date}
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
            {d.summary}
          </p>
          {d.affects && d.affects.length > 0 && (
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {d.affects.map((t) => (
                <span key={t} style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b',
                }}>
                  {t}
                </span>
              ))}
            </div>
          )}
          {d.change && (
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: theme === 'dark' ? '#475569' : '#94a3b8' }}>
              via {d.change}
            </p>
          )}
        </div>
      ))}
    </div>
  )
})

export default DecisionsTab
