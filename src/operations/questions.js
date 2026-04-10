import fs from 'fs';
import path from 'path';

const CHANGES_DIR = '.modscape/changes';

/**
 * Find the questions.md path for a given change name.
 */
function questionsPath(changeName) {
  return path.join(CHANGES_DIR, changeName, 'questions.md');
}

/**
 * List all active change names (directories under CHANGES_DIR).
 */
export function listActiveChanges() {
  if (!fs.existsSync(CHANGES_DIR)) return [];
  return fs.readdirSync(CHANGES_DIR).filter(entry => {
    return fs.statSync(path.join(CHANGES_DIR, entry)).isDirectory();
  });
}

/**
 * Resolve the change name: explicit name takes priority.
 * If omitted and exactly one active change exists, use that.
 * If multiple exist, throw an error requiring explicit name.
 */
export function resolveChangeName(explicitName) {
  if (explicitName) return explicitName;
  const active = listActiveChanges();
  if (active.length === 1) return active[0];
  if (active.length === 0) throw new Error('No active changes found under .modscape/changes/');
  throw new Error(
    `Multiple active changes found: ${active.join(', ')}.\n` +
    'Specify the change name: modscape spec answer <name> <id> "<answer>"'
  );
}

/**
 * Answer a question in questions.md identified by its ID (e.g. Q-001).
 * Marks the checkbox [x] and appends **A:** <answer>.
 */
export function answerQuestion(changeName, id, answer) {
  const filePath = questionsPath(changeName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`questions.md not found for change "${changeName}". Run: modscape spec new ${changeName}`);
  }

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const idPattern = new RegExp(`\\*\\*${id}\\*\\*`);
  const questionLineIdx = lines.findIndex(l => idPattern.test(l));

  if (questionLineIdx === -1) {
    throw new Error(`${id} is not found in questions.md for change "${changeName}"`);
  }

  // Mark checkbox as done
  lines[questionLineIdx] = lines[questionLineIdx].replace(/^(\s*)-\s*\[\s*\]/, '$1- [x]');

  // Find insertion point: after the question line, skip existing indented continuation lines
  let insertIdx = questionLineIdx + 1;
  while (insertIdx < lines.length && /^\s{2,}/.test(lines[insertIdx])) {
    insertIdx++;
  }

  // Insert the answer line (indented to match continuation style)
  lines.splice(insertIdx, 0, `  **A:** ${answer}`);

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return { changeName, id, answer };
}
