import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { buildLineageGraph, hasLineageCycle } from './model-utils.js';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';

const collectYamlFiles = (inputPath) => {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(inputPath)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => path.join(inputPath, f));
  }
  return [inputPath];
};

// BFS from multiple starting IDs, collecting all downstream table IDs.
// The visited set naturally prevents infinite loops including cycles.
function collectDownstream(startIds, graph) {
  // Warn if graph has a cycle (shared utility)
  if (hasLineageCycle(graph)) {
    process.stderr.write('  ⚠️  Circular lineage detected — cycle guard activated\n');
  }

  // BFS to collect all downstream IDs from starting points
  const visited = new Set(startIds);
  const queue = [...startIds];

  while (queue.length > 0) {
    const current = queue.shift();
    for (const next of graph.get(current) || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  // Return only the downstream IDs (exclude the starting IDs themselves)
  return [...visited].filter(id => !startIds.includes(id));
}

export function extractModels(inputs, options) {
  const outputPath = options.output || 'extracted.yaml';
  const tableIds = options.tables
    ? options.tables.split(',').map(id => id.trim()).filter(Boolean)
    : [];
  const appendMode = !!options.append;
  const recordPath = options.record || null;
  const withDownstream = !!options.withDownstream;

  if (tableIds.length === 0) {
    console.error('  ❌ --tables option is required. Specify comma-separated table IDs.');
    return;
  }

  // upsert用 Map（appendモード時は既存出力ファイルで初期化）
  const tableMap = new Map();
  const relationshipsList = [];
  const lineageList = [];
  const annotationsList = [];
  const domainsList = [];
  const consumersList = [];
  const layoutMap = {};
  const seenRelIds = new Set();
  const seenLinIds = new Set();
  const seenAnnIds = new Set();
  const seenDomIds = new Set();
  const seenConsumerIds = new Set();

  if (appendMode && fs.existsSync(outputPath)) {
    try {
      const existing = yaml.load(fs.readFileSync(outputPath, 'utf8'));
      if (existing) {
        for (const t of existing.tables || []) tableMap.set(t.id, t);
        for (const r of existing.relationships || []) {
          relationshipsList.push(r);
          if (r.id) seenRelIds.add(r.id);
        }
        for (const l of existing.lineage || []) {
          lineageList.push(l);
          if (l.id) seenLinIds.add(l.id);
        }
        for (const a of existing.annotations || []) {
          annotationsList.push(a);
          if (a.id) seenAnnIds.add(a.id);
        }
        for (const d of existing.domains || []) {
          if (!seenDomIds.has(d.id)) {
            domainsList.push(d);
            seenDomIds.add(d.id);
          }
        }
        for (const c of existing.consumers || []) {
          if (!seenConsumerIds.has(c.id)) {
            consumersList.push(c);
            seenConsumerIds.add(c.id);
          }
        }
        Object.assign(layoutMap, existing.layout || {});
      }
      console.log(`  📎 Appending to existing: ${outputPath}`);
    } catch (e) {
      console.warn(`  ⚠️  Could not read existing output file: ${e.message}`);
    }
  }

  const allFiles = [];
  for (const input of inputs) {
    allFiles.push(...collectYamlFiles(input));
  }

  if (allFiles.length === 0) {
    console.error('  ❌ No YAML files found');
    return;
  }

  // Parse all YAML files upfront (needed for downstream graph if --with-downstream)
  const parsedFiles = [];
  for (const filePath of allFiles) {
    try {
      const data = yaml.load(fs.readFileSync(filePath, 'utf8'));
      if (data) parsedFiles.push({ filePath, data });
    } catch (e) {
      console.error(`  ❌ Failed to read ${filePath}: ${e.message}`);
    }
  }

  // Resolve effective table IDs to extract (expand with downstream if requested)
  let effectiveTableIds = [...tableIds];
  // Track which downstream IDs came from which source file (for --record)
  const downstreamSourceMap = new Map(); // tableId → filePath

  if (withDownstream) {
    // Merge lineage entries from all parsed files into one graph
    const allLineage = parsedFiles.flatMap(f => f.data.lineage || []);
    const graph = buildLineageGraph(allLineage);
    const downstreamIds = collectDownstream(tableIds, graph);

    // For each downstream ID, find which file it lives in
    for (const { filePath, data } of parsedFiles) {
      for (const table of data.tables || []) {
        if (downstreamIds.includes(table.id) && !downstreamSourceMap.has(table.id)) {
          downstreamSourceMap.set(table.id, filePath);
        }
      }
    }

    effectiveTableIds = [...tableIds, ...downstreamIds];
    if (downstreamIds.length > 0) {
      console.log(`  🔽 Downstream tables collected: ${downstreamIds.join(', ')}`);
    }
  }

  const extractedIds = [];
  // Track source file for each extracted table (for --record)
  const tableSourceMap = new Map(); // tableId → filePath

  for (const { filePath, data } of parsedFiles) {
    let matched = 0;
    for (const table of data.tables || []) {
      if (effectiveTableIds.includes(table.id)) {
        tableMap.set(table.id, table); // upsert: 新規追加 or 既存上書き
        extractedIds.push(table.id);
        if (!tableSourceMap.has(table.id)) {
          tableSourceMap.set(table.id, filePath);
        }
        matched++;
      }
    }

    // relationships: 両端ともに対象テーブルに含まれるものだけ抽出
    for (const rel of data.relationships || []) {
      const fromId = rel.from?.table;
      const toId = rel.to?.table;
      if (effectiveTableIds.includes(fromId) && effectiveTableIds.includes(toId)) {
        if (!rel.id) {
          relationshipsList.push(rel);
        } else if (!seenRelIds.has(rel.id)) {
          relationshipsList.push(rel);
          seenRelIds.add(rel.id);
        }
      }
    }

    // lineage: 両端ともに対象テーブルに含まれるものだけ抽出
    for (const lin of data.lineage || []) {
      if (effectiveTableIds.includes(lin.from) && effectiveTableIds.includes(lin.to)) {
        if (!lin.id) {
          lineageList.push(lin);
        } else if (!seenLinIds.has(lin.id)) {
          lineageList.push(lin);
          seenLinIds.add(lin.id);
        }
      }
    }

    // annotations: targetId が対象テーブルに含まれるものだけ抽出
    for (const ann of data.annotations || []) {
      if (!ann.targetId || effectiveTableIds.includes(ann.targetId)) {
        if (!ann.id) {
          annotationsList.push(ann);
        } else if (!seenAnnIds.has(ann.id)) {
          annotationsList.push(ann);
          seenAnnIds.add(ann.id);
        }
      }
    }

    // domains: members に対象テーブルを含むものだけ抽出（membersを対象IDのみに絞る）
    for (const domain of data.domains || []) {
      if (seenDomIds.has(domain.id)) continue;
      const filteredMembers = (domain.members || []).filter(m => effectiveTableIds.includes(m));
      if (filteredMembers.length > 0) {
        domainsList.push({ ...domain, members: filteredMembers });
        seenDomIds.add(domain.id);
      }
    }

    // consumers: テーブル参照を持たないため全件抽出（first-wins）
    for (const consumer of data.consumers || []) {
      if (!seenConsumerIds.has(consumer.id)) {
        consumersList.push(consumer);
        seenConsumerIds.add(consumer.id);
      }
    }

    // layout: 対象テーブルIDとドメインIDのエントリのみ抽出
    for (const [key, value] of Object.entries(data.layout || {})) {
      if ((effectiveTableIds.includes(key) || seenDomIds.has(key)) && !(key in layoutMap)) {
        layoutMap[key] = value;
      }
    }

    console.log(`  📄 ${filePath} (${matched} matched)`);
  }

  // マッチしなかった ID を警告
  for (const id of effectiveTableIds) {
    if (!tableMap.has(id)) {
      console.warn(`  ⚠️  Table ID not found: "${id}"`);
    }
  }

  const outputModel = { version: MODEL_FORMAT_VERSION };
  if (tableMap.size) outputModel.tables = [...tableMap.values()];
  if (relationshipsList.length) outputModel.relationships = relationshipsList;
  if (lineageList.length) outputModel.lineage = lineageList;
  if (annotationsList.length) outputModel.annotations = annotationsList;
  if (domainsList.length) outputModel.domains = domainsList;
  if (consumersList.length) outputModel.consumers = consumersList;
  if (Object.keys(layoutMap).length) outputModel.layout = layoutMap;

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Extracted ${extractedIds.length} tables → ${outputPath}`);

  // --record: spec-config.yaml にソース情報を記録
  if (recordPath && extractedIds.length > 0) {
    let config = { main_yamls: [] };

    if (fs.existsSync(recordPath)) {
      try {
        config = yaml.load(fs.readFileSync(recordPath, 'utf8')) || config;
      } catch (e) {
        console.warn(`  ⚠️  Could not read record file: ${e.message}`);
      }
    }

    // Group extracted IDs by their source file
    const idsBySource = new Map(); // filePath → [tableId, ...]
    for (const id of extractedIds) {
      const src = tableSourceMap.get(id);
      if (!src) continue;
      if (!idsBySource.has(src)) idsBySource.set(src, []);
      idsBySource.get(src).push(id);
    }

    // Upsert each source file entry in spec-config.yaml
    for (const [sourceFile, ids] of idsBySource) {
      const entry = config.main_yamls.find(e => e.path === sourceFile);
      if (entry) {
        const existing = new Set(entry.tables || []);
        for (const id of ids) existing.add(id);
        entry.tables = [...existing];
      } else {
        // Auto-add unregistered source YAML
        config.main_yamls.push({ path: sourceFile, tables: ids });
      }
    }

    fs.writeFileSync(recordPath, yaml.dump(config, { lineWidth: -1 }), 'utf8');
    console.log(`  📝 Recorded source mapping → ${recordPath}`);
  }

  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}
