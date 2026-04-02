import type { Schema } from '../types/schema'

export interface GraphEdge {
  from: string;
  to: string;
  type: 'er' | 'lineage';
  id: string; // relationship index for ER, or custom string for lineage
  metadata?: any;
}

export interface PathStep {
  from: string;
  to: string;
  edge: GraphEdge;
}

export type EdgeTypeFilter = 'er' | 'lineage' | 'both'

/**
 * Builds an adjacency list filtered by edge type (undirected, for path discovery)
 */
const buildFilteredAdj = (schema: Schema, filter: EdgeTypeFilter): Record<string, GraphEdge[]> => {
  const adj: Record<string, GraphEdge[]> = {}

  const addEdge = (from: string, to: string, type: 'er' | 'lineage', id: string, metadata?: any) => {
    if (!adj[from]) adj[from] = []
    adj[from].push({ from, to, type, id, metadata })
    if (!adj[to]) adj[to] = []
    adj[to].push({ from: to, to: from, type, id, metadata })
  }

  if (filter === 'er' || filter === 'both') {
    schema.relationships?.forEach((rel) => {
      addEdge(rel.from.table, rel.to.table, 'er', rel.id!, rel)
    })
  }

  if (filter === 'lineage' || filter === 'both') {
    schema.lineage?.forEach((edge) => {
      addEdge(edge.from, edge.to, 'lineage', edge.id!, { direction: 'upstream' })
    })
  }

  return adj
}

/**
 * Builds an adjacency list from schema including ER and Lineage relationships
 */
export const buildAdjacencyList = (schema: Schema) => buildFilteredAdj(schema, 'both')

/**
 * Returns the direct neighbors (1 hop) of a node for the given edge type filter.
 * Result includes the start node itself.
 */
export const getDirectNeighbors = (
  schema: Schema,
  nodeId: string,
  filter: EdgeTypeFilter
): { nodeIds: Set<string>, edgeIds: Set<string> } => {
  const nodeIds = new Set<string>([nodeId])
  const edgeIds = new Set<string>()
  const adj = buildFilteredAdj(schema, filter)

  ;(adj[nodeId] || []).forEach(edge => {
    nodeIds.add(edge.to)
    edgeIds.add(edge.id)
  })

  return { nodeIds, edgeIds }
}

/**
 * Returns all nodes and edges reachable from a node.
 * - Lineage: directed traversal (downstream forward + upstream backward separately)
 *   so that A→B←C starting from A only yields {A,B}, not C.
 * - ER: undirected traversal (joins are symmetric).
 * Result includes the start node itself.
 */
export const getAllReachable = (
  schema: Schema,
  nodeId: string,
  filter: EdgeTypeFilter
): { nodeIds: Set<string>, edgeIds: Set<string> } => {
  const nodeIds = new Set<string>([nodeId])
  const edgeIds = new Set<string>()

  // Lineage: separate directed BFS for downstream and upstream
  if (filter === 'lineage' || filter === 'both') {
    // Downstream: follow edges forward (from → to)
    const downVisited = new Set<string>([nodeId])
    const downQueue = [nodeId]
    while (downQueue.length > 0) {
      const current = downQueue.shift()!
      schema.lineage?.forEach((edge) => {
        if (edge.from === current) {
          edgeIds.add(edge.id!)
          if (!downVisited.has(edge.to)) {
            downVisited.add(edge.to)
            nodeIds.add(edge.to)
            downQueue.push(edge.to)
          }
        }
      })
    }

    // Upstream: follow edges backward (to → from)
    const upVisited = new Set<string>([nodeId])
    const upQueue = [nodeId]
    while (upQueue.length > 0) {
      const current = upQueue.shift()!
      schema.lineage?.forEach((edge) => {
        if (edge.to === current) {
          edgeIds.add(edge.id!)
          if (!upVisited.has(edge.from)) {
            upVisited.add(edge.from)
            nodeIds.add(edge.from)
            upQueue.push(edge.from)
          }
        }
      })
    }
  }

  // ER: undirected BFS (joins are symmetric)
  if (filter === 'er' || filter === 'both') {
    const erVisited = new Set<string>([nodeId])
    const erQueue = [nodeId]
    while (erQueue.length > 0) {
      const current = erQueue.shift()!
      schema.relationships?.forEach((rel) => {
        const id = rel.id!
        let neighbor: string | null = null
        if (rel.from.table === current) neighbor = rel.to.table
        else if (rel.to.table === current) neighbor = rel.from.table
        if (neighbor) {
          edgeIds.add(id)
          if (!erVisited.has(neighbor)) {
            erVisited.add(neighbor)
            nodeIds.add(neighbor)
            erQueue.push(neighbor)
          }
        }
      })
    }
  }

  return { nodeIds, edgeIds }
}

/**
 * Finds the shortest path between two nodes using BFS.
 * Optionally filter by edge type (default: 'both').
 */
export const findShortestPath = (
  schema: Schema,
  startId: string,
  targetId: string,
  filter: EdgeTypeFilter = 'both'
): PathStep[] | null => {
  if (startId === targetId) return []

  const adj = buildFilteredAdj(schema, filter)
  const queue: string[] = [startId]
  const visited = new Set<string>([startId])
  const parent: Record<string, PathStep> = {}

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === targetId) {
      // Reconstruct path
      const path: PathStep[] = []
      let step = targetId
      while (step !== startId) {
        const p = parent[step]
        path.unshift(p)
        step = p.from
      }
      return path
    }

    const neighbors = adj[current] || []
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to)
        parent[edge.to] = { from: current, to: edge.to, edge }
        queue.push(edge.to)
      }
    }
  }

  return null
}
