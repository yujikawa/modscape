import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const collectYamlFiles = (inputPath) => {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(inputPath)
      .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
      .map(f => path.join(inputPath, f));
  }
  return [inputPath];
};

export function mergeModels(inputs, options) {
  const outputPath = options.output || 'merged.yaml';

  // 入力パスを全部ファイルに展開
  const allFiles = [];
  for (const input of inputs) {
    allFiles.push(...collectYamlFiles(input));
  }

  if (allFiles.length === 0) {
    console.error(`  ❌ No YAML files found`);
    return;
  }

  if (options.patch) {
    return mergeModelsPatched(allFiles, outputPath);
  }

  const mergedTables = [];
  const mergedRelationships = [];
  const mergedLineages = [];
  const mergedAnnotations = [];
  const mergedDomains = [];
  const mergedConsumers = [];
  const mergedLayout = {};
  const seenTableIds = new Set();
  const seenDomainIds = new Set();
  const seenLineageIds = new Set();
  const seenRelationshipIds = new Set();
  const seenAnnotationIds = new Set();
  const seenConsumerIds = new Set();
  let mergedVersion = undefined;

  for (const filePath of allFiles) {
    try {
      const data = yaml.load(fs.readFileSync(filePath, 'utf8'));
      if (!data) continue;

      // tables: 重複IDは除外（警告付き）
      for (const table of data.tables || []) {
        if (!seenTableIds.has(table.id)) {
          mergedTables.push(table);
          seenTableIds.add(table.id);
        } else {
          console.warn(`  ⚠ ${table.id}: also exists in a later file — using first version`);
        }
      }

      // version: 最初のファイルの値を採用
      if (mergedVersion === undefined && data.version) {
        mergedVersion = data.version;
      }

      // relationships: IDありは重複除外、IDなしはそのまま追加
      for (const rel of data.relationships || []) {
        if (!rel.id) {
          mergedRelationships.push(rel);
        } else if (!seenRelationshipIds.has(rel.id)) {
          mergedRelationships.push(rel);
          seenRelationshipIds.add(rel.id);
        }
      }

      // lineage: 重複IDは除外、IDなしはそのまま追加
      for (const lineage of data.lineage || []) {
        if (!lineage.id) {
          mergedLineages.push(lineage);
        } else if (!seenLineageIds.has(lineage.id)) {
          mergedLineages.push(lineage);
          seenLineageIds.add(lineage.id);
        }
      }

      // annotations: IDありは重複除外、IDなしはそのまま追加
      for (const annotation of data.annotations || []) {
        if (!annotation.id) {
          mergedAnnotations.push(annotation);
        } else if (!seenAnnotationIds.has(annotation.id)) {
          mergedAnnotations.push(annotation);
          seenAnnotationIds.add(annotation.id);
        }
      }

      // domains: 重複IDはメタ情報をfirst-winsで保持しつつ members をunionマージ
      for (const domain of data.domains || []) {
        if (!seenDomainIds.has(domain.id)) {
          mergedDomains.push({ ...domain, members: [...(domain.members || [])] });
          seenDomainIds.add(domain.id);
        } else {
          // 既存エントリに members をunionマージ
          const existing = mergedDomains.find(d => d.id === domain.id);
          if (existing && domain.members) {
            const memberSet = new Set(existing.members);
            for (const m of domain.members) memberSet.add(m);
            existing.members = [...memberSet];
          }
        }
      }

      // consumers: IDありは重複除外（first-wins）
      for (const consumer of data.consumers || []) {
        if (!seenConsumerIds.has(consumer.id)) {
          mergedConsumers.push(consumer);
          seenConsumerIds.add(consumer.id);
        }
      }

      // layout: 最初のファイルの値を優先（first-wins）
      for (const [key, value] of Object.entries(data.layout || {})) {
        if (!(key in mergedLayout)) {
          mergedLayout[key] = value;
        }
      }

      console.log(`  📄 ${filePath} (${(data.tables || []).length} tables)`);
    } catch (e) {
      console.error(`  ❌ Failed to read ${filePath}: ${e.message}`);
    }
  }

  const outputModel = {};
  if (mergedVersion !== undefined) outputModel.version = mergedVersion;
  if (mergedTables.length) outputModel.tables = mergedTables;
  if (mergedRelationships.length) outputModel.relationships = mergedRelationships;
  if (mergedLineages.length) outputModel.lineage = mergedLineages;
  if (mergedAnnotations.length) outputModel.annotations = mergedAnnotations;
  if (mergedDomains.length) outputModel.domains = mergedDomains;
  if (mergedConsumers.length) outputModel.consumers = mergedConsumers;
  if (Object.keys(mergedLayout).length) outputModel.layout = mergedLayout;

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Merged ${allFiles.length} files → ${outputPath} (${mergedTables.length} tables)`);
  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}

/**
 * Patch mode: first file is the base. Subsequent files upsert into the base,
 * preserving the base file's array order (tables stay in place, no delete+add diffs).
 */
function mergeModelsPatched(allFiles, outputPath) {
  // Load base (first file)
  let base;
  try {
    base = yaml.load(fs.readFileSync(allFiles[0], 'utf8')) || {};
  } catch (e) {
    console.error(`  ❌ Failed to read ${allFiles[0]}: ${e.message}`);
    return;
  }
  console.log(`  📄 ${allFiles[0]} (base, ${(base.tables || []).length} tables)`);

  const tables = [...(base.tables || [])];
  const tableIndex = new Map(tables.map((t, i) => [t.id, i]));

  const relationships = [...(base.relationships || [])];
  const relIndex = new Map(relationships.map((r, i) => [r.id, i]).filter(([id]) => id));

  const lineages = [...(base.lineage || [])];
  const lineageIndex = new Map(lineages.map((l, i) => [l.id, i]).filter(([id]) => id));

  const annotations = [...(base.annotations || [])];
  const annotationIndex = new Map(annotations.map((a, i) => [a.id, i]).filter(([id]) => id));

  const domains = [...(base.domains || [])];
  const domainIndex = new Map(domains.map((d, i) => [d.id, i]));

  const consumers = [...(base.consumers || [])];
  const consumerIndex = new Map(consumers.map((c, i) => [c.id, i]));

  const layout = { ...(base.layout || {}) };

  let version = base.version;

  for (const filePath of allFiles.slice(1)) {
    let patch;
    try {
      patch = yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
    } catch (e) {
      console.error(`  ❌ Failed to read ${filePath}: ${e.message}`);
      continue;
    }

    // tables: update in-place if ID exists, else append
    for (const table of patch.tables || []) {
      const idx = tableIndex.get(table.id);
      if (idx !== undefined) {
        tables[idx] = table;
      } else {
        tableIndex.set(table.id, tables.length);
        tables.push(table);
      }
    }

    // relationships: update in-place by ID, append if new or no ID
    for (const rel of patch.relationships || []) {
      if (!rel.id) {
        relationships.push(rel);
      } else {
        const idx = relIndex.get(rel.id);
        if (idx !== undefined) {
          relationships[idx] = rel;
        } else {
          relIndex.set(rel.id, relationships.length);
          relationships.push(rel);
        }
      }
    }

    // lineage: update in-place by ID, append if new or no ID
    for (const lineage of patch.lineage || []) {
      if (!lineage.id) {
        lineages.push(lineage);
      } else {
        const idx = lineageIndex.get(lineage.id);
        if (idx !== undefined) {
          lineages[idx] = lineage;
        } else {
          lineageIndex.set(lineage.id, lineages.length);
          lineages.push(lineage);
        }
      }
    }

    // annotations: update in-place by ID, append if new or no ID
    for (const annotation of patch.annotations || []) {
      if (!annotation.id) {
        annotations.push(annotation);
      } else {
        const idx = annotationIndex.get(annotation.id);
        if (idx !== undefined) {
          annotations[idx] = annotation;
        } else {
          annotationIndex.set(annotation.id, annotations.length);
          annotations.push(annotation);
        }
      }
    }

    // domains: update meta + union members if ID exists, else append
    for (const domain of patch.domains || []) {
      const idx = domainIndex.get(domain.id);
      if (idx !== undefined) {
        const existing = domains[idx];
        const memberSet = new Set(existing.members || []);
        for (const m of domain.members || []) memberSet.add(m);
        domains[idx] = { ...existing, ...domain, members: [...memberSet] };
      } else {
        domainIndex.set(domain.id, domains.length);
        domains.push({ ...domain, members: [...(domain.members || [])] });
      }
    }

    // consumers: update in-place by ID, append if new
    for (const consumer of patch.consumers || []) {
      const idx = consumerIndex.get(consumer.id);
      if (idx !== undefined) {
        consumers[idx] = consumer;
      } else {
        consumerIndex.set(consumer.id, consumers.length);
        consumers.push(consumer);
      }
    }

    // layout: patch overrides base (patch-wins for layout entries)
    for (const [key, value] of Object.entries(patch.layout || {})) {
      layout[key] = value;
    }

    if (version === undefined && patch.version) version = patch.version;

    console.log(`  🔧 ${filePath} (patch, ${(patch.tables || []).length} tables)`);
  }

  const outputModel = {};
  if (version !== undefined) outputModel.version = version;
  if (tables.length) outputModel.tables = tables;
  if (relationships.length) outputModel.relationships = relationships;
  if (lineages.length) outputModel.lineage = lineages;
  if (annotations.length) outputModel.annotations = annotations;
  if (domains.length) outputModel.domains = domains;
  if (consumers.length) outputModel.consumers = consumers;
  if (Object.keys(layout).length) outputModel.layout = layout;

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Patched ${allFiles.length} files → ${outputPath} (${tables.length} tables)`);
  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}