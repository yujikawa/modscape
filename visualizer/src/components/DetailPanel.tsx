import { memo, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import { X, Plus, Trash2, Tag as TagIcon, Table as TableIcon, Database, Link as LinkIcon, Unlink, ChevronUp, ChevronDown, Cpu, FileChartColumnIncreasing } from 'lucide-react'
import type { Table, Column } from '../types/schema'
import { TYPE_CONFIG } from '../lib/cytoscapeElements'
import { LINEAGE_BASE, CONSUMER_DEFAULT_COLOR, ANNOTATION_DEFAULT_COLOR } from '../lib/colors'

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
    updateLineageDescription,
    updateAnnotation,
    assignTableToDomain,
    error,
    setError,
    theme,
    isDetailPanelSuppressed,
    isDetailPanelMinimized,
    setIsDetailPanelMinimized
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
    updateLineageDescription: s.updateLineageDescription,
    updateAnnotation: s.updateAnnotation,
    assignTableToDomain: s.assignTableToDomain,
    error: s.error,
    setError: s.setError,
    theme: s.theme,
    isDetailPanelSuppressed: s.isDetailPanelSuppressed,
    isDetailPanelMinimized: s.isDetailPanelMinimized,
    setIsDetailPanelMinimized: s.setIsDetailPanelMinimized,
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
  const [panelHeight, setPanelHeight] = useState(400) // Default height in pixels
  const [isResizing, setIsResizing] = useState(false)

  // Use simple effect for global mouse move to handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      // Constraint height between 150px and 90% of window height
      setPanelHeight(Math.max(150, Math.min(newHeight, window.innerHeight * 0.9)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (isDetailPanelSuppressed) return null

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'ns-resize';
  };

  // Helper to prevent event propagation to React Flow canvas
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  // Common Wrapper Style
  const panelStyle: React.CSSProperties = {
    height: `${panelHeight}px`,
    maxHeight: '90vh',
    minHeight: '150px',
    backgroundColor: 'var(--node-bg)', 
    borderTop: `2px solid ${theme === 'dark' ? LINEAGE_BASE : '#60a5fa'}`,
    display: 'flex', 
    flexDirection: 'column',
    color: 'var(--text-primary)',
    boxShadow: theme === 'dark' ? '0 -10px 25px -5px rgba(0, 0, 0, 0.4)' : '0 -4px 12px rgba(0, 0, 0, 0.05)',
    fontFamily: 'sans-serif',
    position: 'relative',
    transition: 'background-color 0.3s, color 0.3s'
  };

  // --- Minimized State Rendering ---
  if (isDetailPanelMinimized) {
    const selectedName = table?.name || domain?.name || consumer?.name || (relationshipData ? `${relationshipData.relationship.from.table} → ${relationshipData.relationship.to.table}` : null) || annotation?.text?.substring(0, 20);
    const hasSelection = !!selectedName;

    // Determine active theme color for border synchronization
    let activeColor = theme === 'dark' ? '#334155' : '#e2e8f0'; // Subtle gray if nothing selected
    if (table) {
      const tc = table.appearance?.type ? TYPE_CONFIG[table.appearance.type] : null;
      activeColor = table.appearance?.color || tc?.color || activeColor;
    } else if (domain) {
      activeColor = domain.color || activeColor;
    } else if (consumer) {
      activeColor = consumer.appearance?.color || CONSUMER_DEFAULT_COLOR;
    } else if (annotation) {
      activeColor = annotation.color || ANNOTATION_DEFAULT_COLOR;
    }

    return (
      <div 
        className={`shadow-2xl z-50 flex items-center justify-between px-6 transition-all border-t-2 ${hasSelection ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900' : 'cursor-default opacity-80'}`}
        onClick={(e) => {
          if (!hasSelection) return;
          e.stopPropagation();
          setIsDetailPanelMinimized(false);
        }}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={{ 
          height: '40px', 
          backgroundColor: 'var(--node-bg)', 
          borderColor: activeColor,
          color: 'var(--text-primary)'
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
            {hasSelection ? `Selected: ${selectedName}` : 'Select an object on the canvas to view its details'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {hasSelection && (
            <>
              <div className="text-[10px] font-medium text-slate-400 italic hidden sm:block">
                Click to expand
              </div>
              <button 
                className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}
              >
                <ChevronUp size={18} style={{ color: activeColor }} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleUpdateTable = (updates: Partial<Table>) => {
    if (table?.isImported) return; // Imported tables are read-only
    updateTable(table!.id, updates);
  };

  // --- Annotation Editor Rendering ---
  if (annotation) {
    return (
      <div 
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={{ ...panelStyle, borderTopColor: annotation.color || ANNOTATION_DEFAULT_COLOR }}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          style={{
            position: 'absolute',
            top: '-4px',
            left: 0,
            right: 0,
            height: '8px',
            cursor: 'ns-resize',
            zIndex: 60
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <TagIcon size={18} style={{ color: annotation.color || ANNOTATION_DEFAULT_COLOR }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Annotation</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                {annotation.targetId ? `Sticky to ${annotation.targetId} (${annotation.targetType})` : 'Floating Note'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsDetailPanelMinimized(true)} 
              className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}
              title="Minimize Details"
            >
              <ChevronDown size={18} />
            </button>
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
                      value={annotation.targetId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          const targetLayout = schema?.layout?.[annotation.targetId!];
                          const parentLayout = targetLayout?.parentId ? schema?.layout?.[targetLayout.parentId] : null;
                          const absX = (parentLayout?.x ?? 0) + (targetLayout?.x ?? 0) + annotation.offset.x;
                          const absY = (parentLayout?.y ?? 0) + (targetLayout?.y ?? 0) + annotation.offset.y;
                          updateAnnotation(annotation.id, { targetId: undefined, targetType: undefined, offset: { x: absX, y: absY } });
                        } else {
                          const isTable = schema?.tables.some(t => t.id === val);
                          updateAnnotation(annotation.id, { 
                            targetId: val, 
                            targetType: isTable ? 'table' : 'domain',
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
                        {schema?.tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                      </optgroup>
                      <optgroup label="Domains">
                        {schema?.domains?.map(d => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
                      </optgroup>
                    </select>
                    {annotation.targetId ? (
                      <button 
                        onClick={() => {
                          const targetLayout = schema?.layout?.[annotation.targetId!];
                          const parentLayout = targetLayout?.parentId ? schema?.layout?.[targetLayout.parentId] : null;
                          const absX = (parentLayout?.x ?? 0) + (targetLayout?.x ?? 0) + annotation.offset.x;
                          const absY = (parentLayout?.y ?? 0) + (targetLayout?.y ?? 0) + annotation.offset.y;
                          updateAnnotation(annotation.id, { targetId: undefined, targetType: undefined, offset: { x: absX, y: absY } });
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
                      value={annotation.color || (theme === 'dark' ? '#334155' : '#fef3c7')}
                      onChange={(e) => updateAnnotation(annotation.id, { color: e.target.value })}
                      className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                    />
                    <input 
                      value={annotation.color || ''}
                      onChange={(e) => updateAnnotation(annotation.id, { color: e.target.value })}
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
      </div>
    );
  }

  // --- Consumer Editor Rendering ---
  if (consumer) {
    const CONSUMER_COLOR = consumer.appearance?.color || CONSUMER_DEFAULT_COLOR
    return (
      <div
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={{ ...panelStyle, borderTop: `2px solid ${CONSUMER_COLOR}` }}
      >
        {/* Resize Handle */}
        <div onMouseDown={startResizing} style={{ position: 'absolute', top: '-4px', left: 0, right: 0, height: '8px', cursor: 'ns-resize', zIndex: 60 }} />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <FileChartColumnIncreasing size={18} style={{ color: CONSUMER_COLOR }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{consumer.name}</span>
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(124, 58, 237, 0.1)', color: CONSUMER_DEFAULT_COLOR, border: '1px solid rgba(124, 58, 237, 0.2)', textTransform: 'uppercase' }}>
                  CONSUMER
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{consumer.id}</p>
            </div>
          </div>
          <button onClick={() => setIsDetailPanelMinimized(true)} className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}>
            <ChevronDown size={18} />
          </button>
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
                  value={consumer.appearance?.icon || ''}
                  onChange={(e) => updateConsumer(consumer.id, { appearance: { ...consumer.appearance, icon: e.target.value || undefined } })}
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
                    value={consumer.appearance?.color || CONSUMER_DEFAULT_COLOR}
                    onChange={(e) => updateConsumer(consumer.id, { appearance: { ...consumer.appearance, color: e.target.value } })}
                    className="w-8 h-8 p-0 border-none rounded cursor-pointer bg-transparent"
                  />
                  <input
                    value={consumer.appearance?.color || ''}
                    onChange={(e) => updateConsumer(consumer.id, { appearance: { ...consumer.appearance, color: e.target.value || undefined } })}
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
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <LinkIcon size={18} style={{ color: LINEAGE_BASE }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Lineage</span>
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>
                  UPSTREAM
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                {relationship.from.table} → {relationship.to.table}
              </p>
            </div>
          </div>
          <button onClick={() => setIsDetailPanelMinimized(true)} className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}>
            <ChevronDown size={18} />
          </button>
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
      </div>
    )
  }

  if (relationshipData) {
    const { relationship, index } = relationshipData;
    return (
      <div 
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={panelStyle}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          style={{
            position: 'absolute',
            top: '-4px',
            left: 0,
            right: 0,
            height: '8px',
            cursor: 'ns-resize',
            zIndex: 60
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Database size={18} style={{ color: LINEAGE_BASE }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Relationship</span>
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>
                  EDGE
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>
                {relationship.from.table}{relationship.from.column && relationship.from.column.length > 0 ? `.${relationship.from.column.join(', ')}` : ''} → {relationship.to.table}{relationship.to.column && relationship.to.column.length > 0 ? `.${relationship.to.column.join(', ')}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsDetailPanelMinimized(true)} 
              className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}
              title="Minimize Details"
            >
              <ChevronDown size={18} />
            </button>
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
          </div>
        </div>
      </div>
    );
  }
  if (domain) {
    return (
      <div 
        className="shadow-2xl z-50 flex flex-col sidebar-content"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        style={{ ...panelStyle, borderTopColor: domain.color || LINEAGE_BASE }}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          style={{
            position: 'absolute',
            top: '-4px',
            left: 0,
            right: 0,
            height: '8px',
            cursor: 'ns-resize',
            zIndex: 60
          }}
        />
        {/* Panel Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <Database size={18} style={{ color: domain.color || LINEAGE_BASE }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  value={domain.name ?? ''}
                  onChange={(e) => updateDomain(domain.id, { name: e.target.value })}
                  onBlur={(e) => { if (!e.target.value) updateDomain(domain.id, { name: 'UNNAMED_DOMAIN' }) }}
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
                    minWidth: '200px'
                  }}
                  onFocus={(e) => (e.target as HTMLInputElement).style.borderBottom = `1px solid ${LINEAGE_BASE}`}
                />
                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', textTransform: 'uppercase' }}>
                  DOMAIN
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>{domain.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsDetailPanelMinimized(true)} 
              className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}
              title="Minimize Details"
            >
              <ChevronDown size={18} />
            </button>
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
                    const c = domain.color;
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
                    updateDomain(domain.id, { color: `rgba(${r}, ${g}, ${b}, 0.12)` });
                  }}
                  style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                />
                <input 
                  value={domain.color || ''}
                  onChange={(e) => updateDomain(domain.id, { color: e.target.value })}
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
      </div>
    );
  }

  // --- Table Editor Rendering ---
  if (!table) return null;

  const tabs = [
    { id: 'conceptual', label: 'Conceptual', icon: <TagIcon size={14} /> },
    { id: 'logical', label: 'Logical', icon: <Database size={14} /> },
    { id: 'physical', label: 'Physical', icon: <Database size={14} /> },
    { id: 'implementation', label: 'Implementation', icon: <Cpu size={14} /> },
    { id: 'sample', label: 'Sample Data', icon: <TableIcon size={14} /> }
  ]

  const typeConfig = table!.appearance?.type ? TYPE_CONFIG[table!.appearance.type] : null;
  const themeColor = table!.appearance?.color || typeConfig?.color || '#334155';
  const icon = table!.appearance?.icon || typeConfig?.icon || '';
  
  // Advanced Labels
  let typeLabel = typeConfig?.label || '';
  const subType = table!.appearance?.sub_type;
  const scd = table!.appearance?.scd;

  if (table!.appearance?.type === 'fact' && subType) {
    const strategyMap: Record<string, string> = {
      transaction: 'Trans.',
      periodic: 'Periodic',
      accumulating: 'Accum.',
      factless: 'Factless'
    };
    typeLabel = `FACT (${strategyMap[subType] || subType})`;
  } else if (table!.appearance?.type && subType) {
    typeLabel = `${table!.appearance.type.toUpperCase()} (${subType})`;
  } else if (table!.appearance?.type) {
    typeLabel = table!.appearance.type.toUpperCase();
  }

  if (scd) {
    const scdLabel = `SCD ${scd.replace('type', 'T')}`;
    typeLabel = typeLabel ? `${typeLabel} / ${scdLabel}` : scdLabel;
  }

  const handleAddColumn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCol: Column = {
      id: `col_${Date.now()}`,
      logical: { name: 'New Column', type: 'String', description: '' },
      physical: { name: '', type: 'VARCHAR(255)', constraints: [] }
    };
    handleUpdateTable({ columns: [...(table!.columns || []), newCol] });
  };

  const handleRemoveColumn = (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    const newColumns = table!.columns?.filter(col => col.id !== colId) || [];
    handleUpdateTable({ columns: newColumns });
  };

  const handleUpdateLogicalColumn = (colId: string, updates: Partial<NonNullable<Column['logical']>>) => {
    const newColumns: Column[] = table!.columns?.map(col => {
      if (col.id === colId) {
        return { 
          ...col, 
          logical: { 
            name: col.logical?.name || col.id,
            type: col.logical?.type || 'String',
            ...col.logical, 
            ...updates 
          } 
        };
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
      const currentTags = table!.conceptual?.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        handleUpdateTable({
          conceptual: {
            ...table!.conceptual,
            tags: [...currentTags, tagInput.trim()]
          }
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.stopPropagation();
    const currentTags = table!.conceptual?.tags || [];
    handleUpdateTable({
      conceptual: {
        ...table!.conceptual,
        tags: currentTags.filter(t => t !== tagToRemove)
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
      className="shadow-2xl z-50 flex flex-col sidebar-content"
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onPointerDown={stopPropagation}
      style={{ ...panelStyle, borderTopColor: themeColor }}
    >
      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        style={{
          position: 'absolute',
          top: '-4px',
          left: 0,
          right: 0,
          height: '8px',
          cursor: 'ns-resize',
          zIndex: 60
        }}
      />
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
        <div style={{ flex: 1 }}>
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
              value={table!.name ?? ''}
              onChange={(e) => handleUpdateTable({ name: e.target.value })}
              onBlur={(e) => { if (!e.target.value) handleUpdateTable({ name: 'UNNAMED_TABLE' }) }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>ID</span>
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
                  color: 'var(--text-secondary)',
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
        <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
          <select 
            value={table!.appearance?.type || 'fact'}
            onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, type: e.target.value as any } })}
            className={`border rounded text-[10px] px-2 py-1 outline-none transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500' 
                : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400'
            }`}
            title="Table Type"
          >
            <option value="fact">Fact</option>
            <option value="dimension">Dimension</option>
            <option value="mart">Mart</option>
            <option value="table">Table</option>
            <option value="hub">Hub</option>
            <option value="link">Link</option>
            <option value="satellite">Satellite</option>
          </select>

          <select 
            value={table!.appearance?.sub_type || ''}
            onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, sub_type: (e.target.value || undefined) as any } })}
            className={`border rounded text-[10px] px-2 py-1 outline-none transition-colors ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 text-slate-300 focus:ring-blue-500' 
                : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-400 focus:border-blue-400'
            }`}
            title="Table Sub-type"
          >
            <option value="">- Sub-type -</option>
            <option value="transaction">Transaction</option>
            <option value="periodic">Periodic Snapshot</option>
            <option value="accumulating">Accumulating Snapshot</option>
            <option value="factless">Factless</option>
            <option value="conformed">Conformed</option>
            <option value="junk">Junk</option>
            <option value="degenerate">Degenerate</option>
          </select>
          
          <select 
            value={table!.appearance?.scd || ''}
            onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, scd: (e.target.value || undefined) as any } })}
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
              value={table!.appearance?.icon || ''}
              onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, icon: e.target.value || undefined } })}
              placeholder="Icon"
              title="Appearance Icon (emoji)"
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
                onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, color: e.target.value } })}
                style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
              />
              <input
                value={table!.appearance?.color || ''}
                onChange={(e) => handleUpdateTable({ appearance: { ...table!.appearance, color: e.target.value || undefined } })}
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

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsDetailPanelMinimized(true)} 
            className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-400'}`}
            title="Minimize Details"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', padding: '0 20px', borderBottom: '1px solid var(--border-main)', backgroundColor: 'var(--header-bg)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(tab.id);
            }}
            style={{ 
              padding: '12px 0', 
              backgroundColor: 'transparent', 
              border: 'none', 
              borderBottom: activeTab === tab.id ? `2px solid ${LINEAGE_BASE}` : '2px solid transparent',
              color: activeTab === tab.id ? (theme === 'dark' ? '#60a5fa' : '#2563eb') : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
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
                {table!.conceptual?.tags?.map(tag => (
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
                  value={table!.logical_name || ''}
                  onChange={(e) => handleUpdateTable({ logical_name: e.target.value })}
                  placeholder={table!.name}
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
                            onClick={() => handleUpdateLogicalColumn(col.id, { isPrimaryKey: !col.logical?.isPrimaryKey })}
                            title="Primary Key"
                            className={`transition-opacity ${col.logical?.isPrimaryKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >🔑</button>
                          <div className="flex flex-col flex-1 min-w-0">
                            <input
                              value={col.logical?.name ?? ''}
                              onChange={(e) => handleUpdateLogicalColumn(col.id, { name: e.target.value })}
                              onBlur={(e) => { if (!e.target.value) handleUpdateLogicalColumn(col.id, { name: col.id }) }}
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
                            onClick={() => handleUpdateLogicalColumn(col.id, { isForeignKey: !col.logical?.isForeignKey })}
                            title="Foreign Key"
                            className={`transition-opacity text-sm ${col.logical?.isForeignKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >🔩</button>
                          <button
                            onClick={() => handleUpdateLogicalColumn(col.id, { isPartitionKey: !col.logical?.isPartitionKey })}
                            title="Partition Key"
                            className={`transition-opacity text-sm ${col.logical?.isPartitionKey ? 'opacity-100' : 'opacity-20 hover:opacity-50'}`}
                          >📂</button>
                          <select
                            value={col.logical?.additivity || ''}
                            onChange={(e) => handleUpdateLogicalColumn(col.id, { additivity: (e.target.value || undefined) as any })}
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
                          value={col.logical?.type ?? ''}
                          onChange={(e) => handleUpdateLogicalColumn(col.id, { type: e.target.value })}
                          onBlur={(e) => { if (!e.target.value) handleUpdateLogicalColumn(col.id, { type: 'String' }) }}
                          placeholder="Type..."
                          className={`bg-transparent border-none font-mono text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-slate-400 focus:bg-slate-800' : 'text-slate-500 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input 
                          value={col.logical?.description || ''}
                          onChange={(e) => handleUpdateLogicalColumn(col.id, { description: e.target.value })}
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
                  value={table!.physical_name || ''}
                  onChange={(e) => handleUpdateTable({ physical_name: e.target.value })}
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
                        <div className="text-[11px] font-medium truncate" title={col.logical?.name || col.id}>
                          {col.logical?.name || col.id}
                        </div>
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input 
                          value={col.physical?.name ?? ''}
                          onChange={(e) => handleUpdatePhysicalColumn(col.id, { name: e.target.value })}
                          placeholder={col.logical?.name.toLowerCase().replace(/ /g, '_')}
                          className={`bg-transparent border-none font-mono text-[11px] w-full outline-none p-1 rounded transition-colors ${
                            theme === 'dark' ? 'text-blue-400 focus:bg-slate-800' : 'text-blue-600 focus:bg-slate-50'
                          }`}
                        />
                      </td>
                      <td style={{ padding: '6px 16px' }}>
                        <input 
                          value={col.physical?.type ?? ''}
                          onChange={(e) => handleUpdatePhysicalColumn(col.id, { type: e.target.value })}
                          placeholder={col.logical?.type.toUpperCase()}
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
          </div>
        )}
        
        {activeTab === 'implementation' && (
          <div className="flex flex-col gap-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Implementation Hints</h3>
            <p className="text-[10px] text-slate-400 -mt-3">Code generation hints for AI agents (dbt, Spark, SQLMesh, etc.).</p>

            {/* Materialization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Materialization</label>
              <select
                value={table!.implementation?.materialization || ''}
                onChange={(e) => {
                  const val = e.target.value as any
                  const isIncremental = val === 'incremental'
                  const hasPhysicalTable = val === 'table' || val === 'incremental'
                  handleUpdateTable({
                    implementation: {
                      ...table!.implementation,
                      materialization: val || undefined,
                      // incremental固有のフィールドはincremental以外に変更時クリア
                      incremental_strategy: isIncremental ? table!.implementation?.incremental_strategy : undefined,
                      unique_key: isIncremental ? table!.implementation?.unique_key : undefined,
                      // partition_byは物理テーブル(table/incremental)以外に変更時クリア
                      partition_by: hasPhysicalTable ? table!.implementation?.partition_by : undefined,
                    }
                  })
                }}
                className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value=""></option>
                <option value="table">📋 table</option>
                <option value="view">👁 view</option>
                <option value="incremental">⚡ incremental</option>
                <option value="ephemeral">👻 ephemeral</option>
              </select>
            </div>

            {/* Incremental options */}
            {table!.implementation?.materialization === 'incremental' && (
              <div className={`flex flex-col gap-3 p-3 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incremental Settings</div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Strategy</label>
                  <select
                    value={table!.implementation?.incremental_strategy || ''}
                    onChange={(e) => {
                      const val = e.target.value as any
                      handleUpdateTable({
                        implementation: {
                          ...table!.implementation,
                          incremental_strategy: val || undefined
                        }
                      })
                    }}
                    className={`w-full px-3 py-2 rounded border text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value=""></option>
                    <option value="merge">merge</option>
                    <option value="append">append</option>
                    <option value="delete+insert">delete+insert</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-500">Unique Key</label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {(Array.isArray(table!.implementation?.unique_key) ? table!.implementation!.unique_key! : []).map((key) => (
                      <span
                        key={key}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                          theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {key}
                        <button
                          onClick={() => {
                            const updated = (table!.implementation?.unique_key || []).filter(k => k !== key)
                            handleUpdateTable({
                              implementation: {
                                ...table!.implementation,
                                unique_key: updated.length ? updated : undefined
                              }
                            })
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
                      const current = Array.isArray(table!.implementation?.unique_key) ? table!.implementation!.unique_key! : []
                      if (!current.includes(val)) {
                        handleUpdateTable({
                          implementation: {
                            ...table!.implementation,
                            unique_key: [...current, val]
                          }
                        })
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border text-sm font-mono transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="">+ Add column</option>
                    {(table!.columns || [])
                      .filter(col => !(table!.implementation?.unique_key || []).includes(col.physical?.name || col.id))
                      .map(col => {
                        const physName = col.physical?.name || col.id
                        return <option key={col.id} value={physName}>{physName}</option>
                      })}
                  </select>
                </div>
              </div>
            )}

            {/* Partition By — 物理テーブル(table/incremental)のみ表示 */}
            {!['view', 'ephemeral'].includes(table!.implementation?.materialization || '') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Partition By</label>
                <button
                  onClick={() => {
                    const current = Array.isArray(table!.implementation?.partition_by) ? table!.implementation!.partition_by! : []
                    handleUpdateTable({
                      implementation: {
                        ...table!.implementation,
                        partition_by: [...current, { field: '' }]
                      }
                    })
                  }}
                  className="text-[11px] text-blue-500 hover:text-blue-400"
                >+ Add field</button>
              </div>
              {(Array.isArray(table!.implementation?.partition_by) ? table!.implementation!.partition_by! : []).map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={p.field}
                    onChange={(e) => {
                      const updated = [...(table!.implementation?.partition_by || [])]
                      updated[i] = { ...updated[i], field: e.target.value }
                      handleUpdateTable({
                        implementation: { ...table!.implementation, partition_by: updated }
                      })
                    }}
                    className={`flex-1 px-3 py-2 rounded border text-sm font-mono transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value=""></option>
                    {(table!.columns || []).map(col => {
                      const physName = col.physical?.name || col.id
                      return <option key={col.id} value={physName}>{physName}</option>
                    })}
                  </select>
                  <select
                    value={p.granularity || ''}
                    onChange={(e) => {
                      const updated = [...(table!.implementation?.partition_by || [])]
                      updated[i] = { ...updated[i], granularity: (e.target.value as any) || undefined }
                      handleUpdateTable({
                        implementation: { ...table!.implementation, partition_by: updated }
                      })
                    }}
                    className={`px-2 py-2 rounded border text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value=""></option>
                    <option value="day">day</option>
                    <option value="month">month</option>
                    <option value="year">year</option>
                    <option value="hour">hour</option>
                  </select>
                  <button
                    onClick={() => {
                      const updated = (Array.isArray(table!.implementation?.partition_by) ? table!.implementation!.partition_by! : []).filter((_, idx) => idx !== i)
                      handleUpdateTable({
                        implementation: { ...table!.implementation, partition_by: updated.length ? updated : undefined }
                      })
                    }}
                    className="text-slate-400 hover:text-red-400 text-sm px-1"
                  >×</button>
                </div>
              ))}
            </div>
            )}
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
                              <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{col?.logical?.name || col.id}</span>
                              <span className={`text-[10px] font-mono italic ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                {col?.physical?.name || col?.logical?.name?.toLowerCase().replace(/ /g, '_') || col.id}
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
      </div>
    </div>
  )
})

export default DetailPanel
