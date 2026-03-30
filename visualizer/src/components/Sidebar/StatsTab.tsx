import { memo, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { ArrowUpRight, AlertTriangle } from 'lucide-react'

const StatsTab = memo(() => {
  const { schema, theme, setSelectedTableId, setFocusNodeId } = useStore(
    useShallow((s) => ({
      schema: s.schema,
      theme: s.theme,
      setSelectedTableId: s.setSelectedTableId,
      setFocusNodeId: s.setFocusNodeId,
    }))
  )

  const lineageStats = useMemo(() => {
    const map = new Map<string, { upstream: number; downstream: number; total: number }>()
    if (!schema) return map
    ;(schema.lineage ?? []).forEach((edge) => {
      if (!map.has(edge.from)) map.set(edge.from, { upstream: 0, downstream: 0, total: 0 })
      if (!map.has(edge.to)) map.set(edge.to, { upstream: 0, downstream: 0, total: 0 })
      const from = map.get(edge.from)!
      from.downstream += 1
      from.total += 1
      const to = map.get(edge.to)!
      to.upstream += 1
      to.total += 1
    })
    return map
  }, [schema])

  const hotspots = useMemo(() => {
    if (!schema) return []
    return schema.tables
      .filter((t) => lineageStats.has(t.id))
      .map((t) => ({ table: t, ...lineageStats.get(t.id)! }))
      .sort((a, b) => b.total - a.total)
  }, [schema, lineageStats])

  const isolatedTables = useMemo(() => {
    if (!schema) return []
    return schema.tables.filter((t) => !lineageStats.has(t.id))
  }, [schema, lineageStats])

  const maxTotal = hotspots.length > 0 ? hotspots[0].total : 1

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

  return (
    <div className="flex-1 flex flex-col overflow-auto p-4 gap-6 sidebar-content">
      {/* Overview */}
      <section>
        <p className={sectionLabel}>Overview</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Tables', value: schema.tables.length },
            { label: 'Lineage', value: (schema.lineage ?? []).length },
            { label: 'Relations', value: (schema.relationships ?? []).length },
            { label: 'Domains', value: (schema.domains ?? []).length },
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

      {/* Lineage Hotspots */}
      <section>
        <p className={sectionLabel}>Lineage Hotspots</p>
        {hotspots.length === 0 ? (
          <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            No lineage data
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
            {hotspots.map(({ table, total }) => (
              <button
                key={table.id}
                onClick={() => handleFocus(table.id)}
                className={`w-full group flex items-center gap-2 p-1.5 rounded text-left transition-colors ${
                  theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50'
                }`}
              >
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {table.name}
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {total}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full w-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(total / maxTotal) * 100}%` }}
                    />
                  </div>
                </div>
                <ArrowUpRight
                  size={12}
                  className={`opacity-0 group-hover:opacity-100 shrink-0 transition-opacity ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Isolated Tables */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle size={12} className={isolatedTables.length > 0 ? 'text-amber-500 shrink-0' : `shrink-0 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-wider ${
            isolatedTables.length > 0
              ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')
              : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
          }`}>
            Isolated Tables {isolatedTables.length > 0 && `(${isolatedTables.length})`}
          </p>
        </div>
        {isolatedTables.length === 0 ? (
          <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            No isolated tables
          </p>
        ) : (
          <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
            {isolatedTables.map((t, i) => (
              <button
                key={t.id}
                onClick={() => handleFocus(t.id)}
                className={`w-full group flex items-center justify-between px-3 py-2 text-left transition-colors text-xs ${
                  i > 0 ? (theme === 'dark' ? 'border-t border-amber-500/10' : 'border-t border-amber-100') : ''
                } ${
                  theme === 'dark'
                    ? 'hover:bg-amber-500/10 text-slate-300'
                    : 'hover:bg-amber-100 text-slate-700'
                }`}
              >
                <span className="flex flex-col min-w-0">
                  <span className="truncate">{t.name}</span>
                  {t.name !== t.id && (
                    <span className="truncate font-mono text-[9px] opacity-50">{t.id}</span>
                  )}
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

export default StatsTab
