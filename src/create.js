import { confirm } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MODEL_FORMAT_VERSION } from './model-format-version.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createModel(filePath) {
  // 1. Extension Handling
  if (!filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
    filePath += '.yaml';
  }

  const absolutePath = path.resolve(process.cwd(), filePath);
  const dir = path.dirname(absolutePath);

  // 2. Recursive Directory Creation
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created directory: ${path.relative(process.cwd(), dir)}`);
  }

  // 3. Overwrite Protection
  if (fs.existsSync(absolutePath)) {
    const overwrite = await confirm({
      message: `File ${filePath} already exists. Overwrite with template?`,
      default: false,
    });
    if (!overwrite) {
      console.log(`  Operation cancelled. File ${filePath} preserved.`);
      return;
    }
  }

  // 4. Template Writing
  try {
    const templatePath = path.join(__dirname, 'templates/default-model.yaml');
    const template = fs.readFileSync(templatePath, 'utf8')
      .replace('{{MODEL_FORMAT_VERSION}}', MODEL_FORMAT_VERSION);
    fs.writeFileSync(absolutePath, template, 'utf8');
    console.log(`  ✅ Successfully created new model: ${filePath}`);
    console.log(`  🚀 Run 'modscape dev ${filePath}' to start modeling.`);
  } catch (error) {
    console.error(`  ❌ Failed to create model: ${error.message}`);
  }
}
