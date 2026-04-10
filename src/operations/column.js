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
    name: c.name ?? null,
    type: c.type ?? null,
    isPrimaryKey: c.isPrimaryKey ?? false,
    isForeignKey: c.isForeignKey ?? false,
  }));
}

export function addColumn(filePath, { tableId, id, name, type, isPrimaryKey, isForeignKey, isPartitionKey, physicalName, physicalType }) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  if (findColumn(table, id)) throw new Error(`Column "${id}" already exists in table "${tableId}"`);
  const column = { id };
  if (name) column.name = name;
  if (type) column.type = type;
  if (isPrimaryKey) column.isPrimaryKey = true;
  if (isForeignKey) column.isForeignKey = true;
  if (isPartitionKey) column.isPartitionKey = true;
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

export function updateColumn(filePath, { tableId, id, name, type, isPrimaryKey, isForeignKey, isPartitionKey, physicalName, physicalType }) {
  const data = readYaml(filePath);
  const table = findTableById(data, tableId);
  if (!table) throw new Error(`Table "${tableId}" not found`);
  const column = findColumn(table, id);
  if (!column) throw new Error(`Column "${id}" not found in table "${tableId}"`);
  if (name !== undefined) column.name = name;
  if (type !== undefined) column.type = type;
  if (isPrimaryKey !== undefined) column.isPrimaryKey = isPrimaryKey === 'true' || isPrimaryKey === true;
  if (isForeignKey !== undefined) column.isForeignKey = isForeignKey === 'true' || isForeignKey === true;
  if (isPartitionKey !== undefined) column.isPartitionKey = isPartitionKey === 'true' || isPartitionKey === true;
  if (physicalName !== undefined || physicalType !== undefined) {
    column.physical = column.physical || {};
    if (physicalName !== undefined) column.physical.name = physicalName;
    if (physicalType !== undefined) column.physical.type = physicalType;
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
