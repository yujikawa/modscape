import { readYaml, writeYaml } from '../model-utils.js';

function findMetricById(data, id) {
  return (data.metrics || []).find(m => m.id === id) || null;
}

export function listMetrics(filePath) {
  const data = readYaml(filePath);
  return data.metrics || [];
}

export function getMetric(filePath, id) {
  const data = readYaml(filePath);
  const metric = findMetricById(data, id);
  if (!metric) throw new Error(`Metric "${id}" not found`);
  return metric;
}

export function addMetric(filePath, { id, name, expression, description }) {
  const data = readYaml(filePath);
  if (findMetricById(data, id)) throw new Error(`Metric "${id}" already exists. Use updateMetric instead.`);
  const metric = { id, name };
  if (expression) metric.expression = expression;
  if (description) metric.description = description;
  if (!data.metrics) data.metrics = [];
  data.metrics.push(metric);
  writeYaml(filePath, data);
  return { id };
}

export function updateMetric(filePath, { id, name, expression, description }) {
  const data = readYaml(filePath);
  const metric = findMetricById(data, id);
  if (!metric) throw new Error(`Metric "${id}" not found. Use addMetric instead.`);
  if (name) metric.name = name;
  if (expression !== undefined) {
    if (expression === '') delete metric.expression;
    else metric.expression = expression;
  }
  if (description !== undefined) {
    if (description === '') delete metric.description;
    else metric.description = description;
  }
  writeYaml(filePath, data);
  return { id };
}

export function removeMetric(filePath, id) {
  const data = readYaml(filePath);
  const before = (data.metrics || []).length;
  data.metrics = (data.metrics || []).filter(m => m.id !== id);
  if (data.metrics.length === before) throw new Error(`Metric "${id}" not found`);
  writeYaml(filePath, data);
  return { id };
}
