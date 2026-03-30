import { memo, useState, useMemo, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import {
  Search,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  FileChartColumnIncreasing,
  Database,
} from 'lucide-react'
import type { Table, Column } from '../../types/schema'
import { LINEAGE_BASE } from '../../lib/colors'

const MAX_RESULTS = 30

interface TableResult {
  table: Table
  tableMatched: boolean
  matchedColumns: Column[]
}

function matchesKeyword(value: string | undefined, keyword: string): boolean {
  if (!value) return false
  return value.toLowerCase().includes(keyword)
}

function searchModel(tables: Table[], keyword: string): TableResult[] {
  const kw = keyword.toLowerCase().trim()
  if (!kw) return []

  const results: TableResult[] = []

  for (const table of tables) {
    if (results.length >= MAX_RESULTS) break

    const tableMatched =
      matchesKeyword(table.name, kw) ||
      matchesKeyword(table.id, kw) ||
      matchesKeyword(table.logical_name, kw) ||
      matchesKeyword(table.physical_name, kw) ||
      matchesKeyword(table.conceptual?.description, kw)

    const matchedColumns = (table.columns ?? []).filter(column =>
      matchesKeyword(column.id, kw) ||
      matchesKeyword(column.logical?.name, kw) ||
      matchesKeyword(column.logical?.description, kw) ||
      matchesKeyword(column.physical?.name, kw) ||
      (column.logical as any)?.tags?.some((tag: string) => tag.toLowerCase().includes(kw))
    )

    if (tableMatched || matchedColumns.length > 0) {
      results.push({ table, tableMatched, matchedColumns })
    }
  }

  return results
}

const SearchTab = memo(() => {
  const {
    schema,
    theme,
    setSelectedTableId,
    setFocusNodeId,
    isRightPanelOpen,
    activeRightPanelTab,
  } = useStore(useShallow((s) => ({
    schema: s.schema,
    theme: s.theme,
    setSelectedTableId: s.setSelectedTableId,
    setFocusNodeId: s.setFocusNodeId,
    isRightPanelOpen: s.isRightPanelOpen,
    activeRightPanelTab: s.activeRightPanelTab,
  })))

  const [query, setQuery] = useState('')
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRightPanelOpen && activeRightPanelTab === 'search') {
      const timer = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(timer)
    }
  }, [isRightPanelOpen, activeRightPanelTab])

  const handleFocus = (id: string) => {
    setSelectedTableId(id)
    setFocusNodeId(id)
  }

  const toggleDomain = (id: string) => {
    const newCollapsed = new Set(collapsedDomains)
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id)
    } else {
      newCollapsed.add(id)
    }
    setCollapsedDomains(newCollapsed)
  }

  // Tree data (all tables grouped, no filtering — used when query is empty)
  const treeData = useMemo(() => {
    if (!schema) return { domains: [], unassigned: [], consumers: [] }

    const domainMap: Record<string, Table[]> = {}
    const assignedTableIds = new Set<string>()

    schema.domains?.forEach(d => { domainMap[d.id] = [] })

    schema.tables.forEach(table => {
      const parentDomain = schema.domains?.find(d => d.members.includes(table.id))
      if (parentDomain) {
        domainMap[parentDomain.id].push(table)
        assignedTableIds.add(table.id)
      }
    })

    const domains = (schema.domains || []).map(d => ({ ...d, tables: domainMap[d.id] }))
    const unassigned = schema.tables.filter(t => !assignedTableIds.has(t.id) && !schema.domains?.some(d => d.members.includes(t.id)))
    const consumers = schema.consumers || []

    return { domains, unassigned, consumers }
  }, [schema])

  // Fulltext search results (used when query is non-empty)
  const searchResults = useMemo(
    () => searchModel(schema?.tables ?? [], query),
    [schema, query]
  )

  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
  const textBody = theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
  const cardClass =
    theme === 'dark'
      ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/60'
      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-sm'

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Search input */}
      <div className="relative mb-4 shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tables and columns..."
          className={`w-full pl-9 pr-4 py-2 rounded-md text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          }`}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto pr-1">
        {/* ── Tree view (empty query) ── */}
        {!query && (
          <div className="space-y-4">
            {treeData.domains.map(d => {
              const isCollapsed = collapsedDomains.has(d.id)
              return (
                <section key={d.id} className="flex flex-col">
                  <div
                    className={`flex items-center justify-between group px-1 py-1.5 cursor-pointer rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100'
                    }`}
                    onClick={() => toggleDomain(d.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isCollapsed ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color || LINEAGE_BASE }} />
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{d.name}</h3>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-slate-100'}`}>{(d as any).tables.length}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFocus(d.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-500 text-slate-500 transition-all"
                    >
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className={`ml-4 mt-1 space-y-0.5 border-l pl-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                      {(d as any).tables.map((t: Table) => (
                        <button key={t.id} onClick={() => handleFocus(t.id)} className={`w-full flex items-center justify-between group p-1.5 text-xs rounded border border-transparent transition-all text-left ${theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200' : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'}`}>
                          <span className="flex flex-col min-w-0">
                            <span className="truncate">{t.name}</span>
                            {t.name !== t.id && <span className="truncate font-mono text-[9px] opacity-50">{t.id}</span>}
                          </span>
                          <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                      {(d as any).tables.length === 0 && <div className="p-2 text-[10px] text-slate-500 italic">No tables</div>}
                    </div>
                  )}
                </section>
              )
            })}

            {treeData.unassigned.length > 0 && (
              <section className="flex flex-col">
                <div
                  className={`flex items-center justify-between group px-1 py-1.5 cursor-pointer rounded transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleDomain('unassigned')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {collapsedDomains.has('unassigned') ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                    <HelpCircle size={12} className="text-slate-500 shrink-0" />
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider truncate ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Unassigned</h3>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-slate-100'}`}>{treeData.unassigned.length}</span>
                  </div>
                </div>
                {!collapsedDomains.has('unassigned') && (
                  <div className={`ml-4 mt-1 space-y-0.5 border-l pl-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    {treeData.unassigned.map(t => (
                      <button key={t.id} onClick={() => handleFocus(t.id)} className={`w-full flex items-center justify-between group p-1.5 text-xs rounded border border-transparent transition-all text-left ${theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200' : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'}`}>
                        <span className="flex flex-col min-w-0">
                          <span className="truncate">{t.name}</span>
                          {t.name !== t.id && <span className="truncate font-mono text-[9px] opacity-50">{t.id}</span>}
                        </span>
                        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {treeData.consumers.length > 0 && (
              <section className="flex flex-col">
                <div
                  className={`flex items-center justify-between group px-1 py-1.5 cursor-pointer rounded transition-colors ${
                    theme === 'dark' ? 'hover:bg-slate-800/30' : 'hover:bg-slate-100'
                  }`}
                  onClick={() => toggleDomain('consumers')}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {collapsedDomains.has('consumers') ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
                    <FileChartColumnIncreasing size={12} className="text-violet-400 shrink-0" />
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider truncate ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Consumers</h3>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${theme === 'dark' ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-slate-100'}`}>{treeData.consumers.length}</span>
                  </div>
                </div>
                {!collapsedDomains.has('consumers') && (
                  <div className={`ml-4 mt-1 space-y-0.5 border-l pl-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                    {treeData.consumers.map(u => (
                      <button key={u.id} onClick={() => handleFocus(u.id)} className={`w-full flex items-center justify-between group p-1.5 text-xs rounded border border-transparent transition-all text-left ${theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200' : 'hover:bg-violet-50 text-slate-500 hover:text-violet-600'}`}>
                        <span className="flex flex-col min-w-0">
                          <span className="truncate">{u.name}</span>
                          {u.name !== u.id && <span className="truncate font-mono text-[9px] opacity-50">{u.id}</span>}
                        </span>
                        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {treeData.domains.length === 0 && treeData.unassigned.length === 0 && treeData.consumers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Database size={48} className="mb-4 text-slate-400" />
                <p className="text-sm font-medium">No tables found in this model.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Fulltext search results (query entered) ── */}
        {query && (
          <div className="space-y-2">
            {searchResults.length === 0 && (
              <div className="text-center py-10 text-slate-500 italic text-sm">
                No results found for "{query}"
              </div>
            )}

            {searchResults.map(({ table, tableMatched, matchedColumns }) => (
              <button
                key={table.id}
                onClick={() => handleFocus(table.id)}
                className={`w-full p-3 text-left rounded-lg border transition-all group relative ${cardClass}`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {table.name}
                    </p>
                    {table.logical_name && (
                      <p className={`text-xs leading-tight truncate ${textBody}`}>
                        {table.logical_name}
                      </p>
                    )}
                    {table.physical_name && (
                      <p className={`text-[10px] leading-tight truncate font-mono ${textMuted}`}>
                        {table.physical_name}
                      </p>
                    )}
                  </div>
                  {tableMatched && (
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                      theme === 'dark' ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      table
                    </span>
                  )}
                </div>

                {matchedColumns.length > 0 && (
                  <div className={`mt-2 pt-2 border-t space-y-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    {matchedColumns.map(column => (
                      <div key={column.id} className="flex items-baseline gap-1.5 text-xs">
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          col
                        </span>
                        <span className={`font-medium truncate max-w-[120px] ${textBody}`}>
                          {column.logical?.name ?? column.id}
                        </span>
                        {column.logical?.description && (
                          <>
                            <span className={textMuted}>—</span>
                            <span className={`truncate flex-1 ${textMuted}`}>
                              {column.logical.description}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <ArrowUpRight
                  size={12}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500"
                />
              </button>
            ))}

            {searchResults.length === MAX_RESULTS && (
              <p className={`text-center text-[10px] py-2 ${textMuted}`}>
                Showing top {MAX_RESULTS} results. Refine your search to narrow down.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default SearchTab
