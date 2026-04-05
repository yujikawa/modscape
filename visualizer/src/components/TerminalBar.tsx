import { memo, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { X, GripHorizontal, Trash2 } from 'lucide-react'

interface HistoryEntry {
  status: 'success' | 'error'
  input: string
  message: string
}

interface Suggestion {
  value: string
  label: string
  desc?: string
  type: 'command' | 'table' | 'column' | 'domain'
}

const COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: '/t',      desc: 'Add table' },
  { cmd: '/d',      desc: 'Add domain' },
  { cmd: '/c',      desc: 'Add consumer' },
  { cmd: '/s',      desc: 'Add annotation' },
  { cmd: '/er',     desc: 'ER relationship  /er <src.col> <tgt.col> [1n|n1|nn|11]' },
  { cmd: '/ln',     desc: 'Lineage  /ln <source> <target>' },
  { cmd: '/mv',     desc: 'Move to domain  /mv <pattern> <domain>' },
  { cmd: '/del',    desc: 'Delete  /del <id>' },
  { cmd: '/get',    desc: 'Show details  /get <id>' },
  { cmd: '/rename', desc: 'Rename table ID  /rename <id> <newId>' },
  { cmd: '/label',  desc: 'Set display name  /label <id> <name>' },
  { cmd: '/col',    desc: 'Column ops  /col add|rm <tableId> [colId]' },
  { cmd: '/find',   desc: 'Find and focus  /find <name>' },
  { cmd: '/clear',  desc: 'Clear history' },
  { cmd: '/fit',    desc: 'Fit view' },
  { cmd: '/pos',    desc: 'Move to position  /pos <id> <x> <y>' },
  { cmd: '/theme',  desc: 'Switch theme  /theme dark|light' },
]

const DEFAULT_W = 380
const DEFAULT_H = 280
const MIN_W = 280
const MIN_H = 180

