import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DEFAULT_SPECS_DIR = '.modscape/specs';

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function loadContextYaml(specsDir) {
  const contextPath = path.join(specsDir, '_context.yaml');
  const raw = readFileIfExists(contextPath);
  if (!raw) return { decisions: [] };
  try {
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return { decisions: [] };
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    };
  } catch {
    return { decisions: [] };
  }
}

function loadQuestionsYaml(specsDir) {
  const questionsPath = path.join(specsDir, '_questions.yaml');
  const raw = readFileIfExists(questionsPath);
  if (!raw) return [];
  try {
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch {
    return [];
  }
}

function loadGlossaryYaml(specsDir) {
  const glossaryPath = path.join(specsDir, '_glossary.yaml');
  const raw = readFileIfExists(glossaryPath);
  if (!raw) return [];
  try {
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    return Array.isArray(parsed.terms) ? parsed.terms : [];
  } catch {
    return [];
  }
}

function loadTableSpecs(specsDir) {
  const tables = {};
  if (!fs.existsSync(specsDir)) return tables;

  const entries = fs.readdirSync(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const tableId = entry.name;
    const tableDir = path.join(specsDir, tableId);
    const spec = readFileIfExists(path.join(tableDir, 'spec.md'));
    const questions = readFileIfExists(path.join(tableDir, 'questions.md'));
    if (spec !== null || questions !== null) {
      tables[tableId] = {};
      if (spec !== null) tables[tableId].spec = spec;
      if (questions !== null) tables[tableId].questions = questions;
    }
  }
  return tables;
}

function formatAsMarkdown(context) {
  const lines = ['# Modscape Context\n'];

  if (context.glossary.length > 0) {
    lines.push('## Glossary\n');
    for (const t of context.glossary) {
      lines.push(`### ${t.id}${t.label ? ` (${t.label})` : ''}`);
      lines.push(`\n${t.definition}`);
      if (t.tables?.length) lines.push(`\n*Tables: ${t.tables.join(', ')}*`);
      if (t.columns?.length) lines.push(`*Columns: ${t.columns.join(', ')}*`);
      if (t.change) lines.push(`*Change: ${t.change}*`);
      lines.push('');
    }
  }

  if (context.decisions.length > 0) {
    lines.push('## Decisions\n');
    for (const d of context.decisions) {
      lines.push(`### ${d.id}: ${d.summary}`);
      if (d.rationale) lines.push(`\n> ${d.rationale}`);
      if (d.date) lines.push(`\n*Date: ${d.date}*`);
      if (d.change) lines.push(`*Change: ${d.change}*`);
      lines.push('');
    }
  }

  if (context.questions.length > 0) {
    lines.push('## Q&A\n');
    for (const q of context.questions) {
      const status = q.status ?? (q.answer ? 'answered' : 'open');
      lines.push(`### ${q.id}: ${q.question}`);
      lines.push(`\n*Status: ${status}*`);
      if (q.table) lines.push(`*Table: ${q.table}*`);
      if (q.answer) {
        lines.push(`\n**Answer:** ${q.answer}`);
      } else if (q.assumption) {
        lines.push(`\n**Assumption:** ${q.assumption}`);
      } else {
        lines.push('\n*Unanswered*');
      }
      if (q.date) lines.push(`\n*Date: ${q.date}*`);
      if (q.change) lines.push(`*Change: ${q.change}*`);
      lines.push('');
    }
  }

  const tableIds = Object.keys(context.tables);
  if (tableIds.length > 0) {
    lines.push('## Table Specs\n');
    for (const tableId of tableIds) {
      const entry = context.tables[tableId];
      lines.push(`### ${tableId}\n`);
      if (entry.spec) {
        lines.push('#### Spec\n');
        lines.push(entry.spec.trim());
        lines.push('');
      }
      if (entry.questions) {
        lines.push('#### Questions\n');
        lines.push(entry.questions.trim());
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

export function exportContext(specsDir = DEFAULT_SPECS_DIR, format = 'json') {
  const { decisions } = loadContextYaml(specsDir);
  const questions = loadQuestionsYaml(specsDir);
  const glossary = loadGlossaryYaml(specsDir);
  const tables = loadTableSpecs(specsDir);

  const context = { decisions, questions, glossary, tables };

  if (format === 'md') {
    process.stdout.write(formatAsMarkdown(context) + '\n');
  } else {
    process.stdout.write(JSON.stringify(context, null, 2) + '\n');
  }
}
