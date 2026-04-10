import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const getFolderKey = (node) => {
  if (node.resource_type === 'seed') return 'seeds';
  return node.fqn?.[1] || 'default';
};

export async function importDbt(projectDir, options) {
  const resolvedDir = path.resolve(projectDir || '.');
  const manifestPath = path.join(resolvedDir, 'target', 'manifest.json');
  const splitBy = options.splitBy || null;

  // dbt_project.ymlからプロジェクト名を取得
  const dbtProjectPath = path.join(resolvedDir, 'dbt_project.yml');
  let projectName = path.basename(resolvedDir);

  if (fs.existsSync(dbtProjectPath)) {
    const dbtProject = yaml.load(fs.readFileSync(dbtProjectPath, 'utf8'));
    projectName = dbtProject.name || projectName;
  }

  const outputDir = options.output || `modscape-${projectName}`;

  try {
    if (!fs.existsSync(manifestPath)) {
      console.error(`  ❌ manifest.json not found at: ${manifestPath}`);
      console.error(`  💡 Run 'dbt parse' in your dbt project first.`);
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`  🔍 Parsing dbt manifest: ${manifestPath}`);

    const tables = [];
    const lineage = [];
    const domainsMap = new Map();
    const tableSplitKeyMap = new Map();

    const allNodes = { ...manifest.nodes, ...manifest.sources };

    for (const [uniqueId, node] of Object.entries(allNodes)) {
      if (!['model', 'seed', 'snapshot', 'source'].includes(node.resource_type)) continue;

      const tableId = node.unique_id;

      const columns = [];
      if (node.columns) {
        for (const [colKey, col] of Object.entries(node.columns)) {
          columns.push({
            id: col.name,
            logical: {
              name: col.name,
              type: col.data_type || 'unknown',
              description: col.description || ''
            }
          });
        }
      }

      const tableEntry = {
        id: tableId,
        conceptual: { name: node.name, kind: 'table', description: node.description || '' },
        logical: { name: node.name },
        physical: { name: node.alias || node.name },
        columns,
      };

      tables.push(tableEntry);

      // split keyを決定
      let splitKey = getFolderKey(node);
      if (splitBy === 'schema') {
        splitKey = node.schema || node.config?.schema || 'default';
      } else if (splitBy === 'tag') {
        const tags = node.tags || node.config?.tags || [];
        splitKey = Array.isArray(tags) ? (tags[0] || 'untagged') : (tags || 'untagged');
      }
      tableSplitKeyMap.set(tableId, splitKey);

      // domainsMapはfqn[1]ベースで常に構築
      const domainName = getFolderKey(node);
      if (domainName && domainName !== 'default') {
        if (!domainsMap.has(domainName)) {
          domainsMap.set(domainName, { id: domainName, name: domainName, members: [] });
        }
        domainsMap.get(domainName).members.push(tableId);
      }
    }

    // lineage
    for (const [, node] of Object.entries(allNodes)) {
      if (!['model', 'seed', 'snapshot', 'source'].includes(node.resource_type)) continue;
      if (node.depends_on?.nodes) {
        for (const upstreamId of node.depends_on.nodes) {
          if (allNodes[upstreamId]) {
            lineage.push({ from: upstreamId, to: node.unique_id });
          }
        }
      }
    }

    // 出力先フォルダを作成
    fs.mkdirSync(outputDir, { recursive: true });

    if (splitBy) {
      const splitMap = new Map();

      for (const table of tables) {
        const key = tableSplitKeyMap.get(table.id) || 'default';
        if (!splitMap.has(key)) splitMap.set(key, []);
        splitMap.get(key).push(table);
      }

      // 自己完結率を計算
      const selfContainedRate = new Map();
      for (const [key, splitTables] of splitMap.entries()) {
        const tableIds = new Set(splitTables.map(t => t.id));
        let internal = 0;
        let external = 0;
        for (const edge of lineage) {
          if (!tableIds.has(edge.to)) continue;
          if (tableIds.has(edge.from)) internal++;
          else external++;
        }
        const total = internal + external;
        const rate = total > 0 ? Math.round(internal / total * 100) : 100;
        selfContainedRate.set(key, { internal, external, rate });
      }

      let fileCount = 0;
      for (const [key, splitTables] of splitMap.entries()) {
        const splitOutputPath = path.join(outputDir, `${key}.yaml`);
        const { rate, external } = selfContainedRate.get(key);

        const splitDomains = Array.from(domainsMap.values())
          .filter(d => d.members.some(tid => splitTables.some(t => t.id === tid)))
          .map(d => ({
            ...d,
            members: d.members.filter(tid => splitTables.some(t => t.id === tid))
          }));

        const splitTableIds = new Set(splitTables.map(t => t.id));
        const splitLineage = lineage.filter(e => splitTableIds.has(e.from) || splitTableIds.has(e.to));
        const outputModel = {
          tables: splitTables,
          relationships: [],
          lineage: splitLineage,
          domains: splitDomains
        };

        fs.writeFileSync(splitOutputPath, yaml.dump(outputModel), 'utf8');

        const icon = rate >= 80 ? '✅' : '⚠️ ';
        const warning = rate < 80 ? ` (${external} cross-file lineage edges missing)` : '';
        console.log(`  ${icon} ${splitOutputPath} (${splitTables.length} tables, ${rate}% self-contained${warning})`);
        fileCount++;
      }

      console.log(`\n  📦 Split into ${fileCount} files → ${outputDir}/`);
      console.log(`  🚀 Run 'modscape dev ${outputDir}' to visualize.`);

    } else {
      const outputPath = path.join(outputDir, 'dbt-model.yaml');
      const outputModel = {
        tables,
        relationships: [],
        lineage,
        domains: Array.from(domainsMap.values())
      };

      fs.writeFileSync(outputPath, yaml.dump(outputModel), 'utf8');
      console.log(`  ✅ Successfully imported ${tables.length} tables → ${outputPath}`);
      console.log(`  🚀 Run 'modscape dev ${outputDir}' to visualize.`);
    }

  } catch (error) {
    console.error(`  ❌ Failed to import dbt metadata: ${error.message}`);
  }
}