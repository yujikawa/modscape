import { readYaml, writeYaml, findTableById } from '../model-utils.js';

export function listTables(filePath, { type, domainId, orphanOnly } = {}) {
  const data = readYaml(filePath);
  let tables = (data.tables || []).map(t => ({
    id: t.id,
    name: t.conceptual?.name ?? null,
    type: t.conceptual?.kind ?? null,
  }));

  if (type) {
    tables = tables.filter(t => t.type === type);
  }

  if (domainId) {
    const domain = (data.domains || []).find(d => d.id === domainId);
    const members = new Set(domain ? (domain.members || []) : []);
    tables = tables.filter(t => members.has(t.id));
  }

  if (orphanOnly) {
    const memberIds = new Set();
    for (const domain of (data.domains || [])) {
      for (const id of (domain.members || [])) {
        memberIds.add(id);
      }
    }
    tables = tables.filter(t => !memberIds.has(t.id));
  }

  return tables;
}

export function getTable(filePath, id) {
  const data = readYaml(filePath);
  const table = findTableById(data, id);
  if (!table) throw new Error(`Table "${id}" not found`);
  return table;
}

export function addTable(filePath, { id, name, kind, logicalName, physicalName, description }) {
  const data = readYaml(filePath);
  if (findTableById(data, id)) throw new Error(`Table "${id}" already exists. Use updateTable instead.`);
  const table = { id };
  const conceptual = {};
  if (name) conceptual.name = name;
  if (kind) conceptual.kind = kind;
  if (description) conceptual.description = description;
  if (Object.keys(conceptual).length > 0) table.conceptual = conceptual;
  if (logicalName) table.logical = { name: logicalName };
  if (physicalName) table.physical = { name: physicalName };
  if (!data.tables) data.tables = [];
  data.tables.push(table);
  writeYaml(filePath, data);
  return { id };
}

export function updateTable(filePath, { id, name, kind, logicalName, physicalName, description }) {
  const data = readYaml(filePath);
  const table = findTableById(data, id);
  if (!table) throw new Error(`Table "${id}" not found. Use addTable instead.`);
  if (name || kind || description) {
    table.conceptual = table.conceptual || {};
    if (name) table.conceptual.name = name;
    if (kind) table.conceptual.kind = kind;
    if (description) table.conceptual.description = description;
  }
  if (logicalName) {
    table.logical = table.logical || {};
    table.logical.name = logicalName;
  }
  if (physicalName) {
    table.physical = table.physical || {};
    table.physical.name = physicalName;
  }
  writeYaml(filePath, data);
  return { id };
}

export function removeTable(filePath, id) {
  const data = readYaml(filePath);
  const before = (data.tables || []).length;
  data.tables = (data.tables || []).filter(t => t.id !== id);
  if (data.tables.length === before) throw new Error(`Table "${id}" not found`);
  writeYaml(filePath, data);
  return { id };
}
