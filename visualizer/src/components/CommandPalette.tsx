import { memo, useState, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import {
  Command,
  Search,
  ChevronRight,
  Check,
  Info,
  Plus,
  Sun,
  Maximize,
  Zap,
  MousePointer2,
  Move,
  Network,
  GitGraph,
  ArrowRight,
  ChevronDown,
  Database,
} from 'lucide-react'
import type { Relationship } from '../types/schema'

// ── Connect mode candidate helpers ──────────────────────────────────────────

interface ConnectCandidate {
  value: string
  label: string
  type: 'table' | 'column' | 'bulk'
  tableId?: string
}

function buildCandidates(schema: ReturnType<typeof useStore.getState>['schema'], includeColumns: boolean): ConnectCandidate[] {
  if (!schema) return []
  const results: ConnectCandidate[] = []
  schema.tables.forEach(table => {
    results.push({ value: table.id, label: table.name, type: 'table' })
    if (includeColumns) {
      table.columns?.forEach(col => {
        results.push({
          value: `${table.id}.${col.id}`,
          label: col.logical?.name ?? col.id,
          type: 'column',
          tableId: table.id,
        })
      })
    }
  })
  return results
}

function filterCandidates(candidates: ConnectCandidate[], query: string): ConnectCandidate[] {
  if (!query) return []
  const q = query.toLowerCase()
  return candidates.filter(c => c.value.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)).slice(0, 12)
}

// ── Component ────────────────────────────────────────────────────────────────

