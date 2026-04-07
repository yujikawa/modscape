import { confirm } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function safeWriteFile(filePath, content) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absolutePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(absolutePath)) {
    const overwrite = await confirm({
      message: `File ${filePath} already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      console.log(`  Skipping ${filePath}`);
      return;
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

    // 1. Create .modscape/rules.md and .modscape/codegen-rules.md
    const rulesTemplatePath = path.join(__dirname, 'templates/rules.md');
    const rulesTemplate = fs.readFileSync(rulesTemplatePath, 'utf8')
      .replaceAll('{{MODEL_FORMAT_VERSION}}', MODEL_FORMAT_VERSION);
    await safeWriteFile('.modscape/rules.md', rulesTemplate);

    const codegenRulesTemplatePath = path.join(__dirname, 'templates/codegen-rules.md');
    const codegenRulesTemplate = fs.readFileSync(codegenRulesTemplatePath, 'utf8');
    await safeWriteFile('.modscape/codegen-rules.md', codegenRulesTemplate);

    // 2. Create agent-specific files
    const specSkillNames = ['requirements', 'design', 'implement', 'archive', 'status'];

    if (agents.includes('gemini')) {
      const modelingTemplate = fs.readFileSync(path.join(__dirname, 'templates/gemini/modscape-modeling/SKILL.md'), 'utf8');
      await safeWriteFile('.gemini/skills/modscape-modeling/SKILL.md', modelingTemplate);
      const codegenTemplate = fs.readFileSync(path.join(__dirname, 'templates/gemini/modscape-codegen/SKILL.md'), 'utf8');
      await safeWriteFile('.gemini/skills/modscape-codegen/SKILL.md', codegenTemplate);

      if (options.sdd) {
        console.log('  Scaffolding SDD skills for Gemini CLI...');
        for (const skill of specSkillNames) {
          const template = fs.readFileSync(path.join(__dirname, `templates/gemini/modscape-spec-${skill}/SKILL.md`), 'utf8');
          await safeWriteFile(`.gemini/skills/modscape-spec-${skill}/SKILL.md`, template);
        }
      }
    }

    if (agents.includes('codex')) {
      const modelingTemplate = fs.readFileSync(path.join(__dirname, 'templates/codex/modscape-modeling/SKILL.md'), 'utf8');
      await safeWriteFile('.codex/skills/modscape-modeling/SKILL.md', modelingTemplate);
      const codegenTemplate = fs.readFileSync(path.join(__dirname, 'templates/codex/modscape-codegen/SKILL.md'), 'utf8');
      await safeWriteFile('.codex/skills/modscape-codegen/SKILL.md', codegenTemplate);

      if (options.sdd) {
        console.log('  Scaffolding SDD skills for Codex...');
        for (const skill of specSkillNames) {
          const template = fs.readFileSync(path.join(__dirname, `templates/codex/modscape-spec-${skill}/SKILL.md`), 'utf8');
          await safeWriteFile(`.codex/skills/modscape-spec-${skill}/SKILL.md`, template);
        }
      }
    }

    if (agents.includes('claude')) {
      const modelingTemplate = fs.readFileSync(path.join(__dirname, 'templates/claude/modeling.md'), 'utf8');
      await safeWriteFile('.claude/commands/modscape/modeling.md', modelingTemplate);
      const codegenTemplate = fs.readFileSync(path.join(__dirname, 'templates/claude/codegen.md'), 'utf8');
      await safeWriteFile('.claude/commands/modscape/codegen.md', codegenTemplate);
      console.log('\n  💡 To use the MCP server with Claude Code, run:');
      console.log('     claude mcp add modscape -- modscape mcp\n');

      if (options.sdd) {
        console.log('  Scaffolding SDD skills for Claude Code...');
        const specDir = path.join(__dirname, 'templates/claude/spec');
        const claudeSpecSkills = ['requirements.md', 'design.md', 'tasks.md', 'implement.md', 'archive.md', 'status.md'];
        for (const skill of claudeSpecSkills) {
          const template = fs.readFileSync(path.join(specDir, skill), 'utf8');
          await safeWriteFile(`.claude/commands/modscape/spec/${skill}`, template);
        }
      }
    }

    if (options.sdd) {
      const customExample = fs.readFileSync(path.join(__dirname, 'templates/claude/spec/modscape-spec.custom.md.example'), 'utf8');
      await safeWriteFile('.modscape/changes/modscape-spec.custom.md.example', customExample);
      // Create specs/ directory placeholder
      await safeWriteFile('.modscape/specs/.gitkeep', '');
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
