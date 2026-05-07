import path from 'path';
import { readYaml, resolveImports, writeYaml } from './model-utils.js';

/**
 * Detect and optionally remove orphaned entries from a model YAML file.
 * @param {string} filePath
 * @param {object} [opts]
 * @param {boolean} [opts.write] - If true, write pruned YAML back to disk
 * @param {boolean} [opts.includeIsolated] - If true, also detect isolated tables
 * @returns {{ orphans: object[], removed: boolean }}
 */
export function pruneModel(filePath, opts = {}) {
  const raw = readYaml(filePath);
  const basePath = path.dirname(path.resolve(filePath));
  const { schema: data } = resolveImports(raw, basePath);

  const tables = raw.tables || [];
  const domains = raw.domains || [];
  const relationships = raw.relationships || [];
  const lineage = raw.lineage || [];
  const layout = raw.layout || {};
  const consumers = raw.consumers || [];

  // Build resolved table IDs (includes imported tables for reference checks)
  const tableIds = new Set(data.tables?.map(t => t.id).filter(Boolean));
  const domainIds = new Set(domains.map(d => d.id).filter(Boolean));
  const consumerIds = new Set(consumers.map(c => c.id).filter(Boolean));
  const validIds = new Set([...tableIds, ...consumerIds]);
  const validLayoutIds = new Set([...tableIds, ...domainIds, ...consumerIds]);

  const orphans = [];

  // ── Orphaned relationships ────────────────────────────────────────────────
  for (const rel of relationships) {
    const id = rel.id ?? JSON.stringify(rel.from);
    const fromMissing = rel.from?.table && !validIds.has(rel.from.table);
    const toMissing = rel.to?.table && !validIds.has(rel.to.table);
    if (fromMissing || toMissing) {
      orphans.push({
        kind: 'relationship',
        id,
        reason: [
          fromMissing ? `from.table "${rel.from.table}" not found` : null,
          toMissing   ? `to.table "${rel.to.table}" not found` : null,
        ].filter(Boolean).join('; '),
        ref: rel,
      });
    }
  }

  // ── Orphaned lineage ──────────────────────────────────────────────────────
  for (const entry of lineage) {
    const id = entry.id ?? `${entry.from}->${entry.to}`;
    const fromMissing = entry.from && !validIds.has(entry.from);
    const toMissing = entry.to && !validIds.has(entry.to);
    if (fromMissing || toMissing) {
      orphans.push({
        kind: 'lineage',
        id,
        reason: [
          fromMissing ? `from "${entry.from}" not found` : null,
          toMissing   ? `to "${entry.to}" not found` : null,
        ].filter(Boolean).join('; '),
        ref: entry,
      });
    }
  }

  // ── Orphaned layout entries ───────────────────────────────────────────────
  for (const id of Object.keys(layout)) {
    if (!validLayoutIds.has(id)) {
      orphans.push({ kind: 'layout', id, reason: `"${id}" not found in tables or domains` });
    }
  }

  // ── Orphaned domain.members ───────────────────────────────────────────────
  for (const domain of domains) {
    if (!domain.id) continue;
    for (const memberId of domain.members || []) {
      if (!validIds.has(memberId)) {
        orphans.push({ kind: 'domain.member', id: `${domain.id}/${memberId}`, reason: `Table "${memberId}" not found`, domainId: domain.id, memberId });
      }
    }
  }

  // ── Isolated tables (opt-in) ──────────────────────────────────────────────
  if (opts.includeIsolated) {
    const connected = new Set();
    for (const rel of relationships) {
      if (rel.from?.table) connected.add(rel.from.table);
      if (rel.to?.table) connected.add(rel.to.table);
    }
    for (const entry of lineage) {
      if (entry.from) connected.add(entry.from);
      if (entry.to) connected.add(entry.to);
    }
    // Only check local tables (not imported) for isolation
    for (const table of tables) {
      if (!table.id) continue;
      if (!connected.has(table.id)) {
        orphans.push({ kind: 'isolated-table', id: table.id, reason: 'Not referenced in any relationship or lineage' });
      }
    }
  }

  let removed = false;
  if (opts.write && orphans.length > 0) {
    const orphanedRelRefs = new Set(orphans.filter(o => o.kind === 'relationship').map(o => o.ref));
    const orphanedLineageRefs = new Set(orphans.filter(o => o.kind === 'lineage').map(o => o.ref));
    const orphanedLayoutIds = new Set(orphans.filter(o => o.kind === 'layout').map(o => o.id));
    const orphanedMembers = orphans.filter(o => o.kind === 'domain.member');
    const orphanedTableIds = new Set(orphans.filter(o => o.kind === 'isolated-table').map(o => o.id));

    const pruned = { ...raw };

    if (orphanedRelRefs.size > 0) {
      pruned.relationships = (raw.relationships || []).filter(r => !orphanedRelRefs.has(r));
      if (pruned.relationships.length === 0) delete pruned.relationships;
    }
    if (orphanedLineageRefs.size > 0) {
      pruned.lineage = (raw.lineage || []).filter(e => !orphanedLineageRefs.has(e));
      if (pruned.lineage.length === 0) delete pruned.lineage;
    }
    if (orphanedLayoutIds.size > 0) {
      pruned.layout = Object.fromEntries(
        Object.entries(raw.layout || {}).filter(([id]) => !orphanedLayoutIds.has(id))
      );
      if (Object.keys(pruned.layout).length === 0) delete pruned.layout;
    }
    if (orphanedMembers.length > 0) {
      const removeMap = new Map();
      for (const o of orphanedMembers) {
        if (!removeMap.has(o.domainId)) removeMap.set(o.domainId, new Set());
        removeMap.get(o.domainId).add(o.memberId);
      }
      pruned.domains = (raw.domains || []).map(domain => {
        if (!removeMap.has(domain.id)) return domain;
        return { ...domain, members: (domain.members || []).filter(m => !removeMap.get(domain.id).has(m)) };
      });
    }
    if (orphanedTableIds.size > 0) {
      pruned.tables = (raw.tables || []).filter(t => !orphanedTableIds.has(t.id));
    }

    writeYaml(filePath, pruned);
    removed = true;
  }

  return { orphans, removed };
}

/**
 * Run prune and print results to stdout.
 */
export function runPrune(filePath, opts = {}) {
  const result = pruneModel(filePath, {
    write: opts.write,
    includeIsolated: opts.includeIsolated,
  });

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (result.orphans.length === 0) {
    console.log('  ✅ No orphaned entries found.');
    return;
  }

  const action = opts.write ? 'Removed' : 'Found';
  console.log(`  ${opts.write ? '🗑️ ' : '🔍'} ${action} ${result.orphans.length} orphaned entr${result.orphans.length === 1 ? 'y' : 'ies'}:\n`);
  for (const o of result.orphans) {
    console.log(`     [${o.kind}] ${o.id}: ${o.reason}`);
  }
  if (!opts.write) {
    console.log('\n  Run with --write to remove them.');
  }
}
