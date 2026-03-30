import { memo } from 'react'
import EditorTab from './EditorTab'
import StatsTab from './StatsTab'
import ActivityBar from './ActivityBar'
import { useStore } from '../../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { FileText, BarChart2 } from 'lucide-react'
import logo from '/favicon.svg?url'

const Sidebar = memo(() => {
  const { isSidebarOpen, isCliMode, theme, savingStatus, activeTab, setActiveTab } = useStore(useShallow((s) => ({
    isSidebarOpen: s.isSidebarOpen,
    isCliMode: s.isCliMode,
    theme: s.theme,
    savingStatus: s.savingStatus,
    activeTab: s.activeTab,
    setActiveTab: s.setActiveTab,
  })))

  // Fallback for stale localStorage values
  const safeTab = (activeTab === 'yaml' || activeTab === 'stats') ? activeTab : 'yaml'

  return (
    <div
      className={`relative h-full flex flex-row border-r transition-all duration-300 ease-in-out shadow-2xl z-50 ${
        isSidebarOpen ? 'w-[456px]' : 'w-14'
      } ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* 1. Main Content Panel (Left) */}
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 sidebar-content ${
          theme === 'dark' ? 'bg-slate-900' : 'bg-white'
        } ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ width: isSidebarOpen ? '400px' : '0px' }}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Modscape Logo" className="w-5 h-5 rounded-md" />
            <h1 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Modscape</h1>
            {isCliMode && (
              <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold rounded uppercase ml-1 animate-pulse" title="Connected & Syncing">
                Live
              </span>
            )}
          </div>

          {savingStatus === 'saving' && (
            <span className="text-[10px] text-slate-500 animate-pulse uppercase font-bold tracking-widest">
              Saving...
            </span>
          )}
        </div>

        {/* Tab Selection */}
        <div className="px-4 mt-6">
          <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                safeTab === 'yaml'
                  ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-lg' : 'bg-white text-blue-600 shadow-sm')
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <FileText size={14} />
              YAML
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                safeTab === 'stats'
                  ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-lg' : 'bg-white text-blue-600 shadow-sm')
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <BarChart2 size={14} />
              Stats
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-4">
          {safeTab === 'stats' ? <StatsTab /> : <EditorTab />}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <p className="text-[10px] text-slate-500 font-medium px-1">
            Modscape v2.4.0
          </p>
        </div>
      </div>

      {/* 2. Activity Bar (Right) */}
      <ActivityBar />
    </div>
  )
})

export default Sidebar
