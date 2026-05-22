import { useState, useMemo, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import {
  Search,
  GitGraph,
  Database,
  X,
  AlertCircle,
  FileChartColumnIncreasing,
} from 'lucide-react'
import {
  findShortestPath,
  getDirectNeighbors,
  getAllReachable,
  type PathStep,
  type EdgeTypeFilter,
} from '../../lib/graph'

type Mode = 'single' | 'path'
type SingleRange = 'direct' | 'all'
type NodeKind = 'table' | 'consumer' | 'metric'

const PathFinderTab = () => {
  const { schema, theme, setPathFinderResult, setFocusNodeId } = useStore()

  const [mode, setMode] = useState<Mode>('single')
  const [edgeFilter, setEdgeFilter] = useState<EdgeTypeFilter>('lineage')
  // single mode
  const [singleNodeId, setSingleNodeId] = useState('')
  const [singleRange, setSingleRange] = useState<SingleRange>('direct')
  // path mode
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [path, setPath] = useState<PathStep[] | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const tables = useMemo(() => schema?.tables || [], [schema])
  const consumers = useMemo(() => schema?.consumers || [], [schema])
  const metrics = useMemo(() => schema?.metrics || [], [schema])
  const allNodes = useMemo(() => [
    ...tables.map(t => ({ id: t.id, name: t.conceptual?.name ?? t.id, kind: 'table' as NodeKind })),
    ...consumers.map(c => ({ id: c.id, name: c.name, kind: 'consumer' as NodeKind })),
    ...metrics.map(m => ({ id: m.id, name: m.name, kind: 'metric' as NodeKind })),
  ], [tables, consumers, metrics])

  // Group nodes by domain for optgroup display
  const groupedNodes = useMemo(() => {
    const domains = schema?.domains || []
    const assignedIds = new Set<string>()
    const groups: { label: string; nodes: typeof allNodes }[] = []

    domains.forEach(domain => {
      const members = (domain.members || [])
        .map(memberId => allNodes.find(n => n.id === memberId))
        .filter((n): n is typeof allNodes[number] => !!n)
      if (members.length > 0) {
        members.forEach(n => assignedIds.add(n.id))
        groups.push({ label: domain.name, nodes: members })
      }
    })

    const unassigned = allNodes.filter(n => !assignedIds.has(n.id))
    if (unassigned.length > 0) {
      groups.push({ label: 'Other', nodes: unassigned })
    }

    return groups
  }, [schema, allNodes])

  // Auto-execute single mode whenever relevant state changes
  useEffect(() => {
    if (mode !== 'single' || !schema || !singleNodeId) {
      if (mode === 'single') setPathFinderResult(null)
      return
    }
    const result = singleRange === 'direct'
      ? getDirectNeighbors(schema, singleNodeId, edgeFilter)
      : getAllReachable(schema, singleNodeId, edgeFilter)
    setPathFinderResult({
      nodeIds: Array.from(result.nodeIds),
      edgeIds: Array.from(result.edgeIds),
    })
  }, [mode, singleNodeId, singleRange, edgeFilter, schema, setPathFinderResult])

  const handleFindPath = () => {
    if (!schema || !fromId || !toId) return
    const result = findShortestPath(schema, fromId, toId, edgeFilter)
    setPath(result)
    setHasSearched(true)
    if (result) {
      const nodeIds = Array.from(new Set([fromId, ...result.map(s => s.to)]))
      const edgeIds = result.map(s => s.edge.id)
      setPathFinderResult({ nodeIds, edgeIds })
    } else {
      setPathFinderResult(null)
    }
  }

  const clearAll = () => {
    setSingleNodeId('')
    setFromId('')
    setToId('')
    setPath(null)
    setHasSearched(false)
    setPathFinderResult(null)
  }

  const toggleBase = `flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all`
  const toggleActive = `bg-blue-600 text-white shadow`
  const toggleInactive = theme === 'dark'
    ? `text-slate-400 hover:text-slate-200`
    : `text-slate-500 hover:text-slate-700`

  const NodeIcon = ({ kind }: { kind: NodeKind }) =>
    kind === 'consumer'
      ? <FileChartColumnIncreasing size={12} className="text-violet-400 shrink-0" />
      : kind === 'metric'
      ? <GitGraph size={12} className="text-emerald-400 shrink-0" />
      : <Database size={12} className="text-emerald-500 shrink-0" />

  // Combobox: free-text filter + dropdown selector
  const NodeCombobox = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Filter groups by name or id (case-insensitive substring match)
    const filteredGroups = useMemo(() => {
      if (!query) return groupedNodes
      const q = query.toLowerCase()
      return groupedNodes
        .map(g => ({ ...g, nodes: g.nodes.filter(n => n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)) }))
        .filter(g => g.nodes.length > 0)
    }, [query])

    const selectedNode = value ? allNodes.find(n => n.id === value) : null
    const displayValue = selectedNode ? selectedNode.name : query

    const inputClass = `w-full pl-2 pr-7 py-2 rounded-md text-sm border shadow-sm focus:ring-1 focus:ring-blue-500/50 outline-none ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`
    const dropdownClass = `absolute z-50 w-full mt-1 rounded-md border shadow-lg max-h-56 overflow-y-auto ${
      theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
    }`

    return (
      <div ref={containerRef} className="relative">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            placeholder="Search node..."
            className={inputClass}
            onFocus={() => setIsOpen(true)}
            onChange={e => {
              if (value) onChange('') // reset selection when user starts typing
              setQuery(e.target.value)
              setIsOpen(true)
            }}
          />
          {value && (
            <button
              onMouseDown={e => { e.preventDefault(); onChange(''); setQuery(''); setIsOpen(true) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
        {isOpen && (
          <div className={dropdownClass}>
            {filteredGroups.length === 0 ? (
              <div className={`px-3 py-2 text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No results</div>
            ) : (
              filteredGroups.map(group => (
                <div key={group.label}>
                  <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    theme === 'dark' ? 'text-slate-500 bg-slate-800/60' : 'text-slate-400 bg-slate-50'
                  }`}>{group.label}</div>
                  {group.nodes.map(n => (
                    <button
                      key={n.id}
                      onMouseDown={e => { e.preventDefault(); onChange(n.id); setQuery(''); setIsOpen(false) }}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        n.id === value
                          ? theme === 'dark' ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                          : theme === 'dark' ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <NodeIcon kind={n.kind} />
                      <span className="truncate">{n.name}</span>
                      <span className={`ml-auto shrink-0 text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{n.id}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

      {/* Mode toggle */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mode</div>
        <div className={`flex gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          <button
            onClick={() => { setMode('single'); clearAll() }}
            className={`${toggleBase} ${mode === 'single' ? toggleActive : toggleInactive}`}
          >
            Single Node
          </button>
          <button
            onClick={() => { setMode('path'); clearAll() }}
            className={`${toggleBase} ${mode === 'path' ? toggleActive : toggleInactive}`}
          >
            Path A → B
          </button>
        </div>
      </div>

      {/* Edge type filter */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Edge Type</div>
        <div className={`flex gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
          {(['lineage', 'er', 'both'] as EdgeTypeFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setEdgeFilter(f)}
              className={`${toggleBase} ${edgeFilter === f ? toggleActive : toggleInactive}`}
            >
              {f === 'lineage' ? 'Lineage' : f === 'er' ? 'ER' : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Single node mode */}
      {mode === 'single' && (
        <div className="space-y-3">
          <NodeCombobox label="Node" value={singleNodeId} onChange={setSingleNodeId} />
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Range</div>
            <div className={`flex gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <button
                onClick={() => setSingleRange('direct')}
                className={`${toggleBase} ${singleRange === 'direct' ? toggleActive : toggleInactive}`}
              >
                Direct (1 hop)
              </button>
              <button
                onClick={() => setSingleRange('all')}
                className={`${toggleBase} ${singleRange === 'all' ? toggleActive : toggleInactive}`}
              >
                All Transitive
              </button>
            </div>
          </div>
          {singleNodeId && (
            <button
              onClick={clearAll}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs transition-all border ${
                theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Path mode */}
      {mode === 'path' && (
        <div className="space-y-3">
          <NodeCombobox label="From" value={fromId} onChange={setFromId} />
          <NodeCombobox label="To" value={toId} onChange={setToId} />
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleFindPath}
              disabled={!fromId || !toId}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                (!fromId || !toId)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-95'
              }`}
            >
              <Search size={14} />
              FIND PATH
            </button>
            {hasSearched && (
              <button
                onClick={clearAll}
                className={`p-2 rounded-md border transition-all hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
                title="Clear results"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Path results */}
          <div className="flex-1 overflow-auto pr-1">
            {hasSearched && !path && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle size={32} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 italic">No path found between these nodes.</p>
              </div>
            )}
            {path && (
              <div className="space-y-1">
                <div className={`p-3 rounded-lg border border-l-4 border-l-blue-500 mb-4 ${
                  theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50/50 border-blue-100'
                }`}>
                  <p className="text-xs font-medium text-slate-500">Path found with <span className="font-bold text-blue-500">{path.length}</span> steps</p>
                </div>
                <div className="relative pl-4 space-y-0">
                  <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
                  <div className="relative mb-4">
                    <div className="absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                    <button onClick={() => setFocusNodeId(fromId)} className="text-xs font-bold hover:text-blue-500 transition-colors flex items-center gap-1.5">
                      <NodeIcon kind={allNodes.find(n => n.id === fromId)?.kind ?? 'table'} />
                      {allNodes.find(n => n.id === fromId)?.name}
                    </button>
                  </div>
                  {path.map((step, i) => (
                    <div key={i} className="mb-4">
                      <div className={`flex items-center gap-2 my-2 py-1 px-2 rounded border w-fit transition-colors ${
                        theme === 'dark'
                          ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                          : step.edge.type === 'er'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        {step.edge.type === 'er'
                          ? <Database size={10} className={theme === 'dark' ? 'text-emerald-500' : 'text-emerald-600'} />
                          : <GitGraph size={10} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                        }
                        <span className="text-[9px] font-bold uppercase tracking-tighter">
                          {step.edge.type === 'er' ? `ER (${step.edge.metadata?.type ?? ''})` : 'Lineage'}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[15px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900" />
                        <button onClick={() => setFocusNodeId(step.to)} className="text-xs font-bold hover:text-blue-500 transition-colors flex items-center gap-1.5">
                          <NodeIcon kind={allNodes.find(n => n.id === step.to)?.kind ?? 'table'} />
                          {allNodes.find(n => n.id === step.to)?.name}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PathFinderTab
