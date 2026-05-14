import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SPEC_SKILL_NAMES = ['generate', 'requirements', 'design', 'tasks', 'implement', 'archive', 'status', 'amend', 'search', 'answer', 'check', 'note', 'save', 'load', 'help'];

function tpl(...parts) {
  return fs.readFileSync(path.join(__dirname, 'templates', ...parts), 'utf8');
}

/**
 * Write rules.md and codegen-rules.md.
 * writeFn(filePath, content) — may be async (init) or sync (update).
 */
export async function writeRules(writeFn) {
  const rulesContent = tpl('rules.md').replaceAll('{{MODEL_FORMAT_VERSION}}', MODEL_FORMAT_VERSION);
  await writeFn('.modscape/rules.md', rulesContent);
  await writeFn('.modscape/codegen-rules.md', tpl('codegen-rules.md'));
}

/**
 * Write agent skill command files.
 * writeFn(filePath, content) — may be async (init) or sync (update).
 */
export async function writeAgentTemplates(agents, sdd, writeFn) {
  if (agents.includes('gemini')) {
    await writeFn('.gemini/skills/modscape-modeling/SKILL.md', tpl('gemini/modscape-modeling/SKILL.md'));
    await writeFn('.gemini/skills/modscape-codegen/SKILL.md', tpl('gemini/modscape-codegen/SKILL.md'));
    if (sdd) {
      for (const skill of SPEC_SKILL_NAMES) {
        await writeFn(`.gemini/skills/modscape-spec-${skill}/SKILL.md`, tpl(`gemini/modscape-spec-${skill}/SKILL.md`));
      }
    }
  }

  if (agents.includes('codex')) {
    await writeFn('.codex/skills/modscape-modeling/SKILL.md', tpl('codex/modscape-modeling/SKILL.md'));
    await writeFn('.codex/skills/modscape-codegen/SKILL.md', tpl('codex/modscape-codegen/SKILL.md'));
    if (sdd) {
      for (const skill of SPEC_SKILL_NAMES) {
        await writeFn(`.codex/skills/modscape-spec-${skill}/SKILL.md`, tpl(`codex/modscape-spec-${skill}/SKILL.md`));
      }
    }
  }

  if (agents.includes('claude')) {
    await writeFn('.claude/commands/modscape/modeling.md', tpl('claude/modeling.md'));
    await writeFn('.claude/commands/modscape/codegen.md', tpl('claude/codegen.md'));
    if (sdd) {
      for (const skill of SPEC_SKILL_NAMES) {
        await writeFn(`.claude/commands/modscape/spec/${skill}.md`, tpl('claude/spec', `${skill}.md`));
      }
    }
  }
}
