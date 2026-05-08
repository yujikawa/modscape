import path from 'path';
import fs from 'fs';
import { writeRules, writeAgentTemplates } from './template-files.js';

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

export async function updateProject() {
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

  console.log('\n  💡 User data in .modscape/specs/ was not modified.\n');
}
