import { memo, useRef, useCallback, useState, useMemo } from 'react'
import { X, ChevronDown, ChevronRight as ChevronRightIcon, Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import type { ContextDecision, ContextQuestion } from '../types/schema'

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: '9px', fontWeight: 800, fontFamily: 'monospace',
      color, backgroundColor: color + '22',
      padding: '1px 6px', borderRadius: '3px', letterSpacing: '0.05em', flexShrink: 0,
    }}>
      {text}
    </span>
  )
}

function DecisionCard({ d, theme }: { d: ContextDecision; theme: string }) {
  const border = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const bg = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const text = theme === 'dark' ? '#cbd5e1' : '#334155'
  const sub = theme === 'dark' ? '#475569' : '#94a3b8'
  return (
    <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${border}`, backgroundColor: bg, marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
        <Badge text={d.id} color="#2563eb" />
        {d.date && <span style={{ fontSize: '10px', color: sub }}>{d.date}</span>}
        {d.change && <span style={{ fontSize: '10px', color: sub }}>via {d.change}</span>}
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: text, lineHeight: 1.5 }}>{d.summary}</p>
      {d.rationale && (
        <p style={{ margin: '5px 0 0', fontSize: '11px', color: sub, lineHeight: 1.4, fontStyle: 'italic' }}>{d.rationale}</p>
      )}
    </div>
  )
}

function QuestionCard({ q, theme }: { q: ContextQuestion; theme: string }) {
  const answered = !!q.answer
  const border = answered
    ? (theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)')
    : (theme === 'dark' ? 'rgba(234,179,8,0.25)' : 'rgba(234,179,8,0.3)')
  const bg = answered
    ? (theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
    : (theme === 'dark' ? 'rgba(234,179,8,0.05)' : '#fffbeb')
  const text = theme === 'dark' ? '#cbd5e1' : '#334155'
  const sub = theme === 'dark' ? '#475569' : '#94a3b8'
  return (
    <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${border}`, backgroundColor: bg, marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
        <Badge text={q.id} color={answered ? '#059669' : '#d97706'} />
        {!answered && <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 600 }}>Unanswered</span>}
        {q.date && <span style={{ fontSize: '10px', color: sub }}>{q.date}</span>}
        {q.change && <span style={{ fontSize: '10px', color: sub }}>via {q.change}</span>}
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: text, lineHeight: 1.5 }}>{q.question}</p>
      {q.answer && (
        <p style={{ margin: '6px 0 0', padding: '6px 8px', fontSize: '11px', color: text, lineHeight: 1.5, backgroundColor: theme === 'dark' ? 'rgba(5,150,105,0.1)' : 'rgba(5,150,105,0.06)', borderLeft: '2px solid #059669', borderRadius: '0 4px 4px 0' }}>
          {q.answer}
        </p>
      )}
    </div>
  )
}

