import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OUTPUT_PATH = 'tests/fixtures/output-test.osi.yaml';

test.describe('CLI: export --format osi', () => {
  test.afterEach(() => {
    if (fs.existsSync(OUTPUT_PATH)) {
      fs.rmSync(OUTPUT_PATH);
    }
  });

  test('should produce a valid OSI YAML with correct version', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);

    expect(fs.existsSync(OUTPUT_PATH)).toBe(true);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;

    expect(doc.version).toBe('0.2.0.dev0');
    expect(Array.isArray(doc.semantic_model)).toBe(true);
    expect(doc.semantic_model.length).toBe(1);
  });

  test('should map tables to datasets with physical name as source', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const datasets = doc.semantic_model[0].datasets;

    const hubCustomer = datasets.find((d: any) => d.name === 'hub_customer');
    expect(hubCustomer).toBeDefined();
    expect(hubCustomer.source).toBe('hub_customer');
    expect(hubCustomer.description).toBe('Customer Hub');
  });

  test('should collect primary keys into datasets[].primary_key', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const datasets = doc.semantic_model[0].datasets;

    const hubCustomer = datasets.find((d: any) => d.name === 'hub_customer');
    expect(hubCustomer.primary_key).toContain('customer_hk');
  });

  test('should map columns to fields with ANSI_SQL expression', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const datasets = doc.semantic_model[0].datasets;

    const hubCustomer = datasets.find((d: any) => d.name === 'hub_customer');
    const field = hubCustomer.fields.find((f: any) => f.name === 'customer_hk');
    expect(field).toBeDefined();
    expect(field.expression.dialects).toHaveLength(1);
    expect(field.expression.dialects[0].dialect).toBe('ANSI_SQL');
    expect(field.expression.dialects[0].expression).toBe('customer_hk');
  });

  test('should map relationships', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const relationships = doc.semantic_model[0].relationships;

    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBeGreaterThan(0);

    const rel = relationships[0];
    expect(rel.name).toBeDefined();
    expect(rel.from).toBeDefined();
    expect(rel.to).toBeDefined();
    expect(Array.isArray(rel.from_columns)).toBe(true);
    expect(Array.isArray(rel.to_columns)).toBe(true);
  });

  test('should map metrics with ANSI_SQL expression', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const metrics = doc.semantic_model[0].metrics;

    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);

    const metric = metrics.find((m: any) => m.name === 'Gross Revenue MTD');
    expect(metric).toBeDefined();
    expect(metric.expression.dialects[0].dialect).toBe('ANSI_SQL');
    expect(metric.expression.dialects[0].expression).toBe('RUNNING_SUM(SUM([Gross Revenue]))');
    expect(metric.description).toBeDefined();
  });

  test('should store kind and domain in custom_extensions.modscape', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const datasets = doc.semantic_model[0].datasets;

    const hubCustomer = datasets.find((d: any) => d.name === 'hub_customer');
    const ext = hubCustomer.custom_extensions?.[0];
    expect(ext?.vendor_name).toBe('modscape');
    const extData = JSON.parse(ext?.data);
    expect(extData.kind).toBe('hub');
    expect(extData.domain).toBe('raw_vault');
  });

  test('should resolve imports and include dim_dates from imported file', () => {
    execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml --output ${OUTPUT_PATH}`);
    const doc = yaml.load(fs.readFileSync(OUTPUT_PATH, 'utf8')) as any;
    const datasets = doc.semantic_model[0].datasets;

    const dimDates = datasets.find((d: any) => d.name === 'dim_dates');
    expect(dimDates).toBeDefined();
  });

  test('should use default output path when --output is not specified', () => {
    const defaultOutput = 'samples/1-retail-analytics.osi.yaml';
    try {
      execSync(`node src/index.js export --format osi samples/1-retail-analytics.yaml`);
      expect(fs.existsSync(defaultOutput)).toBe(true);
    } finally {
      if (fs.existsSync(defaultOutput)) fs.rmSync(defaultOutput);
    }
  });
});
