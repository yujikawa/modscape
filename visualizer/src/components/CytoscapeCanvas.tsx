/**
 * CytoscapeCanvas — Canvas-based graph renderer replacing React Flow.
 *
 * Architecture:
 * - Cytoscape.js renders edges (ER + lineage) on HTML5 Canvas
 * - cytoscape-dom-node plugin positions DOM containers for each node
 * - React portals render TableCard inside those DOM containers
 * - Domain backgrounds are positioned divs updated on cy 'pan zoom' events
 * - Annotations are overlay divs updated on 'pan zoom' events
 */

import { useEffect, useRef, useCallback } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useStore } from '../store/useStore'
import { useShallow } from 'zustand/react/shallow'
import TableCard from './TableCard'
import ConsumerCard from './ConsumerCard'
import { yamlToElements } from '../lib/cytoscapeElements'
import { ER_HIGHLIGHT, LINEAGE_BASE, LINEAGE_HIGHLIGHT } from '../lib/colors'
import type { Schema } from '../types/schema'

// ── Cytoscape imports — use dynamic cast to avoid verbatimModuleSyntax conflict ─
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CyInstance = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CyFactory = ((opts?: unknown) => CyInstance) & { use: (ext: unknown) => void }

// Dynamic imports bypass verbatimModuleSyntax restrictions on export= modules
import cytoscapeModule from 'cytoscape'
import cytoscapeDagreModule from 'cytoscape-dagre'
import cytoscapeDomNodeModule from 'cytoscape-dom-node'
const cytoscape = cytoscapeModule as unknown as CyFactory

// Register extensions once at module load
cytoscape.use(cytoscapeDagreModule as unknown as (cy: unknown) => void)
cytoscape.use(cytoscapeDomNodeModule as unknown as (cy: unknown) => void)

// Zoom below this threshold uses native Cytoscape canvas rendering (no React DOM)
const LOW_ZOOM_THRESHOLD = 0.12
const PAD = 24

// ── Hit-test helper ─────────────────────────────────────────────────────
// Returns true if (clientX, clientY) falls within a card's screen bounds.
// cytoscape-dom-node centers containers on the node position, so bounds are
// ±(offsetWidth/2) horizontally and ±(offsetHeight/2) vertically.
function hitTestCard(
  clientX: number, clientY: number,
  domCont: HTMLDivElement,
  nodePos: { x: number; y: number },
  zoom: number,
  pan: { x: number; y: number },
  containerRect: DOMRect,
): boolean {
  const snx = containerRect.left + nodePos.x * zoom + pan.x
  const sny = containerRect.top  + nodePos.y * zoom + pan.y
  const hw = domCont.offsetWidth  > 0 ? domCont.offsetWidth  / 2 : 140
  const hh = domCont.offsetHeight > 0 ? domCont.offsetHeight / 2 : 80
  return (
    clientX >= snx - hw * zoom && clientX <= snx + hw * zoom &&
    clientY >= sny - hh * zoom && clientY <= sny + hh * zoom
  )
}

// ── Cytoscape base stylesheet ──────────────────────────────────────────
function buildCytoscapeStyle(theme: 'dark' | 'light', lowZoom = false) {
  const erStroke = theme === 'dark' ? '#94a3b8' : '#64748b'
  return [
    {
      selector: 'node',
      style: {
        shape: 'rectangle',
        // Low-zoom: show native colored boxes; normal: transparent (DOM card renders)
        'background-opacity': lowZoom ? 0.85 : 0,
        'background-color': lowZoom ? 'data(typeColor)' : '#000',
        'border-width': lowZoom ? 1 : 0,
        'border-color': lowZoom ? (theme === 'dark' ? '#ffffff33' : '#00000022') : '#000',
        width: 280,
        height: 160,
      },
    },
    {
      selector: 'edge.er-edge',
      style: {
        'curve-style': 'round-taxi',
        'line-color': erStroke,
        // ER edges: no arrow (relationship lines, not directional flow)
        'target-arrow-shape': 'none',
        'source-arrow-shape': 'none',
        width: 2,
        'source-label': 'data(sourceLabel)',
        'target-label': 'data(targetLabel)',
        'font-size': 11,
        'font-weight': 800,
        color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
        'source-text-offset': 28,
        'target-text-offset': 28,
        'text-background-color': theme === 'dark' ? '#1e293b' : '#e2e8f0',
        'text-background-opacity': 1,
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
      },
    },
    // ER edge: connected to selected node
    {
      selector: 'edge.er-edge.highlighted',
      style: {
        'line-color': ER_HIGHLIGHT,
        width: 3,
        'overlay-color': ER_HIGHLIGHT,
        'overlay-opacity': 0.15,
        'overlay-padding': 4,
      },
    },
    // ER edge: edge itself selected
    {
      selector: 'edge.er-edge:selected',
      style: {
        'line-color': ER_HIGHLIGHT,
        width: 4,
        'overlay-color': ER_HIGHLIGHT,
        'overlay-opacity': 0.25,
        'overlay-padding': 6,
      },
    },
    {
      selector: 'edge.er-edge.path-highlighted',
      style: {
        'line-color': ER_HIGHLIGHT,
        width: 6,
        'overlay-color': ER_HIGHLIGHT,
        'overlay-opacity': 0.15,
        'overlay-padding': 4,
      },
    },
    {
      selector: 'edge.lineage-edge',
      style: {
        'curve-style': 'bezier',
        'line-style': 'dashed',
        'line-color': LINEAGE_BASE,
        'target-arrow-color': LINEAGE_BASE,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.2,
        width: 2,
      },
    },
    // Lineage edge with description: show ⓘ indicator
    {
      selector: 'edge.lineage-edge[?description]',
      style: {
        label: 'ⓘ',
        'font-size': 16,
        'font-weight': 700,
        color: theme === 'dark' ? '#93c5fd' : '#2563eb',
      },
    },
    // Lineage edge: connected to selected node
    {
      selector: 'edge.lineage-edge.highlighted',
      style: {
        'line-color': LINEAGE_HIGHLIGHT,
        'target-arrow-color': LINEAGE_HIGHLIGHT,
        width: 3,
        'overlay-color': LINEAGE_HIGHLIGHT,
        'overlay-opacity': 0.15,
        'overlay-padding': 4,
      },
    },
    // Lineage edge: edge itself selected
    {
      selector: 'edge.lineage-edge:selected',
      style: {
        'line-color': LINEAGE_HIGHLIGHT,
        'target-arrow-color': LINEAGE_HIGHLIGHT,
        width: 4,
        'overlay-color': LINEAGE_HIGHLIGHT,
        'overlay-opacity': 0.2,
        'overlay-padding': 6,
      },
    },
    {
      selector: 'edge.lineage-edge.path-highlighted',
      style: { width: 6, 'line-color': LINEAGE_HIGHLIGHT, 'target-arrow-color': LINEAGE_HIGHLIGHT },
    },
    {
      selector: 'edge.dimmed',
      style: { opacity: 0.1 },
    },
    {
      selector: 'node.dimmed',
      style: { opacity: 0.15 },
    },
    // Consumer nodes (DOM overlay, transparent at normal zoom like table nodes)
    {
      selector: 'node.consumer-node',
      style: {
        shape: 'round-rectangle',
        'background-opacity': lowZoom ? 0.85 : 0,
        'background-color': lowZoom ? 'data(typeColor)' : '#000',
        'border-width': lowZoom ? 2 : 0,
        'border-color': lowZoom ? 'data(typeColor)' : '#000',
        width: 220,
        height: 70,
        ...(lowZoom ? {
          label: 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          color: '#ffffff',
          'font-size': 11,
          'font-weight': 'bold',
          'text-wrap': 'ellipsis',
          'text-max-width': '200px',
        } : {}),
      },
    },
  ]
}

