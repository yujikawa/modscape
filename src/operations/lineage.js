import path from 'path';
import { readYaml, writeYaml, findTableById, resolveImports } from '../model-utils.js';

export function listLineages(filePath) {
  const data = readYaml(filePath);
  return data.lineage || [];
}

export function listDownstreamLineages(entries, fromId, { recursive = false, depth = Infinity } = {}) {
  const direct = entries.filter(e => e.from === fromId);
  if (!recursive) return direct;

  const result = [];
  const visited = new Set();
  const queue = direct.map(e => ({ entry: e, d: 1 }));

  while (queue.length > 0) {
    const { entry, d } = queue.shift();
    const key = `${entry.from}-->${entry.to}`;
    if (visited.has(key)) continue;
    visited.add(key);
    result.push({ ...entry, depth: d });
    if (d < depth) {
      entries.filter(e => e.from === entry.to).forEach(e => queue.push({ entry: e, d: d + 1 }));
    }
  }
  return result;
}

function findNodeById(schema, id) {
  return findTableById(schema, id) || (schema.consumers || []).find(c => c.id === id) || (schema.metrics || []).find(m => m.id === id) || null;
}

export function addLineage(filePath, { from, to, id, description }) {
  const data = readYaml(filePath);
  const { schema: resolved } = resolveImports(data, path.dirname(path.resolve(filePath)));
  if (!findNodeById(resolved, from)) throw new Error(`Table or consumer "${from}" not found`);
  if (!findNodeById(resolved, to)) throw new Error(`Table or consumer "${to}" not found`);
  const entries = data.lineage || [];
  const lineageId = id || `lin-${from}-${to}`;
  if (entries.some(e => e.id === lineageId || (e.from === from && e.to === to))) {
    throw new Error(`Lineage "${lineageId}" already exists`);
  }
  const entry = { id: lineageId, from, to };
  if (description) entry.description = description;
  data.lineage = [...entries, entry];
  writeYaml(filePath, data);
  return { id: lineageId };
}

export function updateLineage(filePath, { id, from, to, description }) {
  const data = readYaml(filePath);
  const entries = data.lineage || [];
  const lineageId = id || (from && to ? `lin-${from}-${to}` : null);
  if (!lineageId) throw new Error('Specify id or both from and to');
  const idx = entries.findIndex(e => e.id === lineageId || (e.from === from && e.to === to));
  if (idx === -1) throw new Error(`Lineage "${lineageId}" not found`);
  const updated = { ...entries[idx] };
  if (description !== undefined) {
    if (description === '') delete updated.description;
    else updated.description = description;
  }
  data.lineage = [...entries.slice(0, idx), updated, ...entries.slice(idx + 1)];
  writeYaml(filePath, data);
  return { id: lineageId };
}

export function removeLineage(filePath, { id, from, to }) {
  const data = readYaml(filePath);
  const lineageId = id || (from && to ? `lin-${from}-${to}` : null);
  if (!lineageId) throw new Error('Specify id or both from and to');
  const before = (data.lineage || []).length;
  data.lineage = (data.lineage || []).filter(e => !(e.id === lineageId || (e.from === from && e.to === to)));
  if (data.lineage.length === before) throw new Error(`Lineage "${lineageId}" not found`);
  writeYaml(filePath, data);
  return { id: lineageId };
}
