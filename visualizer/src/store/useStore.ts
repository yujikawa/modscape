import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import yaml from 'js-yaml'
import type { Schema, Table, Relationship, Domain, Annotation, Consumer } from '../types/schema'
import { parseYAML, normalizeSchema } from '../lib/parser'

// Debounce timer for syncToYamlInput — avoids yaml.dump on every frame during drag
let syncTimer: ReturnType<typeof setTimeout> | null = null

export interface ModelFile {
  slug: string;
  name: string;
  path: string;
}

interface AppState {
  schema: Schema | null;
  selectedTableId: string | null;
  selectedTableIds: string[];
  selectedEdgeId: string | null;
  selectedEdgeKind: 'lineage' | 'er' | null;
  selectedAnnotationId: string | null;
  highlightedNodeIds: string[];
  hoveredColumnId: string | null;
  error: string | null;
  isModelLoading: boolean;
  isCliMode: boolean;
  isAutoSaveEnabled: boolean;
  lastSavedAt: number;
  savingStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastUpdateSource: 'user' | 'visual' | 'undo';
  undoStack: Schema[];
  redoStack: Schema[];

  // YAML Input (Sidebar State)
  yamlInput: string;
  baselineYaml: string;
  baselineTimestamp: number;
  setYamlInput: (yaml: string) => void;
  syncToYamlInput: () => void;
  
  // Multi-file state
  availableFiles: ModelFile[];
  currentModelSlug: string | null;
  
  // UI State
  isSidebarOpen: boolean;
  isRightPanelOpen: boolean;
  isSpecPanelOpen: boolean;
  isQuickConnectBarOpen: boolean;
  isTerminalOpen: boolean;
  connectMode: 'lineage' | 'er' | null;
  activeTab: 'yaml' | 'stats';
  activeRightPanelTab: 'search' | 'path' | 'notes' | 'decisions' | 'spec';
  focusNodeId: string | null;
  pathFinderResult: { nodeIds: string[], edgeIds: string[] } | null;
  showER: boolean;
  showLineage: boolean;
  showAnnotations: boolean;
  isCompactMode: boolean;
  isDrawMode: boolean;
  theme: 'dark' | 'light';
  isDetailPanelOpen: boolean;
  
  // Actions
  setSchema: (schema: any) => void;
  setSelectedTableId: (id: string | null) => void;
  setSelectedTableIds: (ids: string[]) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setHighlightedNodeIds: (ids: string[]) => void;
  setIsDetailPanelOpen: (open: boolean) => void;
  setHoveredColumnId: (id: string | null) => void;
  setIsCliMode: (isCli: boolean) => void;
  setShowER: (show: boolean) => void;
  setShowLineage: (show: boolean) => void;
  setShowAnnotations: (show: boolean) => void;
  setIsCompactMode: (v: boolean) => void;
  setIsDrawMode: (v: boolean) => void;
  setIsAutoSaveEnabled: (enabled: boolean) => void;
  setLastUpdateSource: (source: 'user' | 'visual' | 'undo') => void;
  undo: () => void;
  redo: () => void;
  parseAndSetSchema: (yaml: string) => void;
  setError: (error: string | null) => void;
  updateNodePosition: (id: string, x: number, y: number, parentId?: string | null) => void;
  updateNodesPosition: (nodes: { id: string, x: number, y: number, parentId?: string | null }[]) => void;
  updateNodeDimensions: (id: string, width: number, height: number) => void;
  saveSchema: (force?: boolean) => Promise<void>;
  refreshModelData: () => Promise<void>;

  // Modeling Actions
  addTable: (x: number, y: number, name?: string) => void;
  addDomain: (x: number, y: number, name?: string) => void;
  addConsumer: (x: number, y: number, name?: string) => void;
  addRelationship: (source: string, target: string, sourceHandle?: string | null, targetHandle?: string | null, relType?: Relationship['type']) => void;
  bulkAddRelationship: (source: { table: string, column?: string }, targetPattern: string, type: Relationship['type'] | 'lineage') => void;
  addLineage: (source: string, target: string) => void;
  updateLineageDescription: (from: string, to: string, description: string) => void;
  updateRelationshipDescription: (id: string, description: string) => void;
  updateRelationship: (index: number, updates: Partial<Relationship>) => void;
  removeEdge: (sourceId: string, targetId: string, kind?: 'er' | 'lineage') => void;
  removeEdgeById: (id: string) => void;
  removeNode: (id: string) => void;
  bulkRemoveTables: (ids: string[]) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  renameTableId: (oldId: string, newId: string) => void;
  renameColumnId: (tableId: string, oldId: string, newId: string) => void;
  updateDomain: (id: string, updates: Partial<Domain>) => void;
  assignTableToDomain: (tableId: string, domainId?: string | null) => void;
  bulkAssignTablesToDomain: (tableIds: string[], domainId: string | null) => void;
  distributeSelectedTables: (direction: 'horizontal' | 'vertical') => void;
  applyLayout: (newLayout: Record<string, any>) => void;
  executeCommand: (input: string) => { status: 'success' | 'error', message: string };
  toggleTableSelection: (id: string) => void;
  toggleEdgeSelection: (id: string, kind: 'lineage' | 'er') => void;
  toggleAnnotationSelection: (id: string) => void;
  