function TableSpecSection({ tableId, spec, questions, theme }: { tableId: string; spec?: string; questions?: string; theme: string }) {
  const [open, setOpen] = useState(false)
  const border = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const bg = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const text = theme === 'dark' ? '#cbd5e1' : '#334155'
  const headerBg = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 12px', background: headerBg, border: 'none', cursor: 'pointer',
          color: theme === 'dark' ? '#94a3b8' : '#475569',
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>{tableId}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', backgroundColor: bg }}>
          {spec && (
            <>
              <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme === 'dark' ? '#475569' : '#94a3b8' }}>Spec</p>
              <pre style={{ margin: '0 0 10px', fontSize: '11px', color: text, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{spec}</pre>
            </>
          )}
          {questions && (
            <>
              <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme === 'dark' ? '#475569' : '#94a3b8' }}>Q&A</p>
              <pre style={{ margin: 0, fontSize: '11px', color: text, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>{questions}</pre>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const ContextPanel = memo(() => {
  const { contextData, tableSpecs, isContextPanelOpen, setIsContextPanelOpen, theme } = useStore(
    useShallow((s) => ({
      contextData: s.contextData,
      tableSpecs: s.tableSpecs,
      isContextPanelOpen: s.isContextPanelOpen,
      setIsContextPanelOpen: s.setIsContextPanelOpen,
      theme: s.theme,
    }))
  )

  const [query, setQuery] = useState('')
  const q = query.toLowerCase()

  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const posRef = useRef({ x: 80, y: 80 })
  const sizeRef = useRef({ width: 360, height: 480 })

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const origW = sizeRef.current.width
    const origH = sizeRef.current.height
    const onMove = (ev: MouseEvent) => {
      if (!panelRef.current) return
      sizeRef.current = {
        width: Math.max(280, Math.min(700, origW + ev.clientX - startX)),
        height: Math.max(200, Math.min(window.innerHeight * 0.9, origH + ev.clientY - startY)),
      }
      panelRef.current.style.width = `${sizeRef.current.width}px`
      panelRef.current.style.height = `${sizeRef.current.height}px`
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: posRef.current.x, origY: posRef.current.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !panelRef.current) return
      posRef.current = {
        x: dragRef.current.origX + ev.clientX - dragRef.current.startX,
        y: dragRef.current.origY + ev.clientY - dragRef.current.startY,
      }
      panelRef.current.style.left = `${posRef.current.x}px`
      panelRef.current.style.top = `${posRef.current.y}px`
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const isDark = theme === 'dark'
  const decisions = useMemo(() =>
    (contextData?.decisions ?? []).filter(d =>
      !q || d.id.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q) || (d.rationale ?? '').toLowerCase().includes(q)
    ), [contextData, q])
  const questions = useMemo(() =>
    (contextData?.questions ?? []).filter(qe =>
      !q || qe.id.toLowerCase().includes(q) || qe.question.toLowerCase().includes(q) || (qe.answer ?? '').toLowerCase().includes(q)
    ), [contextData, q])
  const tableSpecEntries = useMemo(() =>
    (tableSpecs ? Object.entries(tableSpecs) : []).filter(([tableId, entry]) =>
      !q || tableId.toLowerCase().includes(q) || (entry.spec ?? '').toLowerCase().includes(q) || (entry.questions ?? '').toLowerCase().includes(q)
    ), [tableSpecs, q])
  const isEmpty = decisions.length === 0 && questions.length === 0 && tableSpecEntries.length === 0

  if (!isContextPanelOpen) return null

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: posRef.current.x,
        top: posRef.current.y,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={onDragStart}
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a', letterSpacing: '0.02em' }}>
          Context
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsContextPanelOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#64748b' : '#94a3b8', display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
          <Search size={12} color={isDark ? '#475569' : '#94a3b8'} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: isDark ? '#e2e8f0' : '#0f172a' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#475569' : '#94a3b8', display: 'flex' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: isDark ? '#475569' : '#94a3b8' }}>
            {query ? (
              <p style={{ margin: 0, fontSize: '12px' }}>No results for "{query}"</p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '12px' }}>No context recorded yet.</p>
                <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Run SDD workflows to populate</p>
                <code style={{ fontSize: '10px', opacity: 0.7 }}>.modscape/specs/_context.yaml</code>
              </>
            )}
          </div>
        ) : (
          <>
            {decisions.length > 0 && (
              <>
                <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#475569' : '#94a3b8' }}>
                  Decisions ({decisions.length})
                </p>
                {decisions.map(d => <DecisionCard key={d.id} d={d} theme={theme} />)}
              </>
            )}
            {questions.length > 0 && (
              <>
                <p style={{ margin: `${decisions.length > 0 ? '12px' : '0'} 0 8px`, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#475569' : '#94a3b8' }}>
                  Q&A ({questions.length})
                </p>
                {questions.map(q => <QuestionCard key={q.id} q={q} theme={theme} />)}
              </>
            )}
            {tableSpecEntries.length > 0 && (
              <>
                <p style={{ margin: `${decisions.length > 0 || questions.length > 0 ? '12px' : '0'} 0 8px`, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#475569' : '#94a3b8' }}>
                  Table Specs ({tableSpecEntries.length})
                </p>
                {tableSpecEntries.map(([tableId, entry]) => (
                  <TableSpecSection
                    key={tableId}
                    tableId={tableId}
                    spec={entry.spec}
                    questions={entry.questions}
                    theme={theme}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 16, height: 16, cursor: 'se-resize',
          background: `linear-gradient(135deg, transparent 50%, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} 50%)`,
          borderRadius: '0 0 12px 0',
        }}
      />
    </div>
  )
})

export default ContextPanel
