import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { writeRules, writeAgentTemplates } from './template-files.js';
import { readSpecConfig, writeSpecConfig } from './model-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Files under .modscape/specs/ are user data — never overwrite
function isUserData(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const specsDir = path.resolve(process.cwd(), '.modscape/specs');
  return abs.startsWith(specsDir + path.sep) || abs === specsDir;
}

function forceWrite(filePath, content) {
  if (isUserData(filePath)) return;
  const abs = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  console.log(`  Updated ${filePath}`);
}

function detectInstalledAgents() {
  const agents = [];
  if (fs.existsSync(path.resolve(process.cwd(), '.claude/commands/modscape'))) agents.push('claude');
  if (fs.existsSync(path.resolve(process.cwd(), '.gemini/skills/modscape-modeling'))) agents.push('gemini');
  if (fs.existsSync(path.resolve(process.cwd(), '.codex/skills/modscape-modeling'))) agents.push('codex');
  return agents;
}

function detectSdd(agents) {
  if (agents.includes('claude')) {
    return fs.existsSync(path.resolve(process.cwd(), '.claude/commands/modscape/spec/requirements.md'));
  }
  if (agents.includes('gemini')) {
    return fs.existsSync(path.resolve(process.cwd(), '.gemini/skills/modscape-spec-requirements'));
  }
  if (agents.includes('codex')) {
    return fs.existsSync(path.resolve(process.cwd(), '.codex/skills/modscape-spec-requirements'));
  }
  return false;
}

export async function updateProject(options = {}) {
  console.log('\n  🔄  Modscape Update\n');

  const agents = detectInstalledAgents();
  const sdd = detectSdd(agents);

  if (agents.length === 0 && !fs.existsSync(path.resolve(process.cwd(), '.modscape/rules.md'))) {
    console.log('  ⚠️  No Modscape installation detected in this directory.');
    console.log('     Run `modscape init` first.\n');
    return;
  }

  console.log(`  Detected agents: ${agents.length > 0 ? agents.join(', ') : 'none'}`);
  if (sdd) console.log('  SDD skills: installed');
  console.log('');

  await writeRules(forceWrite);
  await writeAgentTemplates(agents, sdd, forceWrite);

  // Update HTML spec templates if already installed, or install fresh when --html is passed
  const specTemplatesDir = path.resolve(process.cwd(), '.modscape/spec-templates');
  const htmlSrcDir = path.join(__dirname, 'templates', 'spec', 'html');
  const htmlFiles = ['spec-template.html', 'design-template.html', 'tasks-template.html', 'questions-template.html'];

  if (options.html || fs.existsSync(specTemplatesDir)) {
    for (const file of htmlFiles) {
      const src = path.join(htmlSrcDir, file);
      if (fs.existsSync(src)) {
        forceWrite(`.modscape/spec-templates/${file}`, fs.readFileSync(src, 'utf8'));
      }
    }
  }

  // When --html is passed, also ensure output_format: html is set in config.yaml
  if (options.html) {
    const existing = readSpecConfig();
    if (existing.output_format !== 'html') {
      writeSpecConfig({ ...existing, output_format: 'html' });
      console.log('  Created/Updated .modscape/modscape-spec.config.yaml (output_format: html)');
    } else {
      console.log('  .modscape/modscape-spec.config.yaml already has output_format: html — skipped');
    }
  }

  console.log('\n  💡 User data in .modscape/specs/ was not modified.\n');
}
