#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { startDevServer } from './dev.js';
import { build } from './build.js';
import { initProject } from './init.js';
import { exportModel } from './export.js';
import { createModel } from './create.js';
import { importDbt } from './import-dbt.js';
import { syncDbt } from './sync-dbt.js';
import { applyLayout } from './layout.js';
import { createRequire } from 'module';
import { mergeModels } from './merge.js';
import { extractModels } from './extract.js';
import { tableCommand, columnCommand, relationshipCommand, lineageCommand, domainCommand, annotationCommand, summaryCommand, consumerCommand } from './cli.js';
import { runValidate } from './validate.js';
import { runCoverage } from './coverage.js';
import { runLint } from './lint.js';
import { runPrune } from './prune.js';
import { migrateModel } from './migrate.js';
import { specNew } from './spec.js';
import { runSearch } from './search.js';
import { updateProject } from './update.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VISUALIZER_PATH = path.resolve(__dirname, '../visualizer');
const program = new Command();

program
  .name('modscape')
  .description('Modscape: A YAML-driven data modeling visualizer CLI')
  .version(pkg.version);

program
  .command('update')
  .description('Update installed skill files to the latest bundled version')
  .action(() => {
    updateProject();
  });

program
  .command('init')
  .description('Initialize project with AI modeling rules')
  .option('-g, --gemini', 'Scaffold for Gemini CLI')
  .option('-x, --codex', 'Scaffold for Codex')
  .option('-c, --claude', 'Scaffold for Claude Code')
  .option('-a, --all', 'Scaffold for all agents')
  .option('-s, --sdd', 'Add SDD (Spec-Driven Data Engineering) skills')
  .option('-y, --yes', 'Automatically overwrite existing files without prompting')
  .action((options) => {
    initProject(options);
  });

program
  .command('new')
  .description('Create a new YAML model file from template')
  .argument('<path>', 'path to the new YAML file')
  .action((path) => {
    createModel(path);
  });

program
  .command('dev')
  .description('Start the development visualizer with local YAML files or directories')
  .argument('<paths...>', 'paths to YAML model files or directories')
  .action((paths) => {
    startDevServer(paths, VISUALIZER_PATH);
  });

program
  .command('build')
  .description('Build a static site from YAML models')
  .argument('<paths...>', 'paths to YAML model files or directories')
  .option('-o, --output <dir>', 'output directory', 'dist')
  .action((paths, options) => {
    build(paths, VISUALIZER_PATH, options.output);
  });

program
  .command('export')
  .description('Export YAML models to Mermaid-compatible Markdown documentation')
  .argument('<paths...>', 'paths to YAML model files or directories')
  .option('-o, --output <path>', 'output file or directory')
  .option('--with-context [specs-dir]', 'merge SDD context (decisions, Q&A, glossary, table specs); defaults to .modscape/specs')
  .action((paths, options) => {
    exportModel(paths, options);
  });

const dbtCommand = program
  .command('dbt')
  .description('dbt integration commands');

dbtCommand
  .command('import')
  .description('Import dbt project into Modscape YAML models')
  .argument('[project-dir]', 'path to dbt project directory (default: current directory)')
  .option('-o, --output <dir>', 'output directory (default: modscape-<project-name>)')
  .option('--split-by <key>', 'split output by "schema", "tag", or "folder"')
  .action((projectDir, options) => {
    importDbt(projectDir, options);
  });

// dbtCommandに追加
dbtCommand
  .command('sync')
  .description('Sync dbt project changes into existing Modscape YAML models')
  .argument('[project-dir]', 'path to dbt project directory (default: current directory)')
  .option('-o, --output <dir>', 'output directory (default: modscape-<project-name>)')
  .action((projectDir, options) => {
    syncDbt(projectDir, options);
  });


program
  .command('merge')
  .description('Merge multiple YAML models into one')
  .argument('<paths...>', 'YAML files or directories to merge')
  .option('-o, --output <path>', 'output file path', 'merged.yaml')
  .option('-p, --patch', 'Patch mode: preserve first file\'s table order, upsert subsequent files in-place')
  .action((paths, options) => {
    mergeModels(paths, options);
  });

