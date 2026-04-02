import { readYaml, writeYaml } from '../model-utils.js';

function findConsumerById(data, id) {
  return (data.consumers || []).find(c => c.id === id) || null;
}

export function listConsumers(filePath) {
  const data = readYaml(filePath);
  return data.consumers || [];
}

export function getConsumer(filePath, id) {
  const data = readYaml(filePath);
  const consumer = findConsumerById(data, id);
  if (!consumer) throw new Error(`Consumer "${id}" not found`);
  return consumer;
}

export function addConsumer(filePath, { id, name, description, icon, color, url }) {
  const data = readYaml(filePath);
  if (findConsumerById(data, id)) throw new Error(`Consumer "${id}" already exists. Use updateConsumer instead.`);
  const consumer = { id, name };
  if (description) consumer.description = description;
  if (icon || color) {
    consumer.appearance = {};
    if (icon) consumer.appearance.icon = icon;
    if (color) consumer.appearance.color = color;
  }
  if (url) consumer.url = url;
  if (!data.consumers) data.consumers = [];
  data.consumers.push(consumer);
  writeYaml(filePath, data);
  return { id };
}

export function updateConsumer(filePath, { id, name, description, icon, color, url }) {
  const data = readYaml(filePath);
  const consumer = findConsumerById(data, id);
  if (!consumer) throw new Error(`Consumer "${id}" not found. Use addConsumer instead.`);
  if (name) consumer.name = name;
  if (description !== undefined) consumer.description = description;
  if (icon !== undefined || color !== undefined) {
    consumer.appearance = consumer.appearance || {};
    if (icon !== undefined) consumer.appearance.icon = icon;
    if (color !== undefined) consumer.appearance.color = color;
  }
  if (url !== undefined) consumer.url = url;
  writeYaml(filePath, data);
  return { id };
}

export function removeConsumer(filePath, id) {
  const data = readYaml(filePath);
  const before = (data.consumers || []).length;
  data.consumers = (data.consumers || []).filter(c => c.id !== id);
  if (data.consumers.length === before) throw new Error(`Consumer "${id}" not found`);
  writeYaml(filePath, data);
  return { id };
}
