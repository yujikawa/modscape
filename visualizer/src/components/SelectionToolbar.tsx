import { X, Database, Layout, GitGraph, Tag, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Layers, FileChartColumnIncreasing, PanelBottomOpen, PanelBottomClose } from 'lucide-react'
import { useStore } from '../store/useStore'

const SelectionToolbar = () => {
  const {
    getSelectedTable,
    getSelectedDomain,
    getSelectedConsumer,
    getSelectedRelationship,
    selectedTableIds,
    setSelectedTableIds,
    distributeSelectedTables,
    setSelectedTableId,
    setSelectedEdgeId,
    setSelectedAnnotationId,
    isDetailPanelOpen,
    setIsDetailPanelOpen,
    theme
  } = useStore()

  const table = getSelectedTable()
  const domain = getSelectedDomain()
  const consumer = getSelectedConsumer()
  const relationshipData = getSelectedRelationship()
  const isMultiSelect = selectedTableIds.length > 1

  if (!table && !domain && !consumer && !relationshipData && !isMultiSelect) return null

  const handleClearSelection = () => {
    setSelectedTableId(null)
    setSelectedTableIds([])
    setSelectedEdgeId(null)
    setSelectedAnnotationId(null)
    setIsDetailPanelOpen(false)
  }

  return (
    <div className={`absolute top-4 right-4 z-10 flex items-center gap-3 border rounded-xl shadow-2xl p-1.5 px-4 animate-in fade-in slide-in-from-top-4 duration-300 ${
      theme === 'dark' ? 'bg-slate-900/90 backdrop-blur-md border-blue-500/30' : 'bg-white/90 backdrop-blur-md border-blue-200 shadow-blue-500/5'
    }`}>
      {/* Selection Info */}
      <div className={`flex items-center gap-2 border-r pr-4 mr-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
        {isMultiSelect ? (
          <Layers size={16} className="text-blue-500" />
        ) : (
          <>
            {table && <Database size={16} className="text-emerald-500" />}
            {domain && <Layout size={16} className="text-blue-500" />}
            {consumer && <FileChartColumnIncreasing size={16} className="text-violet-400" />}
            {relationshipData && (
              ((relationshipData.relationship.type as any) === 'lineage')
                ? <GitGraph size={16} className="text-blue-400" />
                : <Tag size={16} className="text-amber-500" />
            )}
          </>
        )}
        
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {isMultiSelect ? 'Multi-Selection' : `Selected ${table ? 'Table' : domain ? 'Domain' : consumer ? 'Consumer' : (((relationshipData?.relationship.type as any) === 'lineage') ? 'Lineage' : 'Relation')}`}
          </span>
          <span className={`text-xs font-semibold truncate max-w-[180px] ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
            {isMultiSelect ? `${selectedTableIds.length} tables selected` : (table ? table.name : domain ? domain.name : consumer ? consumer.name : relationshipData ? `${relationshipData.relationship.from.table} → ${relationshipData.relationship.to.table}` : '')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Alignment Buttons (Multi-select only) */}
        {isMultiSelect && (
          <div className="flex items-center gap-1 mr-2 pr-2 border-r border-slate-700/30">
            <button
              onClick={() => distributeSelectedTables('vertical')}
              className="flex items-center justify-center w-8 h-8 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all"
              title="Align Vertically (V)"
            >
              <AlignVerticalJustifyCenter size={16} />
            </button>
            <button
              onClick={() => distributeSelectedTables('horizontal')}
              className="flex items-center justify-center w-8 h-8 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all"
              title="Align Horizontally (H)"
            >
              <AlignHorizontalJustifyCenter size={16} />
            </button>
          </div>
        )}

        {/* Inspect button (single selection only) */}
        {!isMultiSelect && (
          <button
            onClick={() => setIsDetailPanelOpen(!isDetailPanelOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
              isDetailPanelOpen
                ? 'bg-blue-600/10 text-blue-500'
                : theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
            }`}
            title={isDetailPanelOpen ? 'Close Details' : 'Open Details'}
          >
            {isDetailPanelOpen ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
          </button>
        )}

        <button
          onClick={handleClearSelection}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
          }`}
          title="Clear Selection (Esc)"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default SelectionToolbar
