import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const DEFAULT_SPECS_DIR = '.modscape/specs';

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function loadContext(specsDir = DEFAULT_SPECS_DIR) {
  const contextPath = path.join(specsDir, '_context.yaml');
  const questionsPath = path.join(specsDir, '_questions.yaml');
  const glossaryPath = path.join(specsDir, '_glossary.yaml');

  const parseYaml = (filePath, fallback) => {
    const raw = readFileIfExists(filePath);
    if (!raw) return fallback;
    try {
      const parsed = yaml.load(raw);
      return (parsed && typeof parsed === 'object') ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const contextData = parseYaml(contextPath, {});
  const questionsData = parseYaml(questionsPath, {});
  const glossaryData = parseYaml(glossaryPath, {});

  const tables = {};
  if (fs.existsSync(specsDir)) {
    for (const modelEntry of fs.readdirSync(specsDir, { withFileTypes: true })) {
      if (!modelEntry.isDirectory() || modelEntry.name.startsWith('_')) continue;
      const modelDir = path.join(specsDir, modelEntry.name);
      for (const file of fs.readdirSync(modelDir)) {
        if (!file.endsWith('.md') || file.includes('.questions.')) continue;
        const tableId = file.replace(/\.md$/, '');
        const spec = readFileIfExists(path.join(modelDir, file));
        const questions = readFileIfExists(path.join(modelDir, `${tableId}.questions.md`));
        if (spec !== null || questions !== null) {
          tables[tableId] = {};
          if (spec !== null) tables[tableId].spec = spec;
          if (questions !== null) tables[tableId].questions = questions;
        }
      }
    }
  }

  return {
    decisions: Array.isArray(contextData.decisions) ? contextData.decisions : [],
    questions: Array.isArray(questionsData.questions) ? questionsData.questions : [],
    glossary: Array.isArray(glossaryData.terms) ? glossaryData.terms : [],
    tables,
  };
}

/**
 * Normalizes the schema data to ensure it's in a consistent format.
 * Similar to visualizer/src/lib/parser.ts but for the CLI side.
 */
function normalizeSchema(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid YAML: Root must be an object');
  }

  const schema = {
    tables: Array.isArray(data.tables) ? data.tables : [],
    relationships: Array.isArray(data.relationships) ? data.relationships : [],
    domains: Array.isArray(data.domains) ? data.domains : [],
    annotations: Array.isArray(data.annotations) ? data.annotations : [],
    layout: data.layout || {}
  };

  schema.tables = schema.tables.map(table => {
    let sampleData = table.sampleData;
    
    // Migrate legacy format { columns: [...], rows: [[...]] } to new [[...]] format
    if (sampleData && typeof sampleData === 'object' && !Array.isArray(sampleData)) {
      if (Array.isArray(sampleData.rows)) {
        sampleData = sampleData.rows;
      } else {
        sampleData = [];
      }
    }

    const columns = (Array.isArray(table.columns) ? table.columns : []).map(col => ({
      ...col,
      id: col.id || 'unknown',
      logical: col.logical || { name: col.id || 'unknown', type: 'string' },
      physical: col.physical || { name: '', type: '' }
    }));

    return {
      ...table,
      id: table.id || 'unknown',
      name: table.name || table.id || 'Unnamed Table',
      columns,
      sampleData: Array.isArray(sampleData) ? sampleData : []
    };
  });

  return schema;
}

/**
 * Sanitizes a string for use as a Mermaid entity name.
 * Spaces and hyphens are replaced with underscores.
 */
function sanitize(str) {
  if (!str) return 'unknown';
  // Mermaid ER/Flowchart labels can be wrapped in quotes for better compatibility
  return str.replace(/[^a-zA-Z0-9_\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, '_');
}

/**
 * Generates Mermaid Data Lineage syntax.
 */
function generateMermaidLineage(schema) {
  let mermaid = 'graph TD\n';
  let hasLineage = false;

  (schema.lineage || []).forEach(edge => {
    hasLineage = true;
    const sourceTable = schema.tables.find(t => t.id === edge.from);
    const targetTable = schema.tables.find(t => t.id === edge.to);
    const sourceName = sanitize(sourceTable?.name || edge.from);
    const targetName = sanitize(targetTable?.name || edge.to);
    mermaid += `    ${sourceName} --> ${targetName}\n`;
  });

  return hasLineage ? mermaid : null;
}

/**
 * Generates Mermaid ER diagram syntax.
 */
function generateMermaidER(schema) {
  let mermaid = 'erDiagram\n';

  // Tables (Entities)
  schema.tables.forEach(table => {
    const tableName = sanitize(table.name);
    mermaid += `    ${tableName} {\n`;
    table.columns.forEach(col => {
      const colName = sanitize(col.logical?.name || col.id);
      const colType = sanitize(col.logical?.type || 'string');
      let markers = '';
      if (col.logical?.isPrimaryKey) markers += ' PK';
      if (col.logical?.isForeignKey) markers += ' FK';
      mermaid += `        ${colType} ${colName}${markers}\n`;
    });
    mermaid += '    }\n';
  });

  // Relationships
  schema.relationships.forEach(rel => {
    const fromTable = sanitize(schema.tables.find(t => t.id === rel.from.table)?.name || rel.from.table);
    const toTable = sanitize(schema.tables.find(t => t.id === rel.to.table)?.name || rel.to.table);
    
    // Default to one-to-many if type is missing
    let connector = '||--o{';
    if (rel.type === 'one-to-one') connector = '||--||';
    if (rel.type === 'many-to-many') connector = '}|--|{';
    if (rel.type === 'one-to-many') connector = '||--o{';

    mermaid += `    ${fromTable} ${connector} ${toTable} : ""\n`;
  });

  return mermaid;
}

/**
 * Generates the Sticky Notes section.
 */
function generateNotesSection(schema) {
  if (!schema.annotations || schema.annotations.length === 0) return null;

  let md = '## Sticky Notes\n\n';
  schema.annotations.forEach(note => {
    md += `> **[Note]** ${note.text}\n`;
    if (note.targetId) {
      md += `> *Attached to: ${note.targetId} (${note.targetType})*\n`;
    }
    md += '\n';
  });

  return md;
}

/**
 * Generates Glossary, Decisions, Q&A sections from context.
 */
function generateContextSections(context) {
  let md = '';

  if (context.glossary.length > 0) {
    md += '## Glossary\n\n';
    for (const t of context.glossary) {
      md += `### ${t.id}${t.label ? ` (${t.label})` : ''}\n\n`;
      md += `${t.definition}\n\n`;
      if (t.ids?.length) md += `*Tables: ${t.ids.join(', ')}*\n\n`;
      if (t.columns?.length) md += `*Columns: ${t.columns.join(', ')}*\n\n`;
    }
  }

  if (context.decisions.length > 0) {
    md += '## Decisions\n\n';
    for (const d of context.decisions) {
      md += `### ${d.id}: ${d.summary}\n\n`;
      if (d.rationale) md += `> ${d.rationale}\n\n`;
      if (d.date) md += `*Date: ${d.date}*\n\n`;
    }
  }

  if (context.questions.length > 0) {
    md += '## Q&A\n\n';
    for (const q of context.questions) {
      const status = q.status ?? (q.answer ? 'answered' : 'open');
      md += `### ${q.id}: ${q.question}\n\n`;
      md += `*Status: ${status}*`;
      if (q.ids?.length) md += ` · *Table: ${q.ids.join(', ')}*`;
      md += '\n\n';
      if (q.answer) {
        md += `**Answer:** ${q.answer}\n\n`;
      } else if (q.assumption) {
        md += `**Assumption:** ${q.assumption}\n\n`;
      }
    }
  }

  return md;
}

/**
 * Generates the full Markdown document.
 */
export function generateMarkdown(schema, modelName, context = null) {
  let md = `# ${modelName} Data Model Definition\n\n`;

  // Mermaid ER Diagram
  if (schema.relationships && schema.relationships.length > 0) {
    md += '## ER Diagram\n\n';
    md += '```mermaid\n';
    md += generateMermaidER(schema);
    md += '```\n\n';
  }

  // Mermaid Data Lineage
  const lineageMermaid = generateMermaidLineage(schema);
  if (lineageMermaid) {
    md += '## Data Lineage\n\n';
    md += '```mermaid\n';
    md += lineageMermaid;
    md += '```\n\n';
  }

  // Domains
  if (schema.domains && schema.domains.length > 0) {
    md += '## Domains\n\n';
    schema.domains.forEach(domain => {
      md += `### ${domain.name}\n`;
      if (domain.description) md += `${domain.description}\n\n`;
      md += 'Associated Tables:\n';
      (domain.members || []).forEach(tableId => {
        const table = schema.tables.find(t => t.id === tableId);
        md += `- ${table?.name || tableId}\n`;
      });
      md += '\n';
    });
  }

  // Table Catalog
  md += '## Table Catalog\n\n';
  schema.tables.forEach(table => {
    md += `### ${table.name} ${table.appearance?.icon || ''}\n`;
    if (table.logical_name) md += `*${table.logical_name}*\n\n`;
    if (table.conceptual?.description) {
      md += `**Description**: ${table.conceptual.description}\n\n`;
    }

    // Type + SCD
    if (table.appearance?.type) {
      const scd = table.appearance.scd ? ` · SCD ${table.appearance.scd}` : '';
      md += `**Type**: \`${table.appearance.type.toUpperCase()}\`${scd}\n\n`;
    }

    // Physical name
    if (table.physical_name) {
      md += `**Physical Name**: \`${table.physical_name}\`\n\n`;
    }

    // Lineage
    const upstreamEdges = (schema.lineage || []).filter(e => e.to === table.id);
    if (upstreamEdges.length > 0) {
      const upstreamNames = upstreamEdges.map(e => {
        const t = schema.tables.find(t => t.id === e.from);
        return t ? t.name : e.from;
      });
      md += `**Upstream**: ${upstreamNames.map(n => `\`${n}\``).join(' → ')}\n\n`;
    }

    // Implementation
    if (table.implementation) {
      const impl = table.implementation;
      md += '#### Implementation\n\n';
      md += '| Property | Value |\n| --- | --- |\n';
      if (impl.materialization) md += `| Materialization | \`${impl.materialization}\` |\n`;
      if (impl.incremental_strategy) md += `| Incremental Strategy | \`${impl.incremental_strategy}\` |\n`;
      if (impl.unique_key) {
        const uk = Array.isArray(impl.unique_key) ? impl.unique_key.join(', ') : impl.unique_key;
        md += `| Unique Key | \`${uk}\` |\n`;
      }
      if (impl.partition_by) {
        const pb = impl.partition_by;
        const field = pb.field || pb[0]?.field;
        const gran = pb.granularity || pb[0]?.granularity;
        md += `| Partition By | \`${field}\`${gran ? ` (${gran})` : ''} |\n`;
      }
      if (impl.cluster_by) {
        const cb = Array.isArray(impl.cluster_by) ? impl.cluster_by.join(', ') : impl.cluster_by;
        md += `| Cluster By | \`${cb}\` |\n`;
      }
      if (impl.grain) {
        const grain = Array.isArray(impl.grain) ? impl.grain.join(', ') : impl.grain;
        md += `| Grain (GROUP BY) | \`${grain}\` |\n`;
      }
      md += '\n';

      // Measures
      if (impl.measures?.length > 0) {
        md += '#### Measures\n\n';
        md += '| Column | Aggregation | Source Column |\n| --- | --- | --- |\n';
        impl.measures.forEach(m => {
          md += `| \`${m.column}\` | \`${m.agg}\` | ${m.source_column ? `\`${m.source_column}\`` : '-'} |\n`;
        });
        md += '\n';
      }
    }

    // Columns Table (Enhanced with Physical info)
    if (table.columns && table.columns.length > 0) {
      md += '#### Column Definitions\n\n';
      md += '| Logical Name | Physical Name | Logical Type | Physical Type | Key | Description |\n';
      md += '| --- | --- | --- | --- | --- | --- |\n';
      table.columns.forEach(col => {
        const key = [
          col.logical?.isPrimaryKey ? 'PK' : '',
          col.logical?.isForeignKey ? 'FK' : ''
        ].filter(Boolean).join(', ');
        const logicalName = col.logical?.name || col.id;
        const physicalName = col.physical?.name || '-';
        const logicalType = col.logical?.type || '-';
        const physicalType = col.physical?.type || '-';
        const description = col.logical?.description || '-';
        
        md += `| ${logicalName} | ${physicalName} | ${logicalType} | ${physicalType} | ${key || '-'} | ${description} |\n`;
      });
      md += '\n';
    }

    // Sample Data
    if (table.sampleData && table.sampleData.length > 0) {
      md += '#### Sample Data\n\n';
      const headers = table.columns.map(c => c.logical?.name || c.id);
      md += '| ' + headers.join(' | ') + ' |\n';
      md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      table.sampleData.slice(0, 5).forEach(row => {
        md += '| ' + row.join(' | ') + ' |\n';
      });
      if (table.sampleData.length > 5) {
        md += `\n*(Showing 5 of ${table.sampleData.length} rows)*\n`;
      }
      md += '\n';
    }

    // Table Spec (from context)
    if (context?.tables?.[table.id]?.spec) {
      md += '#### Spec\n\n';
      md += context.tables[table.id].spec.trim() + '\n\n';
    }
    if (context?.tables?.[table.id]?.questions) {
      md += '#### Questions\n\n';
      md += context.tables[table.id].questions.trim() + '\n\n';
    }
  });

  // Sticky Notes Section
  const notesSection = generateNotesSection(schema);
  if (notesSection) {
    md += notesSection;
  }

  // Context sections (Glossary, Decisions, Q&A)
  if (context) {
    md += generateContextSections(context);
  }

  return md;
}

/**
 * Main export function called by the CLI
 */
export async function exportModel(paths, options) {
  for (const inputPath of paths) {
    const absolutePath = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`  ⚠️ Warning: Path not found: ${inputPath}`);
      continue;
    }

    const stats = fs.statSync(absolutePath);
    const files = stats.isDirectory()
      ? fs.readdirSync(absolutePath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).map(f => path.join(absolutePath, f))
      : [absolutePath];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const data = yaml.load(content);
        const schema = normalizeSchema(data);
        const modelName = path.parse(file).name.charAt(0).toUpperCase() + path.parse(file).name.slice(1).replace(/[-_]/g, ' ');
        const context = options.withContext ? loadContext(options.withContext === true ? '.modscape/specs' : options.withContext) : null;
        const markdown = generateMarkdown(schema, modelName, context);

        if (options.output) {
          // If output is specified, we either append or use it as a directory/base
          // For now, let's just write to the specified output file if it's one file, 
          // or treat as a directory if multiple.
          let outputPath = options.output;
          if (files.length > 1 || stats.isDirectory()) {
             // ensure directory exists
             if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });
             outputPath = path.join(outputPath, `${path.parse(file).name}.md`);
          }
          
          fs.writeFileSync(outputPath, markdown, 'utf8');
          console.log(`  ✅ Exported: ${path.relative(process.cwd(), file)} -> ${outputPath}`);
        } else {
          process.stdout.write(markdown + '\n');
        }
      } catch (e) {
        console.error(`  ❌ Error exporting ${file}: ${e.message}`);
      }
    }
  }
}
