import { useEffect, useRef, useState, useCallback } from 'react'
import { GripHorizontal, X, Copy, Check } from 'lucide-react'
import { useStore } from '../store/useStore'

interface SpecTab {
  id: string
  label: string
  file: string
  available: boolean
}

interface DesignTable {
  id: string
  file: string
}

const DEFAULT_W = 760
const DEFAULT_H = 560
const MIN_W = 400
const MIN_H = 300

export default function SpecPanel() {
  const specName: string = (window as any).MODSCAPE_SPEC_NAME ?? ''
  const theme = useStore(s => s.theme)
  const isSpecPanelOpen = useStore(s => s.isSpecPanelOpen)
  const setIsSpecPanelOpen = useStore(s => s.setIsSpecPanelOpen)

  const [tabs, setTabs] = useState<SpecTab[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [designTables, setDesignTables] = useState<DesignTable[]>([])
  const [activeDesignTable, setActiveDesignTable] = useState<string>('overview')
  const [copied, setCopied] = useState(false)

  const copySpecName = useCallback(() => {
    navigator.clipboard.writeText(specName).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [specName])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Floating window state
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const [initialized, setInitialized] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  // Initialize position centered when first opened
  useEffect(() => {
    if (isSpecPanelOpen && !initialized) {
      setPos({
        x: Math.max(0, Math.round((window.innerWidth - DEFAULT_W) / 2)),
        y: Math.max(0, Math.round((window.innerHeight - DEFAULT_H) / 2)),
      })
      setInitialized(true)
    }
  }, [isSpecPanelOpen, initialized])

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

  useEffect(() => {
    fetch('/api/spec/tabs')
      .then(r => r.json())
      .then((data: SpecTab[]) => {
        setTabs(data)
        const first = data.find(t => t.available)
        if (first && !activeTab) setActiveTab(first.id)
      })
      .catch(() => {})
  }, [specName])

  useEffect(() => {
    if (activeTab !== 'design') return
    fetch('/api/spec/design-tables')
      .then(r => r.json())
      .then((data: DesignTable[]) => setDesignTables(data))
      .catch(() => {})
  }, [activeTab])

  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}`)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'spec-update') {
          if (iframeRef.current) iframeRef.current.src = iframeRef.current.src
          fetch('/api/spec/tabs')
            .then(r => r.json())
            .then((data: SpecTab[]) => setTabs(data))
            .catch(() => {})
          if (activeTab === 'design') {
            fetch('/api/spec/design-tables')
              .then(r => r.json())
              .then((data: DesignTable[]) => setDesignTables(data))
              .catch(() => {})
          }
        }
      } catch {}
    }
    return () => ws.close()
  }, [])

  if (!isSpecPanelOpen) return null

  const activeTabData = tabs.find(t => t.id === activeTab)
  const iframeSrc = activeTabData?.available
    ? activeTab === 'design' && activeDesignTable !== 'overview'
      ? `/api/spec/design/${activeDesignTable}?theme=${theme}`
      : `/api/spec/${activeTabData.file}?theme=${theme}`
    : null

  const isDark = theme === 'dark'
  const bg = isDark ? '#0f172a' : '#ffffff'
  const border = isDark ? '#1e293b' : '#e2e8f0'
  const tabBarBg = isDark ? '#0f172a' : '#f8fafc'
  const tabBorderB = isDark ? '#1e293b' : '#e2e8f0'

  // Design tab sidebar items
  const showDesignSidebar = activeTab === 'design' && designTables.length > 0
  const sidebarItems = showDesignSidebar
    ? [{ id: 'overview', label: 'Overview' }, ...designTables.map(t => ({ id: t.id, label: t.id }))]
    : []

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        boxShadow: isDark
          ? '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 8px 32px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Title / drag bar */}
      <div
        onMouseDown={onDragStart}
        style={{
          height: 34,
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px 0 12px',
          cursor: 'grab',
          flexShrink: 0,
          borderRadius: '9px 9px 0 0',
          borderBottom: `1px solid ${border}`,
          gap: 8,
        }}
      >
        <GripHorizontal size={13} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>
          spec: {specName}
        </span>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={copySpecName}
          title="Copy spec name"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', borderRadius: 4 }}
        >
          {copied ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
        </button>
        <div style={{ flex: 1 }} />
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setIsSpecPanelOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', borderRadius: 4 }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: tabBarBg,
        borderBottom: `1px solid ${tabBorderB}`,
        padding: '0 12px',
        flexShrink: 0,
        gap: 2,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => tab.available && setActiveTab(tab.id)}
            disabled={!tab.available}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
              color: !tab.available
                ? (isDark ? '#475569' : '#cbd5e1')
                : activeTab === tab.id
                  ? '#3b82f6'
                  : (isDark ? '#94a3b8' : '#64748b'),
              cursor: tab.available ? 'pointer' : 'not-allowed',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area: sidebar + iframe for Design tab, full iframe otherwise */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Design sidebar — shown only when Design tab is active and per-table files exist */}
        {showDesignSidebar && (
          <div style={{
            width: 150,
            flexShrink: 0,
            overflowY: 'auto',
            borderRight: `1px solid ${border}`,
            backgroundColor: isDark ? '#0a1628' : '#f8fafc',
            paddingTop: 4,
            paddingBottom: 4,
          }}>
            {sidebarItems.map((item, idx) => {
              const isActive = activeDesignTable === item.id
              const isDivider = idx === 1
              return (
                <div key={item.id}>
                  {isDivider && (
                    <div style={{ height: 1, backgroundColor: border, margin: '4px 0' }} />
                  )}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => setActiveDesignTable(item.id)}
                    title={item.label}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: isActive ? 600 : 400,
                      background: isActive
                        ? (isDark ? '#1e3a5f' : '#eff6ff')
                        : 'none',
                      border: 'none',
                      borderLeft: `2px solid ${isActive ? '#3b82f6' : 'transparent'}`,
                      color: isActive
                        ? '#3b82f6'
                        : (isDark ? '#64748b' : '#94a3b8'),
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'color 0.15s, background 0.15s',
                      boxSizing: 'border-box',
                    }}
                  >
                    {item.label}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* iframe */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {iframeSrc ? (
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={activeTab ?? 'spec'}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 13, color: isDark ? '#475569' : '#94a3b8' }}>
              {tabs.length === 0
                ? 'HTMLファイルが見つかりません。/modscape:spec:requirements を実行してください。'
                : 'このタブのファイルはまだ生成されていません。'}
            </div>
          )}
        </div>
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          zIndex: 10,
        }}
      />
    </div>
  )
}
