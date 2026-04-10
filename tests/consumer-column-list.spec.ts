import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const FIXTURE_DIR = 'tests/fixtures/consumer-column-test';
const MODEL_FILE = path.join(FIXTURE_DIR, 'model.yaml');

const INITIAL_MODEL = {
  version: '2.0.0',
  tables: [
    {
      id: 'fct_orders',
      conceptual: { name: 'Orders', kind: 'fact' },
      columns: [
        { id: 'order_id', name: 'Order ID', type: 'Int', isPrimaryKey: true, isForeignKey: false },
        { id: 'customer_id', name: 'Customer ID', type: 'Int', isPrimaryKey: false, isForeignKey: true },
        { id: 'amount', name: 'Amount', type: 'Decimal', isPrimaryKey: false, isForeignKey: false },
      ],
    },
    { id: 'dim_customers', conceptual: { name: 'Customers', kind: 'dimension' } },
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

test.describe('CLI: column list', () => {
  test.beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(MODEL_FILE, yaml.dump(INITIAL_MODEL));
  });

  test.afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test('column list returns columns of a table as JSON', () => {
    const result = cliJson(`column list ${MODEL_FILE} --table fct_orders --json`);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('order_id');
    expect(result[0].isPrimaryKey).toBe(true);
    expect(result[1].id).toBe('customer_id');
    expect(result[1].isForeignKey).toBe(true);
  });

  test('column list returns empty array for table with no columns', () => {
    const result = cliJson(`column list ${MODEL_FILE} --table dim_customers --json`);
    expect(result).toEqual([]);
  });

  test('column list throws error for non-existent table', () => {
    expect(() => cli(`column list ${MODEL_FILE} --table ghost --json`)).toThrow();
  });
});

test.describe('CLI: consumer commands', () => {
  test.beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    fs.writeFileSync(MODEL_FILE, yaml.dump(INITIAL_MODEL));
  });

  test.afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  });

  test('consumer list returns empty array when no consumers', () => {
    const result = cliJson(`consumer list ${MODEL_FILE} --json`);
    expect(result).toEqual([]);
  });

  test('consumer add creates a consumer with required fields', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "BI Dashboard"`);
    const model = readModel();
    expect(model.consumers).toHaveLength(1);
    expect(model.consumers[0].id).toBe('bi_dashboard');
    expect(model.consumers[0].name).toBe('BI Dashboard');
  });

  test('consumer add with all optional fields', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "BI Dashboard" --description "Main dashboard" --icon 📊 --color "#e0f2fe" --url "https://example.com/dashboard"`);
    const model = readModel();
    const c = model.consumers[0];
    expect(c.description).toBe('Main dashboard');
    expect(c.display.icon).toBe('📊');
    expect(c.display.color).toBe('#e0f2fe');
    expect(c.url).toBe('https://example.com/dashboard');
  });

  test('consumer add with duplicate id throws error', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "BI Dashboard"`);
    expect(() => cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "Duplicate"`)).toThrow();
  });

  test('consumer list returns all consumers', () => {
    cli(`consumer add ${MODEL_FILE} --id c1 --name "Consumer 1"`);
    cli(`consumer add ${MODEL_FILE} --id c2 --name "Consumer 2"`);
    const result = cliJson(`consumer list ${MODEL_FILE} --json`);
    expect(result).toHaveLength(2);
    expect(result.map((c: any) => c.id)).toContain('c1');
    expect(result.map((c: any) => c.id)).toContain('c2');
  });

  test('consumer get returns a single consumer', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "BI Dashboard"`);
    const result = cliJson(`consumer get ${MODEL_FILE} --id bi_dashboard --json`);
    expect(result.id).toBe('bi_dashboard');
    expect(result.name).toBe('BI Dashboard');
  });

  test('consumer get throws error for non-existent id', () => {
    expect(() => cli(`consumer get ${MODEL_FILE} --id ghost --json`)).toThrow();
  });

  test('consumer update modifies name without changing other fields', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "Old Name" --url "https://example.com"`);
    cli(`consumer update ${MODEL_FILE} --id bi_dashboard --name "New Name"`);
    const model = readModel();
    const c = model.consumers[0];
    expect(c.name).toBe('New Name');
    expect(c.url).toBe('https://example.com');
  });

  test('consumer update throws error for non-existent id', () => {
    expect(() => cli(`consumer update ${MODEL_FILE} --id ghost --name "x"`)).toThrow();
  });

  test('consumer remove deletes the entry', () => {
    cli(`consumer add ${MODEL_FILE} --id bi_dashboard --name "BI Dashboard"`);
    cli(`consumer remove ${MODEL_FILE} --id bi_dashboard`);
    const model = readModel();
    expect((model.consumers || []).find((c: any) => c.id === 'bi_dashboard')).toBeUndefined();
  });

  test('consumer remove throws error for non-existent id', () => {
    expect(() => cli(`consumer remove ${MODEL_FILE} --id ghost`)).toThrow();
  });
});
