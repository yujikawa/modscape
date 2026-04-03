import { useState } from 'react'
import { useStore } from '../../store/useStore'
import {
  Grid,
  Layout,
  Network,
  Plus,
  ChevronLeft,
  CircleHelp,
  X,
  Command,
  Spline,
  Tag,
  FileChartColumnIncreasing,
  Pencil,
} from 'lucide-react'
import logo from '/favicon.svg?url'

const ActivityBar = () => {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    connectMode,
    setConnectMode,
    addTable,
    addDomain,
    addConsumer,
    addAnnotation,
    showAnnotations,
    setShowAnnotations,
    theme,
    getSelectedTable,
    getSelectedDomain,
    isDrawMode,
    setIsDrawMode,
  } = useStore()

  const [showHelp, setShowHelp] = useState(false)

  // Convert screen center to canvas coordinates via Cytoscape viewport
  const screenToCanvasCenter = () => {
    const cy = (window as any).__modscapeCy
    if (!cy) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pan: { x: number; y: number } = cy.pan()
    const zoom: number = cy.zoom()
    const sx = window.innerWidth / 2
    const sy = window.innerHeight / 2
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom }
  }
  
  const table = getSelectedTable()
  const domain = getSelectedDomain()

  const handleAddDomain = () => {
    const center = screenToCanvasCenter()
    addDomain(center.x - 300, center.y - 200)
  }

  const handleAddTable = () => {
    const center = screenToCanvasCenter()
    addTable(center.x - 160, center.y - 125)
  }

  const handleAddConsumer = () => {
    const center = screenToCanvasCenter()
    addConsumer(center.x - 80, center.y - 30)
  }

  const handleAddAnnotation = () => {
    const target = table || domain
    const center = screenToCanvasCenter()
    
    if (!showAnnotations) setShowAnnotations(true)

    if (target) {
      addAnnotation({ x: 50, y: -50 }, target.id, table ? 'table' : 'domain')
    } else {
      addAnnotation({ x: center.x - 60, y: center.y - 40 })
    }
  }

  const iconClass = (isActive: boolean, activeColor: string = 'text-blue-500') => `
    flex items-center justify-center w-10 h-10 rounded-xl transition-all relative group
    ${isActive 
      ? `bg-blue-600/10 ${activeColor} shadow-inner` 
      : theme === 'dark' ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
    }
  `

  const Tooltip = ({ text }: { text: string }) => (
    <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60] border border-slate-700 shadow-xl">
      {text}
      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
    </div>
  )

  const ShortcutRow = ({ keys, label }: { keys: string[], label: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex gap-1">
        {keys.map(k => (
          <kbd key={k} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 min-w-[20px] text-center shadow-sm">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div className={`w-14 h-full flex flex-col items-center py-4 border-l transition-colors z-50 ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Toggle Button: ChevronLeft if open, Logo if closed */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`mb-6 p-2 rounded-xl transition-all ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-white hover:shadow-md text-slate-500 hover:text-slate-900'
          }`}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={20} />
          ) : (
            <img src={logo} alt="Logo" className="w-6 h-6 rounded-md shadow-lg" />
          )}
        </button>

        {/* Add Section */}
        <div className="flex flex-col items-center mb-4 gap-2">
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAddDomain}
              className={iconClass(false, 'text-blue-400')}
            >
              <div className="relative">
                <Layout size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text="Add Domain (D)" />
            </button>
            <button
              onClick={handleAddTable}
              className={iconClass(false, 'text-emerald-400')}
            >
              <div className="relative">
                <Grid size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text="Add Table (T)" />
            </button>
            <button
              onClick={handleAddConsumer}
              className={iconClass(false, 'text-violet-400')}
            >
              <div className="relative">
                <FileChartColumnIncreasing size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text="Add Consumer (C)" />
            </button>
            <button onClick={handleAddAnnotation} className={iconClass(false, 'text-amber-400')}>
              <div className="relative">
                <Tag size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text="Add Sticky Note (S)" />
            </button>
            <button onClick={() => setConnectMode(connectMode === 'lineage' ? null : 'lineage')} className={iconClass(connectMode === 'lineage', 'text-blue-400')}>
              <div className="relative">
                <Spline size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text={connectMode === 'lineage' ? "Exit Lineage Mode (Esc)" : "Draw Lineage Edge (L)"} />
            </button>
            <button onClick={() => setConnectMode(connectMode === 'er' ? null : 'er')} className={iconClass(connectMode === 'er', 'text-emerald-400')}>
              <div className="relative">
                <Network size={20} />
                <Plus size={12} className="absolute -bottom-1 -right-1 text-amber-500 stroke-[3.5px]" />
              </div>
              <Tooltip text={connectMode === 'er' ? "Exit ER Mode (Esc)" : "Draw ER Edge (R)"} />
            </button>

            {/* Draw mode button */}
            <button onClick={() => setIsDrawMode(!isDrawMode)} className={iconClass(isDrawMode, 'text-pink-400')}>
              <Pencil size={20} />
              <Tooltip text={isDrawMode ? "Exit Draw Mode (P)" : "Draw Mode (P)"} />
            </button>
          </div>
        </div>

        <div className={`w-8 border-t mb-6 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`} />

        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => setShowHelp(true)} className={iconClass(showHelp)}>
            <CircleHelp size={20} />
            <Tooltip text="Shortcut Guide" />
          </button>
        </div>
      </div>

      {/* Shortcut Guide Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className={`relative w-full max-w-sm shadow-2xl rounded-2xl border p-6 animate-in zoom-in-95 duration-200 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Command size={18} className="text-blue-500" />
                </div>
                <h2 className="font-bold text-base">Shortcut Guide</h2>
              </div>
              <button onClick={() => setShowHelp(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">General</h3>
                <ShortcutRow label="Command Palette" keys={['Ctrl', 'K']} />
                <ShortcutRow label="Find Entities" keys={['/']} />
                <ShortcutRow label="Switch Theme" keys={['\\']} />
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Quick Create</h3>
                <ShortcutRow label="New Table" keys={['T']} />
                <ShortcutRow label="New Domain" keys={['D']} />
                <ShortcutRow label="New Consumer" keys={['C']} />
                <ShortcutRow label="New Sticky Note" keys={['S']} />
                <ShortcutRow label="Draw Lineage Edge" keys={['L']} />
                <ShortcutRow label="Draw ER Edge" keys={['R']} />
                <ShortcutRow label="Draw Mode" keys={['P']} />
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Canvas Control</h3>
                <ShortcutRow label="Fit View" keys={['F']} />
                <ShortcutRow label="Pan / Scroll" keys={['↑', '↓', '←', '→']} />
                <ShortcutRow label="Clear Selection" keys={['Esc']} />
                <ShortcutRow label="Delete Selected" keys={['Del', '⌫']} />
              </section>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <p className="text-[10px] text-slate-400 italic">Pro-tip: Focus the canvas to use shortcuts.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ActivityBar
