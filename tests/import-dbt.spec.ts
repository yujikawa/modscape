import { test, expect } from '@playwright/test';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const PROJECT_DIR = 'tests/fixtures/dbt_project';
const OUTPUT_DIR = 'tests/fixtures/import-test-result';
const OUTPUT_YAML = path.join(OUTPUT_DIR, 'dbt-model.yaml');

test.describe('CLI: dbt import', () => {
  test.afterEach(() => {
    // Ensure the generated files are cleaned up after each test
    if (fs.existsSync(OUTPUT_DIR)) {
      fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  test('should import dbt manifest and generate valid Modscape YAML', async () => {
    // 1. Run the import command
    // We use node src/index.js directly to avoid issues with bin linking in CI
    const command = `node src/index.js dbt import ${PROJECT_DIR} -o ${OUTPUT_DIR}`;
    
    try {
      execSync(command);
    } catch (error) {
      throw new Error(`Import command failed: ${error.message}`);
    }

    // 2. Verify the output file exists
    expect(fs.existsSync(OUTPUT_YAML)).toBe(true);

    // 3. Load and verify the content
    const content = fs.readFileSync(OUTPUT_YAML, 'utf8');
    const model = yaml.load(content) as any;

    expect(model.tables).toBeDefined();
    expect(model.tables.length).toBeGreaterThan(0);

    // Verify conceptual-first mapping
    const stgOrders = model.tables.find(t => t.id === 'model.my_project.stg_orders');
    expect(stgOrders).toBeDefined();
    expect(stgOrders.conceptual.description).toContain('staging table'); // from dbt description
    expect(stgOrders.logical?.name).toBe('stg_orders'); // from dbt name
    expect(stgOrders.physical?.name).toBe('stg_orders_v1'); // from dbt alias

    // Verify lineage
    const lineageEntry = model.lineage.find(l => l.to === 'model.my_project.stg_orders');
    expect(lineageEntry).toBeDefined();
    expect(lineageEntry.from).toBe('source.my_project.raw_orders.orders');

    // Verify domains
    expect(model.domains).toBeDefined();
    const stagingDomain = model.domains.find(d => d.id === 'staging');
    expect(stagingDomain).toBeDefined();
    expect(stagingDomain.members).toContain('model.my_project.stg_orders');
  });

  test('should show error message when manifest is missing', async () => {
    const EMPTY_DIR = 'tests/fixtures/empty_project';
    if (!fs.existsSync(EMPTY_DIR)) fs.mkdirSync(EMPTY_DIR);
    
    // Use spawnSync to easily get stdout and stderr
    const { stderr } = spawnSync('node', [
      'src/index.js',
      'dbt',
      'import',
      EMPTY_DIR,
      '-o',
      OUTPUT_DIR
    ]);
    
    const output = stderr.toString();
    expect(output).toContain('manifest.json not found');
    expect(fs.existsSync(OUTPUT_YAML)).toBe(false);
    
    if (fs.existsSync(EMPTY_DIR)) fs.rmSync(EMPTY_DIR, { recursive: true });
  });
});
