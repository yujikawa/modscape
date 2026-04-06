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
  const mergedDomains = [];
  const seenTableIds = new Set();
  const seenDomainIds = new Set();

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

      // relationships: そのまま全部追加
      mergedRelationships.push(...(data.relationships || []));

      // domains: 重複IDは除外
      for (const domain of data.domains || []) {
        if (!seenDomainIds.has(domain.id)) {
          mergedDomains.push(domain);
          seenDomainIds.add(domain.id);
        }
      }

      console.log(`  📄 ${filePath} (${(data.tables || []).length} tables)`);
    } catch (e) {
      console.error(`  ❌ Failed to read ${filePath}: ${e.message}`);
    }
  }

  const outputModel = {
    tables: mergedTables,
    relationships: mergedRelationships,
    domains: mergedDomains
  };

  fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
  console.log(`\n  ✅ Merged ${allFiles.length} files → ${outputPath} (${mergedTables.length} tables)`);
  console.log(`  🚀 Run 'modscape dev ${outputPath}' to visualize.`);
}