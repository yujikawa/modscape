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

  const mergedTables = [];
  const mergedRelationships = [];
  const mergedLineages = [];
  const mergedAnnotations = [];
  const mergedDomains = [];
  const mergedLayout = {};
  const seenTableIds = new Set();
  const seenDomainIds = new Set();
  const seenLineageIds = new Set();
  const seenRelationshipIds = new Set();
  const seenAnnotationIds = new Set();
  let mergedVersion = undefined;

  // 入力パスを全部ファイルに展開
  const allFiles = [];
  for (const input of inputs) {
    allFiles.push(...collectYamlFiles(input));
  }

  if (allFiles.length === 0) {
    console.error(`  ❌ No YAML files found`);
    return;
  }

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
  if (Object.keys(mergedLayout).length) outputModel.layout = mergedLayout;

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Merged ${allFiles.length} files → ${outputPath} (${mergedTables.length} tables)`);
  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}