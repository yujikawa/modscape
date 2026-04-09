import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import { useShallow } from 'zustand/react/shallow'
import CytoscapeCanvas from './components/CytoscapeCanvas'
import DetailPanel from './components/DetailPanel'
import Sidebar from './components/Sidebar/Sidebar'
import RightPanel from './components/RightPanel/RightPanel'
import TerminalBar from './components/TerminalBar'
import SelectionToolbar from './components/SelectionToolbar'
import CanvasViewToolbar from './components/CanvasViewToolbar'
import DrawOverlay, { type DrawOverlayHandle } from './components/DrawOverlay'
import DrawToolbar from './components/DrawToolbar'
import { LINEAGE_BASE } from './lib/colors'

// ── Flow (Canvas area) ────────────────────────────────────────────────
function Flow() {
  const {
    schema,
    error,
    setSelectedTableId,
    selectedTableId,
    selectedEdgeId,
    selectedEdgeKind,
    setSelectedEdgeId,
    selectedAnnotationId,
    setSelectedAnnotationId,
    focusNodeId,
    setFocusNodeId,
    removeNode,
    bulkRemoveTables,
    removeEdge,
    removeAnnotation,
    showAnnotations,
    addTable,
    addDomain,
    addConsumer,
    addAnnotation,
    theme,
    refreshModelData,
    fetchAvailableFiles,
    isModelLoading,
    isCliMode,
    distributeSelectedTables,
    selectedTableIds,
    toggleTableSelection,
    toggleEdgeSelection,
    currentModelSlug,
    setIsDetailPanelOpen,
  } = useStore(useShallow(s => ({
    schema: s.schema,
    error: s.error,
    setSelectedTableId: s.setSelectedTableId,
    selectedTableId: s.selectedTableId,
    selectedEdgeId: s.selectedEdgeId,
    selectedEdgeKind: s.selectedEdgeKind,
    setSelectedEdgeId: s.setSelectedEdgeId,
    selectedAnnotationId: s.selectedAnnotationId,
    setSelectedAnnotationId: s.setSelectedAnnotationId,
    focusNodeId: s.focusNodeId,
    setFocusNodeId: s.setFocusNodeId,
    removeNode: s.removeNode,
    bulkRemoveTables: s.bulkRemoveTables,
    removeEdge: s.removeEdge,
    removeAnnotation: s.removeAnnotation,
    showAnnotations: s.showAnnotations,
    addTable: s.addTable,
    addDomain: s.addDomain,
    addConsumer: s.addConsumer,
    addAnnotation: s.addAnnotation,
    theme: s.theme,
    refreshModelData: s.refreshModelData,
    fetchAvailableFiles: s.fetchAvailableFiles,
    isModelLoading: s.isModelLoading,
    isCliMode: s.isCliMode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    distributeSelectedTables: (s as any).distributeSelectedTables as ((dir: string) => void) | undefined,
    selectedTableIds: s.selectedTableIds,
    toggleTableSelection: s.toggleTableSelection,
    toggleEdgeSelection: s.toggleEdgeSelection,
    currentModelSlug: s.currentModelSlug,
    setIsDetailPanelOpen: s.setIsDetailPanelOpen,
  })))

  // Draw mode state
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen')
  const [drawColor, setDrawColor] = useState('#ef4444')
  const [drawLineWidth, setDrawLineWidth] = useState(4)
  const drawOverlayRef = useRef<DrawOverlayHandle | null>(null)

  // Callbacks exposed by CytoscapeCanvas
  const fitViewFnRef = useRef<(() => void) | null>(null)
  const focusNodeFnRef = useRef<((id: string) => void) | null>(null)
  const autoLayoutFnRef = useRef<(() => void) | null>(null)

  const handleFitView = useCallback((fn: () => void) => {
    fitViewFnRef.current = fn
    // On initial load, schema may already be set before CytoscapeCanvas mounts
    // (e.g. no ?model= param in URL). Trigger fitView now that the canvas is ready.
    if (useStore.getState().schema) {
      setTimeout(() => fn(), 100)
    }
  }, [])
  const handleFocusNode = useCallback((fn: (id: string) => void) => {
    focusNodeFnRef.current = fn
  }, [])
  const handleAutoLayout = useCallback((fn: () => void) => {
    autoLayoutFnRef.current = fn
  }, [])

  // Fit view whenever the active model changes
  useEffect(() => {
    if (!currentModelSlug) return
    const timer = setTimeout(() => fitViewFnRef.current?.(), 300)
    return () => clearTimeout(timer)
  }, [currentModelSlug])

  // WebSocket live sync
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef<number>(1000)

  useEffect(() => {
    if (!isCliMode) return

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}`)

      ws.onopen = () => {
        reconnectDelayRef.current = 1000
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'update') refreshModelData()
          else if (data.type === 'files_changed') fetchAvailableFiles()
        } catch (_) {}
      }
      ws.onclose = () => {
        wsRef.current = null
        if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 30000)
          connect()
        }, reconnectDelayRef.current)
      }
      ws.onerror = () => ws.close()
      wsRef.current = ws
    }

    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current)
    }
  }, [isCliMode, refreshModelData, fetchAvailableFiles])

  // Handle focusNodeId → focus in canvas
  useEffect(() => {
    if (focusNodeId && focusNodeFnRef.current) {
      focusNodeFnRef.current(focusNodeId)
      setFocusNodeId(null)
    }
  }, [focusNodeId, setFocusNodeId])

  // Expose fit-view and auto-layout triggers (e.g. from ActivityBar)
  useEffect(() => {
    ;(window as any).__modscapeFitView = () => fitViewFnRef.current?.()
    ;(window as any).__modscapeAutoLayout = () => autoLayoutFnRef.current?.()
  }, [])

  // Keyboard shortcuts (canvas-agnostic: Escape, K, /, L, V, H, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (useStore.getState().isDrawMode) { useStore.getState().setIsDrawMode(false); return }
        if (useStore.getState().connectMode) { useStore.getState().setConnectMode(null); return }
        useStore.getState().setPathFinderResult(null)
        setSelectedTableId(null)
        setSelectedEdgeId(null)
        setSelectedAnnotationId(null)
        setIsDetailPanelOpen(false)
        useStore.getState().setSelectedTableIds([])
        return
      }

      const activeEl = document.activeElement
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable ||
        activeEl?.closest('.cm-editor') ||
        activeEl?.closest('.sidebar-content')
      if (isTyping || e.repeat) return

      // Undo / Redo (Ctrl+Z / Cmd+Z, Ctrl+Shift+Z / Cmd+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          useStore.getState().redo()
        } else {
          useStore.getState().undo()
        }
        return
      }

      const key = e.key.toLowerCase()

      if (key === 'p') {
        e.preventDefault()
        useStore.getState().setIsDrawMode(!useStore.getState().isDrawMode)
        return
      }

      if (key === 'f') {
        e.preventDefault()
        fitViewFnRef.current?.()
        return
      }

      if (key === '/' ) {
        e.preventDefault()
        useStore.getState().setIsRightPanelOpen(true)
        useStore.getState().setActiveRightPanelTab('search')
        return
      }

      if (key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        useStore.getState().setIsTerminalOpen(!useStore.getState().isTerminalOpen)
        return
      }


      if ((key === 'v' || key === 'h') && selectedTableIds.length > 1) {
        e.preventDefault()
        distributeSelectedTables?.(key === 'v' ? 'vertical' : 'horizontal')
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Multi-select delete (highest priority — lasso sets selectedTableIds but not selectedTableId)
        if (selectedTableIds.length > 1) {
          bulkRemoveTables(selectedTableIds)
          useStore.getState().setSelectedTableIds([])
          return
        }
        // Edge delete (no table/annotation selected)
        if (!selectedTableId && !selectedAnnotationId) {
          if (selectedEdgeId) {
            if (selectedEdgeKind === 'lineage') {
              const lineageEdge = schema?.lineage?.find(e => e.id === selectedEdgeId)
              if (lineageEdge) removeEdge(lineageEdge.from, lineageEdge.to, 'lineage')
            } else if (selectedEdgeKind === 'er') {
              const rel = schema?.relationships?.find(r => r.id === selectedEdgeId)
              if (rel) removeEdge(rel.from.table, rel.to.table, 'er')
            }
            setSelectedEdgeId(null)
          }
          return
        }
      }

      if ((e.key === 'Backspace' || e.key === 'Delete') && (selectedTableId || selectedAnnotationId)) {
        if (selectedAnnotationId) {
          removeAnnotation(selectedAnnotationId)
          setSelectedAnnotationId(null)
        } else if (selectedTableId) {
          removeNode(selectedTableId)
          setSelectedTableId(null)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    setSelectedTableId, setSelectedEdgeId, setSelectedAnnotationId, setIsDetailPanelOpen,
    selectedTableId, selectedEdgeId, selectedEdgeKind, selectedAnnotationId,
    selectedTableIds, distributeSelectedTables,
    schema, removeNode, bulkRemoveTables, removeEdge, removeAnnotation,
  ])

  // ── CytoscapeCanvas callbacks ─────────────────────────────────────
  const handleNodeClick = useCallback((id: string) => {
    toggleTableSelection(id)
  }, [toggleTableSelection])

  const handleEdgeClick = useCallback((edgeData: {
    id: string; kind: string; source: string; target: string;
    fromColumn?: string[] | null; toColumn?: string[] | null; relType?: string
  }) => {
    toggleEdgeSelection(edgeData.id, edgeData.kind as 'lineage' | 'er')
  }, [toggleEdgeSelection])

  const handlePaneClick = useCallback(() => {
    setSelectedTableId(null)
    setSelectedEdgeId(null)
    setSelectedAnnotationId(null)
    setIsDetailPanelOpen(false)
    useStore.getState().setSelectedTableIds([])
  }, [setSelectedTableId, setSelectedEdgeId, setSelectedAnnotationId, setIsDetailPanelOpen])

  const handleAnnotationClick = useCallback((id: string) => {
    setSelectedTableId(null)
    setSelectedEdgeId(null)
    setSelectedAnnotationId(id)
  }, [setSelectedTableId, setSelectedEdgeId, setSelectedAnnotationId])

  const handleDomainClick = useCallback((id: string) => {
    setSelectedAnnotationId(null)
    setSelectedEdgeId(null)
    toggleTableSelection(id)
  }, [setSelectedAnnotationId, setSelectedEdgeId, toggleTableSelection])

  const handleEdgeCreated = useCallback((kind: 'lineage' | 'er', sourceId: string, targetId: string) => {
    if (kind === 'lineage') {
      useStore.getState().addLineage(sourceId, targetId)
    } else {
      useStore.getState().addRelationship(sourceId, targetId)
    }
    // Stay in connect mode so multiple edges can be added consecutively
  }, [])

  const handleAddTable = useCallback((x: number, y: number) => {
    addTable(x, y)
  }, [addTable])

  const handleAddDomain = useCallback((x: number, y: number) => {
    addDomain(x, y)
  }, [addDomain])

  const handleAddConsumer = useCallback((x: number, y: number) => {
    addConsumer(x, y)
  }, [addConsumer])

  const handleAddAnnotation = useCallback((x: number, y: number) => {
    if (!showAnnotations) useStore.getState().setShowAnnotations(true)
    addAnnotation({ x, y })
  }, [addAnnotation, showAnnotations])

  return (
    <div className="flex-1 relative h-full flex flex-col overflow-hidden">
      <div className="flex-1 relative overflow-hidden">
        <SelectionToolbar />
        <TerminalBar />
        <CanvasViewToolbar />

        {isModelLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, borderTopColor: theme === 'dark' ? '#60a5fa' : LINEAGE_BASE, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Loading model…</span>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 32 }}>
            <div style={{
              maxWidth: 560, width: '100%', borderRadius: 12, border: `1px solid ${theme === 'dark' ? '#7f1d1d' : '#fecaca'}`,
              backgroundColor: theme === 'dark' ? '#1c0a0a' : '#fff5f5', padding: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: theme === 'dark' ? '#f87171' : '#dc2626' }}>YAML Parse Error</span>
              </div>
              <pre style={{
                fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                color: theme === 'dark' ? '#fca5a5' : '#b91c1c',
                backgroundColor: theme === 'dark' ? '#2d0f0f' : '#fee2e2',
                borderRadius: 8, padding: '12px 16px', margin: 0,
              }}>{error}</pre>
              <p style={{ marginTop: 12, fontSize: 11, color: theme === 'dark' ? '#6b7280' : '#9ca3af' }}>
                Fix the YAML file and save — the canvas will reload automatically.
              </p>
            </div>
          </div>
        )}

        <DrawOverlay
          ref={drawOverlayRef}
          tool={drawTool}
          color={drawColor}
          lineWidth={drawLineWidth}
        />
        <DrawToolbar
          tool={drawTool}
          setTool={setDrawTool}
          color={drawColor}
          setColor={setDrawColor}
          lineWidth={drawLineWidth}
          setLineWidth={setDrawLineWidth}
          overlayRef={drawOverlayRef}
        />

        {!error && schema && (
          <CytoscapeCanvas
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            onAnnotationClick={handleAnnotationClick}
            onDomainClick={handleDomainClick}
            onAddTableAt={handleAddTable}
            onAddDomainAt={handleAddDomain}
            onAddConsumerAt={handleAddConsumer}
            onAddAnnotationAt={handleAddAnnotation}
            onFitView={handleFitView}
            onFocusNode={handleFocusNode}
            onEdgeCreated={handleEdgeCreated}
            onAutoLayout={handleAutoLayout}
          />
        )}
        <DetailPanel />
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────
function App() {
  const [mounted, setMounted] = useState(false)
  const {
    isCliMode,
    fetchAvailableFiles,
    setCurrentModel,
    setSchema,
    setError,
    theme,
  } = useStore()

  const hasInjectedData = !!(window as any).__MODSCAPE_DATA__

  useEffect(() => {
    if (isCliMode) {
      fetchAvailableFiles().then(() => {
        const params = new URLSearchParams(window.location.search)
        const modelSlug = params.get('model')
        if (modelSlug) setCurrentModel(modelSlug)
        else fetch('/api/model').then(async res => {
          if (!res.ok) { setError(await res.text()); return }
          setSchema(await res.json())
        })
      })
      if ((import.meta as any).hot) {
        ;(import.meta as any).hot.on('model-update', (data: any) => setSchema(data))
      }
      setMounted(true)
      return
    }
    if (hasInjectedData) {
      const data = (window as any).__MODSCAPE_DATA__
      if (data?.models?.length > 0) {
        fetchAvailableFiles().then(() => {
          const params = new URLSearchParams(window.location.search)
          const modelSlug = params.get('model')
          if (modelSlug) setCurrentModel(modelSlug)
          else {
            setSchema(data.models[0].schema)
            if (data.models[0].slug) setCurrentModel(data.models[0].slug)
          }
        })
      }
    }
    setMounted(true)
  }, [isCliMode, hasInjectedData, fetchAvailableFiles, setCurrentModel, setSchema])

  if (!mounted) return null

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Sidebar />
      <Flow />
      <RightPanel />
    </div>
  )
}

export default App