program
  .command('extract')
  .description('Extract specific tables from YAML models by ID')
  .argument('<paths...>', 'YAML files or directories to extract from')
  .option('-t, --tables <ids>', 'comma-separated table IDs to extract')
  .option('-o, --output <path>', 'output file path', 'extracted.yaml')
  .option('-a, --append', 'upsert into existing output file instead of overwriting')
  .option('--record <path>', 'record source YAML → table mapping into spec-config.yaml')
  .option('--with-downstream', 'Recursively collect all downstream tables via lineage traversal')
  .action((paths, options) => {
    extractModels(paths, options);
  });

program.addCommand(tableCommand());
program.addCommand(columnCommand());
program.addCommand(relationshipCommand());
program.addCommand(lineageCommand());
program.addCommand(domainCommand());
program.addCommand(annotationCommand());
program.addCommand(consumerCommand());
program.addCommand(summaryCommand());

program
  .command('layout')
  .description('Perform automatic layout calculation and update the YAML file')
  .argument('<path>', 'path to the YAML model file')
  .option('-o, --output <path>', 'output file path (defaults to overwriting input)')
  .action((path, options) => {
    applyLayout(path, options);
  });

program
  .command('migrate')
  .description('Migrate a YAML model file to the latest schema version')
  .argument('<path>', 'path to the YAML model file')
  .option('--dry-run', 'preview the migration without writing files')
  .option('-o, --out <path>', 'write migrated output to a different file')
  .action((filePath, options) => {
    migrateModel(filePath, { dryRun: options.dryRun, out: options.out });
  });

program
  .command('validate')
  .description('Validate a YAML model file for structural errors')
  .argument('<file>', 'path to the YAML model file')
  .option('--json', 'output as JSON')
  .action((file, opts) => {
    runValidate(file, opts);
  });

program
  .command('coverage')
  .description('Show model stats and documentation coverage for a YAML model file')
  .argument('<file>', 'path to the YAML model file')
  .option('--min-coverage <n>', 'exit 1 if overall coverage is below this threshold (%)', (v) => parseInt(v, 10))
  .option('--json', 'output as JSON')
  .action((file, opts) => {
    const code = runCoverage(file, { minCoverage: opts.minCoverage, json: opts.json });
    if (code !== 0) process.exit(code);
  });

program
  .command('lint')
  .description('Check documentation quality and modeling best-practice compliance')
  .argument('<file>', 'path to the YAML model file')
  .option('--rules <path>', 'path to lint-rules.yaml (default: .modscape/lint-rules.yaml)')
  .option('--json', 'output as JSON')
  .action((file, opts) => {
    runLint(file, { rules: opts.rules, json: opts.json });
  });

program
  .command('prune')
  .description('Detect and optionally remove orphaned entries from a YAML model file')
  .argument('<file>', 'path to the YAML model file')
  .option('--write', 'actually remove orphaned entries (default: dry-run)')
  .option('--include-isolated', 'also detect tables with no relationship or lineage connections')
  .option('--json', 'output as JSON')
  .action((file, opts) => {
    runPrune(file, { write: opts.write, includeIsolated: opts.includeIsolated, json: opts.json });
  });

const specCommand = program
  .command('spec')
  .description('Spec-Driven Data Engineering (SDD) commands');

specCommand
  .command('new')
  .description('Scaffold a new spec work folder under .modscape/changes/<name>/')
  .argument('<name>', 'kebab-case name for the spec (e.g. monthly-sales-summary)')
  .action((name) => {
    specNew(name);
  });

specCommand
  .command('search')
  .description('Search past archives and specs for a keyword')
  .argument('<keyword>', 'keyword to search for')
  .option('--json', 'output as JSON')
  .option('--limit <n>', 'maximum number of results (default: 5)', (v) => parseInt(v, 10), 5)
  .action((keyword, opts) => {
    runSearch(keyword, opts);
  });


program.parse();
