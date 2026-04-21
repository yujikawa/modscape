import fs from 'fs';
import path from 'path';

const ARCHIVES_DIR = '.modscape/archives';
const SPECS_DIR = '.modscape/specs';

const SEARCH_FILES = ['spec.md', 'design.md'];

/**
 * Search for keyword in a file and return matching line contexts.
 * @param {string} filePath
 * @param {string} keyword  case-insensitive
 * @returns {{ line: number, text: string }[]}
 */
function searchFile(filePath, keyword) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const lower = keyword.toLowerCase();
  const matches = [];
  lines.forEach((text, idx) => {
    if (text.toLowerCase().includes(lower)) {
      matches.push({ line: idx + 1, text: text.trim() });
    }
  });
  return matches;
}

/**
 * Extract spec title from the first heading in a spec.md file.
 * Falls back to the directory basename.
 */
function extractTitle(specMdPath, fallback) {
  if (!fs.existsSync(specMdPath)) return fallback;
  const content = fs.readFileSync(specMdPath, 'utf8');
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : fallback;
}

/**
 * Search archives and specs directories for keyword.
 * @param {string} keyword
 * @param {number} limit
 * @returns {Array<{type, path, title, matches}>}
 */
export function searchSpecs(keyword, limit = 5) {
  const results = [];

  // Search archives
  if (fs.existsSync(ARCHIVES_DIR)) {
    const entries = fs.readdirSync(ARCHIVES_DIR)
      .filter(e => fs.statSync(path.join(ARCHIVES_DIR, e)).isDirectory())
      .sort()
      .reverse(); // newest first

    for (const entry of entries) {
      if (results.length >= limit) break;
      const archiveDir = path.join(ARCHIVES_DIR, entry);
      const specMdPath = path.join(archiveDir, 'spec.md');
      const title = extractTitle(specMdPath, entry);

      const fileMatches = [];
      for (const fileName of SEARCH_FILES) {
        const filePath = path.join(archiveDir, fileName);
        const matches = searchFile(filePath, keyword);
        if (matches.length > 0) {
          fileMatches.push({ file: fileName, matches: matches.slice(0, 3) });
        }
      }

      if (fileMatches.length > 0) {
        results.push({
          type: 'archive',
          path: archiveDir,
          title,
          matches: fileMatches,
        });
      }
    }
  }

  // Search specs/*.md
  if (fs.existsSync(SPECS_DIR) && results.length < limit) {
    const specFiles = fs.readdirSync(SPECS_DIR)
      .filter(e => e.endsWith('.md') && e !== 'questions.md');

    for (const specFile of specFiles) {
      if (results.length >= limit) break;
      const filePath = path.join(SPECS_DIR, specFile);
      const matches = searchFile(filePath, keyword);
      if (matches.length > 0) {
        const title = extractTitle(filePath, specFile.replace('.md', ''));
        results.push({
          type: 'spec',
          path: filePath,
          title,
          matches: [{ file: specFile, matches: matches.slice(0, 3) }],
        });
      }
    }
  }

  return results;
}

/**
 * Run the search command.
 * @param {string} keyword
 * @param {{ json: boolean, limit: number }} opts
 */
export function runSearch(keyword, opts = {}) {
  const limit = opts.limit ?? 5;
  const results = searchSpecs(keyword, limit);

  if (opts.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(`\n  No results found for "${keyword}"\n`);
    return;
  }

  console.log(`\n  Found ${results.length} result(s) for "${keyword}":\n`);
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.path}`);
    console.log(`      Title: ${r.title}`);
    r.matches.forEach(fm => {
      fm.matches.forEach(m => {
        const preview = m.text.length > 80 ? m.text.slice(0, 77) + '...' : m.text;
        console.log(`      Match (${fm.file} L${m.line}): ${preview}`);
      });
    });
    console.log('');
  });
}
