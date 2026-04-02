import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const FIXTURE_DIR = 'tests/fixtures/ai-tools-test';
const MODEL_FILE = path.join(FIXTURE_DIR, 'model.yaml');

const INITIAL_MODEL = {
  tables: [
    { id: 'fct_orders', name: 'Orders', appearance: { type: 'fact' } },
    { id: 'dim_customers', name: 'Customers', appearance: { type: 'dimension' } },
    { id: 'dim_products', name: 'Products', appearance: { type: 'dimension' } },
    { id: 'mart_summary', name: 'Summary', appearance: { type: 'mart' } },
  ],
  domains: [
    { id: 'sales', name: 'Sales', members: ['fct_orders', 'dim_customers'] },
  ],
  relationships: [
    { id: 'rel_1', from: { table: 'dim_customers', column: ['customer_id'] }, to: { table: 'fct_orders', column: ['customer_id'] }, type: 'one-to-many' },
  ],
  lineage: [
    { id: 'lin_1', from: 'fct_orders', to: 'mart_summary' },
  ],
};

function cli(args: string): string {
  return execSync(`node src/index.js ${args}`, { encoding: 'utf8' });
}

function cliJson(args: string): any {
  return JSON.parse(cli(args));
}

function readModel(): any {
  return yaml.load(fs.readFileSync(MODEL_FILE, 'utf8'));
}

test.describe('CLI: annotation commands', () => {
  test.beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(MODEL_FILE, yaml.dump(INITIAL_MODEL));
  });

  test.afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test('annotation list returns empty array when no annotations', () => {
    const result = cliJson(`annotation list ${MODEL_FILE} --json`);
    expect(result).toEqual([]);
  });

  test('annotation add creates annotation with auto-generated id', () => {
    cli(`annotation add ${MODEL_FILE} --text "Test note" --type sticky`);
    const model = readModel();
    expect(model.annotations).toHaveLength(1);
    expect(model.annotations[0].text).toBe('Test note');
    expect(model.annotations[0].type).toBe('sticky');
    expect(model.annotations[0].id).toMatch(/^note-\d+$/);
  });

  test('annotation add with explicit id', () => {
    cli(`annotation add ${MODEL_FILE} --id my_note --text "Explicit ID" --type callout --target-id fct_orders --target-type table`);
    const model = readModel();
    const note = model.annotations.find((a: any) => a.id === 'my_note');
    expect(note).toBeDefined();
    expect(note.targetId).toBe('fct_orders');
    expect(note.targetType).toBe('table');
  });

  test('annotation add with duplicate id throws error', () => {
    cli(`annotation add ${MODEL_FILE} --id dup --text "First"`);
    expect(() => cli(`annotation add ${MODEL_FILE} --id dup --text "Second"`)).toThrow();
  });

  test('annotation list returns all annotations as JSON', () => {
    cli(`annotation add ${MODEL_FILE} --id n1 --text "Note 1"`);
    cli(`annotation add ${MODEL_FILE} --id n2 --text "Note 2" --type callout`);
    const result = cliJson(`annotation list ${MODEL_FILE} --json`);
    expect(result).toHaveLength(2);
    expect(result.map((a: any) => a.id)).toContain('n1');
    expect(result.map((a: any) => a.id)).toContain('n2');
  });

  test('annotation update modifies text without changing other fields', () => {
    cli(`annotation add ${MODEL_FILE} --id n1 --text "Original" --type callout`);
    cli(`annotation update ${MODEL_FILE} --id n1 --text "Updated"`);
    const model = readModel();
    const note = model.annotations.find((a: any) => a.id === 'n1');
    expect(note.text).toBe('Updated');
    expect(note.type).toBe('callout');
  });

  test('annotation update with non-existent id throws error', () => {
    expect(() => cli(`annotation update ${MODEL_FILE} --id ghost --text "x"`)).toThrow();
  });

  test('annotation remove deletes the entry', () => {
    cli(`annotation add ${MODEL_FILE} --id n1 --text "To delete"`);
    cli(`annotation remove ${MODEL_FILE} --id n1`);
    const model = readModel();
    expect((model.annotations || []).find((a: any) => a.id === 'n1')).toBeUndefined();
  });

  test('annotation remove with non-existent id throws error', () => {
    expect(() => cli(`annotation remove ${MODEL_FILE} --id ghost`)).toThrow();
  });
});

