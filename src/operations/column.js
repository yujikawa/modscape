import { readYaml, writeYaml, findTableById } from '../model-utils.js';

function findColumn(table, id) {
  return (table.columns || []).find(c => c.id === id) || null;
}

export function listColumns(filePath, tableId) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  return (table.columns || []).map(c => ({
    id: c.id,
    name: c.logical?.name,
    type: c.logical?.type ?? null,
    isPrimaryKey: c.logical?.isPrimaryKey ?? false,
    isForeignKey: c.logical?.isForeignKey ?? false,
  }));
}

export function addColumn(filePath, { tableId, id, name, type, isPrimaryKey, isForeignKey, physicalName, physicalType }) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  if (findColumn(table, id)) throw new Error(`Column "${id}" already exists in table "${tableId}"`);
  const column = { id, logical: { name } };
  if (type) column.logical.type = type;
  if (isPrimaryKey) column.logical.isPrimaryKey = true;
  if (isForeignKey) column.logical.isForeignKey = true;
  if (physicalName || physicalType) {
    column.physical = {};
    if (physicalName) column.physical.name = physicalName;
    if (physicalType) column.physical.type = physicalType;
  }
  if (!table.columns) table.columns = [];
  table.columns.push(column);
  writeYaml(filePath, data);
  return { tableId, id };
}

export function updateColumn(filePath, { tableId, id, name, type, isPrimaryKey, isForeignKey, physicalName, physicalType }) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  const column = findColumn(table, id);
  if (!column) throw new Error(`Column "${id}" not found in table "${tableId}"`);
  column.logical = column.logical || {};
  if (name) column.logical.name = name;
  if (type) column.logical.type = type;
  if (isPrimaryKey !== undefined) column.logical.isPrimaryKey = isPrimaryKey === 'true' || isPrimaryKey === true;
  if (isForeignKey !== undefined) column.logical.isForeignKey = isForeignKey === 'true' || isForeignKey === true;
  if (physicalName || physicalType) {
    column.physical = column.physical || {};
    if (physicalName) column.physical.name = physicalName;
    if (physicalType) column.physical.type = physicalType;
  }
  writeYaml(filePath, data);
  return { tableId, id };
}

export function removeColumn(filePath, { tableId, id }) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  const before = (table.columns || []).length;
  table.columns = (table.columns || []).filter(c => c.id !== id);
  if (table.columns.length === before) throw new Error(`Column "${id}" not found in table "${tableId}"`);
  writeYaml(filePath, data);
  return { tableId, id };
}