// ── Domain bounding box helper ──────────────────────────────────────────
// Calculates the bounding box of a set of nodes, accounting for their actual
// DOM rendered height (since Cytoscape only knows the static stylesheet size).
function getDomainBB(memberNodes: any, _zoom: number, schema: Schema) {
  if (memberNodes.length === 0) return { x1: 0, y1: 0, x2: 0, y2: 0, w: 0, h: 0 }

  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity

  memberNodes.forEach((n: CyInstance) => {
    const pos: { x: number; y: number } = n.position()
    const domEl: HTMLElement | undefined = n.data('dom')
    const tableId = n.id() as string
    const tableLayout = schema.layout?.[tableId]
    
    // Use the actual DOM dimensions if available, otherwise fallback to stored layout or defaults.
    // This prevents the domain from snapping to default sizes when nodes are off-screen (0 width).
    const w = (domEl && domEl.offsetWidth > 0) ? domEl.offsetWidth : (tableLayout?.width ?? 280)
    const h = (domEl && domEl.offsetHeight > 0) ? domEl.offsetHeight : (tableLayout?.height ?? 160)
    
    const hw = w / 2
    const hh = h / 2
    
    if (pos.x - hw < x1) x1 = pos.x - hw
    if (pos.x + hw > x2) x2 = pos.x + hw
    if (pos.y - hh < y1) y1 = pos.y - hh
    if (pos.y + hh > y2) y2 = pos.y + hh
  })

  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 }
}

