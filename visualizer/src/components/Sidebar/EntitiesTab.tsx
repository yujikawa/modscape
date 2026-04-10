import { memo, useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { Search, ArrowUpRight, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'
import type { Table } from '../../types/schema'
import { LINEAGE_BASE } from '../../lib/colors'

const EntitiesTab = memo(() => {
  const { schema, setSelectedTableId, setFocusNodeId, theme } = useStore(useShallow((s) => ({
    schema: s.schema,
    setSelectedTableId: s.setSelectedTableId,
    setFocusNodeId: s.setFocusNodeId,
    theme: s.theme,
  })))
  const [search, setSearch] = useState('')
  const [collapsedDomains, setCollapsedDomains] = useState<Set<string>>(new Set())

  const toggleDomain = (id: string) => {
    const newCollapsed = new Set(collapsedDomains)
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id)
    } else {
      newCollapsed.add(id)
    }
    setCollapsedDomains(newCollapsed)
  }

  const handleFocus = (id: string) => {
    setSelectedTableId(id);
    setFocusNodeId(id);
  }

  // Grouping Logic
  const groupedData = useMemo(() => {
    if (!schema) return { domains: [], unassigned: [] }

    const domainMap: Record<string, Table[]> = {}
    const assignedTableIds = new Set<string>()

    // Initialize map
    schema.domains?.forEach(d => {
      domainMap[d.id] = []
    })

    // Map tables to domains
    schema.tables.forEach(table => {
      const parentDomain = schema.domains?.find(d => d.members.includes(table.id))
      const matchesSearch = (table.conceptual?.name ?? table.id).toLowerCase().includes(search.toLowerCase()) ||
                           table.id.toLowerCase().includes(search.toLowerCase())

      if (matchesSearch) {
        if (parentDomain) {
          domainMap[parentDomain.id].push(table)
          assignedTableIds.add(table.id)
        }
      }
    })

    const filteredDomains = (schema.domains || []).filter(d => {
      const hasMatchingTables = domainMap[d.id].length > 0
      const domainMatchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                                 d.id.toLowerCase().includes(search.toLowerCase())
      return hasMatchingTables || (domainMatchesSearch && search !== '')
    }).map(d => ({
      ...d,
      tables: domainMap[d.id]
    }))

    const unassignedTables = schema.tables.filter(t => {
      const isMatch = (t.conceptual?.name ?? t.id).toLowerCase().includes(search.toLowerCase()) ||
                     t.id.toLowerCase().includes(search.toLowerCase())
      return isMatch && !assignedTableIds.has(t.id) && !schema.domains?.some(d => d.members.includes(t.id))
    })

    return { domains: filteredDomains, unassigned: unassignedTables }
  }, [schema, search])

  if (!schema) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 pt-2">
      {/* Search Bar */}
      <div className="relative mb-4 shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entities..."
          className={`w-full pl-9 pr-4 py-2 rounded-md text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          }`}
        />
      </div>

      <div className="flex-1 space-y-4 overflow-auto pr-1">
        {/* Domains Groups */}
        {groupedData.domains.map(d => {
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
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: d.display?.color || LINEAGE_BASE }}
                  />
                  <h3 className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {d.name}
                  </h3>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    theme === 'dark' ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-slate-100'
                  }`}>
                    {(d as any).tables.length}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFocus(d.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-500 text-slate-500 transition-all"
                  title="Focus on Domain"
                >
                  <ArrowUpRight size={12} />
                </button>
              </div>

              {!isCollapsed && (
                <div className={`ml-4 mt-1 space-y-0.5 border-l pl-2 ${
                  theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  {(d as any).tables.map((t: Table) => (
                    <button
                      key={t.id}
                      onClick={() => handleFocus(t.id)}
                      className={`w-full flex items-center justify-between group p-1.5 text-xs rounded border border-transparent transition-all text-left ${
                        theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200' : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      <span className="truncate">{t.conceptual?.name ?? t.id}</span>
                      <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                  {(d as any).tables.length === 0 && (
                    <div className="p-2 text-[10px] text-slate-500 italic">No tables in this domain</div>
                  )}
                </div>
              )}
            </section>
          )
        })}

        {/* Unassigned Group */}
        {groupedData.unassigned.length > 0 && (
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
                <h3 className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                  theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Unassigned
                </h3>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                  theme === 'dark' ? 'text-slate-600 bg-slate-800/50' : 'text-slate-400 bg-slate-100'
                }`}>
                  {groupedData.unassigned.length}
                </span>
              </div>
            </div>

            {!collapsedDomains.has('unassigned') && (
              <div className={`ml-4 mt-1 space-y-0.5 border-l pl-2 ${
                theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
              }`}>
                {groupedData.unassigned.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleFocus(t.id)}
                    className={`w-full flex items-center justify-between group p-1.5 text-xs rounded border border-transparent transition-all text-left ${
                      theme === 'dark' ? 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200' : 'hover:bg-blue-50 text-slate-500 hover:text-blue-600'
                    }`}
                  >
                    <span className="truncate">{t.conceptual?.name ?? t.id}</span>
                    <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
        
        {groupedData.domains.length === 0 && groupedData.unassigned.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-500 italic">No entities found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default EntitiesTab