const CommandPalette = memo(() => {
  const {
    schema,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    executePipeline,
    setHighlightedNodeIds,
    setFocusNodeId,
    bulkAddRelationship,
    theme,
  } = useStore(useShallow((s) => ({
    schema: s.schema,
    isCommandPaletteOpen: s.isCommandPaletteOpen,
    setIsCommandPaletteOpen: s.setIsCommandPaletteOpen,
    executePipeline: s.executePipeline,
    setHighlightedNodeIds: s.setHighlightedNodeIds,
    setFocusNodeId: s.setFocusNodeId,
    bulkAddRelationship: s.bulkAddRelationship,
    theme: s.theme,
  })))

  // ── Pipeline mode state ──
  const [input, setInput] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info', msg: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // ── Palette mode ──
  const [paletteMode, setPaletteMode] = useState<'pipeline' | 'connect'>('pipeline')
  const [connectSubMode, setConnectSubMode] = useState<'er' | 'lineage'>('er')

  // ── Connect mode state ──
  const [sourceInput, setSourceInput] = useState('')
  const [targetInput, setTargetInput] = useState('')
  const [relType, setRelType] = useState<Relationship['type'] | 'lineage'>('one-to-many')
  const [showSourceDrop, setShowSourceDrop] = useState(false)
  const [showTargetDrop, setShowTargetDrop] = useState(false)
  const [connectSelIdx, setConnectSelIdx] = useState(0)
  const [connectSuccess, setConnectSuccess] = useState(false)
  const sourceRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<HTMLInputElement>(null)

  const includeColumns = connectSubMode === 'er'
  const allCandidates = useMemo(() => buildCandidates(schema, includeColumns), [schema, includeColumns])

  const sourceCandidates = useMemo(() => filterCandidates(allCandidates, sourceInput), [allCandidates, sourceInput])
  const targetCandidatesBase = useMemo(() => filterCandidates(allCandidates, targetInput), [allCandidates, targetInput])
  const targetCandidates = useMemo(() => {
    if (connectSubMode === 'er' && targetInput.includes('.')) {
      const colPart = targetInput.split('.')[1] || ''
      const bulk: ConnectCandidate = { value: `*.${colPart}`, label: `*.${colPart}`, type: 'bulk' }
      return [bulk, ...targetCandidatesBase]
    }
    return targetCandidatesBase
  }, [targetCandidatesBase, connectSubMode, targetInput])

  // ── Pipeline analysis ──
  const pipeline = useMemo(() => {
    if (!input.trim()) return { stages: [], outputIds: [] }
    return executePipeline(input, true)
  }, [input, executePipeline])

  // ── Pipeline suggestions ──
  const suggestions = useMemo(() => {
    if (!schema) return []
    const val = input.trim().toLowerCase()

    if (!val) {
      return [
        { id: 'select', label: 'Select tables...', icon: <MousePointer2 size={14} />, desc: 'select [pattern] or select *', action: () => setInput('select ') },
        { id: 'search', label: 'Find table...', icon: <Search size={14} />, desc: 'Jump to entity', action: () => setInput('search ') },
        { id: 'add-table', label: 'Add table...', icon: <Plus size={14} />, desc: 'Create a new table node', action: () => setInput('add table ') },
        { id: 'add-domain', label: 'Add domain...', icon: <Plus size={14} />, desc: 'Create a new domain container', action: () => setInput('add domain ') },
        { id: 'add-consumer', label: 'Add consumer...', icon: <Plus size={14} />, desc: 'Create a downstream consumer node', action: () => setInput('add consumer ') },
        { id: 'fit', label: 'Fit View', icon: <Maximize size={14} />, desc: 'Show entire model', action: () => handleExecute('fit') },
        { id: 'theme', label: 'Switch Theme', icon: <Sun size={14} />, desc: 'Toggle dark/light mode', action: () => setInput('theme ') },
      ]
    }

    const stages = input.split('|')
    const lastStage = stages[stages.length - 1]
    const tokens = lastStage.trim().split(/\s+/)
    const cmd = tokens[0].toLowerCase()
    const prefix = stages.slice(0, -1).join('|') + (stages.length > 1 ? '|' : '')

    if (cmd === 'select') {
      const tableQuery = tokens.slice(1).join(' ').toLowerCase()
      return (schema.tables || [])
        .filter(t => t.id.toLowerCase().includes(tableQuery) || t.name.toLowerCase().includes(tableQuery))
        .slice(0, 8)
        .map(t => ({
          id: t.id, label: t.name, icon: <Search size={14} />, desc: `Table: ${t.id}`,
          action: () => setInput(`${prefix} select ${t.id}`)
        }))
    }

    if (cmd === 'mv') {
      const toIndex = tokens.findIndex(t => t.toLowerCase() === 'to')
      const domainQuery = toIndex > -1 ? tokens.slice(toIndex + 1).join(' ').toLowerCase() : tokens.slice(1).join(' ').toLowerCase()
      const cmdPart = toIndex > -1 ? tokens.slice(0, toIndex + 1).join(' ') : 'mv'
      return (schema.domains || [])
        .filter(d => d.id.toLowerCase().includes(domainQuery) || d.name.toLowerCase().includes(domainQuery))
        .slice(0, 8)
        .map(d => ({
          id: d.id, label: d.name, icon: <Move size={14} />, desc: `Domain: ${d.id}`,
          action: () => setInput(`${prefix} ${cmdPart} ${d.id}`)
        }))
    }

    if (cmd === 'theme') {
      const themeQuery = tokens.slice(1).join(' ').toLowerCase()
      return ['dark', 'light']
        .filter(m => m.includes(themeQuery))
        .map(m => ({
          id: m, label: m, icon: <Sun size={14} />, desc: 'UI Appearance',
          action: () => setInput(`${prefix} theme ${m}`)
        }))
    }

    if (cmd === 'search' || cmd === 'find' || (!['mv', 'add', 'select', 'theme', 'fit'].includes(cmd))) {
      const searchQuery = cmd === 'search' || cmd === 'find' ? tokens.slice(1).join(' ').toLowerCase() : lastStage.trim().toLowerCase()
      return (schema.tables || [])
        .filter(t => t.id.toLowerCase().includes(searchQuery) || t.name.toLowerCase().includes(searchQuery))
        .slice(0, 10)
        .map(t => ({
          id: t.id, label: `Go to ${t.name}`, icon: <Search size={14} />, desc: t.id,
          action: () => {
            if (cmd === 'search' || cmd === 'find' || stages.length === 1) {
              setFocusNodeId(t.id); setIsCommandPaletteOpen(false)
            } else {
              setInput(`${prefix} select ${t.id}`)
            }
          }
        }))
    }

    return []
  }, [schema, input, setFocusNodeId, setIsCommandPaletteOpen])

  // ── Effects ──
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setHighlightedNodeIds(pipeline.outputIds)
    } else {
      setHighlightedNodeIds([])
    }
  }, [isCommandPaletteOpen, pipeline.outputIds, setHighlightedNodeIds])

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setInput('')
      setFeedback(null)
      setSelectedIndex(0)
      setPaletteMode('pipeline')
      setSourceInput('')
      setTargetInput('')
      setConnectSuccess(false)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isCommandPaletteOpen])

  // ── Pipeline execute ──
  const handleExecute = (overrideInput?: string) => {
    const finalInput = overrideInput || input
    if (!finalInput.trim()) return
    if (finalInput === 'fit') {
      ;(window as any).__modscapeFitView?.()
      showFeedback('success', 'View fitted')
      return
    }
    const result = executePipeline(finalInput, false)
    if (result.stages.length > 0 && result.stages.every(s => s.status === 'success')) {
      showFeedback('success', 'Pipeline executed successfully')
    } else {
      const errorStage = result.stages.find(s => s.status === 'error')
      if (errorStage) showFeedback('info', errorStage.message)
    }
  }

  const showFeedback = (type: 'success' | 'info', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => {
      setFeedback(null)
      if (type === 'success') setInput('')
    }, 1500)
  }

  const handlePipelineKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') setIsCommandPaletteOpen(false)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % (suggestions.length || 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + (suggestions.length || 1)) % (suggestions.length || 1)) }
    else if (e.key === 'Tab') { e.preventDefault(); if (suggestions[selectedIndex]) suggestions[selectedIndex].action() }
    else if (e.key === 'Enter') { e.preventDefault(); handleExecute() }
  }

  // ── Connect apply ──
  const handleConnectApply = () => {
    if (!sourceInput || !targetInput) return
    if (connectSubMode === 'er') {
      const parts = sourceInput.split('.')
      bulkAddRelationship({ table: parts[0], column: parts[1] }, targetInput, relType as Relationship['type'])
    } else {
      bulkAddRelationship({ table: sourceInput }, targetInput, 'lineage')
    }
    setConnectSuccess(true)
    setTimeout(() => setConnectSuccess(false), 1500)
    setTargetInput('')
    targetRef.current?.focus()
  }

  const handleConnectKeyDown = (e: React.KeyboardEvent, field: 'source' | 'target') => {
    e.stopPropagation()
    if (e.key === 'Escape') { setIsCommandPaletteOpen(false); return }
    const candidates = field === 'source' ? sourceCandidates : targetCandidates
    if (e.key === 'ArrowDown') { e.preventDefault(); setConnectSelIdx(prev => (prev + 1) % (candidates.length || 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setConnectSelIdx(prev => (prev - 1 + (candidates.length || 1)) % (candidates.length || 1)) }
    else if (e.key === 'Enter') {
      if (candidates[connectSelIdx]) {
        if (field === 'source') { setSourceInput(candidates[connectSelIdx].value); setShowSourceDrop(false); targetRef.current?.focus() }
        else { setTargetInput(candidates[connectSelIdx].value); setShowTargetDrop(false) }
      } else if (field === 'target' && sourceInput && targetInput) {
        handleConnectApply()
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (field === 'source') { targetRef.current?.focus() }
      else { sourceRef.current?.focus() }
    }
  }

  const switchToConnect = (subMode: 'er' | 'lineage') => {
    setPaletteMode('connect')
    setConnectSubMode(subMode)
    setRelType(subMode === 'er' ? 'one-to-many' : 'lineage')
    setSourceInput('')
    setTargetInput('')
    setConnectSelIdx(0)
    setTimeout(() => sourceRef.current?.focus(), 10)
  }

  if (!isCommandPaletteOpen) return null

  // ── Candidate row renderer ──
  const CandidateRow = ({ c, isActive, onClick }: { c: ConnectCandidate, isActive: boolean, onClick: () => void }) => (
    <div
      className={`px-4 py-2 flex items-center gap-3 cursor-pointer transition-colors ${
        isActive ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-600')
      }`}
      onMouseDown={onClick}
    >
      {c.type === 'table' ? (
        <Database size={12} className={isActive ? 'text-white' : 'text-blue-400'} />
      ) : c.type === 'bulk' ? (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'}`}>BULK</span>
      ) : (
        <span className="w-3 h-px shrink-0 ml-2 bg-current opacity-40" />
      )}
      <div className="flex flex-col min-w-0">
        <span className={`text-xs font-${c.type === 'table' ? 'bold' : 'medium'} truncate`}>{c.value}</span>
        {c.type === 'column' && c.tableId && (
          <span className={`text-[9px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{c.tableId}</span>
        )}
      </div>
    </div>
  )

  return (
    <div className={`fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-[2px] animate-in fade-in duration-200 ${
      theme === 'dark' ? 'bg-slate-950/20' : 'bg-white/20'
    }`}>
      <div className="absolute inset-0" onClick={() => setIsCommandPaletteOpen(false)} />

      <div className={`relative w-full max-w-2xl rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-2 overflow-hidden animate-in slide-in-from-top-4 duration-300 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* ── PIPELINE MODE ────────────────────────────────────────────── */}
        {paletteMode === 'pipeline' && (
          <>
            {/* Input Header */}
            <div className={`flex items-center px-4 py-4 gap-3 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'}`}>
              <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                <Command size={18} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="select * | mv Core | stack v"
                className={`flex-1 bg-transparent border-none outline-none text-lg font-bold tracking-tight ${
                  theme === 'dark' ? 'placeholder-slate-600' : 'placeholder-slate-400'
                }`}
                value={input}
                onChange={(e) => { setInput(e.target.value); setSelectedIndex(0) }}
                onKeyDown={handlePipelineKeyDown}
              />
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                theme === 'dark' ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>ESC</kbd>
            </div>

            {/* Feedback / Plan Area */}
            {feedback ? (
              <div className={`px-4 py-6 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-200 ${
                feedback.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
              }`}>
                <div className={`p-3 rounded-full ${feedback.type === 'success' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                  {feedback.type === 'success' ? <Check size={32} /> : <Info size={32} />}
                </div>
                <span className="text-sm font-black uppercase tracking-widest">{feedback.msg}</span>
              </div>
            ) : (
              <>
                {input.trim() && (
                  <div className={`px-4 py-4 border-b flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-950/20' : 'bg-slate-50/50'}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Execution Plan</h4>
                      <Zap size={12} className="text-blue-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {pipeline.stages.length > 0 ? (
                        pipeline.stages.map((stage, i) => (
                          <div key={i} className="flex items-center gap-3 group">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              stage.status === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                              stage.status === 'active' ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'
                            }`}>{i + 1}</div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider">{stage.command}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{stage.message}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">Parsing command...</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  {suggestions.length > 0 && (
                    <div ref={listRef} className="max-h-[300px] overflow-auto py-2 border-b border-slate-800/30">
                      {suggestions.map((s, i) => (
                        <div
                          key={`${s.id}-${i}`}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                            selectedIndex === i ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-600')
                          }`}
                          onClick={() => s.action()}
                        >
                          <div className="flex items-center gap-3">
                            <div className={selectedIndex === i ? 'text-white' : 'text-slate-500'}>{s.icon}</div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{s.label}</span>
                              {s.desc && <span className={`text-[10px] ${selectedIndex === i ? 'text-blue-100' : 'text-slate-500'}`}>{s.desc}</span>}
                            </div>
                          </div>
                          {selectedIndex === i && <ChevronRight size={14} className="opacity-50" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {input.includes('|') && (
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Working Set ({pipeline.outputIds.length})</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-auto">
                        {pipeline.outputIds.length > 0 ? (
                          pipeline.outputIds.map(id => (
                            <div key={id} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>{id}</div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic">No tables in current scope</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Footer */}
            <div className={`px-4 py-3 border-t flex items-center justify-between ${
              theme === 'dark' ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase">
                <div className="flex items-center gap-1">
                  <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>Tab</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>Enter</kbd>
                  <span>Execute</span>
                </div>
              </div>
              {/* Connect shortcut buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => switchToConnect('er')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Network size={10} /> ER Connect
                </button>
                <button
                  onClick={() => switchToConnect('lineage')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <GitGraph size={10} /> Flow Connect
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── CONNECT MODE ─────────────────────────────────────────────── */}
        {paletteMode === 'connect' && (
          <>
            {/* Header */}
            <div className={`flex items-center px-4 py-3.5 gap-3 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'}`}>
              <div className={`p-1.5 rounded-lg text-white shadow-lg ${connectSubMode === 'er' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-violet-600 shadow-violet-500/20'}`}>
                {connectSubMode === 'er' ? <Network size={18} /> : <GitGraph size={18} />}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {connectSubMode === 'er' ? 'ER Connect' : 'Flow Connect'}
                </h3>
                <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {connectSubMode === 'er' ? 'Create a relationship between columns' : 'Create a lineage edge between tables'}
                </p>
              </div>
              {/* Sub-mode toggle */}
              <div className={`flex rounded-full p-0.5 border ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => { setConnectSubMode('er'); setRelType('one-to-many'); setSourceInput(''); setTargetInput('') }}
                  className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all text-[9px] font-black uppercase tracking-tighter ${
                    connectSubMode === 'er'
                      ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Network size={10} /> ER
                </button>
                <button
                  onClick={() => { setConnectSubMode('lineage'); setRelType('lineage'); setSourceInput(''); setTargetInput('') }}
                  className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all text-[9px] font-black uppercase tracking-tighter ${
                    connectSubMode === 'lineage'
                      ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <GitGraph size={10} /> Flow
                </button>
              </div>
              <button onClick={() => setPaletteMode('pipeline')} className={`text-[10px] font-bold px-2 py-1 rounded ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                ← Back
              </button>
              <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${theme === 'dark' ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>ESC</kbd>
            </div>

            {/* Connect Form */}
            <div className="p-5 flex flex-col gap-4">
              {/* Source input */}
              <div className="relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Source</label>
                <input
                  ref={sourceRef}
                  type="text"
                  placeholder={connectSubMode === 'er' ? 'table.column' : 'table_id'}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none transition-all border-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-white placeholder-slate-600 border-transparent focus:border-blue-500/50'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-transparent focus:border-blue-500/30'
                  }`}
                  value={sourceInput}
                  onChange={(e) => { setSourceInput(e.target.value); setShowSourceDrop(true); setConnectSelIdx(0) }}
                  onFocus={() => setShowSourceDrop(true)}
                  onBlur={() => setTimeout(() => setShowSourceDrop(false), 150)}
                  onKeyDown={(e) => handleConnectKeyDown(e, 'source')}
                />
                {showSourceDrop && sourceCandidates.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border-2 overflow-hidden z-[110] max-h-52 overflow-y-auto ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    {sourceCandidates.map((c, i) => (
                      <CandidateRow key={c.value} c={c} isActive={connectSelIdx === i} onClick={() => { setSourceInput(c.value); setShowSourceDrop(false); targetRef.current?.focus() }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Connector visual */}
              <div className="flex justify-center">
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full border shadow-sm ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                }`}>
                  {connectSubMode === 'er' ? (
                    <select
                      className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-blue-500"
                      value={relType}
                      onChange={(e) => setRelType(e.target.value as Relationship['type'])}
                    >
                      <option value="one-to-many">1 : N</option>
                      <option value="one-to-one">1 : 1</option>
                      <option value="many-to-one">N : 1</option>
                      <option value="many-to-many">N : N</option>
                    </select>
                  ) : (
                    <ChevronDown size={14} className="text-violet-500 animate-pulse" />
                  )}
                  <div className={`w-px h-3 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <ArrowRight size={12} className="text-slate-500" />
                </div>
              </div>

              {/* Target input */}
              <div className="relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Target</label>
                <input
                  ref={targetRef}
                  type="text"
                  placeholder={connectSubMode === 'er' ? 'target.column or *.column' : 'table_id'}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none transition-all border-2 ${
                    theme === 'dark'
                      ? 'bg-slate-800 text-white placeholder-slate-600 border-transparent focus:border-blue-500/50'
                      : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-transparent focus:border-blue-500/30'
                  }`}
                  value={targetInput}
                  onChange={(e) => { setTargetInput(e.target.value); setShowTargetDrop(true); setConnectSelIdx(0) }}
                  onFocus={() => setShowTargetDrop(true)}
                  onBlur={() => setTimeout(() => setShowTargetDrop(false), 150)}
                  onKeyDown={(e) => handleConnectKeyDown(e, 'target')}
                />
                {showTargetDrop && targetCandidates.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border-2 overflow-hidden z-[110] max-h-52 overflow-y-auto ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    {targetCandidates.map((c, i) => (
                      <CandidateRow key={c.value} c={c} isActive={connectSelIdx === i} onClick={() => { setTargetInput(c.value); setShowTargetDrop(false) }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Apply button */}
              <button
                onClick={handleConnectApply}
                disabled={!sourceInput || !targetInput}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1 ${
                  connectSuccess
                    ? 'bg-emerald-600 text-white'
                    : !sourceInput || !targetInput
                    ? (theme === 'dark' ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {connectSuccess ? <Check size={14} /> : <Zap size={14} />}
                {connectSuccess ? 'Connected!' : 'Connect Objects'}
              </button>
            </div>

            {/* Footer */}
            <div className={`px-4 py-3 border-t flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase ${
              theme === 'dark' ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-center gap-1">
                <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>Enter</kbd>
                <span>Select / Connect</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`px-1 rounded border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>Tab</kbd>
                <span>Next field</span>
              </div>
              {connectSubMode === 'er' && (
                <span className={`ml-auto text-[9px] px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                  Tip: Use *.id for bulk linking
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

export default CommandPalette
