/**
 * DrawToolbar — Vertical floating toolbar shown only when draw mode is active.
 *
 * Appears to the right of the ActivityBar (left: 56px, absolute positioned).
 * Hidden (returns null) when isDrawMode is false; drawings persist after hiding.
 */

import { Pencil, Eraser, Trash2, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import type { DrawOverlayHandle } from './DrawOverlay'
import type { RefObject } from 'react'

interface DrawToolbarProps {
  tool: 'pen' | 'eraser'
  setTool: (t: 'pen' | 'eraser') => void
  color: string
  setColor: (c: string) => void
  lineWidth: number
  setLineWidth: (w: number) => void
  overlayRef: RefObject<DrawOverlayHandle | null>
}

const DrawToolbar = ({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  overlayRef,
}: DrawToolbarProps) => {
  const { isDrawMode, setIsDrawMode, theme } = useStore(useShallow(s => ({
    isDrawMode: s.isDrawMode,
    setIsDrawMode: s.setIsDrawMode,
    theme: s.theme,
  })))

  if (!isDrawMode) return null

  const base = `w-9 h-9 flex items-center justify-center rounded-lg transition-all`
  const activeBtn = theme === 'dark'
    ? 'bg-blue-600/20 text-blue-400 shadow-inner'
    : 'bg-blue-100 text-blue-600 shadow-inner'
  const inactiveBtn = theme === 'dark'
    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
  const divider = `w-6 h-px mx-auto my-1 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 py-3 px-1.5 rounded-xl border shadow-2xl backdrop-blur-md z-[45] ${
        theme === 'dark'
          ? 'bg-slate-900/90 border-slate-700/60'
          : 'bg-white/90 border-slate-200/80'
      }`}
      style={{ left: '4px' }}
    >
      {/* Pen */}
      <button
        title="Pen"
        onClick={() => setTool('pen')}
        className={`${base} ${tool === 'pen' ? activeBtn : inactiveBtn}`}
      >
        <Pencil size={16} />
      </button>

      {/* Eraser */}
      <button
        title="Eraser"
        onClick={() => setTool('eraser')}
        className={`${base} ${tool === 'eraser' ? activeBtn : inactiveBtn}`}
      >
        <Eraser size={16} />
      </button>

      <div className={divider} />

      {/* Color picker */}
      <label title="Color" className={`${base} ${inactiveBtn} cursor-pointer relative overflow-hidden`}>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <span
          className="w-4 h-4 rounded-full border-2 border-white/40 shadow"
          style={{ backgroundColor: color }}
        />
      </label>

      <div className={divider} />

      {/* Line width */}
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>px</span>
        <input
          type="number"
          min={1}
          max={64}
          value={lineWidth}
          onChange={e => setLineWidth(Math.max(1, Math.min(64, Number(e.target.value))))}
          className={`w-9 h-7 text-center text-xs font-bold rounded-lg border outline-none focus:ring-2 focus:ring-blue-500/40 ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        />
      </div>

      <div className={divider} />

      {/* Clear all */}
      <button
        title="Clear all"
        onClick={() => overlayRef.current?.clearAll()}
        className={`${base} ${theme === 'dark' ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
      >
        <Trash2 size={16} />
      </button>

      {/* Close draw mode */}
      <button
        title="Exit draw mode"
        onClick={() => setIsDrawMode(false)}
        className={`${base} ${theme === 'dark' ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default DrawToolbar
