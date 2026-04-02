import path from 'path';
import { readYaml, writeYaml, findTableById, resolveImports } from '../model-utils.js';

function parseRef(ref) {
  const parts = ref.split('.');
  return { tableId: parts[0], columnId: parts[1] || null };
}

function sameRel(r, fromTableId, toTableId) {
  return r.from?.table === fromTableId && r.to?.table === toTableId;
}

export function listRelationships(filePath) {
  const data = readYaml(filePath);
  return data.relationships || [];
}

export function addRelationship(filePath, { from, to, type, id, description }) {
  const data = readYaml(filePath);
  const { schema: resolved } = resolveImports(data, path.dirname(path.resolve(filePath)));
  const fromRef = parseRef(from);
  const toRef = parseRef(to);
  if (!findTableById(resolved, fromRef.tableId)) throw new Error(`Table "${fromRef.tableId}" not found`);
  if (!findTableById(resolved, toRef.tableId)) throw new Error(`Table "${toRef.tableId}" not found`);
  const rels = data.relationships || [];
  const relId = id || (fromRef.columnId && toRef.columnId
    ? `rel-${fromRef.tableId}.${fromRef.columnId}-${toRef.tableId}.${toRef.columnId}`
    : `rel-${fromRef.tableId}-${toRef.tableId}-${type}`);
  if (rels.some(r => r.id === relId || sameRel(r, fromRef.tableId, toRef.tableId))) {
    throw new Error(`Relationship "${relId}" already exists`);
  }
  const rel = {
    id: relId,
    from: { table: fromRef.tableId, ...(fromRef.columnId ? { column: fromRef.columnId } : {}) },
    to: { table: toRef.tableId, ...(toRef.columnId ? { column: toRef.columnId } : {}) },
    type,
    ...(description ? { description } : {}),
  };
  data.relationships = [...rels, rel];
  writeYaml(filePath, data);
  return { id: relId };
}

export function updateRelationship(filePath, { id, from, to, type, description }) {
  const data = readYaml(filePath);
  const rels = data.relationships || [];
  const fromRef = from ? parseRef(from) : null;
  const toRef = to ? parseRef(to) : null;
  let idx = -1;
  if (id) {
    idx = rels.findIndex(r => r.id === id);
  } else if (fromRef && toRef) {
    const matches = rels.reduce((acc, r, i) => sameRel(r, fromRef.tableId, toRef.tableId) ? [...acc, i] : acc, []);
    if (matches.length > 1) throw new Error(`Multiple relationships found. Use --id to specify.`);
    idx = matches[0] ?? -1;
  } else {
    throw new Error('Specify id or both from and to');
  }
  if (idx === -1) throw new Error(`Relationship not found`);
  const updated = { ...rels[idx] };
  if (type !== undefined) updated.type = type;
  if (description !== undefined) {
    if (description === '') delete updated.description;
    else updated.description = description;
  }
  data.relationships = [...rels.slice(0, idx), updated, ...rels.slice(idx + 1)];
  writeYaml(filePath, data);
  return { id: updated.id };
}

export function removeRelationship(filePath, { id, from, to }) {
  const data = readYaml(filePath);
  const fromRef = from ? parseRef(from) : null;
  const toRef = to ? parseRef(to) : null;
  const before = (data.relationships || []).length;
  data.relationships = (data.relationships || []).filter(r => {
    if (id && r.id === id) return false;
    if (fromRef && toRef && sameRel(r, fromRef.tableId, toRef.tableId)) return false;
    return true;
  });
  if (data.relationships.length === before) throw new Error(`Relationship not found`);
  writeYaml(filePath, data);
  return { id };
}
