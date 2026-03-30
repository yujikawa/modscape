/**
 * DrawOverlay — Full-canvas transparent drawing layer.
 *
 * Architecture:
 * - Sits on top of CytoscapeCanvas via position:absolute inset-0
 * - pointer-events:all when draw mode is active, none otherwise (pass-through)
 * - Drawings persist across mode toggles; only cleared by the "clear all" action
 * - Strokes are stored as path data arrays so they can be redrawn on canvas resize
 * - Eraser uses destination-out composite operation
 *
 * React 19: ref is accepted as a regular prop (no forwardRef needed)
 */

import { useRef, useEffect, useCallback, useImperativeHandle, type Ref } from 'react'
import { useStore } from '../store/useStore'

// ── Types ──────────────────────────────────────────────────────────────────

export interface DrawOverlayHandle {
  clearAll: () => void
}

interface StrokePoint {
  x: number
  y: number
}

interface Stroke {
  tool: 'pen' | 'eraser'
  color: string
  lineWidth: number
  points: StrokePoint[]
}

interface DrawOverlayProps {
  tool: 'pen' | 'eraser'
  color: string
  lineWidth: number
  ref?: Ref<DrawOverlayHandle>
}

// ── Helper: redraw all strokes onto a context ─────────────────────────────

function redrawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = stroke.tool === 'eraser' ? stroke.lineWidth * 4 : stroke.lineWidth
    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = stroke.color
    }
    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const mx = (stroke.points[i].x + stroke.points[i + 1].x) / 2
      const my = (stroke.points[i].y + stroke.points[i + 1].y) / 2
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, mx, my)
    }
    const last = stroke.points[stroke.points.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
    ctx.restore()
  }
}

// ── Component ─────────────────────────────────────────────────────────────

function DrawOverlay({ tool, color, lineWidth, ref }: DrawOverlayProps) {
  const isDrawMode = useStore(s => s.isDrawMode)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)
  const isDrawingRef = useRef(false)

  // Expose clearAll to parent via ref
  useImperativeHandle(ref, () => ({
    clearAll: () => {
      strokesRef.current = []
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }))

  // Size canvas to match container, accounting for devicePixelRatio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const { offsetWidth, offsetHeight } = canvas
    canvas.width = offsetWidth * dpr
    canvas.height = offsetHeight * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      redrawStrokes(ctx, strokesRef.current)
    }
  }, [])

  // Watch container size changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [resizeCanvas])

  // Expose canvas element globally so the export function can composite it
  useEffect(() => {
    ;(window as any).__modscapeDrawCanvas = canvasRef.current
    return () => { ;(window as any).__modscapeDrawCanvas = null }
  }, [])

  // Convert mouse event coords to logical canvas coords
  const getPos = (e: MouseEvent): StrokePoint => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // Keep latest tool/color/lineWidth in refs so event handlers always see current values
  const toolRef = useRef(tool)
  const colorRef = useRef(color)
  const lineWidthRef = useRef(lineWidth)
  useEffect(() => { toolRef.current = tool }, [tool])
  useEffect(() => { colorRef.current = color }, [color])
  useEffect(() => { lineWidthRef.current = lineWidth }, [lineWidth])

  // Mouse event handlers — defined once, read from refs for current values
  const handleMouseDown = useCallback((e: MouseEvent) => {
    isDrawingRef.current = true
    const pos = getPos(e)
    currentStrokeRef.current = {
      tool: toolRef.current,
      color: colorRef.current,
      lineWidth: lineWidthRef.current,
      points: [pos],
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    currentStrokeRef.current.points.push(pos)
    const pts = currentStrokeRef.current.points

    // Incremental draw: only the last segment
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = currentStrokeRef.current.lineWidth
    if (currentStrokeRef.current.tool === 'eraser') {
      ctx.lineWidth = currentStrokeRef.current.lineWidth * 4
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = currentStrokeRef.current.color
    }
    ctx.beginPath()
    if (pts.length >= 3) {
      const prev = pts[pts.length - 2]
      const curr = pts[pts.length - 1]
      const prevPrev = pts[pts.length - 3]
      const mx = (prevPrev.x + prev.x) / 2
      const my = (prevPrev.y + prev.y) / 2
      ctx.moveTo(mx, my)
      ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
    } else if (pts.length === 2) {
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
    }
    ctx.stroke()
    ctx.restore()
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    if (currentStrokeRef.current.points.length > 1) {
      strokesRef.current.push(currentStrokeRef.current)
    }
    currentStrokeRef.current = null
    isDrawingRef.current = false
  }, [])

  // Eraser cursor: a circle matching the effective eraser size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!isDrawMode || tool !== 'eraser') {
      canvas.style.cursor = isDrawMode ? 'crosshair' : 'default'
      return
    }
    const eraserSize = lineWidth * 4
    const pad = 2
    const size = Math.max(eraserSize + pad * 2, 8)
    const cur = document.createElement('canvas')
    cur.width = size
    cur.height = size
    const ctx = cur.getContext('2d')!
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, eraserSize / 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(100,100,100,0.8)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    canvas.style.cursor = `url(${cur.toDataURL()}) ${size / 2} ${size / 2}, cell`
  }, [isDrawMode, tool, lineWidth])

  // Attach/detach mouse listeners.
  // mousedown on canvas to start strokes; mousemove/mouseup on window so that
  // drawing continues even when the pointer passes over DOM nodes (domain headers etc.)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawMode ? 'all' : 'none',
        cursor: isDrawMode && tool !== 'eraser' ? 'crosshair' : 'default',
        zIndex: 15,
      }}
    />
  )
}

export default DrawOverlay
