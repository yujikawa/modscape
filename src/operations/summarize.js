import { readYaml } from '../model-utils.js';

export function summarizeModel(filePath) {
  const data = readYaml(filePath);
  const tables = data.tables || [];
  const domains = data.domains || [];
  const metrics = data.metrics || [];

  // Count tables by appearance type
  const byType = {};
  for (const table of tables) {
    const type = table.conceptual?.kind || 'table';
    byType[type] = (byType[type] || 0) + 1;
  }

  // Collect all IDs that belong to any domain
  const memberIds = new Set();
  for (const domain of domains) {
    for (const id of (domain.members || [])) {
      memberIds.add(id);
    }
  }

  const orphanTableIds = tables.filter(t => !memberIds.has(t.id)).map(t => t.id);
  const orphanMetricIds = metrics.filter(m => !memberIds.has(m.id)).map(m => m.id);

  return {
    tableCount: tables.length,
    byType,
    domainCount: domains.length,
    domains: domains.map(d => ({
      id: d.id,
      name: d.name || '',
      memberCount: (d.members || []).length,
    })),
    orphanTableIds,
    metricCount: metrics.length,
    orphanMetricIds,
    consumerCount: (data.consumers || []).length,
    relationshipCount: (data.relationships || []).length,
    lineageCount: (data.lineage || []).length,
    annotationCount: (data.annotations || []).length,
  };
}
