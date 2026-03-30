import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { Spline, Network, Tag, AlignJustify, Workflow, Database, ChevronDown, Eye, EyeOff } from 'lucide-react'

const CanvasViewToolbar = () => {
  const {
    showLineage, setShowLineage,
    showER, setShowER,
    showAnnotations, setShowAnnotations,
    isCompactMode, setIsCompactMode,
    theme,
    availableFiles,
    currentModelSlug,
    setCurrentModel,
  } = useStore(useShallow((s) => ({
    showLineage: s.showLineage,
    setShowLineage: s.setShowLineage,
    showER: s.showER,
    setShowER: s.setShowER,
    showAnnotations: s.showAnnotations,
    setShowAnnotations: s.setShowAnnotations,
    isCompactMode: s.isCompactMode,
    setIsCompactMode: s.setIsCompactMode,
    theme: s.theme,
    availableFiles: s.availableFiles,
    currentModelSlug: s.currentModelSlug,
    setCurrentModel: s.setCurrentModel,
  })))

  const btnClass = (isActive: boolean, activeColor: string = 'text-blue-400') => `
    relative group flex items-center justify-center w-8 h-8 rounded-lg transition-all
    ${isActive
      ? `${activeColor} bg-white/10`
      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
    }
  `

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-slate-700 shadow-xl">
      {text}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
    </div>
  )

  const activeSlug = currentModelSlug || availableFiles[0]?.slug
  const activeFile = availableFiles.find(f => f.slug === activeSlug) ?? availableFiles[0]

  const [isModelDropOpen, setIsModelDropOpen] = useState(false)
  const modelDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isModelDropOpen) return
    const handleClick = (e: MouseEvent) => {
      if (modelDropRef.current && !modelDropRef.current.contains(e.target as Node)) {
        setIsModelDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isModelDropOpen])

  const pillClass = `flex items-center gap-1 px-2 py-1.5 rounded-xl border shadow-lg backdrop-blur-md ${
    theme === 'dark' ? 'bg-slate-950/70 border-slate-700/50' : 'bg-white/80 border-slate-200/80'
  }`

  return (
    <>
      {/* Model selector — top-left, only when multiple files */}
      {availableFiles.length > 1 && (
        <div className="absolute top-4 left-4 z-40" ref={modelDropRef}>
          <button
            onClick={() => setIsModelDropOpen(v => !v)}
            className={`${pillClass} flex items-center gap-1.5 cursor-pointer max-w-[180px]`}
          >
            <Database size={13} className="text-blue-500 shrink-0" />
            <span className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              {activeFile?.name ?? activeSlug}
            </span>
            <ChevronDown size={11} className={`shrink-0 transition-transform ${isModelDropOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>

          {isModelDropOpen && (
            <div className={`absolute top-full left-0 mt-1.5 min-w-full rounded-xl border shadow-xl overflow-hidden z-50 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              {availableFiles.map(f => (
                <button
                  key={f.slug}
                  onClick={() => { setCurrentModel(f.slug); setIsModelDropOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-left transition-colors whitespace-nowrap ${
                    f.slug === activeSlug
                      ? (theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                      : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')
                  }`}
                >
                  <Database size={12} className={f.slug === activeSlug ? 'text-blue-500' : 'text-slate-400'} />
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View controls — top-center */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 ${pillClass}`}>
        <button
          onClick={() => setShowLineage(!showLineage)}
          className={btnClass(showLineage, 'text-blue-400')}
        >
          <div className="relative">
            <Spline size={16} />
            {showLineage ? <Eye size={8} className="absolute -bottom-1 -right-1 text-slate-400 stroke-[2.5px]" /> : <EyeOff size={8} className="absolute -bottom-1 -right-1 text-slate-500 stroke-[2.5px]" />}
          </div>
          <Tooltip text={showLineage ? 'Hide Lineage' : 'Show Lineage'} />
        </button>

        <button
          onClick={() => setShowER(!showER)}
          className={btnClass(showER, 'text-slate-300')}
        >
          <div className="relative">
            <Network size={16} />
            {showER ? <Eye size={8} className="absolute -bottom-1 -right-1 text-slate-400 stroke-[2.5px]" /> : <EyeOff size={8} className="absolute -bottom-1 -right-1 text-slate-500 stroke-[2.5px]" />}
          </div>
          <Tooltip text={showER ? 'Hide ER Edges' : 'Show ER Edges'} />
        </button>

        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={btnClass(showAnnotations, 'text-amber-400')}
        >
          <div className="relative">
            <Tag size={16} />
            {showAnnotations ? <Eye size={8} className="absolute -bottom-1 -right-1 text-slate-400 stroke-[2.5px]" /> : <EyeOff size={8} className="absolute -bottom-1 -right-1 text-slate-500 stroke-[2.5px]" />}
          </div>
          <Tooltip text={showAnnotations ? 'Hide Annotations' : 'Show Annotations'} />
        </button>

        <button
          onClick={() => setIsCompactMode(!isCompactMode)}
          className={btnClass(!isCompactMode, 'text-slate-300')}
        >
          <div className="relative">
            <AlignJustify size={16} />
            {!isCompactMode ? <Eye size={8} className="absolute -bottom-1 -right-1 text-slate-400 stroke-[2.5px]" /> : <EyeOff size={8} className="absolute -bottom-1 -right-1 text-slate-500 stroke-[2.5px]" />}
          </div>
          <Tooltip text={isCompactMode ? 'Show Columns' : 'Hide Columns'} />
        </button>

        <div className={`w-px h-4 mx-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`} />

        <button
          onClick={() => (window as any).__modscapeAutoLayout?.()}
          className={btnClass(false, 'text-orange-400')}
        >
          <Workflow size={16} />
          <Tooltip text="Auto Layout" />
        </button>
      </div>
    </>
  )
}

export default CanvasViewToolbar