const TerminalBar = memo(() => {
  const { schema, isTerminalOpen, setIsTerminalOpen, executeCommand, setHighlightedNodeIds, theme } = useStore(
    useShallow((s) => ({
      schema: s.schema,
      isTerminalOpen: s.isTerminalOpen,
      setIsTerminalOpen: s.setIsTerminalOpen,
      executeCommand: s.executeCommand,
      setHighlightedNodeIds: s.setHighlightedNodeIds,
      theme: s.theme,
    }))
  )

  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  // Panel position & size
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [initialized, setInitialized] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)
  const suggListRef = useRef<HTMLDivElement>(null)

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  // Resize state
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  // Schema candidates
  const tableIds = useMemo(() => (schema?.tables ?? []).map(t => ({ id: t.id, name: t.name })), [schema])
  const domainIds = useMemo(() => (schema?.domains ?? []).map(d => ({ id: d.id, name: d.name })), [schema])
  const columnIds = useMemo(() => {
    if (!schema) return [] as { value: string }[]
    return schema.tables.flatMap(t =>
      (t.columns ?? []).map(c => ({ value: `${t.id}.${c.id}` }))
    )
  }, [schema])
  const edgeIds = useMemo(() => [
    ...(schema?.relationships ?? []).map(r => ({ id: r.id ?? '', desc: `${r.from.table} → ${r.to.table} (er)` })).filter(e => e.id),
    ...(schema?.lineage ?? []).map(l => ({ id: l.id ?? '', desc: `${l.from} → ${l.to} (ln)` })).filter(e => e.id),
  ], [schema])
  const allNodeIds = useMemo(() => [
    ...tableIds.map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const })),
    ...domainIds.map(d => ({ value: d.id, label: d.id, desc: d.name, type: 'domain' as const })),
  ], [tableIds, domainIds])

  // Center panel on first open
  useEffect(() => {
    if (isTerminalOpen && !initialized) {
      setPos({
        x: Math.max(0, (window.innerWidth - DEFAULT_W) / 2),
        y: Math.max(0, (window.innerHeight - DEFAULT_H) / 2 - 40),
      })
      setInitialized(true)
    }
    if (isTerminalOpen) {
      setInput('')
      setSuggestions([])
      setSuggestionIndex(0)
      setHistoryIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 10)
    } else {
      setHighlightedNodeIds([])
    }
  }, [isTerminalOpen, initialized, setHighlightedNodeIds])

  // Scroll history to bottom
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Scroll active suggestion into view
  useEffect(() => {
    const item = suggListRef.current?.children[suggestionIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [suggestionIndex])

  // Compute suggestions
  useEffect(() => {
    const tokens = input.trim().split(/\s+/).filter(Boolean)
    const raw = input

    // Show command list when input starts with / (before any space)
    if (raw.startsWith('/') && !raw.includes(' ')) {
      const q = raw.toLowerCase()
      const filtered = COMMANDS.filter(c => c.cmd.startsWith(q) && c.cmd !== q)
      setSuggestions(filtered.map(c => ({ value: c.cmd, label: c.cmd, desc: c.desc, type: 'command' })))
      setSuggestionIndex(0)
      return
    }

    // Argument suggestions
    const cmd = tokens[0]?.toLowerCase() ?? ''
    const isAfterSpace = raw.endsWith(' ')
    const argCount = isAfterSpace ? tokens.length - 1 : tokens.length - 2 // number of completed args

    if (!cmd.startsWith('/') || !raw.includes(' ')) {
      setSuggestions([])
      return
    }

    const currentArg = isAfterSpace ? '' : (tokens[tokens.length - 1] ?? '')
    const q = currentArg.toLowerCase()

    let next: Suggestion[] = []

    if (cmd === '/er') {
      // 3rd arg: relationship type shorthand
      if (argCount >= 2) {
        next = [
          { value: '1n', label: '1n', desc: 'one-to-many', type: 'command' as const },
          { value: 'n1', label: 'n1', desc: 'many-to-one', type: 'command' as const },
          { value: 'nn', label: 'nn', desc: 'many-to-many', type: 'command' as const },
          { value: '11', label: '11', desc: 'one-to-one', type: 'command' as const },
        ].filter(s => s.value.startsWith(q) && s.value !== currentArg)
      } else if (currentArg.includes('.')) {
        // column completion after '.'
        const [tableId, colPartial] = currentArg.split('.')
        const colQ = (colPartial ?? '').toLowerCase()
        const table = schema?.tables.find(t => t.id === tableId)
        next = (table?.columns ?? [])
          .filter(c => c.id.toLowerCase().includes(colQ) && `${tableId}.${c.id}` !== currentArg)
          .slice(0, 10)
          .map(c => ({
            value: `${tableId}.${c.id}`,
            label: `${tableId}.${c.id}`,
            desc: c.logical?.name ?? '',
            type: 'column' as const,
          }))
      } else {
        // table ID completion
        next = tableIds
          .filter(t => (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) && t.id !== currentArg)
          .slice(0, 8)
          .map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const }))
      }
    } else if (cmd === '/pos') {
      if (argCount < 1) {
        const allNodes = [
          ...tableIds.map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const })),
          ...domainIds.map(d => ({ value: d.id, label: d.id, desc: d.name, type: 'domain' as const })),
        ]
        next = allNodes.filter(n => n.value.toLowerCase().includes(q) && n.value !== currentArg).slice(0, 8)
      }
    } else if (cmd === '/del') {
      // All node IDs + edge IDs
      const allDel: Suggestion[] = [
        ...allNodeIds,
        ...edgeIds.map(e => ({ value: e.id, label: e.id, desc: e.desc, type: 'table' as const })),
      ]
      next = allDel.filter(n => n.value.toLowerCase().includes(q) && n.value !== currentArg).slice(0, 10)
    } else if (cmd === '/get') {
      const allGet: Suggestion[] = [
        ...allNodeIds,
        ...edgeIds.map(e => ({ value: e.id, label: e.id, desc: e.desc, type: 'table' as const })),
      ]
      next = allGet.filter(n => n.value.toLowerCase().includes(q) && n.value !== currentArg).slice(0, 10)
    } else if (cmd === '/rename') {
      // Tables only (domains not supported)
      next = tableIds
        .filter(t => (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) && t.id !== currentArg)
        .slice(0, 8)
        .map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const }))
    } else if (cmd === '/label') {
      next = allNodeIds.filter(n => n.value.toLowerCase().includes(q) && n.value !== currentArg).slice(0, 8)
    } else if (cmd === '/col') {
      // arg1: sub-command (add/rm), arg2: tableId, arg3: colId (rm only)
      if (argCount < 1) {
        next = ['add', 'rm']
          .filter(s => s.startsWith(q))
          .map(s => ({ value: s, label: s, desc: s === 'add' ? 'Add column' : 'Remove column', type: 'command' as const }))
      } else if (argCount < 2) {
        next = tableIds
          .filter(t => (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) && t.id !== currentArg)
          .slice(0, 8)
          .map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const }))
      } else if (argCount < 3 && tokens[1] === 'rm') {
        // Column completion for /col rm <tableId> <colId>
        const tableId = tokens[2]
        const table = schema?.tables.find(t => t.id === tableId)
        next = (table?.columns ?? [])
          .filter(c => c.id.toLowerCase().includes(q) && c.id !== currentArg)
          .slice(0, 10)
          .map(c => ({ value: c.id, label: c.id, desc: c.logical?.name ?? '', type: 'column' as const }))
      }
    } else if (cmd === '/ln') {
      next = tableIds
        .filter(t => (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) && t.id !== currentArg)
        .slice(0, 8)
        .map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const }))
    } else if (cmd === '/find') {
      next = allNodeIds.filter(n => (n.value.toLowerCase().includes(q) || (n.desc ?? '').toLowerCase().includes(q)) && n.value !== currentArg).slice(0, 8)
    } else if (cmd === '/mv') {
      if (argCount < 1) {
        next = tableIds
          .filter(t => (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) && t.id !== currentArg)
          .slice(0, 8)
          .map(t => ({ value: t.id, label: t.id, desc: t.name, type: 'table' as const }))
      } else {
        next = domainIds
          .filter(d => (d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)) && d.id !== currentArg)
          .slice(0, 8)
          .map(d => ({ value: d.id, label: d.id, desc: d.name, type: 'domain' as const }))
      }
    } else if (cmd === '/theme') {
      next = ['dark', 'light']
        .filter(m => m.startsWith(q) && m !== currentArg)
        .map(m => ({ value: m, label: m, type: 'command' as const }))
    }

    setSuggestions(next)
    setSuggestionIndex(0)
    void argCount
  }, [input, tableIds, domainIds, columnIds, edgeIds, allNodeIds, schema])

  // Canvas highlight
  useEffect(() => {
    if (!isTerminalOpen) return
    const tokens = input.trim().split(/\s+/).filter(Boolean)
    const cmd = tokens[0]?.toLowerCase()
    const ids: string[] = []
    if (cmd && ['/er', '/ln', '/mv', '/del', '/find'].includes(cmd)) {
      tokens.slice(1).forEach(token => {
        const tableId = token.includes('.') ? token.split('.')[0] : token
        if (schema?.tables.some(t => t.id === tableId)) ids.push(tableId)
        if (cmd === '/mv' && schema?.domains?.some(d => d.id === token)) ids.push(token)
      })
    }
    setHighlightedNodeIds(ids)
  }, [input, isTerminalOpen, schema, setHighlightedNodeIds])

  const applySuggestion = useCallback((s: Suggestion) => {
    if (s.type === 'command' && !input.includes(' ')) {
      // Command name completion — replace whole input
      setInput(s.value + ' ')
    } else if (input.endsWith(' ')) {
      // Trailing space: append as new token (don't overwrite existing args)
      setInput(input + s.value + ' ')
    } else {
      // Replace the partially-typed last token
      const tokens = input.split(/\s+/)
      tokens[tokens.length - 1] = s.value
      setInput(tokens.join(' ') + ' ')
    }
    setSuggestions([])
    inputRef.current?.focus()
  }, [input])

  const clearHistory = useCallback(() => {
    setHistory([])
    setHistoryIndex(-1)
    setInput('')
    setSuggestions([])
  }, [])

  const handleExecute = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (trimmed === '/clear') { clearHistory(); return }
    // strip leading slash for executeCommand
    const cmd = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    const result = executeCommand(cmd)
    setHistory(prev => [...prev.slice(-49), { status: result.status, input: trimmed, message: result.message }])
    setHistoryIndex(-1)
    if (result.status === 'success') {
      setInput('')
      setSuggestions([])
      setHighlightedNodeIds([])
    }
  }, [input, executeCommand, setHighlightedNodeIds, clearHistory])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); setIsTerminalOpen(false); return }

    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(i => (i + 1) % suggestions.length); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length); return }
      if (e.key === 'Tab') { e.preventDefault(); applySuggestion(suggestions[suggestionIndex]); return }
      if (e.key === 'Enter') { e.preventDefault(); setSuggestions([]); handleExecute(); return }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const executed = history.filter(h => h.status === 'success').map(h => h.input)
        const next = historyIndex + 1
        if (next < executed.length) { setHistoryIndex(next); setInput(executed[executed.length - 1 - next]) }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const executed = history.filter(h => h.status === 'success').map(h => h.input)
        const next = historyIndex - 1
        if (next < 0) { setHistoryIndex(-1); setInput('') }
        else { setHistoryIndex(next); setInput(executed[executed.length - 1 - next]) }
        return
      }
      if (e.key === 'Enter') { e.preventDefault(); handleExecute(); return }
    }
  }

  // ── Drag ──────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - size.w, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - size.h, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos, size])

  // ── Resize ────────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      setSize({
        w: Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX),
        h: Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY),
      })
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size])

  if (!isTerminalOpen) return null

  const isDark = theme === 'dark'
  const bg = isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.6)'
  const border = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(226,232,240,0.6)'
  const headerBg = isDark ? 'rgba(15,23,42,0.7)' : 'rgba(241,245,249,0.7)'
  const textPrimary = isDark ? '#e2e8f0' : '#0f172a'
  const textMuted = isDark ? '#475569' : '#94a3b8'
  const suggBg = isDark ? 'rgba(30,41,59,0.75)' : 'rgba(248,250,252,0.75)'
  const suggActive = isDark ? '#2563eb' : '#3b82f6'
  const histBg = isDark ? 'rgba(15,23,42,0.3)' : 'rgba(248,250,252,0.3)'

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        boxShadow: isDark
          ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 20px 40px rgba(0,0,0,0.15)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        overflow: 'hidden',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header / drag bar */}
      <div
        onMouseDown={onDragStart}
        style={{
          backgroundColor: headerBg,
          borderBottom: `1px solid ${border}`,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'grab',
          flexShrink: 0,
        }}
      >
        <GripHorizontal size={13} style={{ color: textMuted, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Console</span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={clearHistory}
          title="Clear history"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 2, display: 'flex', alignItems: 'center', borderRadius: 4 }}
        >
          <Trash2 size={12} />
        </button>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setIsTerminalOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 2, display: 'flex', alignItems: 'center', borderRadius: 4 }}
        >
          <X size={13} />
        </button>
      </div>

      {/* History */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 10px',
          backgroundColor: histBg,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 0,
        }}
      >
        {history.length === 0 && (
          <div style={{ color: textMuted, fontSize: 11, margin: 'auto', textAlign: 'center', lineHeight: 1.8 }}>
            Type <span style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>/</span> to see commands
          </div>
        )}
        {history.map((h, i) => {
          const isSuccess = h.status === 'success'
          const accentColor = isSuccess ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#f87171' : '#dc2626')
          const msgColor = isSuccess ? (isDark ? '#94a3b8' : '#64748b') : accentColor
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '4px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
              {/* Input line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: accentColor, flexShrink: 0, fontSize: 10 }}>{isSuccess ? '✓' : '✗'}</span>
                <span style={{ fontSize: 11, color: textPrimary, fontWeight: 500 }}>{h.input}</span>
              </div>
              {/* Output lines */}
              {h.message.split('\n').map((line, j) => (
                <div key={j} style={{ display: 'flex', gap: 5, paddingLeft: 15 }}>
                  <span style={{ fontSize: 11, color: msgColor, whiteSpace: 'pre' }}>{line}</span>
                </div>
              ))}
            </div>
          )
        })}
        <div ref={historyEndRef} />
      </div>

      {/* Suggestion list */}
      {suggestions.length > 0 && (
        <div
          ref={suggListRef}
          style={{
            borderTop: `1px solid ${border}`,
            backgroundColor: suggBg,
            maxHeight: 180,
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.value}
              onMouseDown={e => { e.preventDefault(); applySuggestion(s) }}
              style={{
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: i === suggestionIndex ? suggActive : 'transparent',
                color: i === suggestionIndex ? '#fff' : textPrimary,
              }}
            >
              <span style={{ fontWeight: 700, minWidth: s.type === 'command' ? 60 : 140, flexShrink: 0 }}>{s.label}</span>
              {s.desc && <span style={{ fontSize: 11, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.4, flexShrink: 0 }}>{s.type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Usage hint */}
      {(() => {
        const tokens = input.trim().split(/\s+/)
        const cmd = tokens[0]?.toLowerCase()
        const hint = cmd && input.includes(' ') ? COMMANDS.find(c => c.cmd === cmd)?.desc : null
        return hint ? (
          <div style={{ padding: '3px 10px', fontSize: 10, color: textMuted, borderTop: `1px solid ${border}`, fontStyle: 'italic' }}>
            {hint}
          </div>
        ) : null
      })()}

      {/* Input row */}
      <div
        style={{
          borderTop: `1px solid ${border}`,
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span style={{ color: isDark ? '#3b82f6' : '#2563eb', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setHistoryIndex(-1) }}
          onKeyDown={handleKeyDown}
          placeholder="/ for commands"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 12,
            color: textPrimary,
            caretColor: isDark ? '#60a5fa' : '#2563eb',
          }}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        <kbd style={{ fontSize: 10, color: textMuted, padding: '1px 4px', border: `1px solid ${border}`, borderRadius: 3, flexShrink: 0 }}>Esc</kbd>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 14,
          height: 14,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 3,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill={textMuted}>
          <path d="M7 1L1 7M7 4L4 7M7 7" stroke={textMuted} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
})

export default TerminalBar
