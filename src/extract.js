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

export function extractModels(inputs, options) {
  const outputPath = options.output || 'extracted.yaml';
  const tableIds = options.tables
    ? options.tables.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  if (tableIds.length === 0) {
    console.error('  ❌ --tables option is required. Specify comma-separated table IDs.');
    return;
  }

  // 後勝ちマージ用 Map
  const tableMap = new Map();

  const allFiles = [];
  for (const input of inputs) {
    allFiles.push(...collectYamlFiles(input));
  }

  if (allFiles.length === 0) {
    console.error('  ❌ No YAML files found');
    return;
  }

  const relationshipsList = [];
  const lineageList = [];
  const annotationsList = [];
  const domainsList = [];
  const layoutMap = {};
  const seenRelIds = new Set();
  const seenLinIds = new Set();
  const seenAnnIds = new Set();
  const seenDomIds = new Set();

  for (const filePath of allFiles) {
    try {
      const data = yaml.load(fs.readFileSync(filePath, 'utf8'));
      if (!data) continue;

      let matched = 0;
      for (const table of data.tables || []) {
        if (tableIds.includes(table.id)) {
          tableMap.set(table.id, table); // 後勝ち上書き
          matched++;
        }
      }

      // relationships: 両端ともに対象テーブルに含まれるものだけ抽出
      for (const rel of data.relationships || []) {
        const fromId = rel.from?.table;
        const toId = rel.to?.table;
        if (tableIds.includes(fromId) && tableIds.includes(toId)) {
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
        if (tableIds.includes(lin.from) && tableIds.includes(lin.to)) {
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
        if (!ann.targetId || tableIds.includes(ann.targetId)) {
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
        const filteredMembers = (domain.members || []).filter(m => tableIds.includes(m));
        if (filteredMembers.length > 0) {
          domainsList.push({ ...domain, members: filteredMembers });
          seenDomIds.add(domain.id);
        }
      }

      // layout: 対象テーブルIDとドメインIDのエントリのみ抽出
      for (const [key, value] of Object.entries(data.layout || {})) {
        if ((tableIds.includes(key) || seenDomIds.has(key)) && !(key in layoutMap)) {
          layoutMap[key] = value;
        }
      }

      console.log(`  📄 ${filePath} (${matched} matched)`);
    } catch (e) {
      console.error(`  ❌ Failed to read ${filePath}: ${e.message}`);
    }
  }

  // マッチしなかった ID を警告
  for (const id of tableIds) {
    if (!tableMap.has(id)) {
      console.warn(`  ⚠️  Table ID not found: "${id}"`);
    }
  }

  const outputModel = {};
  if (tableMap.size) outputModel.tables = [...tableMap.values()];
  if (relationshipsList.length) outputModel.relationships = relationshipsList;
  if (lineageList.length) outputModel.lineage = lineageList;
  if (annotationsList.length) outputModel.annotations = annotationsList;
  if (domainsList.length) outputModel.domains = domainsList;
  if (Object.keys(layoutMap).length) outputModel.layout = layoutMap;

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Extracted ${tableMap.size} tables → ${outputPath}`);
  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}
