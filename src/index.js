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
import { startMcpServer } from './mcp.js';
import { runValidate } from './validate.js';

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
  .command('init')
  .description('Initialize project with AI modeling rules')
  .option('-g, --gemini', 'Scaffold for Gemini CLI')
  .option('-x, --codex', 'Scaffold for Codex')
  .option('-c, --claude', 'Scaffold for Claude Code')
  .option('-a, --all', 'Scaffold for all agents')
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
  .action((paths, options) => {
    mergeModels(paths, options);
  });

program
  .command('extract')
  .description('Extract specific tables from YAML models by ID')
  .argument('<paths...>', 'YAML files or directories to extract from')
  .option('-t, --tables <ids>', 'comma-separated table IDs to extract')
  .option('-o, --output <path>', 'output file path', 'extracted.yaml')
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
  .command('validate')
  .description('Validate a YAML model file for structural errors')
  .argument('<file>', 'path to the YAML model file')
  .option('--json', 'output as JSON')
  .action((file, opts) => {
    runValidate(file, opts);
  });

program
  .command('mcp')
  .description('Start the Modscape MCP server (stdio transport)')
  .action(() => {
    startMcpServer();
  });

program.parse();
