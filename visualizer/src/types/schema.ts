// ── Shared types ─────────────────────────────────────────────────────────────

export type TableKind = 'fact' | 'dimension' | 'hub' | 'link' | 'satellite' | 'mart' | 'table';
export type BuildStrategy = 'full' | 'incremental' | 'view' | 'ephemeral';
export type UpdateMode = 'merge' | 'append' | 'delete_insert';
export type Granularity = 'day' | 'month' | 'year' | 'hour';
export type AnnotationTargetType = 'table' | 'domain' | 'relationship' | 'lineage' | 'column';

// ── Column ───────────────────────────────────────────────────────────────────

export interface Column {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isPartitionKey?: boolean;
  additivity?: 'fully' | 'semi' | 'non';
  expression?: string;
  physical?: {
    name?: string;
    type?: string;
    constraints?: string[];
  };
}

// ── Table ────────────────────────────────────────────────────────────────────

export interface Table {
  id: string;
  isImported?: boolean; // runtime flag, read-only

  conceptual?: {
    name?: string;
    kind?: TableKind;
    description?: string;
  };

  logical?: {
    name?: string;
    grain?: string[];
    scd?: {
      type: string;
      business_key?: string[];
      valid_from?: string;
      valid_to?: string;
      current_flag?: string;
    };
  };

  physical?: {
    name?: string;
    schema?: string;
    strategy?: BuildStrategy;
    update_mode?: UpdateMode;
    merge_key?: string[];
    partition?: {
      field: string;
      granularity?: Granularity;
    };
    cluster?: string[];
    filter_key?: string;
    lookback?: string;
  };

  display?: {
    icon?: string;
    color?: string;
  };

  metadata?: Record<string, unknown>;
  sampleData?: unknown[][];
  columns?: Column[];
}

// ── Domain ───────────────────────────────────────────────────────────────────

export interface Domain {
  id: string;
  name: string;
  description?: string;
  members: string[];
  display?: {
    color?: string;
  };
}

// ── Consumer ─────────────────────────────────────────────────────────────────

export interface Consumer {
  id: string;
  name: string;
  description?: string;
  url?: string;
  display?: {
    icon?: string;
    color?: string;
  };
}

// ── Annotation ───────────────────────────────────────────────────────────────

export interface Annotation {
  id: string;
  text: string;
  target?: {
    id: string;
    type: AnnotationTargetType;
  };
  offset?: { x: number; y: number };
  display?: {
    color?: string;
  };
}

// ── Relationship ─────────────────────────────────────────────────────────────

export interface Relationship {
  id?: string;
  from: {
    table: string;
    column?: string[];
  };
  to: {
    table: string;
    column?: string[];
  };
  type?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  description?: string;
}

// ── Lineage ──────────────────────────────────────────────────────────────────

export interface LineageEdge {
  id?: string;
  from: string;
  to: string;
  description?: string;
  join_type?: 'inner' | 'left' | 'cross' | 'none';
}

// ── Import ───────────────────────────────────────────────────────────────────

export interface ImportEntry {
  from: string;
  ids?: string[];
}

// ── Layout ───────────────────────────────────────────────────────────────────

export interface LayoutEntry {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

// ── Schema (root) ─────────────────────────────────────────────────────────────

export interface Schema {
  version?: string;
  tables: Table[];
  relationships: Relationship[];
  lineage?: LineageEdge[];
  domains?: Domain[];
  consumers?: Consumer[];
  annotations?: Annotation[];
  imports?: ImportEntry[];
  layout?: Record<string, LayoutEntry>;
}
