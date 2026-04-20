import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import {
  ChevronRight,
  ChevronLeft,
  Route,
  MessageSquare,
  Sun,
  Moon,
  Search,
  Download,
  BookOpen,
} from 'lucide-react'
import SearchTab from './SearchTab'
import PathFinderTab from './PathFinderTab'
import NoteSearchTab from './NoteSearchTab'

const RightPanel = memo(() => {
  const {
    isRightPanelOpen,
    setIsRightPanelOpen,
    activeRightPanelTab,
    setActiveRightPanelTab,
    isContextPanelOpen,
    setIsContextPanelOpen,
    theme,
    toggleTheme,
    cyInstance,
  } = useStore(useShallow((s) => ({
    isRightPanelOpen: s.isRightPanelOpen,
    setIsRightPanelOpen: s.setIsRightPanelOpen,
    activeRightPanelTab: s.activeRightPanelTab,
    setActiveRightPanelTab: s.setActiveRightPanelTab,
    isContextPanelOpen: s.isContextPanelOpen,
    setIsContextPanelOpen: s.setIsContextPanelOpen,
    theme: s.theme,
    toggleTheme: s.toggleTheme,
    cyInstance: s.cyInstance,
  })))

  // Export popup state
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png')
  const [exportTransparent, setExportTransparent] = useState(false)
  const exportPopupRef = useRef<HTMLDivElement>(null)

  // Close popup on outside click
  useEffect(() => {
    if (!isExportOpen) return
    const handleClick = (e: MouseEvent) => {
      if (exportPopupRef.current && !exportPopupRef.current.contains(e.target as Node)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isExportOpen])

  const handleExport = useCallback(async () => {
    if (!cyInstance) return
    const container = cyInstance.container() as HTMLElement | null
    if (!container) return

    const filename = `modscape-export.${exportFormat}`
    const themeBg = theme === 'dark' ? '#020617' : '#f8fafc'
    try {
      const pixelRatio = 2
      const baseDataUrl = exportFormat === 'png'
        ? await toPng(container, {
            pixelRatio,
            backgroundColor: exportTransparent ? undefined : themeBg,
          })
        : await toJpeg(container, { pixelRatio, quality: 0.95, backgroundColor: themeBg })

      // Composite drawing overlay on top if it has content
      const drawCanvas = (window as any).__modscapeDrawCanvas as HTMLCanvasElement | null
      let finalDataUrl = baseDataUrl

      if (drawCanvas && drawCanvas.width > 0 && drawCanvas.height > 0) {
        const w = container.offsetWidth * pixelRatio
        const h = container.offsetHeight * pixelRatio
        const composite = document.createElement('canvas')
        composite.width = w
        composite.height = h
        const ctx = composite.getContext('2d')!

        const base = new Image()
        base.src = baseDataUrl
        await new Promise<void>(resolve => { base.onload = () => resolve() })
        ctx.drawImage(base, 0, 0)
        ctx.drawImage(drawCanvas, 0, 0, w, h)

        finalDataUrl = exportFormat === 'png'
          ? composite.toDataURL('image/png')
          : composite.toDataURL('image/jpeg', 0.95)
      }

      const a = document.createElement('a')
      a.href = finalDataUrl
      a.download = filename
      a.click()
    } catch (e) {
      console.error('Export failed:', e)
    }
    setIsExportOpen(false)
  }, [cyInstance, exportFormat, exportTransparent, theme])

  const iconClass = (isActive: boolean) => `
    flex items-center justify-center w-10 h-10 rounded-xl transition-all relative group
    ${isActive
      ? 'bg-blue-600/10 text-blue-500 shadow-inner'
      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
    }
  `

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute right-14 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-slate-700 shadow-xl">
      {text}
      <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />
    </div>
  )

  return (
    <div
      className={`relative h-full flex flex-row transition-all duration-300 ease-in-out shadow-2xl z-50 ${
        isRightPanelOpen ? 'w-[456px]' : 'w-14'
      }`}
    >
      {/* 1. Activity Bar (Right side of the Right Panel - Always Visible) */}
      <div className={`w-14 h-full flex flex-col items-center py-4 border-l transition-colors z-50 ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className={`mb-6 p-2 rounded-xl transition-all ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-white hover:shadow-md text-slate-500 hover:text-slate-900'
          }`}
        >
          {isRightPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => { setActiveRightPanelTab('search'); setIsRightPanelOpen(true); }}
            className={iconClass(activeRightPanelTab === 'search' && isRightPanelOpen)}
          >
            <Search size={20} />
            <Tooltip text="Search" />
          </button>

          <button
            onClick={() => { setActiveRightPanelTab('path'); setIsRightPanelOpen(true); }}
            className={iconClass(activeRightPanelTab === 'path' && isRightPanelOpen)}
          >
            <Route size={20} />
            <Tooltip text="Path Finder" />
          </button>

          <button
            onClick={() => { setActiveRightPanelTab('notes'); setIsRightPanelOpen(true); }}
            className={iconClass(activeRightPanelTab === 'notes' && isRightPanelOpen)}
          >
            <MessageSquare size={20} />
            <Tooltip text="Note Search" />
          </button>

        </div>

        <div className="mt-auto flex flex-col gap-2 pb-2">
          {/* Context panel toggle */}
          <div className="relative">
            <button
              onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
              className={iconClass(isContextPanelOpen)}
            >
              <BookOpen size={20} />
              <Tooltip text="Context" />
            </button>
          </div>

          {/* Export as Image button */}
          <div className="relative" ref={exportPopupRef}>
            <button
              onClick={() => setIsExportOpen((v) => !v)}
              className={iconClass(isExportOpen)}
              disabled={!cyInstance}
            >
              <Download size={20} />
              <Tooltip text="Export as Image" />
            </button>

            {/* Export popup */}
            {isExportOpen && (
              <div className={`absolute bottom-12 right-0 w-52 rounded-xl border shadow-2xl p-4 z-[70] ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Export as Image
                </p>

                {/* Format */}
                <p className={`text-[10px] font-semibold mb-1.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Format</p>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" name="format" value="png"
                      checked={exportFormat === 'png'} onChange={() => setExportFormat('png')} />
                    <span className={`text-xs cursor-pointer select-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>PNG</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" className="w-3.5 h-3.5 accent-blue-500 cursor-pointer" name="format" value="jpg"
                      checked={exportFormat === 'jpg'} onChange={() => setExportFormat('jpg')} />
                    <span className={`text-xs cursor-pointer select-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>JPG</span>
                  </label>
                </div>

                {/* Transparent toggle (PNG only) */}
                {exportFormat === 'png' && (
                  <label className="flex items-center justify-between mb-3 cursor-pointer">
                    <span className={`text-xs select-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Transparent</span>
                    <button
                      type="button"
                      onClick={() => setExportTransparent((v) => !v)}
                      className={`relative w-8 h-4 rounded-full transition-colors p-0 flex-shrink-0 ${
                        exportTransparent ? 'bg-blue-600' : theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                        style={{ left: exportTransparent ? '18px' : '2px' }}
                      />
                    </button>
                  </label>
                )}

                <button
                  onClick={handleExport}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  Export
                </button>
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className={iconClass(false)}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <Tooltip text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'} />
          </button>
        </div>
      </div>

      {/* 2. Content Panel (Left side of the Right Panel) */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 sidebar-content ${
          theme === 'dark' ? 'bg-slate-900' : 'bg-white'
        } ${
          isRightPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ width: isRightPanelOpen ? '400px' : '0px' }}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <h2 className={`text-sm font-bold tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {activeRightPanelTab === 'search' && 'Search'}
            {activeRightPanelTab === 'path' && 'Path Finder'}
            {activeRightPanelTab === 'notes' && 'Note Search'}
          </h2>
        </div>

        {/* Tab Content */}
        {activeRightPanelTab === 'search' && <SearchTab />}
        {activeRightPanelTab === 'path' && <PathFinderTab />}
        {activeRightPanelTab === 'notes' && <NoteSearchTab />}
      </div>
    </div>
  )
})

export default RightPanel