// ── Domain background renderer (visual only, no interaction) ───────────
function renderDomainBackgrounds(
  cy: CyInstance,
  schema: Schema,
  container: HTMLDivElement
) {
  if (!schema.domains?.length) {
    container.innerHTML = ''
    return
  }

  const zoom: number = cy.zoom()
  const pan: { x: number; y: number } = cy.pan()

  // Build map of existing background divs by domain id
  const existing = new Map<string, HTMLDivElement>()
  container.querySelectorAll<HTMLDivElement>('[data-domain-bg]').forEach(el => {
    existing.set(el.dataset.domainBg!, el)
  })

  const active = new Set<string>()

    schema.domains.forEach((domain) => {
    active.add(domain.id)
    const memberNodes = cy.nodes().filter((n: CyInstance) => domain.members.includes(n.id()))
    const layoutEntry = schema.layout?.[domain.id]
    const headerH = Math.max(24, 32 * zoom)
    const TOP_PAD = PAD + (headerH / zoom)

    let sx: number, sy: number, sw: number, sh: number
    if (memberNodes.length === 0) {
      const cx = layoutEntry?.x ?? 0
      const cy2 = layoutEntry?.y ?? 0
      const lw = layoutEntry?.width ?? 300
      const lh = layoutEntry?.height ?? 120
      sx = (cx - PAD) * zoom + pan.x
      sy = (cy2 - TOP_PAD) * zoom + pan.y
      sw = (lw + PAD * 2) * zoom
      sh = (lh + PAD + TOP_PAD) * zoom
    } else {
      const bb = getDomainBB(memberNodes, zoom, schema)
      const finalW = bb.w
      const finalH = bb.h
      const cx = bb.x1 + bb.w / 2
      const cyCenter = bb.y1 + bb.h / 2
      
      sx = (cx - finalW / 2 - PAD) * zoom + pan.x
      sy = (cyCenter - finalH / 2 - TOP_PAD) * zoom + pan.y
      sw = (finalW + PAD * 2) * zoom
      sh = (finalH + PAD + TOP_PAD) * zoom
    }

    const labelText = memberNodes.length === 0 ? `${domain.name} (empty)` : domain.name
    const fontSize = `${Math.max(10, 12 * zoom)}px`
    const bgColor = domain.display?.color ?? 'rgba(99,102,241,0.07)'

    // Robust color derivation:
    // If domain.display.color is rgba(r,g,b,a), create a solid version for header and a themed border
    const baseColor = domain.display?.color || 'rgba(99,102,241,1)'
    const headerColor = baseColor.replace(/[\d.]+\)$/, '0.8)') // make it more opaque
    const borderColor = baseColor.replace(/[\d.]+\)$/, '0.4)') // make it slightly transparent

    const div = existing.get(domain.id)
    if (div) {
      div.style.left = `${sx}px`
      div.style.top = `${sy}px`
      div.style.width = `${sw}px`
      div.style.height = `${sh}px`
      div.style.background = bgColor
      div.style.border = `2px solid ${borderColor}`
      const label = div.firstElementChild as HTMLElement | null
      if (label) {
        label.textContent = labelText
        label.style.fontSize = fontSize
        label.style.height = `${headerH}px`
        label.style.background = headerColor
      }
    } else {
      const newDiv = document.createElement('div')
      newDiv.dataset.domainBg = domain.id
      newDiv.style.cssText = `
        position: absolute;
        left: ${sx}px;
        top: ${sy}px;
        width: ${sw}px;
        height: ${sh}px;
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 12px;
        pointer-events: none;
      `
      const label = document.createElement('div')
      label.textContent = labelText
      label.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: ${headerH}px;
        background: ${headerColor};
        color: white;
        border-radius: 10px 10px 0 0;
        padding: 0 12px;
        font-size: ${fontSize};
        font-weight: 800;
        display: flex;
        align-items: center;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
      `
      newDiv.appendChild(label)
      container.appendChild(newDiv)
    }
  })

  // Remove stale backgrounds
  existing.forEach((el, id) => {
    if (!active.has(id)) el.remove()
  })
}

// ── Domain drag handle renderer (z-index: 25, above canvas) ─────────────
// Background divs (bgDiv, z-index:0) are behind the Cytoscape canvas and
// cannot receive pointer events. A transparent header strip matching the
// domain frame's top edge is placed in this high-z layer to act as the
// drag target, so the visible domain label doubles as the handle.
function renderDomainHandles(
  cy: CyInstance,
  schema: Schema,
  container: HTMLDivElement,
  bgContainer: HTMLDivElement,
  _theme: 'dark' | 'light',
  onDomainDragEnd: (domainId: string, dx: number, dy: number, handleX: number, handleY: number) => void,
  onDomainClick: (id: string) => void,
) {
  if (!schema.domains?.length) {
    container.innerHTML = ''
    return
  }

  const zoom: number = cy.zoom()
  const pan: { x: number; y: number } = cy.pan()

  // Build map of existing handles by domain id
  const existing = new Map<string, HTMLDivElement>()
  container.querySelectorAll<HTMLDivElement>('[data-domain-handle]').forEach(el => {
    existing.set(el.dataset.domainHandle!, el)
  })

  const active = new Set<string>()

  schema.domains.forEach((domain) => {
    active.add(domain.id)
    const memberNodes = cy.nodes().filter((n: CyInstance) => domain.members.includes(n.id()))
    const layoutEntry = schema.layout?.[domain.id]
    const headerH = Math.max(24, 32 * zoom)
    const TOP_PAD = PAD + (headerH / zoom)

    let sx: number, sy: number, sw: number
    if (memberNodes.length === 0) {
      const cx = layoutEntry?.x ?? 0
      const cy2 = layoutEntry?.y ?? 0
      const lw = layoutEntry?.width ?? 300
      sx = (cx - PAD) * zoom + pan.x
      sy = (cy2 - TOP_PAD) * zoom + pan.y
      sw = (lw + PAD * 2) * zoom
    } else {
      const bb = getDomainBB(memberNodes, zoom, schema)
      const cx = bb.x1 + bb.w / 2
      const cyCenter = bb.y1 + bb.h / 2

      sx = (cx - bb.w / 2 - PAD) * zoom + pan.x
      sy = (cyCenter - bb.h / 2 - TOP_PAD) * zoom + pan.y
      sw = (bb.w + PAD * 2) * zoom
    }

    const existingHandle = existing.get(domain.id)
    if (existingHandle) {
      // Reuse: update position only, event listener stays intact
      existingHandle.style.left = `${sx}px`
      existingHandle.style.top = `${sy}px`
      existingHandle.style.width = `${sw}px`
      existingHandle.style.height = `${headerH}px`
      return
    }

    // New domain: create handle with event listener
    const handle = document.createElement('div')
    handle.dataset.domainHandle = domain.id
    handle.style.cssText = `
      position: absolute;
      left: ${sx}px;
      top: ${sy}px;
      width: ${sw}px;
      height: ${headerH}px;
      cursor: grab;
      user-select: none;
      pointer-events: auto;
      border-radius: 12px 12px 0 0;
    `

    handle.addEventListener('mousedown', (startEvt) => {
      startEvt.preventDefault()
      startEvt.stopPropagation()

      const startX = startEvt.clientX
      const startY = startEvt.clientY
      const handleInitLeft = parseFloat(handle.style.left)
      const handleInitTop = parseFloat(handle.style.top)

      // Use latest schema from store to avoid stale closures from the time of creation
      const currentSchema = useStore.getState().schema
      const latestDomain = currentSchema?.domains?.find(d => d.id === domain.id)
      if (!latestDomain) return

      // Read memberNodes fresh at interaction time
      const currentMemberNodes = cy.nodes().filter((n: CyInstance) => latestDomain.members.includes(n.id()))
      const initialPositions = new Map<string, { x: number; y: number }>()
      currentMemberNodes.forEach((n: CyInstance) => {
        const pos: { x: number; y: number } = n.position()
        initialPositions.set(n.id() as string, { x: pos.x, y: pos.y })
      })

      // Find background div to move it visually during drag
      const bgDiv = bgContainer.querySelector<HTMLDivElement>(`[data-domain-bg="${domain.id}"]`)

      let lastDx = 0
      let lastDy = 0
      let moved = false

      const onMouseMove = (moveEvt: MouseEvent) => {
        const screenDx = moveEvt.clientX - startX
        const screenDy = moveEvt.clientY - startY
        if (Math.abs(screenDx) > 2 || Math.abs(screenDy) > 2) {
          moved = true
          handle.style.cursor = 'grabbing'
        }
        if (!moved) return
        
        const currentZoom: number = cy.zoom()
        lastDx = screenDx / currentZoom
        lastDy = screenDy / currentZoom

        // 1. Move member nodes in Cytoscape
        currentMemberNodes.forEach((n: CyInstance) => {
          const init = initialPositions.get(n.id() as string)!
          n.position({ x: init.x + lastDx, y: init.y + lastDy })
        })

        // 2. Move handle and background div in sync (visual only)
        const newL = handleInitLeft + screenDx
        const newT = handleInitTop + screenDy
        handle.style.left = `${newL}px`
        handle.style.top = `${newT}px`
        
        if (bgDiv) {
          bgDiv.style.left = `${newL}px`
          bgDiv.style.top = `${newT}px`
        }

        // 3. For domains with tables, re-render to adjust for table height changes if any
        if (currentMemberNodes.length > 0) {
          renderDomainBackgrounds(cy, useStore.getState().schema!, bgContainer)
        }
      }

      const onMouseUp = () => {
        handle.style.cursor = 'grab'
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        if (!moved) {
          onDomainClick(domain.id)
        } else {
          onDomainDragEnd(domain.id, lastDx, lastDy, handleInitLeft, handleInitTop)
        }
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    container.appendChild(handle)
  })

  // Remove handles for deleted domains
  existing.forEach((el, id) => {
    if (!active.has(id)) el.remove()
  })
}


// Returns '#000000' or '#ffffff' based on the luminance of a CSS color string
function textColorForBg(cssColor: string): string {
  let r = 0, g = 0, b = 0
  const hex6 = cssColor.match(/^#([0-9a-f]{6})$/i)
  const hex3 = cssColor.match(/^#([0-9a-f]{3})$/i)
  const rgba = cssColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
  if (hex6) {
    r = parseInt(hex6[1].slice(0, 2), 16)
    g = parseInt(hex6[1].slice(2, 4), 16)
    b = parseInt(hex6[1].slice(4, 6), 16)
  } else if (hex3) {
    r = parseInt(hex3[1][0] + hex3[1][0], 16)
    g = parseInt(hex3[1][1] + hex3[1][1], 16)
    b = parseInt(hex3[1][2] + hex3[1][2], 16)
  } else if (rgba) {
    r = parseInt(rgba[1]); g = parseInt(rgba[2]); b = parseInt(rgba[3])
  }
  // Relative luminance (WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1e293b' : '#f1f5f9'
}

// ── Annotation overlay renderer ─────────────────────────────────────────
function renderAnnotations(
  cy: CyInstance,
  schema: Schema,
  container: HTMLDivElement,
  theme: 'dark' | 'light',
  onAnnotationDragEnd: (id: string, newOffset: { x: number; y: number }) => void,
  onAnnotationClick: (id: string) => void,
  selectedAnnotationId: string | null,
) {
  container.innerHTML = ''
  if (!schema.annotations?.length) return

  const zoom: number = cy.zoom()
  const pan: { x: number; y: number } = cy.pan()

  schema.annotations.forEach((ann) => {
    let absX: number
    let absY: number

    if (ann.target?.id) {
      const targetNode = cy.getElementById(ann.target.id)
      if (targetNode.length === 0) return
      const pos: { x: number; y: number } = targetNode.position()
      absX = (pos.x + (ann.offset?.x ?? 0)) * zoom + pan.x
      absY = (pos.y + (ann.offset?.y ?? 0)) * zoom + pan.y
    } else {
      absX = (ann.offset?.x ?? 0) * zoom + pan.x
      absY = (ann.offset?.y ?? 0) * zoom + pan.y
    }

    const isSelected = selectedAnnotationId === ann.id
    const bgColor = ann.display?.color ?? (theme === 'dark' ? '#1e293b' : '#fef9c3')
    const textColor = textColorForBg(bgColor)
    const div = document.createElement('div')
    div.style.cssText = `
      position: absolute;
      left: ${absX}px;
      top: ${absY}px;
      min-width: ${120 * zoom}px;
      max-width: ${240 * zoom}px;
      padding: ${8 * zoom}px ${12 * zoom}px;
      background: ${bgColor};
      color: ${textColor};
      border: ${isSelected ? `2px solid ${LINEAGE_BASE}` : '1px solid rgba(0,0,0,0.1)'};
      border-radius: ${8 * zoom}px;
      font-size: ${12 * zoom}px;
      line-height: 1.4;
      cursor: grab;
      box-shadow: ${isSelected ? '0 0 0 3px rgba(59,130,246,0.3)' : '0 2px 8px rgba(0,0,0,0.12)'};
      white-space: pre-wrap;
      user-select: none;
      pointer-events: auto;
    `
    div.textContent = ann.text

    // ── Annotation drag + click (tap vs drag detection) ─────────────────
    div.addEventListener('mousedown', (startEvt) => {
      startEvt.preventDefault()
      startEvt.stopPropagation()
      const startScreenX = startEvt.clientX
      const startScreenY = startEvt.clientY
      const startOffsetX = ann.offset?.x ?? 0
      const startOffsetY = ann.offset?.y ?? 0
      let moved = false

      const onMouseMove = (moveEvt: MouseEvent) => {
        const dx = moveEvt.clientX - startScreenX
        const dy = moveEvt.clientY - startScreenY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          moved = true
          div.style.cursor = 'grabbing'
        }
        if (moved) {
          div.style.left = (absX + dx) + 'px'
          div.style.top = (absY + dy) + 'px'
        }
      }

      const onMouseUp = (upEvt: MouseEvent) => {
        div.style.cursor = 'grab'
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        if (!moved) {
          onAnnotationClick(ann.id)
        } else {
          const currentZoom: number = cy.zoom()
          const dx = (upEvt.clientX - startScreenX) / currentZoom
          const dy = (upEvt.clientY - startScreenY) / currentZoom
          onAnnotationDragEnd(ann.id, { x: startOffsetX + dx, y: startOffsetY + dy })
        }
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    })

    container.appendChild(div)
  })
}

// ── Main component ────────────────────────────────────────────────────
interface CytoscapeCanvasProps {
  onNodeClick: (id: string) => void
  onEdgeClick: (edgeData: {
    id: string
    kind: string
    source: string
    target: string
    fromColumn?: string[] | null
    toColumn?: string[] | null
    relType?: string
  }) => void
  onPaneClick: () => void
  onAnnotationClick: (id: string) => void
  onDomainClick: (id: string) => void
  onAddTableAt: (x: number, y: number) => void
  onAddDomainAt: (x: number, y: number) => void
  onAddConsumerAt: (x: number, y: number) => void
  onAddAnnotationAt: (x: number, y: number) => void
  onFitView: (fitFn: () => void) => void
  onFocusNode: (focusFn: (id: string) => void) => void
  onEdgeCreated: (kind: 'lineage' | 'er', sourceId: string, targetId: string) => void
  onAutoLayout: (fn: () => void) => void
}

export default function CytoscapeCanvas({
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onAnnotationClick,
  onDomainClick,
  onAddTableAt,
  onAddDomainAt,
  onAddConsumerAt,
  onAddAnnotationAt,
  onFitView,
  onFocusNode,
  onEdgeCreated,
  onAutoLayout,
}: CytoscapeCanvasProps) {
  const {
    schema,
    selectedTableId,
    selectedTableIds,
    selectedAnnotationId,
    highlightedNodeIds,
    pathFinderResult,
    showER,
    showLineage,
    showAnnotations,
    isCompactMode,
    theme,
    hoveredColumnId,
    updateNodePosition,
    updateAnnotation,
    connectMode,
  } = useStore(
    useShallow((s) => ({
      schema: s.schema,
      selectedTableId: s.selectedTableId,
      selectedTableIds: s.selectedTableIds,
      selectedAnnotationId: s.selectedAnnotationId,
      highlightedNodeIds: s.highlightedNodeIds,
      pathFinderResult: s.pathFinderResult,
      showER: s.showER,
      showLineage: s.showLineage,
      showAnnotations: s.showAnnotations,
      isCompactMode: s.isCompactMode,
      theme: s.theme,
      hoveredColumnId: s.hoveredColumnId,
      updateNodePosition: s.updateNodePosition,
      updateAnnotation: s.updateAnnotation,
      connectMode: s.connectMode,
    }))
  )

  const cyContainerRef = useRef<HTMLDivElement>(null)
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null)
  const cyRef = useRef<CyInstance>(null)
  const domBgRef = useRef<HTMLDivElement | null>(null)
  const domAnnRef = useRef<HTMLDivElement | null>(null)
  const domHandleRef = useRef<HTMLDivElement | null>(null) // domain drag handles (z-index: 25)
  const rootMapRef = useRef<Map<string, Root>>(new Map())
  const domContainerMapRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const zoomRef = useRef<number>(1)
  const lowZoomRef = useRef<boolean>(false)
  const rafIdRef = useRef<number | null>(null)

  // Mutable refs for state used inside stable callbacks
  const selectedIdRef = useRef<string | null>(null)
  const selectedIdsRef = useRef<string[]>([])
  const highlightedIdsRef = useRef<string[]>([])
  const hoveredNodeIdRef = useRef<string | null>(null)
  const connectPendingSourceRef = useRef<string | null>(null)

  const pathFinderResultRef = useRef<{ nodeIds: string[], edgeIds: string[] } | null>(null)
  const themeRef = useRef<'dark' | 'light'>(theme)
  const hoveredColumnIdRef = useRef<string | null>(null)
  const isCompactModeRef = useRef<boolean>(isCompactMode)

  const schemaRef = useRef<Schema | null>(null)
  const showAnnotationsRef = useRef<boolean>(showAnnotations)
  // Track structural parts of schema to detect layout-only changes
  const prevSchemaStructRef = useRef<{
    tables: Schema['tables']
    lineage: Schema['lineage']
    relationships: Schema['relationships']
    domains: Schema['domains']
    annotations: Schema['annotations']
    consumers: Schema['consumers']
  } | null>(null)
  const onNodeClickRef = useRef(onNodeClick)
  const onEdgeCreatedRef = useRef(onEdgeCreated)

  // Keep refs in sync
  useEffect(() => { showAnnotationsRef.current = showAnnotations }, [showAnnotations])
  useEffect(() => { onNodeClickRef.current = onNodeClick }, [onNodeClick])
  useEffect(() => { onEdgeCreatedRef.current = onEdgeCreated }, [onEdgeCreated])

  // ── updateAllCards: re-render visible TableCard portals (RAF-debounced) ──
  const updateAllCards = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      const cy = cyRef.current
      if (!cy) return
      // Skip React rendering entirely in low-zoom mode
      if (lowZoomRef.current) return

      const zoom = zoomRef.current
      const ext = cy.extent() as { x1: number; y1: number; x2: number; y2: number }
      // Pre-render nodes slightly outside the viewport so they appear instantly on pan
      const PAD = 400

      // Pre-compute connected nodes for the selected node (for dimming)
      const selectedId = selectedIdRef.current
      const connectedToSelected = new Set<string>()
      if (selectedId) {
        cy.$(`#${selectedId}`).connectedEdges().connectedNodes().forEach((n: CyInstance) => {
          connectedToSelected.add(n.id())
        })
      }

      cy.nodes().forEach((node: CyInstance) => {
        const table = node.data('table')
        const consumer = node.data('consumer')
        if (!table && !consumer) return
        const id: string = node.id()
        const root = rootMapRef.current.get(id)
        if (!root) return

        // Viewport culling: skip nodes outside viewport + padding
        const pos: { x: number; y: number } = node.position()
        if (
          pos.x < ext.x1 - PAD || pos.x > ext.x2 + PAD ||
          pos.y < ext.y1 - PAD || pos.y > ext.y2 + PAD
        ) return

        const isSelected =
          selectedIdRef.current === id || selectedIdsRef.current.includes(id)
        const isHovered = hoveredNodeIdRef.current === id
        const isHighlighted = highlightedIdsRef.current.includes(id)
        const pathFinderNodeSet = pathFinderResultRef.current
          ? new Set(pathFinderResultRef.current.nodeIds)
          : null
        const isAnythingHighlighted =
          !!pathFinderNodeSet || highlightedIdsRef.current.length > 0 || !!selectedId
        const isDimmed = pathFinderNodeSet
          ? !pathFinderNodeSet.has(id)
          : isAnythingHighlighted && !isSelected && !isHighlighted && !isHovered && !connectedToSelected.has(id)
        const currentConnectMode = useStore.getState().connectMode
        const isPendingSource = connectPendingSourceRef.current === id
        const isConnectMode = !!currentConnectMode
        if (consumer) {
          root.render(
            <ConsumerCard
              consumer={consumer}
              isSelected={isSelected}
              isDimmed={isDimmed}
              theme={themeRef.current}
            />
          )
        } else {
          root.render(
            <TableCard
              table={table}
              isSelected={isSelected}
              isDimmed={isDimmed}
              isHighlighted={isHighlighted}
              isHovered={isHovered}
              zoom={zoom}
              theme={themeRef.current}
              hoveredColumnId={hoveredColumnIdRef.current}
              isCompact={isCompactModeRef.current}
              isConnectMode={isConnectMode}
              isPendingSource={isPendingSource}
            />
          )
        }
      })
    })
  }, [])

  // ── Domain drag end callback ─────────────────────────────────────────
  const onDomainDragEnd = useCallback(
    (domainId: string, lastDx: number, lastDy: number, initialHandleX: number, initialHandleY: number) => {
      const { schema, updateNodesPosition } = useStore.getState()
      if (!schema) return
      const domain = schema.domains?.find((d) => d.id === domainId)
      if (!domain) return
      const cy = cyRef.current
      if (!cy) return

      const updates: { id: string; x: number; y: number }[] = []
      const zoom = cy.zoom()
      const pan = cy.pan()

      // Calculate final absolute canvas position for the domain handle
      // handle position is in screen pixels, so we convert back to canvas coords
      const finalHandleCanvasX = (initialHandleX + lastDx * zoom - pan.x) / zoom
      const finalHandleCanvasY = (initialHandleY + lastDy * zoom - pan.y) / zoom
      
      const headerH = Math.max(24, 32 * zoom)
      const TOP_PAD = PAD + (headerH / zoom)

      // The stored (x,y) should be the anchor of the content area.
      // Since handle is at (x - PAD, y - TOP_PAD), we add them back.
      updates.push({ 
        id: domainId, 
        x: Math.round(finalHandleCanvasX + PAD), 
        y: Math.round(finalHandleCanvasY + TOP_PAD) 
      })

      // Member nodes: read actual Cytoscape positions after the drag
      domain.members.forEach((tableId) => {
        const cyNode = cy.getElementById(tableId)
        if (cyNode && cyNode.length > 0) {
          const pos: { x: number; y: number } = cyNode.position()
          updates.push({ id: tableId, x: Math.round(pos.x), y: Math.round(pos.y) })
        }
      })

      updateNodesPosition(updates)
    },
    []
  )

  // Stable ref so the event handler inside renderDomainHandles always calls the latest version
  const onDomainDragEndRef = useRef(onDomainDragEnd)
  useEffect(() => { onDomainDragEndRef.current = onDomainDragEnd }, [onDomainDragEnd])

  const onDomainClickRef = useRef(onDomainClick)
  useEffect(() => { onDomainClickRef.current = onDomainClick }, [onDomainClick])

  // ── Annotation drag end callback ─────────────────────────────────────
  const onAnnotationDragEnd = useCallback(
    (id: string, newOffset: { x: number; y: number }) => {
      updateAnnotation(id, { offset: newOffset })
    },
    [updateAnnotation]
  )
  const onAnnotationDragEndRef = useRef(onAnnotationDragEnd)
  useEffect(() => { onAnnotationDragEndRef.current = onAnnotationDragEnd }, [onAnnotationDragEnd])

  const onAnnotationClickRef = useRef(onAnnotationClick)
  useEffect(() => { onAnnotationClickRef.current = onAnnotationClick }, [onAnnotationClick])

  const selectedAnnotationIdRef = useRef(selectedAnnotationId)
  useEffect(() => {
    selectedAnnotationIdRef.current = selectedAnnotationId
    const cy = cyRef.current
    if (!cy || !domAnnRef.current || !schemaRef.current || !showAnnotations) return
    renderAnnotations(cy, schemaRef.current, domAnnRef.current, themeRef.current, onAnnotationDragEndRef.current, onAnnotationClickRef.current, selectedAnnotationId)
  }, [selectedAnnotationId, showAnnotations])

  // ── Initialize Cytoscape (mount only) ───────────────────────────────
  useEffect(() => {
    if (!cyContainerRef.current || cyRef.current) return

    const container = cyContainerRef.current
    container.style.position = 'relative'

    // Domain background overlay (behind Cytoscape canvas)
    const bgDiv = document.createElement('div')
    bgDiv.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0;'
    container.insertBefore(bgDiv, container.firstChild)
    domBgRef.current = bgDiv

    // Annotation overlay (above canvas)
    const annDiv = document.createElement('div')
    annDiv.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:20;'

    // Domain drag handle layer — ABOVE canvas + DOM nodes; handles have pointer-events:auto
    const handleDiv = document.createElement('div')
    handleDiv.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:25;'
    container.appendChild(annDiv)
    domAnnRef.current = annDiv
    container.appendChild(handleDiv)
    domHandleRef.current = handleDiv

    const cy: CyInstance = cytoscape({
      container,
      elements: [],
      style: buildCytoscapeStyle(themeRef.current),
      minZoom: 0.05,
      maxZoom: 3,
      wheelSensitivity: 1.0,
      boxSelectionEnabled: true,
      userZoomingEnabled: true,
      userPanningEnabled: true,
    })

    cyRef.current = cy
    zoomRef.current = cy.zoom()

    // Share cy instance via store for export
    useStore.getState().setCyInstance(cy)

    // Expose cy instance for external access (ActivityBar, etc.)
    ;(window as any).__modscapeCy = cy

    // Init cytoscape-dom-node plugin
    cy.domNode()

    // ── Interaction events ────────────────────────────────────────
    cy.on('tap', 'node', (evt: CyInstance) => {
      const id: string = evt.target.id()
      const mode = useStore.getState().connectMode
      if (mode) {
        const pending = connectPendingSourceRef.current
        if (!pending) {
          connectPendingSourceRef.current = id
          updateAllCards()
        } else if (pending === id) {
          connectPendingSourceRef.current = null
          updateAllCards()
        } else {
          onEdgeCreatedRef.current(mode, pending, id)
          connectPendingSourceRef.current = null
          updateAllCards()
        }
        return
      }
      onNodeClick(id)
    })

    cy.on('tap', 'edge', (evt: CyInstance) => {
      const d = evt.target.data()
      onEdgeClick({
        id: evt.target.id(),
        kind: d.kind,
        source: d.source,
        target: d.target,
        fromColumn: d.fromColumn,
        toColumn: d.toColumn,
        relType: d.relType,
      })
    })

    cy.on('tap', (evt: CyInstance) => {
      if (evt.target === cy) onPaneClick()
    })

    cy.on('dragfree', 'node', (evt: CyInstance) => {
      const pos: { x: number; y: number } = evt.target.position()
      updateNodePosition(evt.target.id(), pos.x, pos.y)
    })

    // Hover: no effects

    // Box / lasso selection → sync to store
    // Debounced: lasso over 1000 nodes fires boxselect 1000 times; batch into one update.
    let boxSelectTimer: ReturnType<typeof setTimeout> | null = null
    cy.on('boxselect', 'node', () => {
      if (boxSelectTimer) clearTimeout(boxSelectTimer)
      boxSelectTimer = setTimeout(() => {
        boxSelectTimer = null
        const selectedIds: string[] = cy
          .nodes(':selected')
          .map((n: CyInstance) => n.id() as string)
        useStore.getState().setSelectedTableIds(selectedIds)
      }, 50)
    })

    // Update overlays on viewport change
    const updateOverlays = () => {
      if (domBgRef.current && schemaRef.current) {
        renderDomainBackgrounds(cy, schemaRef.current, domBgRef.current)
      }
      if (domHandleRef.current && domBgRef.current && schemaRef.current) {
        renderDomainHandles(cy, schemaRef.current, domHandleRef.current, domBgRef.current, themeRef.current, onDomainDragEndRef.current, onDomainClickRef.current)
      }
      if (domAnnRef.current && schemaRef.current && showAnnotationsRef.current) {
        renderAnnotations(cy, schemaRef.current, domAnnRef.current, themeRef.current, onAnnotationDragEndRef.current, onAnnotationClickRef.current, selectedAnnotationIdRef.current)
      }
    }
    cy.on('pan zoom', updateOverlays)
    cy.on('drag', 'node', updateOverlays)

    cy.on('zoom', () => {
      const z: number = cy.zoom()
      const wasLow = lowZoomRef.current
      const isLow = z < LOW_ZOOM_THRESHOLD
      zoomRef.current = z
      lowZoomRef.current = isLow

      // Switch stylesheet when crossing the threshold
      if (wasLow !== isLow) {
        cy.style(buildCytoscapeStyle(themeRef.current, isLow))
      }
      if (!isLow) updateAllCards()
    })

    // Pan: re-render newly visible nodes
    cy.on('pan', updateAllCards)

    // ── Shift-lasso: capture-phase listener on the cy container ──────────
    // Card DOM handlers call stopPropagation in bubble phase, preventing
    // Cytoscape's built-in box-select from starting when shift+dragging over cards.
    // We intercept Shift+mousedown in CAPTURE phase (before cards see it),
    // then implement click-vs-drag ourselves.
    const handleShiftCapture = (downEvt: MouseEvent) => {
      if (!downEvt.shiftKey || downEvt.button !== 0) return
      // Take ownership — card bubbling handlers won't fire
      downEvt.stopPropagation()
      downEvt.preventDefault()

      const startX = downEvt.clientX
      const startY = downEvt.clientY
      const containerRect = container.getBoundingClientRect()
      let moved = false
      let lassoEl: HTMLDivElement | null = null

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX
        const dy = me.clientY - startY
        if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return
        moved = true
        if (!lassoEl) {
          lassoEl = document.createElement('div')
          lassoEl.style.cssText =
            `position:absolute;border:2px dashed ${LINEAGE_BASE};background:rgba(59,130,246,0.1);pointer-events:none;z-index:100;`
          container.appendChild(lassoEl)
        }
        const x = Math.min(startX, me.clientX) - containerRect.left
        const y = Math.min(startY, me.clientY) - containerRect.top
        const w = Math.abs(me.clientX - startX)
        const h = Math.abs(me.clientY - startY)
        lassoEl.style.left = `${x}px`
        lassoEl.style.top = `${y}px`
        lassoEl.style.width = `${w}px`
        lassoEl.style.height = `${h}px`
      }

      const onUp = (upEvt: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        if (lassoEl && lassoEl.parentNode) lassoEl.parentNode.removeChild(lassoEl)
        const currCy = cyRef.current
        if (!currCy) return

        if (moved) {
          // Lasso: collect nodes whose Cytoscape position maps inside the selection rect
          const selL = Math.min(startX, upEvt.clientX) - containerRect.left
          const selT = Math.min(startY, upEvt.clientY) - containerRect.top
          const selR = Math.max(startX, upEvt.clientX) - containerRect.left
          const selB = Math.max(startY, upEvt.clientY) - containerRect.top
          const zoom = currCy.zoom()
          const pan = currCy.pan()
          const ids: string[] = []
          currCy.nodes().forEach((node: CyInstance) => {
            const pos = node.position()
            const sx = pos.x * zoom + pan.x
            const sy = pos.y * zoom + pan.y
            if (sx >= selL && sx <= selR && sy >= selT && sy <= selB) {
              ids.push(node.id() as string)
            }
          })
          useStore.getState().setSelectedTableIds(ids)
        } else {
          // Shift+click: find node under cursor and toggle in selectedTableIds
          const zoom = currCy.zoom()
          const pan = currCy.pan()
          let clickedId: string | null = null
          domContainerMapRef.current.forEach((domCont, nid) => {
            if (clickedId) return
            const node = currCy.getElementById(nid)
            if (!node || node.length === 0) return
            if (hitTestCard(startX, startY, domCont, node.position(), zoom, pan, containerRect)) {
              clickedId = nid
            }
          })
          if (clickedId) {
            const { selectedTableIds, setSelectedTableIds } = useStore.getState()
            const next = selectedTableIds.includes(clickedId)
              ? selectedTableIds.filter(sid => sid !== clickedId)
              : [...selectedTableIds, clickedId]
            setSelectedTableIds(next)
          }
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }
    container.addEventListener('mousedown', handleShiftCapture, true)

    return () => {
      container.removeEventListener('mousedown', handleShiftCapture, true)
      rootMapRef.current.forEach((root) => root.unmount())
      rootMapRef.current.clear()
      cy.destroy()
      cyRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Mount only

  // ── Sync schema → Cytoscape elements ────────────────────────────────
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || !schema) return

    schemaRef.current = schema

    // Fast path: if only layout changed, skip full element rebuild
    const prev = prevSchemaStructRef.current
    const onlyLayoutChanged =
      prev !== null &&
      schema.tables === prev.tables &&
      (schema.lineage ?? null) === (prev.lineage ?? null) &&
      (schema.relationships ?? null) === (prev.relationships ?? null) &&
      (schema.domains ?? null) === (prev.domains ?? null) &&
      (schema.annotations ?? null) === (prev.annotations ?? null) &&
      (schema.consumers ?? null) === (prev.consumers ?? null)

    prevSchemaStructRef.current = {
      tables: schema.tables,
      lineage: schema.lineage,
      relationships: schema.relationships,
      domains: schema.domains,
      annotations: schema.annotations,
      consumers: schema.consumers,
    }

    if (onlyLayoutChanged) {
      // Sync positions (needed for applyLayout; drag handler already updates cy positions)
      schema.tables.forEach(table => {
        const layout = schema.layout?.[table.id]
        if (layout) {
          const el = cy.getElementById(table.id)
          if (el.length > 0) el.position({ x: layout.x, y: layout.y })
        }
      })
      cy.edges('.er-edge').style('display', showER ? 'element' : 'none')
      cy.edges('.lineage-edge').style('display', showLineage ? 'element' : 'none')
      if (domBgRef.current) renderDomainBackgrounds(cy, schema, domBgRef.current)
      if (domHandleRef.current && domBgRef.current) renderDomainHandles(cy, schema, domHandleRef.current, domBgRef.current, theme, onDomainDragEndRef.current, onDomainClickRef.current)
      if (domAnnRef.current) {
        if (showAnnotations) renderAnnotations(cy, schema, domAnnRef.current, theme, onAnnotationDragEndRef.current, onAnnotationClickRef.current, selectedAnnotationIdRef.current)
        else domAnnRef.current.innerHTML = ''
      }
      updateAllCards()
      return
    }

    const elements = yamlToElements(schema)
    const existingIds = new Set<string>(
      cy.elements().map((el: CyInstance) => el.id() as string)
    )
    const newIds = new Set<string>(elements.map((el) => el.data.id as string))

    // Remove stale elements
    cy.elements().forEach((el: CyInstance) => {
      if (!newIds.has(el.id())) {
        if (el.isNode()) {
          const root = rootMapRef.current.get(el.id())
          if (root) {
            root.unmount()
            rootMapRef.current.delete(el.id())
          }
          // Explicitly remove DOM container to prevent orphaned elements
          // intercepting mouse events after YAML switch
          const domContainer = domContainerMapRef.current.get(el.id())
          if (domContainer && domContainer.parentNode) {
            domContainer.parentNode.removeChild(domContainer)
          }
          domContainerMapRef.current.delete(el.id())
        }
        el.remove()
      }
    })

    // Add or update elements
    elements.forEach((elDef) => {
      const id = elDef.data.id as string
      if (existingIds.has(id)) {
        const el = cy.getElementById(id)
        // Edges: source/target cannot be changed via .data() after creation.
        // If they changed (e.g. due to index shift after deletion), remove+re-add.
        if (el.isEdge() && (
          el.data('source') !== elDef.data.source ||
          el.data('target') !== elDef.data.target
        )) {
          el.remove()
          cy.add(elDef)
        } else {
          el.data(elDef.data)
          // Update position if schema layout changed (e.g., after auto-layout)
          if (elDef.position) {
            el.position(elDef.position)
          }
        }
      } else {
        // For table nodes, create DOM container BEFORE cy.add() so that
        // cytoscape-dom-node's 'add' handler finds data.dom already set.
        const isTableNode = !!elDef.data.table
        const isUsecaseNode = !!elDef.data.consumer
        let domContainer: HTMLDivElement | null = null
        let elToAdd = elDef
        if (isTableNode || isUsecaseNode) {
          domContainer = document.createElement('div')
          domContainer.style.cssText = 'position:absolute;box-sizing:border-box;min-width:220px;'

          // cytoscape-dom-node overlays can intercept mouse events before they reach
          // the Cytoscape canvas, preventing Cytoscape's built-in drag detection.
          // We implement drag manually on the DOM container instead.
          domContainer.addEventListener('mousedown', (startEvt: MouseEvent) => {
            if (startEvt.button !== 0) return

            const cy = cyRef.current
            const cyEl = cy?.getElementById(id)
            if (!cyEl || cyEl.length === 0) return

            // Hit-test: at low zoom DOM containers overlap — only intercept when
            // the click is within THIS card's actual screen bounds.
            const rect = cyContainerRef.current?.getBoundingClientRect()
            if (!rect || !hitTestCard(startEvt.clientX, startEvt.clientY, domContainer!, cyEl.position(), cy.zoom(), cy.pan(), rect)) {
              return
            }

            // Shift+mousedown is handled by the capture-phase listener on the cy
            // container (handleShiftCapture) which fires before this bubbling handler.
            // If shiftKey somehow reaches here, ignore it to avoid double-handling.
            if (startEvt.shiftKey) return

            startEvt.stopPropagation() // prevent canvas pan / box-select start
            startEvt.preventDefault()

            const startX = startEvt.clientX
            const startY = startEvt.clientY
            let moved = false

            // Multi-select drag: if this node is part of a multi-selection, move all together
            const selectedIds = useStore.getState().selectedTableIds
            const isMultiDrag = selectedIds.length > 1 && selectedIds.includes(id)
            const initPositions = new Map<string, { x: number; y: number }>()
            if (isMultiDrag) {
              selectedIds.forEach(selId => {
                const node = cy?.getElementById(selId)
                if (node && node.length > 0) initPositions.set(selId, { ...node.position() })
              })
            } else {
              initPositions.set(id, { ...cyEl.position() })
            }

            const onMouseMove = (moveEvt: MouseEvent) => {
              const screenDx = moveEvt.clientX - startX
              const screenDy = moveEvt.clientY - startY
              // Use screen pixels for click/drag detection so low-zoom doesn't false-positive
              if (Math.abs(screenDx) > 4 || Math.abs(screenDy) > 4) moved = true
              const zoom: number = cyRef.current?.zoom() ?? 1
              const dx = screenDx / zoom
              const dy = screenDy / zoom
              initPositions.forEach((initPos, nodeId) => {
                const node = cyRef.current?.getElementById(nodeId)
                if (node && node.length > 0) node.position({ x: initPos.x + dx, y: initPos.y + dy })
              })
            }

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove)
              window.removeEventListener('mouseup', onMouseUp)
              if (moved) {
                if (isMultiDrag) {
                  const updates = Array.from(initPositions.keys()).map(nodeId => {
                    const node = cyRef.current?.getElementById(nodeId)
                    const pos: { x: number; y: number } = node.position()
                    return { id: nodeId, x: pos.x, y: pos.y }
                  })
                  useStore.getState().updateNodesPosition(updates)
                } else {
                  const pos: { x: number; y: number } = cyEl.position()
                  useStore.getState().updateNodePosition(id, pos.x, pos.y)
                }
              } else {
                const { connectMode } = useStore.getState()
                if (connectMode) {
                  const pending = connectPendingSourceRef.current
                  if (!pending) {
                    connectPendingSourceRef.current = id
                    updateAllCards()
                  } else if (pending === id) {
                    connectPendingSourceRef.current = null
                    updateAllCards()
                  } else {
                    onEdgeCreatedRef.current(connectMode, pending, id)
                    connectPendingSourceRef.current = null
                    updateAllCards()
                  }
                } else {
                  onNodeClickRef.current(id)
                }
              }
            }

            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
          })

          elToAdd = { ...elDef, data: { ...elDef.data, dom: domContainer } }
        }
        cy.add(elToAdd)
        if ((isTableNode || isUsecaseNode) && domContainer) {
          const root = createRoot(domContainer)
          rootMapRef.current.set(id, root)
          domContainerMapRef.current.set(id, domContainer)
        }
      }
    })

    // Edge visibility
    cy.edges('.er-edge').style('display', showER ? 'element' : 'none')
    cy.edges('.lineage-edge').style('display', showLineage ? 'element' : 'none')

    // Update overlays
    if (domBgRef.current) renderDomainBackgrounds(cy, schema, domBgRef.current)
    if (domHandleRef.current && domBgRef.current) renderDomainHandles(cy, schema, domHandleRef.current, domBgRef.current, theme, onDomainDragEndRef.current, onDomainClickRef.current)
    if (domAnnRef.current) {
      if (showAnnotations) renderAnnotations(cy, schema, domAnnRef.current, theme, onAnnotationDragEndRef.current, onAnnotationClickRef.current, selectedAnnotationIdRef.current)
      else domAnnRef.current.innerHTML = ''
    }

    updateAllCards()
  }, [schema, showER, showLineage, showAnnotations, theme, updateAllCards])

  // ── Sync selection / highlight → cards + edge styles ────────────────
  useEffect(() => {
    isCompactModeRef.current = isCompactMode
    updateAllCards()
  }, [isCompactMode, updateAllCards])

  useEffect(() => {
    selectedIdRef.current = selectedTableId
    selectedIdsRef.current = selectedTableIds
    highlightedIdsRef.current = highlightedNodeIds
    themeRef.current = theme
    hoveredColumnIdRef.current = hoveredColumnId

    const cy = cyRef.current
    if (!cy) return

    pathFinderResultRef.current = pathFinderResult

    if (pathFinderResult) {
      const pathEdgeSet = new Set(pathFinderResult.edgeIds)
      const pathNodeSet = new Set(pathFinderResult.nodeIds)
      cy.edges().forEach((edge: CyInstance) => {
        if (pathEdgeSet.has(edge.id())) {
          edge.addClass('path-highlighted')
          edge.removeClass('dimmed highlighted')
        } else {
          edge.addClass('dimmed')
          edge.removeClass('path-highlighted highlighted')
        }
      })
      cy.nodes().forEach((node: CyInstance) => {
        if (pathNodeSet.has(node.id())) {
          node.removeClass('dimmed')
        } else {
          node.addClass('dimmed')
        }
      })
    } else {
      cy.nodes().forEach((node: CyInstance) => {
        node.removeClass('dimmed')
      })
      cy.edges().forEach((edge: CyInstance) => {
        edge.removeClass('path-highlighted')
        if (selectedTableId) {
          const connected =
            edge.source().id() === selectedTableId ||
            edge.target().id() === selectedTableId
          if (connected) {
            edge.addClass('highlighted')
            edge.removeClass('dimmed')
          } else {
            edge.removeClass('highlighted')
            edge.addClass('dimmed')
          }
        } else {
          edge.removeClass('highlighted dimmed')
        }
      })
    }

    updateAllCards()
  }, [
    selectedTableId,
    selectedTableIds,
    highlightedNodeIds,
    pathFinderResult,
    theme,
    hoveredColumnId,
    updateAllCards,
  ])

  // ── Rebuild Cytoscape style when theme changes ────────────────────────
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.style(buildCytoscapeStyle(theme, zoomRef.current < LOW_ZOOM_THRESHOLD))
  }, [theme])

  // ── Connect mode: reset pending source + clear hover highlight ──────
  useEffect(() => {
    if (connectMode) {
      hoveredNodeIdRef.current = null
      highlightedIdsRef.current = []
    } else {
      connectPendingSourceRef.current = null
    }
    updateAllCards()
  }, [connectMode, updateAllCards])

  // ── Expose canvas API to parent ──────────────────────────────────────
  useEffect(() => {
    const fitFn = () => {
      const cy = cyRef.current
      if (!cy) return
      cy.fit(undefined, 40)
      // If the result is too zoomed out (e.g. 1000 tables), cap at a readable minimum
      const MIN_ZOOM = 0.3
      if (cy.zoom() < MIN_ZOOM) {
        cy.zoom(MIN_ZOOM)
        cy.center(cy.elements())
      }
    }
    onFitView(fitFn)
    ;(window as any).__modscapeFitView = fitFn
    ;(window as any).__modscapeCanvasCenter = () => {
      const cy = cyRef.current
      if (!cy) return { x: 400, y: 300 }
      const ext = cy.extent()
      return { x: (ext.x1 + ext.x2) / 2, y: (ext.y1 + ext.y2) / 2 }
    }
  }, [onFitView])

  // ── Auto Layout (dagre LR + domain grid packing) ─────────────────────
  useEffect(() => {
    onAutoLayout(() => {
      const cy = cyRef.current
      if (!cy) return
      const schema = schemaRef.current
      if (!schema) return

      // Set actual DOM heights so dagre spaces rows correctly
      cy.nodes().forEach((n: CyInstance) => {
        const domEl: HTMLElement | undefined = n.data('dom')
        if (domEl && domEl.offsetHeight > 0) n.style('height', domEl.offsetHeight)
      })

      const cyLayout = cy.layout({
        name: 'dagre',
        rankDir: 'LR',
        nodeSep: 80,
        rankSep: 200,
        padding: 80,
        fit: false,
      })

      cyLayout.on('layoutstop', () => {
        cy.nodes().forEach((n: CyInstance) => n.removeStyle('height'))

        // Read dagre-computed positions (tables and consumers)
        const allNodeIds = new Set<string>([
          ...schema.tables.map(t => t.id),
          ...(schema.consumers ?? []).map(c => c.id),
        ])
        const dagrePos = new Map<string, { x: number; y: number }>()
        cy.nodes().forEach((n: CyInstance) => {
          const id = n.id() as string
          if (allNodeIds.has(id)) dagrePos.set(id, { ...n.position() })
        })

        const newLayout: Record<string, any> = {}
        const PAD = 48
        const TABLE_W = 280
        const GAP = 40

        const getH = (tid: string) => {
          const domEl: HTMLElement | undefined = cy.getElementById(tid).data('dom')
          return domEl?.offsetHeight ?? 220
        }

        // Domain members: rearrange into grid preserving dagre rank order
        schema.domains?.forEach(domain => {
          const members = domain.members.filter(tid => dagrePos.has(tid))
          if (members.length === 0) return

          // Sort by dagre x (rank = left→right order)
          members.sort((a, b) => dagrePos.get(a)!.x - dagrePos.get(b)!.x)

          const cols = Math.min(3, Math.ceil(Math.sqrt(members.length)))
          const rowCount = Math.ceil(members.length / cols)

          // Row heights: max DOM height per row
          const rowH: number[] = Array.from({ length: rowCount }, (_, row) => {
            let max = 0
            for (let c = 0; c < cols; c++) {
              const m = members[row * cols + c]
              if (m) max = Math.max(max, getH(m))
            }
            return max
          })

          const gridW = cols * (TABLE_W + GAP) - GAP
          const gridH = rowH.reduce((s, h) => s + h + GAP, 0) - GAP

          // Anchor grid to dagre centroid
          const cx = members.reduce((s, tid) => s + dagrePos.get(tid)!.x, 0) / members.length
          const cy2 = members.reduce((s, tid) => s + dagrePos.get(tid)!.y, 0) / members.length
          const originX = cx - gridW / 2
          const originY = cy2 - gridH / 2

          members.forEach((tid, idx) => {
            const col = idx % cols
            const row = Math.floor(idx / cols)
            const xOff = col * (TABLE_W + GAP) + TABLE_W / 2
            const yOff = rowH.slice(0, row).reduce((s, h) => s + h + GAP, 0) + rowH[row] / 2
            newLayout[tid] = { x: Math.round(originX + xOff), y: Math.round(originY + yOff), parentId: domain.id }
          })

          // Domain bounding box
          const HEADER = 28
          newLayout[domain.id] = {
            x: Math.round(originX - PAD),
            y: Math.round(originY - PAD - HEADER),
            width: Math.round(gridW + PAD * 2),
            height: Math.round(gridH + PAD * 2 + HEADER),
          }
        })

        // Standalone tables (not in any domain)
        const domainTableIds = new Set(schema.domains?.flatMap(d => d.members) ?? [])

        // Identify connected vs isolated standalone tables
        const connectedIds = new Set<string>()
        ;(schema.lineage ?? []).forEach(e => { connectedIds.add(e.from); connectedIds.add(e.to) })
        ;(schema.relationships ?? []).forEach(r => { connectedIds.add(r.from.table); connectedIds.add(r.to.table) })

        const standaloneConnected: typeof schema.tables = []
        const standaloneIsolated: typeof schema.tables = []
        schema.tables.forEach(t => {
          if (!domainTableIds.has(t.id) && dagrePos.has(t.id)) {
            if (connectedIds.has(t.id)) standaloneConnected.push(t)
            else standaloneIsolated.push(t)
          }
        })

        // Place connected standalone tables at dagre positions
        standaloneConnected.forEach(t => {
          const pos = dagrePos.get(t.id)!
          newLayout[t.id] = { x: Math.round(pos.x), y: Math.round(pos.y) }
        })

        // Compute bounding box of all placed nodes to anchor isolated grid below
        const placedValues = Object.values(newLayout) as Array<{ x: number; y: number }>
        let maxY = 0, minX = Infinity
        placedValues.forEach(pos => {
          if (pos.y > maxY) maxY = pos.y
          if (pos.x < minX) minX = pos.x
        })

        // Place isolated tables in a grid below connected nodes
        if (standaloneIsolated.length > 0) {
          const TABLE_W = 280, TABLE_H = 160, GAP = 40
          const ISOLATED_COLS = Math.min(4, Math.ceil(Math.sqrt(standaloneIsolated.length)))
          const gridStartX = placedValues.length > 0 ? Math.round(minX) : 0
          const gridStartY = placedValues.length > 0 ? Math.round(maxY + TABLE_H + GAP * 3) : 0
          standaloneIsolated.forEach((t, idx) => {
            const col = idx % ISOLATED_COLS
            const row = Math.floor(idx / ISOLATED_COLS)
            newLayout[t.id] = {
              x: Math.round(gridStartX + col * (TABLE_W + GAP) + TABLE_W / 2),
              y: Math.round(gridStartY + row * (TABLE_H + GAP) + TABLE_H / 2),
            }
          })
        }

        // Standalone consumers (not in any domain)
        ;(schema.consumers ?? []).forEach(c => {
          if (!domainTableIds.has(c.id) && dagrePos.has(c.id)) {
            const pos = dagrePos.get(c.id)!
            newLayout[c.id] = { x: Math.round(pos.x), y: Math.round(pos.y) }
          }
        })

        useStore.getState().applyLayout(newLayout)

        // Fit view after layout settles
        setTimeout(() => {
          const cyi = cyRef.current
          if (!cyi) return
          cyi.fit(undefined, 40)
          const MIN_ZOOM = 0.3
          if (cyi.zoom() < MIN_ZOOM) { cyi.zoom(MIN_ZOOM); cyi.center(cyi.elements()) }
        }, 300)
      })

      cyLayout.run()
    })
  }, [onAutoLayout])

  useEffect(() => {
    onFocusNode((id: string) => {
      const cy = cyRef.current
      if (!cy) return
      const node = cy.getElementById(id)
      if (node.length === 0) return
      cy.animate({ fit: { eles: node, padding: 120 }, duration: 800, easing: 'ease-in-out' })
    })
  }, [onFocusNode])

  // ── Minimap ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = minimapCanvasRef.current
    const cy = cyRef.current
    if (!canvas || !cy) return

    const W = canvas.width
    const H = canvas.height
    const PAD = 6

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, W, H)

      const nodes = cy.nodes()
      if (nodes.length === 0) return

      const bb = nodes.boundingBox({})
      if (bb.w === 0 || bb.h === 0) return

      const scale = Math.min((W - PAD * 2) / bb.w, (H - PAD * 2) / bb.h)
      const ox = PAD + ((W - PAD * 2) - bb.w * scale) / 2
      const oy = PAD + ((H - PAD * 2) - bb.h * scale) / 2
      const toX = (x: number) => (x - bb.x1) * scale + ox
      const toY = (y: number) => (y - bb.y1) * scale + oy

      // Nodes
      nodes.forEach((n: CyInstance) => {
        const pos = n.position()
        const color: string = n.data('typeColor') || '#64748b'
        const nw = 280 * scale
        const nh = 160 * scale
        ctx.fillStyle = color
        ctx.globalAlpha = 0.85
        ctx.beginPath()
        ctx.roundRect(toX(pos.x) - nw / 2, toY(pos.y) - nh / 2, nw, nh, 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Viewport rect
      const zoom: number = cy.zoom()
      const pan: { x: number; y: number } = cy.pan()
      const container = cy.container() as HTMLElement
      const vx1 = toX(-pan.x / zoom)
      const vy1 = toY(-pan.y / zoom)
      const vx2 = toX((container.offsetWidth - pan.x) / zoom)
      const vy2 = toY((container.offsetHeight - pan.y) / zoom)
      ctx.strokeStyle = LINEAGE_BASE
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.9
      ctx.strokeRect(vx1, vy1, vx2 - vx1, vy2 - vy1)
      ctx.fillStyle = LINEAGE_BASE
      ctx.globalAlpha = 0.1
      ctx.fillRect(vx1, vy1, vx2 - vx1, vy2 - vy1)
      ctx.globalAlpha = 1
    }

    cy.on('pan zoom add remove move data', draw)
    draw()
    return () => { cy.removeListener('pan zoom add remove move data', draw) }
  }, [schema]) // redraw when schema changes too

  // ── Keyboard shortcuts (canvas-level: T, D, S, arrows) ──────────────
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const cy = cyRef.current
    if (!cy) return { x: 0, y: 0 }
    const pan: { x: number; y: number } = cy.pan()
    const zoom: number = cy.zoom()
    return { x: (screenX - pan.x) / zoom, y: (screenY - pan.y) / zoom }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable ||
        activeEl?.closest('.cm-editor') ||
        activeEl?.closest('.sidebar-content')
      if (isTyping || e.repeat) return

      const key = e.key.toLowerCase()
      if (key === 'l') {
        e.preventDefault()
        const { connectMode, setConnectMode } = useStore.getState()
        setConnectMode(connectMode === 'lineage' ? null : 'lineage')
        return
      }

      if (key === 'r') {
        e.preventDefault()
        const { connectMode, setConnectMode } = useStore.getState()
        setConnectMode(connectMode === 'er' ? null : 'er')
        return
      }

      if (key === 't' || key === 'd' || key === 'c' || key === 's') {
        e.preventDefault()
        const center = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2)
        if (key === 't') onAddTableAt(center.x - 160, center.y - 125)
        else if (key === 'd') onAddDomainAt(center.x - 300, center.y - 200)
        else if (key === 'c') onAddConsumerAt(center.x - 80, center.y - 30)
        else onAddAnnotationAt(center.x - 60, center.y - 40)
        return
      }

      if (e.key.startsWith('Arrow')) {
        const cy = cyRef.current
        if (!cy) return
        const STEP = 100
        const pan: { x: number; y: number } = cy.pan()
        if (e.key === 'ArrowUp') cy.pan({ x: pan.x, y: pan.y + STEP })
        else if (e.key === 'ArrowDown') cy.pan({ x: pan.x, y: pan.y - STEP })
        else if (e.key === 'ArrowLeft') cy.pan({ x: pan.x + STEP, y: pan.y })
        else if (e.key === 'ArrowRight') cy.pan({ x: pan.x - STEP, y: pan.y })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screenToCanvas, onAddTableAt, onAddDomainAt, onAddConsumerAt, onAddAnnotationAt])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={cyContainerRef} style={{ width: '100%', height: '100%' }} />
      <canvas
        ref={minimapCanvasRef}
        width={140}
        height={90}
        style={{
          position: 'absolute',
          bottom: 48,
          right: 16,
          width: 140,
          height: 90,
          borderRadius: 6,
          border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          background: theme === 'dark' ? '#0f172a' : '#f8fafc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
