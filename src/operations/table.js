import { readYaml, writeYaml, findTableById } from '../model-utils.js';

export function listTables(filePath) {
  const data = readYaml(filePath);
  return (data.tables || []).map(t => ({ id: t.id, name: t.name, type: t.appearance?.type ?? null }));
}

export function getTable(filePath, id) {
  const data = readYaml(filePath);
  const table = findTableById(data, id);
  if (!table) throw new Error(`Table "${id}" not found`);
  return table;
}

export function addTable(filePath, { id, name, type, logicalName, physicalName, description }) {
  const data = readYaml(filePath);
  if (findTableById(data, id)) throw new Error(`Table "${id}" already exists. Use updateTable instead.`);
  const table = { id, name };
  if (logicalName) table.logical_name = logicalName;
  if (physicalName) table.physical_name = physicalName;
  if (type) table.appearance = { type };
  if (description) table.conceptual = { description };
  if (!data.tables) data.tables = [];
  data.tables.push(table);
  writeYaml(filePath, data);
  return { id };
}

export function updateTable(filePath, { id, name, type, logicalName, physicalName, description }) {
  const data = readYaml(filePath);
  const table = findTableById(data, id);
  if (!table) throw new Error(`Table "${id}" not found. Use addTable instead.`);
  if (name) table.name = name;
  if (logicalName) table.logical_name = logicalName;
  if (physicalName) table.physical_name = physicalName;
  if (type) {
    table.appearance = table.appearance || {};
    table.appearance.type = type;
  }
  if (description) {
    table.conceptual = table.conceptual || {};
    table.conceptual.description = description;
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
