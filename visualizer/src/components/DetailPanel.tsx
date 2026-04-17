import { memo, useState, useCallback, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { X, Plus, Trash2, Tag as TagIcon, Table as TableIcon, Database, Link as LinkIcon, Unlink, GripHorizontal, FileChartColumnIncreasing, Copy } from 'lucide-react'
import type { Table, Column } from '../types/schema'
import { TYPE_CONFIG } from '../lib/cytoscapeElements'
import { LINEAGE_BASE, CONSUMER_DEFAULT_COLOR, ANNOTATION_DEFAULT_COLOR } from '../lib/colors'

const CardBadge = ({ label }: { label: string }) => (
  <span style={{ fontSize: '11px', fontWeight: 900, padding: '0px 5px', borderRadius: '3px', backgroundColor: 'rgba(132, 204, 22, 0.15)', color: '#84cc16', border: '1px solid rgba(132, 204, 22, 0.3)', fontFamily: 'monospace', flexShrink: 0 }}>
    {label}
  </span>
)

const DetailPanel = memo(() => {
  const {
    schema,
    getSelectedTable,
    getSelectedDomain,
    getSelectedConsumer,
    getSelectedRelationship,
    getSelectedAnnotation,
    updateTable,
    renameTableId,
    renameColumnId,
    updateDomain,
    updateConsumer,
    updateRelationship,
    updateRelationshipDescription,
    updateLineageDescription,
    updateAnnotation,
    assignTableToDomain,
    error,
    setError,
    theme,
    isDetailPanelOpen,
    setIsDetailPanelOpen,
    contextData
  } = useStore(useShallow((s) => ({
    schema: s.schema,
    getSelectedTable: s.getSelectedTable,
    getSelectedDomain: s.getSelectedDomain,
    getSelectedConsumer: s.getSelectedConsumer,
    getSelectedRelationship: s.getSelectedRelationship,
    getSelectedAnnotation: s.getSelectedAnnotation,
    updateTable: s.updateTable,
    renameTableId: s.renameTableId,
    renameColumnId: s.renameColumnId,
    updateDomain: s.updateDomain,
    updateConsumer: s.updateConsumer,
    updateRelationship: s.updateRelationship,
    updateRelationshipDescription: s.updateRelationshipDescription,
    updateLineageDescription: s.updateLineageDescription,
    updateAnnotation: s.updateAnnotation,
    assignTableToDomain: s.assignTableToDomain,
    error: s.error,
    setError: s.setError,
    theme: s.theme,
    isDetailPanelOpen: s.isDetailPanelOpen,
    setIsDetailPanelOpen: s.setIsDetailPanelOpen,
    contextData: s.contextData,
    // Trigger re-render when selection changes (needed for getSelected* to return fresh values)
    selectedTableId: s.selectedTableId,
    selectedEdgeId: s.selectedEdgeId,
    selectedAnnotationId: s.selectedAnnotationId,
  })))

  const table = getSelectedTable()
  const domain = getSelectedDomain()
  const consumer = getSelectedConsumer()
  const relationshipData = getSelectedRelationship()
  const annotation = getSelectedAnnotation()
  
  const [activeTab, setActiveTab] = useState('conceptual')
  const [tagInput, setTagInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [tabsOverflow, setTabsOverflow] = useState(false)
  const [metadataEntries, setMetadataEntries] = useState<Array<{ key: string; value: string }>>([])
  const tableIdRef = useRef<string | undefined>(undefined)

  // Floating window state
  const DEFAULT_W = 600
  const DEFAULT_H = 340
  const MIN_W = 320
  const MIN_H = 220
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [initialized, setInitialized] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const tabRowRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  // Copy ID to clipboard and show brief confirmation (must be before early returns)
  const copyEdgeId = useCallback((id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  // ── Drag (must be before early returns) ──────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - size.w, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - size.h, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
      })
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos, size])

  // ── Resize (must be before early returns) ────────────────────────────
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h }
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      setSize({
        w: Math.max(MIN_W, resizeRef.current.origW + ev.clientX - resizeRef.current.startX),
        h: Math.max(MIN_H, resizeRef.current.origH + ev.clientY - resizeRef.current.startY),
      })
    }
    const onUp = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [size])

  // Initialize position to bottom-right when first opened
  useEffect(() => {
    if (isDetailPanelOpen && !initialized) {
      setPos({
        x: Math.max(0, Math.round((window.innerWidth - DEFAULT_W) / 2)),
        y: Math.max(0, Math.round((window.innerHeight - DEFAULT_H) / 2)),
      })
      setInitialized(true)
    }
  }, [isDetailPanelOpen, initialized])

  useEffect(() => {
    // Tab widths: each tab ~100px average, 5 tabs + 40px padding = ~540px threshold
    setTabsOverflow(size.w < 540)
  }, [size.w])

  // Keyboard shortcuts for the detail panel
  useEffect(() => {
    if (!isDetailPanelOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable ||
        activeEl?.closest('.cm-editor')
      if (isTyping || e.repeat) return

      if (e.key === 'Escape') {
        setIsDetailPanelOpen(false)
        return
      }

      // 1–5: switch tabs (only when a table is selected)
      const tabIds = ['conceptual', 'logical', 'physical', 'sample', 'metadata']
      const idx = parseInt(e.key) - 1
      if (idx >= 0 && idx < tabIds.length && getSelectedTable()) {
        e.preventDefault()
        setActiveTab(tabIds[idx])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailPanelOpen, setIsDetailPanelOpen, getSelectedTable])

  // Sync metadataEntries when the selected table changes
  useEffect(() => {
    const t = getSelectedTable()
    if (!t || t.id === tableIdRef.current) return
    tableIdRef.current = t.id
    setMetadataEntries(
      t.metadata ? Object.entries(t.metadata).map(([k, v]) => ({ key: k, value: String(v) })) : []
    )
  })

  if (!isDetailPanelOpen) return null
  if (!table && !domain && !consumer && !relationshipData && !annotation) return null

  // Helper to prevent event propagation to canvas
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  // Cardinality labels for source and target sides
  const cardinalityOf = (type: string | undefined): [string, string] => {
    if (type === 'one-to-many')  return ['1', 'N']
    if (type === 'many-to-one')  return ['N', '1']
    if (type === 'many-to-many') return ['N', 'N']
    return ['1', '1']
  }

  // Floating window style
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: pos.x,
    top: pos.y,
    width: size.w,
    height: size.h,
    zIndex: 200,
    backgroundColor: 'var(--node-bg)',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
    display: 'flex',
    flexDirection: 'column',
    color: 'var(--text-primary)',
    boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' : '0 8px 32px rgba(0,0,0,0.15)',
    fontFamily: 'sans-serif',
    borderRadius: 10,
    transition: 'background-color 0.3s, color 0.3s'
  };

  const dragBar = (color: string) => (
    <div
      onMouseDown={onDragStart}
      style={{ height: '30px', backgroundColor: color, display: 'flex', alignItems: 'center', padding: '0 8px 0 12px', cursor: 'grab', flexShrink: 0, borderRadius: '9px 9px 0 0' }}
    >
      <GripHorizontal size={13} style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />
      <div style={{ flex: 1 }} />
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={() => setIsDetailPanelOpen(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );

  const handleUpdateTable = (updates: Partial<Table>) => {
    if (table?.isImported) return; // Imported tables are read-only
    updateTable(table!.id, updates);
  };

  // --- Annotation Editor Rendering ---
  if (annotation) {
    return (
      <div
        ref={panelRef}
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {dragBar(annotation.display?.color || ANNOTATION_DEFAULT_COLOR)}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <TagIcon size={16} style={{ color: annotation.display?.color || ANNOTATION_DEFAULT_COLOR, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Annotation</span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '2px 0 0' }}>
              {annotation.target?.id ? `Sticky to ${annotation.target.id} (${annotation.target.type})` : 'Floating Note'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => copyEdgeId(annotation.id)}
                title="Copy ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <Copy size={11} />
              </button>
              <span style={{ fontSize: '10px', color: copiedId === annotation.id ? '#22c55e' : 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: copiedId === annotation.id ? 600 : 400 }}>ID: {annotation.id}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Note Content</h3>
              <textarea 
                value={annotation.text || ''}
                onChange={(e) => updateAnnotation(annotation.id, { text: e.target.value })}
                style={{ 
                  width: '100%', 
                  minHeight: '100px',
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  border: `1px solid var(--border-main)`, 
                  borderRadius: '6px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </section>

            <div className="grid grid-cols-2 gap-8">
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Target Binding</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <select
                      value={annotation.target?.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          const targetLayout = schema?.layout?.[annotation.target?.id!];
                          const parentLayout = (targetLayout as any)?.parentId ? schema?.layout?.[(targetLayout as any).parentId] : null;
                          const absX = (parentLayout?.x ?? 0) + (targetLayout?.x ?? 0) + (annotation.offset?.x ?? 0);
                          const absY = (parentLayout?.y ?? 0) + (targetLayout?.y ?? 0) + (annotation.offset?.y ?? 0);
                          updateAnnotation(annotation.id, { target: undefined, offset: { x: absX, y: absY } });
                        } else {
                          const isTable = schema?.tables.some(t => t.id === val);
                          updateAnnotation(annotation.id, {
                            target: { id: val, type: isTable ? 'table' : 'domain' },
                            offset: { x: 50, y: -50 } // Reset to a safe offset when binding
                          });
                        }
                      }}
                      className={`flex-1 border rounded text-xs p-2 outline-none ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">- Floating (No Target) -</option>
                      <optgroup label="Tables">
                        {schema?.tables.map(t => <option key={t.id} value={t.id}>{t.conceptual?.name ?? t.id} ({t.id})</option>)}
                      </optgroup>
                      <optgroup label="Domains">
                        {schema?.domains?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
                      </optgroup>
                    </select>
                    {annotation.target?.id ? (
                      <button
                        onClick={() => {
                          const targetLayout = schema?.layout?.[annotation.target!.id];
                          const parentLayout = (targetLayout as any)?.parentId ? schema?.layout?.[(targetLayout as any).parentId] : null;
                          const absX = (parentLayout?.x ?? 0) + (targetLayout?.x ?? 0) + (annotation.offset?.x ?? 0);
                          const absY = (parentLayout?.y ?? 0) + (targetLayout?.y ?? 0) + (annotation.offset?.y ?? 0);
                          updateAnnotation(annotation.id, { target: undefined, offset: { x: absX, y: absY } });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-100"
                        title="Unbind Target"
                      >
                        <Unlink size={14} />
                      </button>
                    ) : (
                      <div className="p-2 text-slate-300 border border-slate-100 rounded">
                        <LinkIcon size={14} />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Bind to a table to make the note "stick" when moving.</p>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Note Color</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={annotation.display?.color || (theme === 'dark' ? '#334155' : '#fef3c7')}
                      onChange={(e) => updateAnnotation(annotation.id, { display: { ...annotation.display, color: e.target.value } })}
                      className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                    />
                    <input
                      value={annotation.display?.color || ''}
                      onChange={(e) => updateAnnotation(annotation.id, { display: { ...annotation.display, color: e.target.value || undefined } })}
                      placeholder="e.g. #fef3c7"
                      className={`flex-1 border rounded text-[10px] p-1.5 outline-none font-mono ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
        <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
      </div>
    );
  }

  // --- Consumer Editor Rendering ---
  if (consumer) {
    const CONSUMER_COLOR = consumer.display?.color || CONSUMER_DEFAULT_COLOR
    return (
      <div
        ref={panelRef}
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {dragBar(CONSUMER_COLOR)}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <FileChartColumnIncreasing size={16} style={{ color: CONSUMER_COLOR, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{consumer.name}</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: CONSUMER_DEFAULT_COLOR, border: '1px solid rgba(124, 58, 237, 0.2)', textTransform: 'uppercase' }}>CONSUMER</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => copyEdgeId(consumer.id)}
                title="Copy ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <Copy size={11} />
              </button>
              <p style={{ fontSize: '11px', color: copiedId === consumer.id ? '#22c55e' : 'var(--text-secondary)', margin: 0, fontFamily: 'monospace', fontWeight: copiedId === consumer.id ? 600 : 400 }}>ID: {consumer.id}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Name</h3>
              <input
                value={consumer.name}
                onChange={(e) => updateConsumer(consumer.id, { name: e.target.value })}
                className={`w-full border rounded text-sm p-2 outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </section>

            {/* Description */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
              <textarea
                value={consumer.description || ''}
                onChange={(e) => updateConsumer(consumer.id, { description: e.target.value || undefined })}
                rows={3}
                placeholder="Purpose of this consumer..."
                className={`w-full border rounded text-sm p-2 outline-none resize-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </section>

            {/* URL */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">URL</h3>
              <input
                value={consumer.url || ''}
                onChange={(e) => updateConsumer(consumer.id, { url: e.target.value || undefined })}
                placeholder="https://..."
                className={`w-full border rounded text-sm p-2 outline-none font-mono ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </section>

            <div className="grid grid-cols-2 gap-6">
              {/* Icon */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Icon</h3>
                <input
                  value={consumer.display?.icon || ''}
                  onChange={(e) => updateConsumer(consumer.id, { display: { ...consumer.display, icon: e.target.value || undefined } })}
                  placeholder="🔗"
                  className={`w-full border rounded text-sm p-2 outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                />
              </section>

              {/* Color */}
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Color</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={consumer.display?.color || CONSUMER_DEFAULT_COLOR}
                    onChange={(e) => updateConsumer(consumer.id, { display: { ...consumer.display, color: e.target.value } })}
                    className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                  />
                  <input
                    value={consumer.display?.color || ''}
                    onChange={(e) => updateConsumer(consumer.id, { display: { ...consumer.display, color: e.target.value || undefined } })}
                    placeholder="#a78bfa"
                    className={`flex-1 border rounded text-[10px] p-1.5 outline-none font-mono ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
                  />
                </div>
              </section>
            </div>

            {/* Domain Assignment */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Domain Assignment</h3>
              <select
                value={schema?.domains?.find(d => d.members.includes(consumer.id))?.id || ''}
                onChange={(e) => assignTableToDomain(consumer.id, e.target.value || null)}
                className={`w-full border rounded text-sm p-2 outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <option value="">- No Domain -</option>
                {schema?.domains?.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </section>
          </div>
        </div>
        <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
      </div>
    )
  }

  // --- Relationship Editor Rendering ---
  if (relationshipData && relationshipData.kind === 'lineage') {
    const { relationship, index } = relationshipData;
    const lineageEdge = schema?.lineage?.[index];
    const currentDescription = lineageEdge?.description ?? '';
    return (
      <div
        ref={panelRef}
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {dragBar(LINEAGE_BASE)}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <LinkIcon size={16} style={{ color: LINEAGE_BASE, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Lineage</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>UPSTREAM</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              {relationship.from.table} → {relationship.to.table}
            </p>
            {lineageEdge?.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => copyEdgeId(lineageEdge.id!)}
                  title="Copy ID"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                >
                  <Copy size={11} />
                </button>
                <span style={{ fontSize: '10px', color: copiedId === lineageEdge.id ? '#22c55e' : 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: copiedId === lineageEdge.id ? 600 : 400 }}>ID: {lineageEdge.id}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, padding: '20px', fontSize: '13px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              <strong style={{ color: 'var(--text-main)' }}>{relationship.to.table}</strong>
              <span> depends on </span>
              <strong style={{ color: 'var(--text-main)' }}>{relationship.from.table}</strong>
              <span> as an upstream source.</span>
            </p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              defaultValue={currentDescription}
              key={`${relationship.from.table}-${relationship.to.table}`}
              placeholder="Describe the transformation or filter applied along this lineage..."
              onBlur={(e) => {
                const val = e.target.value.trim();
                updateLineageDescription(relationship.from.table, relationship.to.table, val);
              }}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-main)',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>
        <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
      </div>
    )
  }

  if (relationshipData) {
    const { relationship, index } = relationshipData;
    return (
      <div
        ref={panelRef}
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {dragBar(LINEAGE_BASE)}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <Database size={16} style={{ color: LINEAGE_BASE, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Relationship</span>
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>EDGE</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', flexWrap: 'wrap' }}>
              {(() => { const [src, tgt] = cardinalityOf(relationship.type); return (<>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{relationship.from.table}{relationship.from.column?.length ? `.${relationship.from.column.join(', ')}` : ''}</span>
                <CardBadge label={src} />
                <span>-</span>
                <CardBadge label={tgt} />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{relationship.to.table}{relationship.to.column?.length ? `.${relationship.to.column.join(', ')}` : ''}</span>
              </>) })()}
            </div>
            {relationship.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => copyEdgeId(relationship.id!)}
                  title="Copy ID"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                >
                  <Copy size={11} />
                </button>
                <span style={{ fontSize: '10px', color: copiedId === relationship.id ? '#22c55e' : 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: copiedId === relationship.id ? 600 : 400 }}>ID: {relationship.id}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="grid grid-cols-2 gap-8">
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Relationship Type</h3>
                <select 
                  value={relationship.type || 'one-to-many'}
                  onChange={(e) => updateRelationship(index, { type: e.target.value as any })}
                  className={`w-full border rounded text-sm p-2.5 outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400 shadow-sm'
                  }`}
                >
                  <option value="one-to-one">1:1 (one-to-one)</option>
                  <option value="one-to-many">1:N (one-to-many)</option>
                  <option value="many-to-one">N:1 (many-to-one)</option>
                  <option value="many-to-many">N:N (many-to-many)</option>
                </select>
              </section>

              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Cardinality (Metadata)</h3>
                <div className="text-slate-500 text-sm">
                  Mapping established from <strong>{relationship.from.table}</strong> to <strong>{relationship.to.table}</strong>.
                </div>
              </section>
            </div>
            
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Source/Target Details</h3>
              {(() => {
                const cardMap: Record<string, [string, string]> = {
                  'one-to-many':  ['1', 'N'],
                  'many-to-one':  ['N', '1'],
                  'many-to-many': ['N', 'N'],
                  'one-to-one':   ['1', '1'],
                };
                const [fromCard, toCard] = cardMap[relationship.type || 'one-to-many'] ?? ['?', '?'];
                return (
                  <div className={`flex gap-4 items-center p-3 rounded border ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 uppercase">From Table</div>
                      <div className="flex items-baseline gap-1.5">
                        <div className={`text-sm font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{relationship.from.table}</div>
                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>{fromCard}</div>
                      </div>
                      <div className="text-[10px] text-slate-500">Column: {relationship.from.column && relationship.from.column.length > 0 ? relationship.from.column.join(', ') : '(Table level)'}</div>
                    </div>
                    <div className="text-slate-400 dark:text-slate-600">—</div>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 uppercase">To Table</div>
                      <div className="flex items-baseline gap-1.5">
                        <div className={`text-sm font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{relationship.to.table}</div>
                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>{toCard}</div>
                      </div>
                      <div className="text-[10px] text-slate-500">Column: {relationship.to.column && relationship.to.column.length > 0 ? relationship.to.column.join(', ') : '(Table level)'}</div>
                    </div>
                  </div>
                );
              })()}
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
              <textarea
                defaultValue={relationship.description ?? ''}
                key={relationship.id}
                placeholder="Describe the meaning or purpose of this relationship..."
                onBlur={(e) => {
                  if (relationship.id) {
                    updateRelationshipDescription(relationship.id, e.target.value.trim());
                  }
                }}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-main)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </section>
          </div>
        </div>
        <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
      </div>
    );
  }
  if (domain) {
    return (
      <div
        ref={panelRef}
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {dragBar(domain.display?.color || LINEAGE_BASE)}
        {/* Panel Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <Database size={16} style={{ color: domain.display?.color || LINEAGE_BASE, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                value={domain.name ?? ''}
                onChange={(e) => updateDomain(domain.id, { name: e.target.value })}
                onBlur={(e) => { if (!e.target.value) updateDomain(domain.id, { name: 'UNNAMED_DOMAIN' }) }}
                onMouseDown={e => e.stopPropagation()}
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  padding: '2px 0',
                  outline: 'none',
                  width: 'fit-content',
                  minWidth: '150px'
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderBottom = `1px solid ${LINEAGE_BASE}`}
              />
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>DOMAIN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={() => copyEdgeId(domain.id)}
                title="Copy ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <Copy size={11} />
              </button>
              <p style={{ fontSize: '11px', color: copiedId === domain.id ? '#22c55e' : 'var(--text-secondary)', margin: 0, fontFamily: 'monospace', fontWeight: copiedId === domain.id ? 600 : 400 }}>ID: {domain.id}</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Domain Description</h3>
              <textarea 
                value={domain.description || ''}
                onChange={(e) => updateDomain(domain.id, { description: e.target.value })}
                placeholder="What is the purpose of this domain?"
                style={{ 
                  width: '100%', 
                  minHeight: '80px',
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  border: `1px solid var(--border-main)`, 
                  borderRadius: '6px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  transition: 'background-color 0.3s'
                }}
              />
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Domain Theme Color</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={(() => {
                    const c = domain.display?.color;
                    if (!c) return LINEAGE_BASE;
                    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (m) return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
                    return c.startsWith('#') ? c : LINEAGE_BASE;
                  })()}
                  onChange={(e) => {
                    const hex = e.target.value;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    updateDomain(domain.id, { display: { ...domain.display, color: `rgba(${r}, ${g}, ${b}, 0.12)` } });
                  }}
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                />
                <input
                  value={domain.display?.color || ''}
                  onChange={(e) => updateDomain(domain.id, { display: { ...domain.display, color: e.target.value || undefined } })}
                  placeholder="e.g. #3b82f6 or rgba(...)"
                  className={`border rounded font-mono text-sm p-2 outline-none flex-1 transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400 shadow-sm'
                  }`}
                />
              </div>
            </section>
          </div>
        </div>
        <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
      </div>
    );
  }

  // --- Table Editor Rendering ---
  if (!table) return null;

  const tabs = [
    { id: 'conceptual', label: 'Conceptual', icon: <TagIcon size={14} />, shortcut: '1' },
    { id: 'logical', label: 'Logical', icon: <Database size={14} />, shortcut: '2' },
    { id: 'physical', label: 'Physical', icon: <Database size={14} />, shortcut: '3' },
    { id: 'sample', label: 'Sample Data', icon: <TableIcon size={14} />, shortcut: '4' },
    { id: 'metadata', label: 'Metadata', icon: <FileChartColumnIncreasing size={14} />, shortcut: '5' }
  ]

  const typeConfig = table!.conceptual?.kind ? TYPE_CONFIG[table!.conceptual.kind] : null;
  const themeColor = table!.display?.color || typeConfig?.color || '#334155';
  const icon = table!.display?.icon || typeConfig?.icon || '';

  // Build type label
  let typeLabel = '';
  const scd = table!.logical?.scd;

  if (table!.conceptual?.kind) {
    typeLabel = table!.conceptual.kind.toUpperCase();
  }

  if (scd?.type) {
    const scdLabel = `SCD ${scd.type.replace('type', 'T')}`;
    typeLabel = typeLabel ? `${typeLabel} / ${scdLabel}` : scdLabel;
  }

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCol: Column = {
      id: `col_${Date.now()}`,
      name: 'New Column',
      type: 'String',
      description: '',
      physical: { name: '', type: 'VARCHAR(255)', constraints: [] }
    };
    handleUpdateTable({ columns: [...(table!.columns || []), newCol] });
  };

  const handleRemoveColumn = (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    const newColumns = table!.columns?.filter(col => col.id !== colId) || [];
    handleUpdateTable({ columns: newColumns });
  };

  const handleUpdateColumn = (colId: string, updates: Partial<Column>) => {
    const newColumns: Column[] = table!.columns?.map(col => {
      if (col.id === colId) {
        return { ...col, ...updates };
      }
      return col;
    }) || [];
    handleUpdateTable({ columns: newColumns });
  };

  const handleUpdatePhysicalColumn = (colId: string, updates: Partial<NonNullable<Column['physical']>>) => {
    const newColumns: Column[] = table!.columns?.map(col => {
      if (col.id === colId) {
        return { 
          ...col, 
          physical: { 
            ...col.physical, 
            ...updates 
          } 
        };
      }
      return col;
    }) || [];
    handleUpdateTable({ columns: newColumns });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const currentTags = (table!.metadata?.tags as string[] | undefined) || [];
      if (!currentTags.includes(tagInput.trim())) {
        handleUpdateTable({
          metadata: {
            ...table!.metadata,
            tags: [...currentTags, tagInput.trim()]
          }
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.stopPropagation();
    const currentTags = (table!.metadata?.tags as string[] | undefined) || [];
    const newTags = currentTags.filter(t => t !== tagToRemove);
    handleUpdateTable({
      metadata: {
        ...table!.metadata,
        tags: newTags.length > 0 ? newTags : undefined
      }
    });
  };

  const handleUpdateSampleData = (newSample: any[][]) => {
    handleUpdateTable({ sampleData: newSample });
  };

  const handleAddSampleRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentSample = table!.sampleData || [];
    const colCount = table!.columns?.length || 0;
    const newRow = new Array(colCount).fill('');
    handleUpdateSampleData([...currentSample, newRow]);
  };

  const handleRemoveSampleRow = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const currentSample = table!.sampleData || [];
    const newRows = currentSample.filter((_, i) => i !== index);
    handleUpdateSampleData(newRows);
  };

  const handleUpdateSampleCell = (rowIndex: number, colIndex: number, value: any) => {
    const currentSample = [...(table!.sampleData || [])];
    if (!currentSample[rowIndex]) return;
    
    const newRow = [...currentSample[rowIndex]];
    newRow[colIndex] = value;
    currentSample[rowIndex] = newRow;
    handleUpdateSampleData(currentSample);
  };

  return (
    <div
      ref={panelRef}
      className="shadow-2xl z-50 flex flex-col sidebar-content"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      style={panelStyle}
    >
      {dragBar(themeColor)}
      {/* Panel Header */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 16px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)', overflow: 'hidden' }}>
        <div style={{ minWidth: 0 }}>
          {/* Top Row: Icon, ID, and Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}>
              {table!.id}
            </span>
            {typeLabel && (
              <span style={{ 
                fontSize: '9px', 
                fontWeight: 800, 
                padding: '1px 5px', 
                borderRadius: '3px', 
                backgroundColor: `${themeColor}30`, 
                color: themeColor, 
                border: `1px solid ${themeColor}50`,
                textTransform: 'uppercase'
              }}>
                {typeLabel}
              </span>
            )}
          </div>

          {/* SDD context info */}
          {contextData?.tables?.[table!.id] && (() => {
            const ctx = contextData.tables![table!.id]
            return (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {ctx.last_change && (
                  <span style={{ fontSize: '10px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    📝 {ctx.last_change}
                  </span>
                )}
                {(ctx.open_questions ?? 0) > 0 && (
                  <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    ❓ {ctx.open_questions} open question{(ctx.open_questions ?? 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Imported badge */}
          {table!.isImported && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '3px 8px', borderRadius: '4px', backgroundColor: theme === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <LinkIcon size={11} style={{ color: '#818cf8' }} />
              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imported — read only</span>
            </div>
          )}

          {/* Primary Row: Editable Conceptual Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              value={table!.conceptual?.name ?? ''}
              onChange={(e) => handleUpdateTable({ conceptual: { ...table!.conceptual, name: e.target.value } })}
              onBlur={(e) => { if (!e.target.value) handleUpdateTable({ conceptual: { ...table!.conceptual, name: 'UNNAMED_TABLE' } }) }}
              onMouseDown={e => e.stopPropagation()}
              readOnly={!!table!.isImported}
              title="Conceptual Table Name"
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid transparent',
                padding: '2px 0',
                outline: 'none',
                width: '100%',
                maxWidth: '500px'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderBottom = `1px solid ${LINEAGE_BASE}`}
            />
          </div>

          {/* ID field */}
          {!table!.isImported && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <button
                onClick={() => copyEdgeId(table!.id)}
                title="Copy ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: copiedId === table!.id ? '#22c55e' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
              >
                <Copy size={11} />
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace', flexShrink: 0 }}>ID:</span>
              <input
                key={table!.id}
                defaultValue={table!.id}
                onBlur={(e) => {
                  const newId = e.target.value.trim()
                  if (newId && newId !== table!.id) renameTableId(table!.id, newId)
                  else e.target.value = table!.id
                }}
                onChange={() => { if (error) setError(null) }}
                readOnly={!!table!.isImported}
                title="Table ID"
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: copiedId === table!.id ? '#22c55e' : 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  padding: '1px 0',
                  outline: 'none',
                  width: '100%',
                  maxWidth: '400px',
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderBottom = `1px solid ${LINEAGE_BASE}`}
                onBlurCapture={(e) => (e.target as HTMLInputElement).style.borderBottom = '1px solid transparent'}
              />
              {error && (
                <span style={{ fontSize: '10px', color: '#ef4444', flexShrink: 0 }}>{error}</span>
              )}
            </div>
          )}
        </div>

        {/* Quick Access Metadata Selectors */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          <select
            value={table!.conceptual?.kind || ''}
            onChange={(e) => handleUpdateTable({ conceptual: { ...table!.conceptual, kind: (e.target.value || undefined) as any } })}
            className={`border rounded text-[10px] px-2 py-1 outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500'
                : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400'
            }`}
            title="Table Kind"
          >
            <option value="">- Kind -</option>
            <option value="fact">Fact</option>
            <option value="dimension">Dimension</option>
            <option value="mart">Mart</option>
            <option value="table">Table</option>
            <option value="hub">Hub</option>
            <option value="link">Link</option>
            <option value="satellite">Satellite</option>
          </select>

          <select
            value={table!.logical?.scd?.type || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleUpdateTable({ logical: { ...table!.logical, scd: val ? { ...(table!.logical?.scd || {}), type: val } : undefined } });
            }}
            className={`border rounded text-[10px] px-2 py-1 outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500'
                : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400'
            }`}
            title="SCD Type"
          >
            <option value="">- SCD Type -</option>
            <option value="type0">SCD Type 0</option>
            <option value="type1">SCD Type 1</option>
            <option value="type2">SCD Type 2</option>
            <option value="type3">SCD Type 3</option>
            <option value="type4">SCD Type 4</option>
            <option value="type5">SCD Type 5</option>
            <option value="type6">SCD Type 6</option>
            <option value="type7">SCD Type 7</option>
          </select>

          {/* Icon input */}
          {!table!.isImported && (
            <input
              value={table!.display?.icon || ''}
              onChange={(e) => handleUpdateTable({ display: { ...table!.display, icon: e.target.value || undefined } })}
              placeholder="Icon"
              title="Display Icon (emoji)"
              maxLength={4}
              className={`border rounded text-[13px] px-2 py-1 outline-none transition-colors w-14 text-center ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500'
                  : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400'
              }`}
            />
          )}

          {/* Color picker */}
          {!table!.isImported && (
            <div className="flex items-center gap-1" title="Header Color">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => handleUpdateTable({ display: { ...table!.display, color: e.target.value } })}
                style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <input
                value={table!.display?.color || ''}
                onChange={(e) => handleUpdateTable({ display: { ...table!.display, color: e.target.value || undefined } })}
                placeholder={typeConfig?.color || '#334155'}
                className={`border rounded text-[10px] px-2 py-1 outline-none font-mono w-24 ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          )}
        </div>

      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
        {tabsOverflow ? (
          <div style={{ padding: '6px 16px' }}>
            <select
              value={activeTab}
              onChange={(e) => { e.stopPropagation(); setActiveTab(e.target.value); }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full border rounded text-[12px] px-2 py-1.5 outline-none cursor-pointer ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        ) : (
          <div ref={tabRowRef} style={{ display: 'flex', padding: '0 20px', overflowX: 'hidden' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(tab.id);
                }}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `2px solid ${LINEAGE_BASE}` : '2px solid transparent',
                  color: activeTab === tab.id ? (theme === 'dark' ? '#60a5fa' : '#2563eb') : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {tab.icon} {tab.label}
                <span style={{ fontSize: '10px', opacity: 0.4, marginLeft: '2px' }}>{tab.shortcut}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
        {activeTab === 'conceptual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
              <textarea 
                value={table!.conceptual?.description || ''}
                onChange={(e) => handleUpdateTable({ 
                  conceptual: { ...table!.conceptual, description: e.target.value } 
                })}
                placeholder="Enter business description..."
                style={{ 
                  width: '100%', 
                  minHeight: '100px',
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                  border: `1px solid var(--border-main)`, 
                  borderRadius: '6px',
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'none',
                  outline: 'none',
                  transition: 'background-color 0.3s'
                }}
              />
            </section>
            
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Domain Assignment</h3>
              <select 
                value={schema?.domains?.find(d => d.members.includes(table!.id))?.id || ''}
                onChange={(e) => assignTableToDomain(table!.id, e.target.value || null)}
                className={`w-full border rounded text-sm p-2 outline-none transition-colors ${
                  theme === 'dark' 
                    ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400 shadow-sm'
                }`}
              >
                <option value="">- No Domain -</option>
                {schema?.domains?.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </section>
            
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {(table!.metadata?.tags as string[] | undefined)?.map(tag => (
                  <span key={tag} className={`flex items-center gap-2 px-3 py-1 border rounded-full text-xs font-medium transition-colors ${
                    theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {tag}
                    <button onClick={(e) => handleRemoveTag(e, tag)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                  </span>
                ))}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+ New Tag"
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: '1px dashed var(--border-main)', 
                      borderRadius: '16px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '100px'
                    }}
                  />
                </div>
              </div>
            </section>
          </div>
        )}
        
        {activeTab === 'logical' && (
          <div>
            <div className="flex flex-col gap-4 mb-6">
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Logical Table Name</h3>
                <input
                  value={table!.logical?.name || ''}
                  onChange={(e) => handleUpdateTable({ logical: { ...table!.logical, name: e.target.value || undefined } })}
                  placeholder={table!.conceptual?.name ?? table!.id}
                  className={`w-full border rounded text-sm p-2 outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-200 focus:ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400 shadow-sm'
                  }`}
                />
              </section>
              
              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Logical Schema (Columns)</h3>
                <button onClick={handleAddColumn} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors shadow-md shadow-blue-500/20 font-medium">
                  <Plus size={14} /> Add Column
                </button>
              </div>
            </div>
            
            <div style={{ border: '1px solid var(--border-main)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-main)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '35%' }}>Logical Name</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '15%' }}>Role</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '15%' }}>Type</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '30%' }}>Description</th>
                    <th style={{ padding: '10px 16px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(table!.columns || []).map(col => (
                    <tr key={col.id} style={{ borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--node-bg)' }}>
                      <td style={{ padding: '6px 16px' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateColumn(col.id, { isPrimaryKey: !col.isPrimaryKey })}
                            title="Primary Key"
                            className={`transition-opacity ${col.isPrimaryKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >🔑</button>
                          <div className="flex flex-col flex-1 min-w-0">
                            <input
                              value={col.name ?? ''}
                              onChange={(e) => handleUpdateColumn(col.id, { name: e.target.value })}
                              onBlur={(e) => { if (!e.target.value) handleUpdateColumn(col.id, { name: col.id }) }}
                              className={`bg-transparent border-none w-full outline-none p-1 rounded font-medium transition-colors ${
                                theme === 'dark' ? 'text-white focus:bg-slate-800' : 'text-slate-900 focus:bg-slate-50'
                              }`}
                            />
                            <input
                              key={col.id}
                              defaultValue={col.id}
                              onBlur={(e) => {
                                const newId = e.target.value.trim()
                                if (newId && newId !== col.id) renameColumnId(table!.id, col.id, newId)
                                else e.target.value = col.id
                              }}
                              onChange={() => { if (error) setError(null) }}
                              title="Column ID"
                              style={{ fontSize: '10px', fontFamily: 'monospace' }}
                              className={`bg-transparent border-none w-full outline-none px-1 rounded transition-colors ${
                                theme === 'dark' ? 'text-slate-500 focus:bg-slate-800' : 'text-slate-400 focus:bg-slate-50'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleUpdateColumn(col.id, { isForeignKey: !col.isForeignKey })}
                            title="Foreign Key"
                            className={`transition-opacity text-sm ${col.isForeignKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >🔩</button>
                          <button
                            onClick={() => handleUpdateColumn(col.id, { isPartitionKey: !col.isPartitionKey })}
                            title="Partition Key"
                            className={`transition-opacity text-sm ${col.isPartitionKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >📂</button>
                          <select
                            value={col.additivity || ''}
                            onChange={(e) => handleUpdateColumn(col.id, { additivity: (e.target.value || undefined) as any })}
                            title="Additivity (for Measures)"
                            style={{ fontSize: '10px' }}
                            className={`border rounded outline-none transition-colors ${
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 text-slate-400'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="">-</option>
                            <option value="fully">Σ (Full)</option>
                            <option value="semi">Σ~ (Semi)</option>
                            <option value="non">⊘ (Non)</option>
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input
                          value={col.type ?? ''}
                          onChange={(e) => handleUpdateColumn(col.id, { type: e.target.value })}
                          onBlur={(e) => { if (!e.target.value) handleUpdateColumn(col.id, { type: 'String' }) }}
                          placeholder="Type..."
                          className={`bg-transparent border-none font-mono text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-slate-400 focus:bg-slate-800' : 'text-slate-500 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input
                          value={col.description || ''}
                          onChange={(e) => handleUpdateColumn(col.id, { description: e.target.value })}
                          placeholder="Description..."
                          className={`bg-transparent border-none text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-slate-500 focus:bg-slate-800' : 'text-slate-400 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px', textAlign: 'right' }}>
                        <button onClick={(e) => handleRemoveColumn(e, col.id)} className="text-red-500/50 hover:text-red-500 p-1 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {activeTab === 'physical' && (
          <div>
            <div className="flex flex-col gap-4 mb-6">
              <section>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Physical Table Name</h3>
                <input
                  value={table!.physical?.name || ''}
                  onChange={(e) => handleUpdateTable({ physical: { ...table!.physical, name: e.target.value || undefined } })}
                  placeholder={table!.id}
                  className={`w-full border rounded font-mono text-sm p-2 outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400 shadow-sm'
                  }`}
                />
              </section>

              <div className="flex justify-between items-center">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Physical Mappings</h3>
              </div>
            </div>
            
            <div style={{ border: '1px solid var(--border-main)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--border-main)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '25%' }}>Logical Column</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '30%' }}>DB Column Name</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '20%' }}>DB Type</th>
                    <th style={{ padding: '10px 16px', color: 'var(--text-secondary)', width: '25%' }}>Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {(table!.columns || []).map(col => (
                    <tr key={col.id} style={{ borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--node-bg)' }}>
                      <td style={{ padding: '6px 16px', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-main)' }}>
                        <div className="text-[11px] font-medium truncate" title={col.name || col.id}>
                          {col.name || col.id}
                        </div>
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input
                          value={col.physical?.name ?? ''}
                          onChange={(e) => handleUpdatePhysicalColumn(col.id, { name: e.target.value })}
                          placeholder={col.name?.toLowerCase()?.replace(/ /g, '_')}
                          className={`bg-transparent border-none font-mono text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-blue-400 focus:bg-slate-800' : 'text-blue-600 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input
                          value={col.physical?.type ?? ''}
                          onChange={(e) => handleUpdatePhysicalColumn(col.id, { type: e.target.value })}
                          placeholder={col.type?.toUpperCase()}
                          className={`bg-transparent border-none font-mono text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-slate-400 focus:bg-slate-800' : 'text-slate-500 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input 
                          value={col.physical?.constraints?.join(', ') || ''}
                          onChange={(e) => handleUpdatePhysicalColumn(col.id, { constraints: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g. NOT NULL"
                          className={`bg-transparent border-none text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-slate-500 focus:bg-slate-800' : 'text-slate-400 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Build Settings */}
            <div className="flex flex-col gap-4 mt-6">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Build Settings</h3>
              <p className="text-[10px] text-slate-400 -mt-2">Code generation hints for AI agents (dbt, Spark, SQLMesh, etc.).</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Strategy</label>
                <select
                  value={table!.physical?.strategy || ''}
                  onChange={(e) => handleUpdateTable({ physical: { ...table!.physical, strategy: (e.target.value || undefined) as any } })}
                  className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value=""></option>
                  <option value="full">📋 full</option>
                  <option value="view">👁 view</option>
                  <option value="incremental">⚡ incremental</option>
                  <option value="ephemeral">👻 ephemeral</option>
                </select>
              </div>

              {table!.physical?.strategy === 'incremental' && (
                <div className={`flex flex-col gap-3 p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incremental Settings</div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Update Mode</label>
                    <select
                      value={table!.physical?.update_mode || ''}
                      onChange={(e) => handleUpdateTable({ physical: { ...table!.physical, update_mode: (e.target.value || undefined) as any } })}
                      className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                        theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value=""></option>
                      <option value="merge">merge</option>
                      <option value="append">append</option>
                      <option value="delete_insert">delete_insert</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-500">Merge Key</label>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {(table!.physical?.merge_key || []).map((key) => (
                        <span key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                          theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {key}
                          <button
                            onClick={() => {
                              const updated = (table!.physical?.merge_key || []).filter(k => k !== key)
                              handleUpdateTable({ physical: { ...table!.physical, merge_key: updated.length ? updated : undefined } })
                            }}
                            className="text-slate-400 hover:text-red-400 ml-0.5"
                          >×</button>
                        </span>
                      ))}
                    </div>
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) return
                        const current = table!.physical?.merge_key || []
                        if (!current.includes(val)) {
                          handleUpdateTable({ physical: { ...table!.physical, merge_key: [...current, val] } })
                        }
                      }}
                      className={`w-full px-3 py-2 rounded border text-sm font-mono transition-colors ${
                        theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="">+ Add column</option>
                      {(table!.columns || [])
                        .filter(col => !(table!.physical?.merge_key || []).includes(col.physical?.name || col.id))
                        .map(col => {
                          const physName = col.physical?.name || col.id
                          return <option key={col.id} value={physName}>{physName}</option>
                        })}
                    </select>
                  </div>
                </div>
              )}

              {!['view', 'ephemeral'].includes(table!.physical?.strategy || '') && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Partition</label>
                    {!table!.physical?.partition && (
                      <button
                        onClick={() => handleUpdateTable({ physical: { ...table!.physical, partition: { field: '' } } })}
                        className="text-[11px] text-blue-500 hover:text-blue-400"
                      >+ Add</button>
                    )}
                  </div>
                  {table!.physical?.partition && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={table!.physical.partition.field}
                        onChange={(e) => handleUpdateTable({ physical: { ...table!.physical, partition: { ...table!.physical!.partition!, field: e.target.value } } })}
                        className={`flex-1 px-3 py-2 rounded border text-sm font-mono transition-colors ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value=""></option>
                        {(table!.columns || []).map(col => {
                          const physName = col.physical?.name || col.id
                          return <option key={col.id} value={physName}>{physName}</option>
                        })}
                      </select>
                      <select
                        value={table!.physical.partition.granularity || ''}
                        onChange={(e) => handleUpdateTable({ physical: { ...table!.physical, partition: { ...table!.physical!.partition!, granularity: (e.target.value as any) || undefined } } })}
                        className={`px-2 py-2 rounded border text-sm transition-colors ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      >
                        <option value=""></option>
                        <option value="day">day</option>
                        <option value="month">month</option>
                        <option value="year">year</option>
                        <option value="hour">hour</option>
                      </select>
                      <button
                        onClick={() => handleUpdateTable({ physical: { ...table!.physical, partition: undefined } })}
                        className="text-slate-400 hover:text-red-400 text-sm px-1"
                      >×</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sample' && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sample Data Editor</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddSampleRow} 
                  disabled={!table!.columns || table!.columns.length === 0}
                  className={`flex items-center gap-2 px-3 py-1.5 text-white rounded text-xs transition-colors font-medium shadow-md ${
                    (!table!.columns || table!.columns.length === 0) 
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  }`}
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>
            </div>

            {!table!.columns || table!.columns.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center p-8 rounded-lg border border-dashed transition-colors ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <TableIcon size={32} className={`${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'} mb-4`} />
                <p className="text-sm text-slate-500 mb-1">No columns defined yet.</p>
                <p className="text-xs text-slate-400 italic">Add columns in the "Logical" tab first to enable sample data.</p>
              </div>
            ) : (
              <div className={`flex-1 overflow-auto border rounded-lg shadow-inner transition-colors ${
                theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-white'
              }`}>
                <table className="w-full border-collapse text-xs">
                  <thead className={`sticky top-0 z-10 border-b transition-colors ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <tr>
                      {(table!.columns || []).map((col) => {
                        return (
                          <th key={col.id} className={`p-3 text-left border-r min-w-[140px] transition-colors ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}>
                            <div className="flex flex-col gap-0.5">
                              <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{col?.name || col.id}</span>
                              <span className={`text-[10px] font-mono italic ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                {col?.physical?.name || col?.name?.toLowerCase()?.replace(/ /g, '_') || col.id}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th className={`w-10 transition-colors ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(table!.sampleData || []).map((row, rowIndex) => (
                      <tr key={rowIndex} className={`border-b transition-colors ${
                        theme === 'dark' ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'
                      }`}>
                        {(table!.columns || []).map((col, colIndex) => (
                          <td key={col.id} className={`p-0 border-r transition-colors ${
                            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                          }`}>
                            <input 
                              value={String(row[colIndex] ?? '')}
                              onChange={(e) => handleUpdateSampleCell(rowIndex, colIndex, e.target.value)}
                              className={`w-full bg-transparent border-none p-3 outline-none font-mono transition-colors ${
                                theme === 'dark' ? 'focus:bg-slate-800 text-slate-300' : 'focus:bg-blue-50 text-slate-700'
                              }`}
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button onClick={(e) => handleRemoveSampleRow(e, rowIndex)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                    {(!table!.sampleData || table!.sampleData.length === 0) && (
                      <tr>
                        <td 
                          colSpan={(table!.columns?.length || 0) + 1} 
                          className={`p-8 text-center text-slate-400 italic transition-colors ${
                            theme === 'dark' ? 'bg-slate-900/20' : 'bg-slate-50'
                          }`}
                        >
                          No rows defined. Click "Add Row" to start.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'metadata' && (
          <div className="flex flex-col h-full gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Metadata</h3>
              <button
                onClick={() => setMetadataEntries(prev => [...prev, { key: '', value: '' }])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-medium shadow-md shadow-emerald-500/20 transition-colors"
              >
                <Plus size={13} /> Add Field
              </button>
            </div>

            {metadataEntries.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center p-8 rounded-lg border border-dashed transition-colors ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <FileChartColumnIncreasing size={32} className={`${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'} mb-4`} />
                <p className="text-sm text-slate-500 mb-1">No metadata fields yet.</p>
                <p className="text-xs text-slate-400 italic">Click "Add Field" to add owner, SLA, sql_path, etc.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 overflow-auto flex-1">
                {metadataEntries.map((entry, idx) => {
                  const saveEntries = (next: typeof metadataEntries) => {
                    const valid = next.filter(e => e.key.trim())
                    const obj = valid.length > 0
                      ? Object.fromEntries(valid.map(e => [e.key.trim(), e.value]))
                      : undefined
                    updateTable(table!.id, { metadata: obj })
                  }
                  return (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                      theme === 'dark' ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'
                    }`}>
                      <input
                        placeholder="key"
                        value={entry.key}
                        onChange={e => {
                          const next = metadataEntries.map((en, i) => i === idx ? { ...en, key: e.target.value } : en)
                          setMetadataEntries(next)
                          saveEntries(next)
                        }}
                        className={`flex-1 min-w-0 bg-transparent border rounded px-2 py-1 text-xs font-mono outline-none transition-colors ${
                          theme === 'dark'
                            ? 'border-slate-700 text-slate-200 placeholder-slate-600 focus:border-blue-500'
                            : 'border-slate-300 text-slate-700 placeholder-slate-400 focus:border-blue-400'
                        }`}
                      />
                      <span className={`text-xs flex-shrink-0 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>:</span>
                      <input
                        placeholder="value"
                        value={entry.value}
                        onChange={e => {
                          const next = metadataEntries.map((en, i) => i === idx ? { ...en, value: e.target.value } : en)
                          setMetadataEntries(next)
                          saveEntries(next)
                        }}
                        className={`flex-[2] min-w-0 bg-transparent border rounded px-2 py-1 text-xs font-mono outline-none transition-colors ${
                          theme === 'dark'
                            ? 'border-slate-700 text-slate-300 placeholder-slate-600 focus:border-blue-500'
                            : 'border-slate-300 text-slate-700 placeholder-slate-400 focus:border-blue-400'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const next = metadataEntries.filter((_, i) => i !== idx)
                          setMetadataEntries(next)
                          saveEntries(next)
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div onMouseDown={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize', zIndex: 300 }} />
    </div>
  )
})

export default DetailPanel
