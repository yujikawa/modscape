import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { ArrowUpRight, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react'

interface TableCoverageResult {
  id: string
  name: string
  table_pct: number
  column_pct: number | null
  avg_pct: number
}

interface StatsResult {
  tableCount: number
  lineageCount: number
  relationCount: number
  domainCount: number
  coverage: {
    overall: number | null
    tables: { covered: number; total: number; pct: number | null }
    columns: { covered: number; total: number; pct: number | null }
    low_coverage: TableCoverageResult[]
  }
  hotspots: { id: string; name: string; total: number }[]
  maxHotspot: number
  isolatedTables: { id: string; name: string }[]
}

function computeStats(schema: NonNullable<ReturnType<typeof useStore.getState>['schema']>): StatsResult {
  const tables = schema.tables ?? []
  const lineage = schema.lineage ?? []
  const relationships = schema.relationships ?? []
  const domains = schema.domains ?? []

  const lineageMap = new Map<string, number>()
  for (const edge of lineage) {
    if (edge.from) lineageMap.set(edge.from, (lineageMap.get(edge.from) ?? 0) + 1)
    if (edge.to) lineageMap.set(edge.to, (lineageMap.get(edge.to) ?? 0) + 1)
  }
  const hotspots = tables
    .filter((t) => lineageMap.has(t.id))
    .map((t) => ({ id: t.id, name: t.conceptual?.name ?? t.id, total: lineageMap.get(t.id)! }))
    .sort((a, b) => b.total - a.total)
  const maxHotspot = hotspots[0]?.total ?? 1

  const isolatedTables = tables
    .filter((t) => !lineageMap.has(t.id))
    .map((t) => ({ id: t.id, name: t.conceptual?.name ?? t.id }))

  let tablesCovered = 0
  let totalColumns = 0
  let columnsCovered = 0
  const low_coverage: TableCoverageResult[] = []

  for (const t of tables) {
    if (!t.id) continue
    const hasDesc = !!(t.conceptual?.description)
    if (hasDesc) tablesCovered++
    const cols = t.columns ?? []
    const colTotal = cols.length
    const colCovered = cols.filter((c) => c.type != null && c.type !== '').length
    totalColumns += colTotal
    columnsCovered += colCovered
    const tablePct = hasDesc ? 100 : 0
    const colPct = colTotal > 0 ? Math.round((colCovered / colTotal) * 100) : null
    const avgPct = colPct != null ? (tablePct + colPct) / 2 : tablePct
    if (avgPct < 70) {
      low_coverage.push({ id: t.id, name: t.conceptual?.name ?? t.id, table_pct: tablePct, column_pct: colPct, avg_pct: avgPct })
    }
  }
  low_coverage.sort((a, b) => a.avg_pct - b.avg_pct)

  const total = tables.length
  const tablePct = total > 0 ? Math.round((tablesCovered / total) * 100) : null
  const columnPct = totalColumns > 0 ? Math.round((columnsCovered / totalColumns) * 100) : null
  const overall = tablePct != null && columnPct != null ? Math.round((tablePct + columnPct) / 2) : tablePct ?? null

  return {
    tableCount: tables.length,
    lineageCount: lineage.length,
    relationCount: relationships.length,
    domainCount: domains.length,
    coverage: { overall, tables: { covered: tablesCovered, total, pct: tablePct }, columns: { covered: columnsCovered, total: totalColumns, pct: columnPct }, low_coverage },
    hotspots,
    maxHotspot,
    isolatedTables,
  }
}

const ModelStatsTab = memo(() => {
  const { schema, theme, setSelectedTableId, setFocusNodeId, currentModelSlug } = useStore(
    useShallow((s) => ({
      schema: s.schema,
      theme: s.theme,
      setSelectedTableId: s.setSelectedTableId,
      setFocusNodeId: s.setFocusNodeId,
      currentModelSlug: s.currentModelSlug,
    }))
  )

  const [result, setResult] = useState<StatsResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const hasResultRef = useRef(false)

  // Model switch: full reset
  useEffect(() => {
    setResult(null)
    hasResultRef.current = false
    setIsStale(false)
  }, [currentModelSlug])

  // Schema content changed: mark stale but keep showing old results
  useEffect(() => {
    if (hasResultRef.current) {
      setIsStale(true)
    }
  }, [schema])

  const handleCalculate = useCallback(() => {
    if (!schema) return
    setIsCalculating(true)
    setTimeout(() => {
      setResult(computeStats(schema))
      hasResultRef.current = true
      setIsStale(false)
      setIsCalculating(false)
    }, 300)
  }, [schema])

  const handleFocus = (id: string) => {
    setSelectedTableId(id)
    setFocusNodeId(id)
  }

  const sectionLabel = `text-[10px] font-bold uppercase tracking-wider mb-3 ${
    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
  }`

  if (!schema) {
    return (
      <div className={`flex-1 flex items-center justify-center text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
        No model loaded
      </div>
    )
  }

  if (result === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
        <BarChart2 size={28} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-300'} />
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={`flex items-center gap-2 py-2 px-4 rounded-lg border text-xs font-medium transition-colors disabled:opacity-60 ${
            theme === 'dark'
              ? 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
          }`}
        >
          <RefreshCw size={12} className={isCalculating ? 'animate-spin' : ''} />
          {isCalculating ? 'Calculating…' : 'Calculate Stats'}
        </button>
      </div>
    )
  }

  const { coverage } = result

  return (
    <div className="flex-1 flex flex-col overflow-auto p-4 gap-6">
      {/* Recalculate row — top, becomes amber banner when stale */}
      <div className={`flex items-center ${isStale ? 'justify-between' : 'justify-end'} ${
        isStale
          ? (theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg' : 'bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg')
          : ''
      }`}>
        {isStale && (
          <span className={`flex items-center gap-1.5 text-[10px] font-medium ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
            <RefreshCw size={10} />
            Model changed — outdated
          </span>
        )}
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded text-[10px] font-medium transition-colors disabled:opacity-60 ${
            isStale
              ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200')
              : (theme === 'dark' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-500')
          }`}
        >
          <RefreshCw size={10} className={isCalculating ? 'animate-spin' : ''} />
          {isCalculating ? 'Calculating…' : 'Recalculate'}
        </button>
      </div>

      {/* Overview */}
      <section>
        <p className={sectionLabel}>Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Tables', value: result.tableCount },
            { label: 'Lineage', value: result.lineageCount },
            { label: 'Relations', value: result.relationCount },
            { label: 'Domains', value: result.domainCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className={`rounded-lg p-3 flex flex-col items-center justify-center border ${
                theme === 'dark'
                  ? 'bg-slate-800/50 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <span className="text-xl font-bold tabular-nums">{value}</span>
              <span className={`text-[10px] font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Documentation Coverage */}
      <section>
        <p className={sectionLabel}>Documentation Coverage</p>
        <div className={`rounded-lg p-3 border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Overall</span>
            <span className={`text-lg font-bold tabular-nums ${
              coverage.overall == null ? (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
                : coverage.overall >= 70 ? 'text-emerald-500'
                : coverage.overall >= 40 ? 'text-amber-500'
                : 'text-red-500'
            }`}>
              {coverage.overall != null ? `${coverage.overall}%` : 'N/A'}
            </span>
          </div>
          <div className={`h-1.5 rounded-full w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div
              className={`h-full rounded-full transition-all ${
                (coverage.overall ?? 0) >= 70 ? 'bg-emerald-500'
                  : (coverage.overall ?? 0) >= 40 ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${coverage.overall ?? 0}%` }}
            />
          </div>
          <div className={`mt-2 flex flex-col gap-0.5 text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Tables: {coverage.tables.covered}/{coverage.tables.total}{coverage.tables.pct != null ? ` (${coverage.tables.pct}%)` : ''} [description]</span>
            <span>Columns: {coverage.columns.covered}/{coverage.columns.total}{coverage.columns.pct != null ? ` (${coverage.columns.pct}%)` : ' (N/A)'} [type]</span>
          </div>
        </div>
        {coverage.low_coverage.length > 0 && (
          <div className="mt-2">
            <p className={`text-[10px] font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Low coverage tables</p>
            <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
              {coverage.low_coverage.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => handleFocus(t.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2 text-left transition-colors text-xs ${
                    i > 0 ? (theme === 'dark' ? 'border-t border-amber-500/10' : 'border-t border-amber-100') : ''
                  } ${theme === 'dark' ? 'hover:bg-amber-500/10 text-slate-300' : 'hover:bg-amber-100 text-slate-700'}`}
                >
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{t.name}</span>
                    <span className="text-[9px] opacity-50 font-mono">tbl: {t.table_pct}% / col: {t.column_pct != null ? `${t.column_pct}%` : 'N/A'}</span>
                  </span>
                  <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lineage Hotspots */}
      <section>
        <p className={sectionLabel}>Lineage Hotspots</p>
        {result.hotspots.length === 0 ? (
          <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No lineage data</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
            {result.hotspots.map(({ id, name, total }) => (
              <button
                key={id}
                onClick={() => handleFocus(id)}
                className={`w-full group flex items-center gap-2 p-1.5 rounded text-left transition-colors ${
                  theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50'
                }`}
              >
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{name}</span>
                    <span className={`text-[10px] font-bold tabular-nums shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{total}</span>
                  </div>
                  <div className={`h-1.5 rounded-full w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(total / result.maxHotspot) * 100}%` }} />
                  </div>
                </div>
                <ArrowUpRight size={12} className={`opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Isolated Tables */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={12} className={result.isolatedTables.length > 0 ? 'text-amber-500 shrink-0' : `shrink-0 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            result.isolatedTables.length > 0
              ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')
              : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
          }`}>
            Isolated Tables {result.isolatedTables.length > 0 && `(${result.isolatedTables.length})`}
          </p>
        </div>
        {result.isolatedTables.length === 0 ? (
          <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No isolated tables</p>
        ) : (
          <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
            {result.isolatedTables.map(({ id, name }, i) => (
              <button
                key={id}
                onClick={() => handleFocus(id)}
                className={`w-full group flex items-center justify-between px-3 py-2 text-left transition-colors text-xs ${
                  i > 0 ? (theme === 'dark' ? 'border-t border-amber-500/10' : 'border-t border-amber-100') : ''
                } ${theme === 'dark' ? 'hover:bg-amber-500/10 text-slate-300' : 'hover:bg-amber-100 text-slate-700'}`}
              >
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{name}</span>
                  {name !== id && <span className="truncate font-mono text-[9px] opacity-50">{id}</span>}
                </span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        )}
      </section>

    </div>
  )
})

export default ModelStatsTab