  // Annotation Actions
  addAnnotation: (offset: { x: number, y: number }, targetId?: string, targetType?: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  
  // Multi-file Actions
  fetchAvailableFiles: () => Promise<void>;
  setCurrentModel: (slug: string) => Promise<void>;
  
  // Sidebar Actions
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsRightPanelOpen: (isOpen: boolean) => void;
  setIsSpecPanelOpen: (isOpen: boolean) => void;
  setIsQuickConnectBarOpen: (isOpen: boolean) => void;
  setIsTerminalOpen: (isOpen: boolean) => void;
  setConnectMode: (mode: 'lineage' | 'er' | null) => void;
  setActiveTab: (tab: 'yaml' | 'stats') => void;
  setActiveRightPanelTab: (tab: 'search' | 'path' | 'notes' | 'decisions' | 'spec') => void;
  setPathFinderResult: (result: { nodeIds: string[], edgeIds: string[] } | null) => void;
  setFocusNodeId: (id: string | null) => void;
  toggleTheme: () => void;
  
  // Cytoscape instance (for export)
  cyInstance: any | null;
  setCyInstance: (cy: any | null) => void;

  // Computed (helpers)
  getSelectedTable: () => Table | null;
  getSelectedDomain: () => Domain | null;
  getSelectedConsumer: () => Consumer | null;
  getSelectedRelationship: () => { relationship: Relationship; index: number; kind: 'er' | 'lineage' } | null;
  getSelectedAnnotation: () => Annotation | null;
  updateConsumer: (id: string, updates: Partial<Consumer>) => void;
}

let saveTimeout: any = null;

const HISTORY_LIMIT = 50;

// Push current schema onto the undo stack, clearing the redo stack (new action invalidates future).
const pushHistory = (get: () => AppState, set: (partial: Partial<AppState>) => void) => {
  const { schema, undoStack } = get();
  if (!schema) return;
  const snapshot = JSON.parse(JSON.stringify(schema)) as Schema;
  const newStack = [...undoStack, snapshot];
  const trimmed = newStack.length > HISTORY_LIMIT ? newStack.slice(newStack.length - HISTORY_LIMIT) : newStack;
  set({ undoStack: trimmed, redoStack: [] });
};

export const useStore = create<AppState>()(persist(
  (set, get) => ({
  schema: null,
  selectedTableId: null,
  selectedTableIds: [],
  selectedEdgeId: null,
  selectedEdgeKind: null,
  selectedAnnotationId: null,
  highlightedNodeIds: [],
  hoveredColumnId: null,
  isModelLoading: false,
  error: null,
  isCliMode: (typeof window !== 'undefined' && (window as any).MODSCAPE_CLI_MODE === true),
  isAutoSaveEnabled: true,
  lastSavedAt: 0,
  savingStatus: 'idle',
  lastUpdateSource: 'visual',
  undoStack: [],
  redoStack: [],

  // YAML Input
  yamlInput: '',
  baselineYaml: '',
  baselineTimestamp: 0,
  setYamlInput: (yaml) => {
    set({ yamlInput: yaml, lastUpdateSource: 'user', lastSavedAt: Date.now() });
    get().saveSchema();
  },
  syncToYamlInput: () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const { schema } = get();
      if (schema) {
        const yamlString = yaml.dump(schema, { indent: 2, lineWidth: -1, noRefs: true });
        set({ yamlInput: yamlString, lastUpdateSource: 'visual' });
        get().saveSchema();
      }
      syncTimer = null;
    }, 300);
  },

  // Multi-file Defaults
  availableFiles: [],
  currentModelSlug: null,

  // UI Defaults
  isSidebarOpen: false,
  isRightPanelOpen: false,
  isSpecPanelOpen: false,
  isQuickConnectBarOpen: false,
  isTerminalOpen: false,
  connectMode: null,
  activeTab: 'yaml',
  activeRightPanelTab: 'search',
  focusNodeId: null,
  pathFinderResult: null,
  showER: true,
  showLineage: true,
  showAnnotations: true,
  isCompactMode: false,
  isDrawMode: false,
  theme: 'dark',
  isDetailPanelOpen: false,
  cyInstance: null,

  setSchema: (schema) => {
    const normalized = normalizeSchema(schema);
    const baselineYaml = yaml.dump(normalized, { indent: 2, lineWidth: -1, noRefs: true });
    set({ schema: normalized, baselineYaml, baselineTimestamp: Date.now() });
    get().syncToYamlInput();
  },

  setError: (error) => set({ error }),

  parseAndSetSchema: (yamlStr) => {
    try {
      const schema = parseYAML(yamlStr);
      set({ schema, error: null });
      get().saveSchema(); // 3sガードを効かせるために呼ぶ（内部でlastUpdateSourceをチェック）
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  setSelectedTableId: (id) => set({
    selectedTableId: id,
    selectedEdgeId: null,
    selectedAnnotationId: null,
    isDetailPanelOpen: id ? get().isDetailPanelOpen : false
  }),

  setSelectedTableIds: (ids) => set({
    selectedTableIds: ids,
  }),

  setSelectedEdgeId: (id) => set({
    selectedEdgeId: id,
    selectedEdgeKind: null,
    selectedTableId: null,
    selectedAnnotationId: null,
    isDetailPanelOpen: id ? get().isDetailPanelOpen : false
  }),

  setSelectedAnnotationId: (id) => set({
    selectedAnnotationId: id,
    selectedTableId: null,
    selectedEdgeId: null,
    isDetailPanelOpen: id ? get().isDetailPanelOpen : false
  }),

  setHighlightedNodeIds: (ids) => set({ highlightedNodeIds: ids }),

  setIsDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
  setHoveredColumnId: (id) => set({ hoveredColumnId: id }),
  setIsCliMode: (isCli) => set({ isCliMode: isCli }),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setIsRightPanelOpen: (isOpen) => set({ isRightPanelOpen: isOpen }),
  setIsSpecPanelOpen: (isOpen) => set({ isSpecPanelOpen: isOpen }),
  setIsQuickConnectBarOpen: (isOpen) => set({ isQuickConnectBarOpen: isOpen }),
  setIsTerminalOpen: (isOpen: boolean) => set({ isTerminalOpen: isOpen }),
  setConnectMode: (mode) => set({ connectMode: mode }),
  setActiveTab: (tab) => set({ activeTab: tab, isSidebarOpen: true }),
  setActiveRightPanelTab: (tab) => set({ activeRightPanelTab: tab, isRightPanelOpen: true }),
  setIsAutoSaveEnabled: (enabled) => set({ isAutoSaveEnabled: enabled }),
  setCyInstance: (cy) => set({ cyInstance: cy }),
  setLastUpdateSource: (source) => set({ lastUpdateSource: source }),

  undo: () => {
    const { schema, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;
    const prevSchema = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = schema ? [...redoStack, JSON.parse(JSON.stringify(schema)) as Schema] : redoStack;
    set({ schema: prevSchema, undoStack: newUndoStack, redoStack: newRedoStack, lastUpdateSource: 'undo' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  redo: () => {
    const { schema, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;
    const nextSchema = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = schema ? [...undoStack, JSON.parse(JSON.stringify(schema)) as Schema] : undoStack;
    set({ schema: nextSchema, undoStack: newUndoStack, redoStack: newRedoStack, lastUpdateSource: 'visual' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  setPathFinderResult: (result) => set({ pathFinderResult: result }),
  setFocusNodeId: (id) => set({ focusNodeId: id }),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  setShowER: (show) => set({ showER: show }),
  setShowLineage: (show) => set({ showLineage: show }),
  setShowAnnotations: (show) => set({ showAnnotations: show }),
  setIsCompactMode: (v: boolean) => set({ isCompactMode: v }),
  setIsDrawMode: (v) => set({ isDrawMode: v }),

  updateNodePosition: (id, x, y, parentId) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const currentLayout = schema.layout || {};
    const existing = currentLayout[id] || {};
    const newLayout = {
      ...currentLayout,
      [id]: { ...existing, x: Math.round(x), y: Math.round(y), ...(parentId ? { parentId } as any : {}) }
    };
    set({ schema: { ...schema, layout: newLayout }, lastUpdateSource: 'visual' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateNodesPosition: (updates) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const currentLayout = schema.layout || {};
    const newLayout = { ...currentLayout };
    updates.forEach(({ id, x, y, parentId }) => {
      const existing = newLayout[id] || {};
      newLayout[id] = { ...existing, x: Math.round(x), y: Math.round(y), ...(parentId ? { parentId } as any : {}) };
    });
    set({ schema: { ...schema, layout: newLayout }, lastUpdateSource: 'visual' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateNodeDimensions: (id, width, height) => {
    const { schema } = get();
    if (!schema) return;
    // x/y のデフォルトを持ちつつ既存エントリをマージして parentId 等を保持する
    const currentLayout = { x: 0, y: 0, ...schema.layout?.[id] };
    const newLayout = { 
      ...(schema.layout || {}), 
      [id]: { ...currentLayout, width, height } 
    };
    set({ schema: { ...schema, layout: newLayout } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  saveSchema: async (force = false) => {
    const { schema, isCliMode, isAutoSaveEnabled, lastUpdateSource, currentModelSlug } = get();

    // refreshModelData の3秒ガードを確実に効かせるため、
    // saveSchema 呼び出し時点で即座に lastSavedAt を更新する。
    set({ lastSavedAt: Date.now() });

    // ユーザー操作（エディタ入力等）の場合はファイル書き込みは不要
    if (lastUpdateSource === 'user') return;

    if (!isCliMode || (!isAutoSaveEnabled && !force)) return;

    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      // 実際の送信直前に再度、現在のモデルを確認する（切り替え直後の割り込み防止）
      const activeModel = get().currentModelSlug;
      if (currentModelSlug !== activeModel) return;

      try {
        const yamlStr = yaml.dump(schema, { indent: 2, lineWidth: -1, noRefs: true });
        const query = activeModel ? `?model=${activeModel}` : '';
        await fetch(`/api/save${query}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yaml: yamlStr })
        });
        set({ lastSavedAt: Date.now(), savingStatus: 'saved' });
        setTimeout(() => set({ savingStatus: 'idle' }), 2000);
      } catch (e) {
        set({ savingStatus: 'error' });
      }
    }, 1000);
    set({ savingStatus: 'saving' });
  },

  refreshModelData: async () => {
    const { lastSavedAt } = get();
    const diff = Date.now() - lastSavedAt;
    
    // 自身が変更・保存してから3秒以内は、サーバーからの通知によるリフレッシュを無視する
    if (diff < 3000) return;

    try {
      const res = await fetch('/api/model' + window.location.search);
      if (!res.ok) {
        const msg = await res.text();
        set({ error: msg, schema: null });
        return;
      }
      const data = await res.json();
      const newSchema = normalizeSchema(data);
      const { selectedTableId } = get();
      // Preserve table/domain/consumer selection if the entity still exists in the refreshed schema
      const entityIds = new Set([
        ...(newSchema.tables || []).map(t => t.id),
        ...(newSchema.domains || []).map(d => d.id),
        ...(newSchema.consumers || []).map(c => c.id),
      ]);
      const nextSelectedTableId = selectedTableId && entityIds.has(selectedTableId) ? selectedTableId : null;
      set({
        schema: newSchema,
        selectedTableId: nextSelectedTableId,
        selectedEdgeId: null,
        selectedAnnotationId: null,
        error: null,
        // Close panel only if the selected entity no longer exists
        isDetailPanelOpen: nextSelectedTableId ? get().isDetailPanelOpen : false,
      });
      // Update YAML viewer without triggering a redundant write-back to disk
      const yamlString = yaml.dump(newSchema, { indent: 2, lineWidth: -1, noRefs: true });
      set({ yamlInput: yamlString, baselineYaml: yamlString, baselineTimestamp: Date.now(), lastUpdateSource: 'visual' });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addTable: (x, y, name) => {
    pushHistory(get, set);
    const schema = get().schema || { tables: [], relationships: [], domains: [], layout: {} };
    const newId = name ? name.toLowerCase().replace(/\s+/g, '_') : `new_table_${Date.now()}`;
    const newTable: Table = {
      id: newId,
      conceptual: { name: name || 'NEW_TABLE', kind: 'table' },
      columns: [{ id: 'id', name: 'ID', type: 'Integer', isPrimaryKey: true }]
    };
    const newSchema = {
      ...schema,
      tables: [...(schema.tables || []), newTable],
      layout: { ...(schema.layout || {}), [newId]: { x: Math.round(x), y: Math.round(y) } }
    };
    set({ schema: normalizeSchema(newSchema), selectedTableId: newId });
    get().syncToYamlInput();
    get().saveSchema();
  },

  addDomain: (x, y, name) => {
    pushHistory(get, set);
    const schema = get().schema || { tables: [], relationships: [], domains: [], layout: {} };
    const newId = name ? name.toLowerCase().replace(/\s+/g, '_') : `new_domain_${Date.now()}`;
    const newDomain = {
      id: newId,
      name: name || 'NEW_DOMAIN',
      description: 'Domain purpose',
      tables: [],
      color: 'rgba(59, 130, 246, 0.05)'
    };
    const newSchema = {
      ...schema,
      domains: [...(schema.domains || []), newDomain],
      layout: { ...(schema.layout || {}), [newId]: { x: Math.round(x), y: Math.round(y), width: 600, height: 400 } }
    };
    set({ schema: normalizeSchema(newSchema), selectedTableId: newId });
    get().syncToYamlInput();
    get().saveSchema();
  },

  addConsumer: (x, y, name) => {
    pushHistory(get, set);
    const schema = get().schema || { tables: [], relationships: [], layout: {} };
    const newId = name ? name.toLowerCase().replace(/\s+/g, '_') : `new_usecase_${Date.now()}`;
    const newUsecase = {
      id: newId,
      name: name || 'NEW_CONSUMER',
      display: { icon: '📊' }
    };
    const newSchema = {
      ...schema,
      consumers: [...(schema.consumers || []), newUsecase],
      layout: { ...(schema.layout || {}), [newId]: { x: Math.round(x), y: Math.round(y) } }
    };
    set({ schema: normalizeSchema(newSchema), selectedTableId: newId });
    get().syncToYamlInput();
    get().saveSchema();
  },

  addRelationship: (source, target, sourceHandle, targetHandle, relType) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const sCol = sourceHandle?.split('-')[1];
    const tCol = targetHandle?.split('-')[1];
    const newRel: Relationship = {
      from: { table: source, column: sCol ? [sCol] : undefined },
      to: { table: target, column: tCol ? [tCol] : undefined },
      type: relType ?? 'one-to-many'
    };
    const newSchema = { ...schema, relationships: [...(schema.relationships || []), newRel] };
    set({ schema: normalizeSchema(newSchema) });
    get().syncToYamlInput();
    get().saveSchema();
  },

  bulkAddRelationship: (source, targetPattern, type) => {
    const { schema } = get();
    if (!schema) return;
    const regex = new RegExp('^' + targetPattern.replace(/\*/g, '.*') + '$', 'i');
    const matchedTables = schema.tables.filter(t => regex.test(t.id) || (t.columns || []).some(c => regex.test(`${t.id}.${c.id}`)));

    if (type === 'lineage') {
      const existing = schema.lineage ?? [];
      const newEdges = matchedTables
        .filter(t => !existing.some(e => e.from === source.table && e.to === t.id))
        .map(t => ({ from: source.table, to: t.id }));
      set({ schema: { ...schema, lineage: [...existing, ...newEdges] } });
    } else {
      const newRels = matchedTables.map(t => {
        let targetCol: string[] | undefined = undefined;
        if (targetPattern.includes('.')) targetCol = [targetPattern.split('.')[1]];
        return { from: source, to: { table: t.id, column: targetCol }, type };
      });
      const newSchema = { ...schema, relationships: [...(schema.relationships || []), ...newRels] };
      set({ schema: normalizeSchema(newSchema) });
    }

    get().syncToYamlInput();
    get().saveSchema();
  },

  addLineage: (source, target) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const existing = schema.lineage ?? [];
    if (existing.some(e => e.from === source && e.to === target)) return; // already exists
    const newSchema = { ...schema, lineage: [...existing, { from: source, to: target }] };
    set({ schema: normalizeSchema(newSchema) });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateLineageDescription: (from, to, description) => {
    const { schema } = get();
    if (!schema) return;
    const newLineage = (schema.lineage ?? []).map(e =>
      e.from === from && e.to === to ? { ...e, description: description || undefined } : e
    );
    set({ schema: { ...schema, lineage: newLineage } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateRelationshipDescription: (id, description) => {
    const { schema } = get();
    if (!schema) return;
    const newRels = schema.relationships.map(r =>
      r.id === id ? { ...r, description: description || undefined } : r
    );
    set({ schema: { ...schema, relationships: newRels } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateRelationship: (index, updates) => {
    const { schema } = get();
    if (!schema) return;
    const newRels = [...schema.relationships];
    newRels[index] = { ...newRels[index], ...updates };
    set({ schema: { ...schema, relationships: newRels } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  removeEdge: (sourceId, targetId, kind) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const newRels = (kind === 'lineage')
      ? schema.relationships
      : schema.relationships.filter(r => !(r.from.table === sourceId && r.to.table === targetId));
    const newLineage = (kind === 'er')
      ? (schema.lineage ?? [])
      : (schema.lineage ?? []).filter(e => !(e.from === sourceId && e.to === targetId));
    set({ schema: { ...schema, relationships: newRels, lineage: newLineage }, selectedEdgeId: null });
    get().syncToYamlInput();
    get().saveSchema();
  },

  removeEdgeById: (id) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const newRels = (schema.relationships ?? []).filter(r => r.id !== id);
    const newLineage = (schema.lineage ?? []).filter(e => e.id !== id);
    set({ schema: { ...schema, relationships: newRels, lineage: newLineage }, selectedEdgeId: null });
    get().syncToYamlInput();
    get().saveSchema();
  },

  removeNode: (id) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const isDomain = (schema.domains || []).some(d => d.id === id);
    const newTables = schema.tables.filter(t => t.id !== id);
    const newUsecases = (schema.consumers || []).filter(u => u.id !== id);
    const newDomains = (schema.domains || []).filter(d => d.id !== id).map(d => ({ ...d, members: d.members.filter(tid => tid !== id) }));
    const newRelationships = schema.relationships.filter(r => r.from.table !== id && r.to.table !== id);
    const newLineage = (schema.lineage ?? []).filter(e => e.from !== id && e.to !== id);
    const newLayout = { ...(schema.layout || {}) };
    delete newLayout[id];

    // If a domain was deleted, clear parentId for all tables that were inside it (internal use)
    if (isDomain) {
      Object.keys(newLayout).forEach(key => {
        if ((newLayout[key] as any).parentId === id) {
          delete (newLayout[key] as any).parentId;
        }
      });
    }

    set({ schema: { ...schema, tables: newTables, consumers: newUsecases, domains: newDomains, relationships: newRelationships, lineage: newLineage, layout: newLayout }, selectedTableId: null, lastUpdateSource: 'visual' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  bulkRemoveTables: (ids) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const idSet = new Set(ids);
    const newTables = schema.tables.filter(t => !idSet.has(t.id));
    const newLayout = { ...(schema.layout || {}) };
    ids.forEach(id => delete newLayout[id]);
    const newRelationships = (schema.relationships || []).filter(r => !idSet.has(r.from.table) && !idSet.has(r.to.table));
    const newLineage = (schema.lineage ?? []).filter(e => !idSet.has(e.from) && !idSet.has(e.to));
    const newDomains = (schema.domains || []).map(d => ({ ...d, members: d.members.filter(tid => !idSet.has(tid)) }));
    set({ schema: { ...schema, tables: newTables, relationships: newRelationships, lineage: newLineage, domains: newDomains, layout: newLayout }, selectedTableIds: [] });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateTable: (id, updates) => {
    const { schema } = get();
    if (!schema) return;
    const newTables = schema.tables.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ schema: { ...schema, tables: newTables } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  renameTableId: (oldId, newId) => {
    const { schema } = get();
    if (!schema) return;
    const trimmed = newId.trim();
    if (!trimmed || trimmed === oldId) return;
    // Duplicate check across tables, domains, consumers
    const allIds = [
      ...schema.tables.map(t => t.id),
      ...(schema.domains || []).map(d => d.id),
      ...(schema.consumers || []).map(c => c.id),
    ];
    if (allIds.includes(trimmed)) {
      set({ error: `ID "${trimmed}" already exists.` });
      return;
    }
    pushHistory(get, set);
    const newTables = schema.tables.map(t => t.id === oldId ? { ...t, id: trimmed } : t);
    const newLayout: Schema['layout'] = {};
    for (const [k, v] of Object.entries(schema.layout || {})) {
      newLayout[k === oldId ? trimmed : k] = v;
    }
    const newDomains = (schema.domains || []).map(d => ({
      ...d,
      members: d.members.map(m => m === oldId ? trimmed : m),
    }));
    const newRelationships = schema.relationships.map(r => ({
      ...r,
      from: { ...r.from, table: r.from.table === oldId ? trimmed : r.from.table },
      to: { ...r.to, table: r.to.table === oldId ? trimmed : r.to.table },
    }));
    const newLineage = (schema.lineage || []).map(l => ({
      ...l,
      from: l.from === oldId ? trimmed : l.from,
      to: l.to === oldId ? trimmed : l.to,
    }));
    const newAnnotations = (schema.annotations || []).map(a => ({
      ...a,
      target: a.target?.id === oldId ? { ...a.target, id: trimmed } : a.target,
    }));
    const newSchema: Schema = {
      ...schema,
      tables: newTables,
      layout: newLayout,
      domains: newDomains,
      relationships: newRelationships,
      lineage: newLineage,
      annotations: newAnnotations,
    };
    const newSelectedId = get().selectedTableId === oldId ? trimmed : get().selectedTableId;
    set({ schema: newSchema, selectedTableId: newSelectedId, error: null });
    get().syncToYamlInput();
    get().saveSchema();
  },

  renameColumnId: (tableId, oldId, newId) => {
    const { schema } = get();
    if (!schema) return;
    const trimmed = newId.trim();
    if (!trimmed || trimmed === oldId) return;
    const table = schema.tables.find(t => t.id === tableId);
    if (!table) return;
    const colIds = (table.columns || []).map(c => c.id);
    if (colIds.includes(trimmed)) {
      set({ error: `Column ID "${trimmed}" already exists in table "${tableId}".` });
      return;
    }
    pushHistory(get, set);
    const newTables = schema.tables.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        columns: (t.columns || []).map(c => c.id === oldId ? { ...c, id: trimmed } : c),
      };
    });
    const newRelationships = schema.relationships.map(r => ({
      ...r,
      from: r.from.table === tableId && r.from.column?.includes(oldId)
        ? { ...r.from, column: r.from.column.map(c => c === oldId ? trimmed : c) }
        : r.from,
      to: r.to.table === tableId && r.to.column?.includes(oldId)
        ? { ...r.to, column: r.to.column.map(c => c === oldId ? trimmed : c) }
        : r.to,
    }));
    set({ schema: { ...schema, tables: newTables, relationships: newRelationships }, error: null });
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateDomain: (id, updates) => {
    const { schema } = get();
    if (!schema) return;
    const newDomains = (schema.domains || []).map(d => d.id === id ? { ...d, ...updates } : d);
    set({ schema: { ...schema, domains: newDomains } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  assignTableToDomain: (tableId, domainId) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const newDomains = (schema.domains || []).map(domain => {
      const filteredTables = domain.members.filter(id => id !== tableId);
      if (domain.id === domainId) return { ...domain, members: Array.from(new Set([...filteredTables, tableId])) };
      return { ...domain, members: filteredTables };
    });
    const newLayout = {
      ...(schema.layout || {}),
      // 既存の width/height を保持しつつ parentId を設定する
      [tableId]: { x: 20, y: 20, ...schema.layout?.[tableId], ...(domainId ? { parentId: domainId } as any : {}) }
    };
    set({ schema: { ...schema, domains: newDomains, layout: newLayout } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  bulkAssignTablesToDomain: (tableIds, domainId) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const newDomains = (schema.domains || []).map(domain => {
      const filteredTables = domain.members.filter(id => !tableIds.includes(id));
      if (domain.id === domainId) return { ...domain, members: Array.from(new Set([...filteredTables, ...tableIds])) };
      return { ...domain, members: filteredTables };
    });
    const newLayout = { ...(schema.layout || {}) };
    // Preserve existing x/y; set parentId internally for Cytoscape rendering
    if (domainId) tableIds.forEach(id => {
      const existing = newLayout[id] || {};
      newLayout[id] = { ...existing, x: existing.x ?? 20, y: existing.y ?? 20, ...(domainId ? { parentId: domainId } as any : {}) };
    });
    set({ schema: { ...schema, domains: newDomains, layout: newLayout } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  distributeSelectedTables: (direction) => {
    pushHistory(get, set);
    const { schema, selectedTableIds } = get();
    if (!schema || selectedTableIds.length < 2) return;
    const tablePositions = selectedTableIds.map(id => ({ id, pos: schema.layout?.[id] || { x: 0, y: 0 } }));
    if (direction === 'vertical') tablePositions.sort((a, b) => a.pos.y - b.pos.y);
    else tablePositions.sort((a, b) => a.pos.x - b.pos.x);
    const newLayout = { ...(schema.layout || {}) };
    const basePos = tablePositions[0].pos;
    tablePositions.forEach((item, index) => {
      newLayout[item.id] = {
        x: direction === 'vertical' ? basePos.x : basePos.x + (index * 280),
        y: direction === 'vertical' ? basePos.y + (index * 320) : basePos.y
      };
    });
    set({ schema: { ...schema, layout: newLayout } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  applyLayout: (newLayout) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    set({ schema: { ...schema, layout: newLayout }, lastUpdateSource: 'visual' });
    get().syncToYamlInput();
    get().saveSchema();
  },

  executeCommand: (input: string): { status: 'success' | 'error', message: string } => {
    const tokens = input.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return { status: 'error', message: 'Empty command' };
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const { schema } = get();

    const getCenter = (): { x: number, y: number } =>
      (window as any).__modscapeCanvasCenter?.() ?? { x: 400, y: 300 };

    const matchByGlob = (pattern: string): string[] => {
      if (!schema) return [];
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
      return schema.tables
        .filter(t => t.id === pattern || regex.test(t.id))
        .map(t => t.id);
    };

    try {
      if (cmd === 't') {
        const name = args.join(' ') || undefined;
        const c = getCenter();
        get().addTable(c.x - 160, c.y - 125, name);
        return { status: 'success', message: name ? `Added table: ${name}` : 'Added table' };
      }

      if (cmd === 'd') {
        const name = args.join(' ') || undefined;
        const c = getCenter();
        get().addDomain(c.x - 300, c.y - 200, name);
        return { status: 'success', message: name ? `Added domain: ${name}` : 'Added domain' };
      }

      if (cmd === 'c') {
        const name = args.join(' ') || undefined;
        const c = getCenter();
        get().addConsumer(c.x - 80, c.y - 30, name);
        return { status: 'success', message: name ? `Added consumer: ${name}` : 'Added consumer' };
      }

      if (cmd === 's') {
        const c = getCenter();
        get().addAnnotation({ x: c.x - 60, y: c.y - 40 });
        const text = args.join(' ');
        if (text) {
          const { selectedAnnotationId } = get();
          if (selectedAnnotationId) get().updateAnnotation(selectedAnnotationId, { text });
        }
        return { status: 'success', message: 'Added annotation' };
      }

      if (cmd === 'er') {
        if (args.length < 2) return { status: 'error', message: 'Usage: er <source> <target> [1n|n1|nn|11]' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [sourcePart, targetPart, typeShorthand] = args;
        const typeMap: Record<string, Relationship['type']> = {
          '1n': 'one-to-many', 'n1': 'many-to-one', 'nn': 'many-to-many', '11': 'one-to-one',
        };
        if (typeShorthand && !typeMap[typeShorthand]) return { status: 'error', message: 'Type must be 1n, n1, nn, or 11' };
        const relType = typeShorthand ? typeMap[typeShorthand] : undefined;
        const [sourceTable, sourceCol] = sourcePart.includes('.') ? sourcePart.split('.') : [sourcePart, undefined];
        const [targetTable, targetCol] = targetPart.includes('.') ? targetPart.split('.') : [targetPart, undefined];
        if (!schema.tables.some(t => t.id === sourceTable)) return { status: 'error', message: `Table not found: ${sourceTable}` };
        if (!schema.tables.some(t => t.id === targetTable)) return { status: 'error', message: `Table not found: ${targetTable}` };
        get().addRelationship(
          sourceTable,
          targetTable,
          sourceCol ? `port-${sourceCol}` : undefined,
          targetCol ? `port-${targetCol}` : undefined,
          relType,
        );
        return { status: 'success', message: `ER: ${sourcePart} → ${targetPart}${relType ? ` (${relType})` : ''}` };
      }

      if (cmd === 'ln') {
        if (args.length < 2) return { status: 'error', message: 'Usage: ln <source> <target>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [source, target] = args;
        if (!schema.tables.some(t => t.id === source)) return { status: 'error', message: `Table not found: ${source}` };
        if (!schema.tables.some(t => t.id === target)) return { status: 'error', message: `Table not found: ${target}` };
        get().addLineage(source, target);
        return { status: 'success', message: `Lineage: ${source} → ${target}` };
      }

      if (cmd === 'mv') {
        if (args.length < 2) return { status: 'error', message: 'Usage: mv <pattern> <domain>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [pattern, domainId] = args;
        if (!(schema.domains || []).some(d => d.id === domainId)) return { status: 'error', message: `Domain not found: ${domainId}` };
        const matched = matchByGlob(pattern);
        if (!matched.length) return { status: 'error', message: `No tables matched: ${pattern}` };
        get().bulkAssignTablesToDomain(matched, domainId);
        return { status: 'success', message: `Moved ${matched.length} table(s) to ${domainId}` };
      }

      if (cmd === 'del') {
        if (!args.length) return { status: 'error', message: 'Usage: del <id|pattern>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const pattern = args[0];
        // Check edge ID first (exact match only, no glob for edges)
        const matchedRel = (schema.relationships ?? []).find(r => r.id === pattern);
        const matchedLin = (schema.lineage ?? []).find(l => l.id === pattern);
        if (matchedRel || matchedLin) {
          get().removeEdgeById(pattern);
          return { status: 'success', message: `Deleted edge: ${pattern}` };
        }
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        const matchedTables = schema.tables.filter(t => t.id === pattern || regex.test(t.id)).map(t => t.id);
        const matchedDomains = (schema.domains || []).filter(d => d.id === pattern || regex.test(d.id)).map(d => d.id);
        if (!matchedTables.length && !matchedDomains.length) return { status: 'error', message: `No matches: ${pattern}` };
        matchedDomains.forEach(id => get().removeNode(id));
        if (matchedTables.length) get().bulkRemoveTables(matchedTables);
        return { status: 'success', message: `Deleted ${matchedTables.length + matchedDomains.length} node(s)` };
      }

      if (cmd === 'find') {
        if (!args.length) return { status: 'error', message: 'Usage: find <name>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const query = args.join(' ').toLowerCase();
        const match =
          schema.tables.find(t => t.id.toLowerCase().includes(query) || (t.conceptual?.name ?? '').toLowerCase().includes(query)) ||
          (schema.domains || []).find(d => d.id.toLowerCase().includes(query) || d.name.toLowerCase().includes(query));
        if (!match) return { status: 'error', message: `Not found: ${query}` };
        get().setFocusNodeId(match.id);
        return { status: 'success', message: `Focused: ${match.id}` };
      }

      if (cmd === 'fit') {
        ;(window as any).__modscapeFitView?.();
        return { status: 'success', message: 'View fitted' };
      }

      if (cmd === 'pos') {
        if (args.length < 3) return { status: 'error', message: 'Usage: pos <id> <x> <y>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [id, xStr, yStr] = args;
        const x = Number(xStr);
        const y = Number(yStr);
        if (isNaN(x) || isNaN(y)) return { status: 'error', message: 'x and y must be numbers' };
        const exists = schema.tables.some(t => t.id === id) || (schema.domains || []).some(d => d.id === id);
        if (!exists) return { status: 'error', message: `Node not found: ${id}` };
        get().updateNodePosition(id, x, y);
        return { status: 'success', message: `Moved ${id} to (${x}, ${y})` };
      }

      if (cmd === 'get') {
        if (!args.length) return { status: 'error', message: 'Usage: get <id>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const id = args[0];
        const table = schema.tables.find(t => t.id === id);
        if (table) {
          const domain = (schema.domains ?? []).find(d => (d.members ?? []).includes(id));
          const cols = (table.columns ?? []).map(c => {
            const flags = [c.isPrimaryKey ? '*' : '', c.isForeignKey ? '†' : ''].filter(Boolean).join('');
            return c.id + (flags ? `(${flags})` : '');
          }).join(', ') || '—';
          const ers = (schema.relationships ?? []).filter(r => r.from.table === id || r.to.table === id)
            .map(r => `${r.from.table} → ${r.to.table} [${r.type ?? '1n'}]`).join(', ') || '—';
          const lns = (schema.lineage ?? []).filter(l => l.from === id || l.to === id)
            .map(l => `${l.from} → ${l.to}`).join(', ') || '—';
          const msg = `${id}  (${table.conceptual?.kind ?? 'table'})  [${domain?.id ?? '—'}]\n  name   : ${table.conceptual?.name ?? id}\n  columns: ${cols}\n  er     : ${ers}\n  lineage: ${lns}`;
          return { status: 'success', message: msg };
        }
        const domain = (schema.domains ?? []).find(d => d.id === id);
        if (domain) {
          const members = (domain.members ?? []).join(', ') || '—';
          return { status: 'success', message: `${id}  (domain)\n  name   : ${domain.name}\n  members: ${members}` };
        }
        const rel = (schema.relationships ?? []).find(r => r.id === id);
        if (rel) {
          return { status: 'success', message: `${id}  (er)\n  ${rel.from.table}.${(rel.from.column ?? []).join(',')} → ${rel.to.table}.${(rel.to.column ?? []).join(',')}  [${rel.type ?? '1n'}]` };
        }
        const lin = (schema.lineage ?? []).find(l => l.id === id);
        if (lin) {
          return { status: 'success', message: `${id}  (lineage)\n  ${lin.from} → ${lin.to}` };
        }
        return { status: 'error', message: `Not found: ${id}` };
      }

      if (cmd === 'rename') {
        if (args.length < 2) return { status: 'error', message: 'Usage: rename <tableId> <newId>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [oldId, newId] = args;
        if (!schema.tables.some(t => t.id === oldId)) {
          if ((schema.domains ?? []).some(d => d.id === oldId)) return { status: 'error', message: 'Domain rename not supported' };
          return { status: 'error', message: `Table not found: ${oldId}` };
        }
        if (schema.tables.some(t => t.id === newId)) return { status: 'error', message: `ID already exists: ${newId}` };
        get().renameTableId(oldId, newId);
        return { status: 'success', message: `Renamed: ${oldId} → ${newId}` };
      }

      if (cmd === 'label') {
        if (args.length < 2) return { status: 'error', message: 'Usage: label <id> <name>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [id, ...nameParts] = args;
        const name = nameParts.join(' ');
        if (schema.tables.some(t => t.id === id)) {
          const table = schema.tables.find(t => t.id === id)!;
          get().updateTable(id, { conceptual: { ...table.conceptual, name } });
          return { status: 'success', message: `Updated name: ${id} → "${name}"` };
        }
        if ((schema.domains ?? []).some(d => d.id === id)) {
          get().updateDomain(id, { name });
          return { status: 'success', message: `Updated name: ${id} → "${name}"` };
        }
        return { status: 'error', message: `Not found: ${id}` };
      }

      if (cmd === 'col') {
        if (args.length < 3) return { status: 'error', message: 'Usage: col add|rm <tableId> <colId>' };
        if (!schema) return { status: 'error', message: 'No model loaded' };
        const [sub, tableId, colId] = args;
        const table = schema.tables.find(t => t.id === tableId);
        if (!table) return { status: 'error', message: `Table not found: ${tableId}` };
        const cols = table.columns ?? [];
        if (sub === 'add') {
          if (cols.some(c => c.id === colId)) return { status: 'error', message: `Column already exists: ${colId}` };
          get().updateTable(tableId, { columns: [...cols, { id: colId }] });
          return { status: 'success', message: `Added column: ${tableId}.${colId}` };
        }
        if (sub === 'rm') {
          if (!cols.some(c => c.id === colId)) return { status: 'error', message: `Column not found: ${colId}` };
          get().updateTable(tableId, { columns: cols.filter(c => c.id !== colId) });
          return { status: 'success', message: `Removed column: ${tableId}.${colId}` };
        }
        return { status: 'error', message: `Unknown sub-command: ${sub}. Use add or rm` };
      }

      if (cmd === 'theme') {
        const target = args[0]?.toLowerCase();
        if (target !== 'dark' && target !== 'light') return { status: 'error', message: 'Usage: theme dark|light' };
        if (get().theme !== target) get().toggleTheme();
        return { status: 'success', message: `Theme: ${target}` };
      }

      return { status: 'error', message: `Unknown command: ${cmd}` };
    } catch {
      return { status: 'error', message: 'Execution error' };
    }
  },

  toggleTableSelection: (id) => {
    const { selectedTableId } = get();
    if (selectedTableId === id) set({ selectedTableId: null, isDetailPanelOpen: false });
    else set({ selectedTableId: id, selectedEdgeId: null, selectedAnnotationId: null });
  },

  toggleEdgeSelection: (id, kind) => {
    const { selectedEdgeId } = get();
    if (selectedEdgeId === id) set({ selectedEdgeId: null, selectedEdgeKind: null });
    else set({ selectedEdgeId: id, selectedEdgeKind: kind, selectedTableId: null, selectedAnnotationId: null });
  },

  toggleAnnotationSelection: (id) => {
    const { selectedAnnotationId } = get();
    if (selectedAnnotationId === id) set({ selectedAnnotationId: null });
    else set({ selectedAnnotationId: id, selectedTableId: null, selectedEdgeId: null });
  },

  addAnnotation: (offset, targetId, targetType) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema) return;
    const newId = `note_${Date.now()}`;
    const newAnnotation: Annotation = { id: newId, target: targetId ? { id: targetId, type: (targetType ?? 'table') as any } : undefined, text: 'New Note', offset };
    const newSchema = { ...schema, annotations: [...(schema.annotations || []), newAnnotation] };
    set({ schema: normalizeSchema(newSchema), selectedAnnotationId: newId, selectedTableId: null, selectedEdgeId: null });
    if (!targetId) get().setFocusNodeId(newId);
    get().syncToYamlInput();
    get().saveSchema();
  },

  updateAnnotation: (id, updates) => {
    const { schema } = get();
    if (!schema || !schema.annotations) return;
    const newAnnotations = schema.annotations.map(a => a.id === id ? { ...a, ...updates } : a);
    set({ schema: { ...schema, annotations: newAnnotations } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  removeAnnotation: (id) => {
    pushHistory(get, set);
    const { schema } = get();
    if (!schema || !schema.annotations) return;
    const newAnnotations = schema.annotations.filter(a => a.id !== id);
    set({ schema: { ...schema, annotations: newAnnotations }, selectedAnnotationId: null });
    get().syncToYamlInput();
    get().saveSchema();
  },

  fetchAvailableFiles: async () => {
    const injectedData = (window as any).__MODSCAPE_DATA__;
    if (injectedData?.models) {
      const files = injectedData.models.map((m: any) => ({ slug: m.slug, name: m.name, path: '' }));
      set({ availableFiles: files });
      return;
    }
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      set({ availableFiles: data });
    } catch (e) { console.error('Failed to fetch files:', e); }
  },

  setCurrentModel: async (slug) => {
    // 旧モデルへの pending save をキャンセル（切り替え後に旧データで上書きされるのを防ぐ）
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set({ isModelLoading: true });
    try {
      const injectedData = (window as any).__MODSCAPE_DATA__;
      let data;
      if (injectedData?.models) {
        const model = injectedData.models.find((m: any) => m.slug === slug);
        data = model?.schema;
      } else {
        const res = await fetch(`/api/model?model=${slug}`);
        if (!res.ok) {
          const msg = await res.text();
          set({ error: msg, schema: null, isModelLoading: false });
          return;
        }
        data = await res.json();
      }
      const loadedSchema = normalizeSchema(data);
      const loadedYaml = yaml.dump(loadedSchema, { indent: 2, lineWidth: -1, noRefs: true });
      set({ schema: loadedSchema, currentModelSlug: slug, selectedTableId: null, selectedEdgeId: null, selectedAnnotationId: null, error: null, isModelLoading: false, undoStack: [], redoStack: [], baselineYaml: loadedYaml, baselineTimestamp: Date.now() });
      get().syncToYamlInput();
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('model', slug);
      window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
    } catch (e: any) { set({ error: e.message, isModelLoading: false }); }
  },

  getSelectedTable: () => {
    const { schema, selectedTableId } = get();
    if (!schema || !selectedTableId) return null;
    return schema.tables.find(t => t.id === selectedTableId) || null;
  },

  getSelectedDomain: () => {
    const { schema, selectedTableId } = get();
    if (!schema || !selectedTableId || !schema.domains) return null;
    return schema.domains.find(d => d.id === selectedTableId) || null;
  },

  getSelectedConsumer: () => {
    const { schema, selectedTableId } = get();
    if (!schema || !selectedTableId || !schema.consumers) return null;
    return schema.consumers.find(u => u.id === selectedTableId) || null;
  },

  updateConsumer: (id, updates) => {
    const { schema } = get();
    if (!schema) return;
    const newUsecases = (schema.consumers || []).map(u => u.id === id ? { ...u, ...updates } : u);
    set({ schema: { ...schema, consumers: newUsecases } });
    get().syncToYamlInput();
    get().saveSchema();
  },

  getSelectedRelationship: () => {
    const { schema, selectedEdgeId, selectedEdgeKind } = get();
    if (!schema || !selectedEdgeId) return null;

    if (selectedEdgeKind === 'lineage') {
      const idx = (schema.lineage || []).findIndex(e => e.id === selectedEdgeId);
      if (idx === -1) return null;
      const edge = schema.lineage![idx];
      return {
        relationship: {
          from: { table: edge.from },
          to: { table: edge.to },
          type: 'lineage' as any,
          description: edge.description
        },
        index: idx,
        kind: 'lineage' as const
      };
    }

    if (selectedEdgeKind === 'er') {
      const idx = (schema.relationships || []).findIndex(r => r.id === selectedEdgeId);
      if (idx === -1) return null;
      return { relationship: schema.relationships![idx], index: idx, kind: 'er' as const };
    }

    return null;
  },

  getSelectedAnnotation: () => {
    const { schema, selectedAnnotationId } = get();
    if (!schema || !selectedAnnotationId || !schema.annotations) return null;
    return schema.annotations.find(a => a.id === selectedAnnotationId) || null;
  },

  }),
  {
    name: 'modscape-ui-settings',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      theme: state.theme,
      showER: state.showER,
      showLineage: state.showLineage,
      showAnnotations: state.showAnnotations,
      isCompactMode: state.isCompactMode,
    }),
  }
));
