import path from 'path';
import { readYaml, writeYaml, findTableById, findDomainById, resolveImports } from '../model-utils.js';

export function listDomains(filePath) {
  const data = readYaml(filePath);
  return (data.domains || []).map(d => ({ id: d.id, name: d.name }));
}

export function getDomain(filePath, id) {
  const data = readYaml(filePath);
  const domain = findDomainById(data, id);
  if (!domain) throw new Error(`Domain "${id}" not found`);
  return domain;
}

export function addDomain(filePath, { id, name, description, color }) {
  const data = readYaml(filePath);
  if (findDomainById(data, id)) throw new Error(`Domain "${id}" already exists. Use updateDomain instead.`);
  const domain = { id, name, members: [] };
  if (description) domain.description = description;
  if (color) domain.color = color;
  if (!data.domains) data.domains = [];
  data.domains.push(domain);
  writeYaml(filePath, data);
  return { id };
}

export function updateDomain(filePath, { id, name, description, color }) {
  const data = readYaml(filePath);
  const domain = findDomainById(data, id);
  if (!domain) throw new Error(`Domain "${id}" not found. Use addDomain instead.`);
  if (name) domain.name = name;
  if (description) domain.description = description;
  if (color) domain.color = color;
  writeYaml(filePath, data);
  return { id };
}

export function removeDomain(filePath, id) {
  const data = readYaml(filePath);
  const before = (data.domains || []).length;
  data.domains = (data.domains || []).filter(d => d.id !== id);
  if (data.domains.length === before) throw new Error(`Domain "${id}" not found`);
  writeYaml(filePath, data);
  return { id };
}

export function addDomainMember(filePath, { domainId, tableId }) {
  const data = readYaml(filePath);
  const { schema: resolved } = resolveImports(data, path.dirname(path.resolve(filePath)));
  const domain = findDomainById(data, domainId);
  if (!domain) throw new Error(`Domain "${domainId}" not found`);
  if (!findTableById(resolved, tableId)) throw new Error(`Table "${tableId}" not found`);
  if (!domain.members) domain.members = [];
  if (domain.members.includes(tableId)) throw new Error(`Table "${tableId}" is already in domain "${domainId}"`);
  domain.members.push(tableId);
  writeYaml(filePath, data);
  return { domainId, tableId };
}

export function removeDomainMember(filePath, { domainId, tableId }) {
  const data = readYaml(filePath);
  const domain = findDomainById(data, domainId);
  if (!domain) throw new Error(`Domain "${domainId}" not found`);
  const before = (domain.members || []).length;
  domain.members = (domain.members || []).filter(t => t !== tableId);
  if (domain.members.length === before) throw new Error(`Table "${tableId}" not found in domain "${domainId}"`);
  writeYaml(filePath, data);
  return { domainId, tableId };
}
