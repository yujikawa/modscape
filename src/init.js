import { confirm } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { writeRules, writeAgentTemplates } from './template-files.js';
import { readSpecConfig, writeSpecConfig } from './model-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function safeWriteFile(filePath, content, yes = false) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absolutePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(absolutePath)) {
    if (!yes) {
      const overwrite = await confirm({
        message: `File ${filePath} already exists. Overwrite?`,
        default: false,
      });
      if (!overwrite) {
        console.log(`  Skipping ${filePath}`);
        return;
      }
    }
  }

  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`  Created ${filePath}`);
}

export async function initProject(options = {}) {
  console.log('\n  🛠️  ModScape Project Initialization\n');

  try {
    const agents = [];

    // If options are provided via CLI flags, use them
    if (options.all) {
      agents.push('gemini', 'codex', 'claude');
    } else if (options.gemini || options.codex || options.claude) {
      if (options.gemini) agents.push('gemini');
      if (options.codex) agents.push('codex');
      if (options.claude) agents.push('claude');
    } else {
      // Otherwise, ask one by one (more robust than checkbox in some terminals)
      console.log('  Please confirm which AI agents you want to scaffold for:\n');

      if (await confirm({ message: 'Scaffold for Gemini CLI?', default: false })) {
        agents.push('gemini');
      }
      if (await confirm({ message: 'Scaffold for Codex?', default: false })) {
        agents.push('codex');
      }
      if (await confirm({ message: 'Scaffold for Claude Code?', default: false })) {
        agents.push('claude');
      }
    }

    if (agents.length === 0) {
      console.log('\n  ⚠️  No agents selected. Only ".modscape/rules.md" will be created.');
    } else {
      console.log(`\n  Selected agents: ${agents.join(', ')}`);
    }

    console.log('\n  Scaffolding modeling rules and commands...');

    const yes = !!options.yes;
    const writeFn = (filePath, content) => safeWriteFile(filePath, content, yes);

    await writeRules(writeFn);
    await writeAgentTemplates(agents, !!options.sdd, writeFn);

    if (options.sdd) {
      const readTpl = (name) => fs.readFileSync(path.join(__dirname, 'templates', name), 'utf8');
      await safeWriteFile('.modscape/modscape-spec.custom.md.example', readTpl('modscape-spec.custom.md.example'), yes);
      await safeWriteFile('.modscape/rules.custom.md.example', readTpl('rules.custom.md.example'), yes);
      await safeWriteFile('.modscape/specs/.gitkeep', '', yes);

      if (options.html) {
        // Copy HTML templates for spec artifacts
        const htmlTemplatesDir = path.join(__dirname, 'templates', 'spec', 'html');
        const htmlTemplateFiles = ['spec-template.html', 'design-template.html', 'tasks-template.html', 'questions-template.html'];
        for (const file of htmlTemplateFiles) {
          const src = path.join(htmlTemplatesDir, file);
          const content = fs.readFileSync(src, 'utf8');
          await safeWriteFile(`.modscape/spec-templates/${file}`, content, yes);
        }

        // Write output_format: html to modscape-spec.config.yaml
        const existing = readSpecConfig();
        if (existing.output_format !== 'html') {
          writeSpecConfig({ ...existing, output_format: 'html' });
          console.log('  Created .modscape/modscape-spec.config.yaml (output_format: html)');
        }
      }
      await safeWriteFile('.modscape/specs/_context.yaml', `# .modscape/specs/_context.yaml
# Cross-project architectural decisions from SDD interactions.
# Do NOT store schema info here — that belongs in model.yaml.
# Q&A is stored in _questions.yaml.

decisions: []
`, yes);
      await safeWriteFile('.modscape/specs/_questions.yaml', `# .modscape/specs/_questions.yaml
# All Q&A from SDD interactions. Use the 'table' field for table-specific questions.
# status: open | answered | assumed

questions: []
`, yes);
      await safeWriteFile('.modscape/specs/_glossary.yaml', `# .modscape/specs/_glossary.yaml
# Project-wide glossary of business and data terms.
# Use this to define terms that appear across multiple tables.
# Per-table knowledge belongs in specs/<table-id>/spec.md and questions.md.

terms: []
`, yes);
      console.log('\n  💡 SDD skills installed.\n');
      if (agents.includes('claude')) console.log('     Claude Code: start with /modscape:spec:requirements');
      if (agents.includes('codex')) console.log('     Codex: start with /modscape:spec:requirements');
      if (agents.includes('gemini')) console.log('     Gemini CLI: start with @modscape-spec-requirements');
      console.log('     Permanent table specs will be stored in .modscape/specs/\n');
    }

    console.log('\n  ✅ Initialization complete! Customize ".modscape/rules.md" to match your project standards.\n');
  } catch (error) {
    if (error.name === 'ExitPromptError') {
      console.log('\n  Initialization cancelled by user.');
    } else {
      console.error('\n  An error occurred during initialization:', error.message);
    }
  }
}