test.describe('CLI: summary command', () => {
  test.beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(MODEL_FILE, yaml.dump(INITIAL_MODEL));
  });

  test.afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test('summary returns correct table count', () => {
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    expect(result.tableCount).toBe(4);
  });

  test('summary returns correct byType breakdown', () => {
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    expect(result.byType.fact).toBe(1);
    expect(result.byType.dimension).toBe(2);
    expect(result.byType.mart).toBe(1);
  });

  test('summary returns domain count and member counts', () => {
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    expect(result.domainCount).toBe(1);
    expect(result.domains[0].id).toBe('sales');
    expect(result.domains[0].memberCount).toBe(2);
  });

  test('summary returns orphan table ids', () => {
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    // dim_products and mart_summary are not in any domain
    expect(result.orphanTableIds).toContain('dim_products');
    expect(result.orphanTableIds).toContain('mart_summary');
    expect(result.orphanTableIds).not.toContain('fct_orders');
  });

  test('summary returns relationship, lineage, annotation counts', () => {
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    expect(result.relationshipCount).toBe(1);
    expect(result.lineageCount).toBe(1);
    expect(result.annotationCount).toBe(0);
  });

  test('summary returns zero counts for empty model', () => {
    fs.writeFileSync(MODEL_FILE, yaml.dump({}));
    const result = cliJson(`summary ${MODEL_FILE} --json`);
    expect(result.tableCount).toBe(0);
    expect(result.domainCount).toBe(0);
    expect(result.orphanTableIds).toEqual([]);
    expect(result.annotationCount).toBe(0);
  });
});

test.describe('CLI: table list filters', () => {
  test.beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(MODEL_FILE, yaml.dump(INITIAL_MODEL));
  });

  test.afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test('table list returns all tables without filters', () => {
    const result = cliJson(`table list ${MODEL_FILE} --json`);
    expect(result).toHaveLength(4);
  });

  test('table list --type fact returns only fact tables', () => {
    const result = cliJson(`table list ${MODEL_FILE} --type fact --json`);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('fct_orders');
  });

  test('table list --type dimension returns only dimension tables', () => {
    const result = cliJson(`table list ${MODEL_FILE} --type dimension --json`);
    expect(result).toHaveLength(2);
    expect(result.map((t: any) => t.id)).toContain('dim_customers');
    expect(result.map((t: any) => t.id)).toContain('dim_products');
  });

  test('table list --type with no match returns empty array', () => {
    const result = cliJson(`table list ${MODEL_FILE} --type hub --json`);
    expect(result).toEqual([]);
  });

  test('table list --domain returns tables in that domain', () => {
    const result = cliJson(`table list ${MODEL_FILE} --domain sales --json`);
    expect(result).toHaveLength(2);
    expect(result.map((t: any) => t.id)).toContain('fct_orders');
    expect(result.map((t: any) => t.id)).toContain('dim_customers');
  });

  test('table list --domain with non-existent domain returns empty array', () => {
    const result = cliJson(`table list ${MODEL_FILE} --domain ghost_domain --json`);
    expect(result).toEqual([]);
  });

  test('table list --orphan returns tables not in any domain', () => {
    const result = cliJson(`table list ${MODEL_FILE} --orphan --json`);
    expect(result.map((t: any) => t.id)).toContain('dim_products');
    expect(result.map((t: any) => t.id)).toContain('mart_summary');
    expect(result.map((t: any) => t.id)).not.toContain('fct_orders');
    expect(result.map((t: any) => t.id)).not.toContain('dim_customers');
  });

  test('table list --orphan returns empty when all tables have domains', () => {
    const allInDomain = {
      ...INITIAL_MODEL,
      domains: [{ id: 'all', name: 'All', members: ['fct_orders', 'dim_customers', 'dim_products', 'mart_summary'] }],
    };
    fs.writeFileSync(MODEL_FILE, yaml.dump(allInDomain));
    const result = cliJson(`table list ${MODEL_FILE} --orphan --json`);
    expect(result).toEqual([]);
  });
});
