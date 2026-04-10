import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { 
  Search, 
  Tag, 
  ArrowUpRight,
  MessageSquare
} from 'lucide-react'

const NoteSearchTab = () => {
  const { 
    schema, 
    theme,
    setSelectedAnnotationId,
    setFocusNodeId
  } = useStore()

  const [search, setSearch] = useState('')

  const filteredNotes = useMemo(() => {
    if (!schema?.annotations) return []
    
    return schema.annotations.filter(note => 
      note.text.toLowerCase().includes(search.toLowerCase())
    )
  }, [schema, search])

  const handleFocus = (id: string) => {
    setSelectedAnnotationId(id);
    setFocusNodeId(id);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="relative mb-4 shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className={`w-full pl-9 pr-4 py-2 rounded-md text-sm transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
          }`}
        />
      </div>

      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {filteredNotes.length === 0 && search && (
          <div className="text-center py-10 text-slate-500 italic text-sm">
            No notes matching "{search}"
          </div>
        )}

        {filteredNotes.map(note => (
          <button 
            key={note.id}
            onClick={() => handleFocus(note.id)}
            className={`w-full p-3 text-left rounded-lg border transition-all group relative ${
              theme === 'dark' 
                ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/60' 
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Tag size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">
                Annotation
              </span>
              <ArrowUpRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
            </div>
            <p className={`text-xs line-clamp-3 leading-relaxed ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {note.text}
            </p>
            {note.target?.id && (
              <div className="mt-2 flex items-center gap-1.5 opacity-60">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="text-[9px] font-medium truncate italic">Attached to {note.target.id}</span>
              </div>
            )}
          </button>
        ))}

        {!search && filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <MessageSquare size={48} className="mb-4 text-slate-400" />
            <p className="text-sm font-medium">No annotations in this model yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default NoteSearchTab
