import { readYaml, writeYaml } from '../model-utils.js';

function findAnnotationById(data, id) {
  return (data.annotations || []).find(a => a.id === id) || null;
}

export function listAnnotations(filePath) {
  const data = readYaml(filePath);
  return data.annotations || [];
}

export function addAnnotation(filePath, { id, text, color, targetId, targetType, offset }) {
  const data = readYaml(filePath);
  const annotations = data.annotations || [];
  const resolvedId = id || `note-${Date.now()}`;
  if (annotations.some(a => a.id === resolvedId)) {
    throw new Error(`Annotation "${resolvedId}" already exists. Use updateAnnotation instead.`);
  }
  const annotation = { id: resolvedId };
  if (text !== undefined) annotation.text = text;
  if (targetId) annotation.target = { id: targetId, type: targetType || 'table' };
  annotation.offset = offset ?? { x: 0, y: 0 };
  if (color) annotation.display = { color };
  data.annotations = [...annotations, annotation];
  writeYaml(filePath, data);
  return { id: resolvedId };
}

export function updateAnnotation(filePath, { id, text, color, targetId, targetType, offset }) {
  const data = readYaml(filePath);
  const annotations = data.annotations || [];
  const idx = annotations.findIndex(a => a.id === id);
  if (idx === -1) throw new Error(`Annotation "${id}" not found. Use addAnnotation instead.`);
  const updated = { ...annotations[idx] };
  if (text !== undefined) updated.text = text;
  if (targetId !== undefined) {
    updated.target = { id: targetId, type: targetType || updated.target?.type || 'table' };
  } else if (targetType !== undefined && updated.target) {
    updated.target = { ...updated.target, type: targetType };
  }
  if (offset !== undefined) updated.offset = offset;
  if (color !== undefined) {
    updated.display = updated.display || {};
    updated.display.color = color;
  }
  data.annotations = [...annotations.slice(0, idx), updated, ...annotations.slice(idx + 1)];
  writeYaml(filePath, data);
  return { id };
}

export function removeAnnotation(filePath, id) {
  const data = readYaml(filePath);
  const before = (data.annotations || []).length;
  data.annotations = (data.annotations || []).filter(a => a.id !== id);
  if (data.annotations.length === before) throw new Error(`Annotation "${id}" not found`);
  writeYaml(filePath, data);
  return { id };
}
