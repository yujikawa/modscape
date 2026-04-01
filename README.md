# <img src="./visualizer/public/favicon.svg" width="32" height="32" align="center" /> Modscape

[![npm version](https://img.shields.io/npm/v/modscape.svg?style=flat-square)](https://www.npmjs.com/package/modscape)
[![npm downloads](https://img.shields.io/npm/dm/modscape.svg?style=flat-square)](https://www.npmjs.com/package/modscape)
[![Deploy Demo](https://github.com/yujikawa/modscape/actions/workflows/deploy.yml/badge.svg)](https://github.com/yujikawa/modscape/actions/workflows/deploy.yml)
[![Publish to NPM](https://github.com/yujikawa/modscape/actions/workflows/publish.yml/badge.svg)](https://github.com/yujikawa/modscape/actions/workflows/publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Modscape** is a YAML-driven data modeling visualizer specialized for **Modern Data Stack** architectures. It bridges the gap between raw physical schemas and high-level business logic, empowering data teams to design, document, and share their data stories.

🌐 **Live Demo:**
https://yujikawa.github.io/modscape/

![Modscape Screenshot](https://raw.githubusercontent.com/yujikawa/modscape/main/docs/assets/modscape.png)

## Why Modscape?

In modern data analysis platforms, data modeling is no longer just about drawing boxes. It's about maintaining a **Single Source of Truth (SSOT)** that is version-controllable, AI-friendly, and understandable by both engineers and stakeholders.

- **For Data Engineers**: Maintain clear mappings between physical tables and logical entities. Visualize complex **Data Vault** or **Star Schema** structures.
- **For Analytics Engineers**: Design modular dbt-ready models. Document table grains, primary keys, and relationships before writing a single line of SQL.
- **For Data Scientists**: Discover data through **Sample Stories**. Understand the purpose and content of a table through integrated sample data previews without running a single query.

## Key Features

- **YAML-as-Code**: Define your entire data architecture in a single, human-readable YAML file. Track changes via Git.
- **Tri-Layer Naming System**: Document entities across three levels of abstraction: **Conceptual** (Visual name), **Logical** (Formal business name), and **Physical** (Actual database table name).
- **Auto-Format Layout**: Automatically arrange tables and domains based on their relationships using an intelligent hierarchical layout engine (Note: manual adjustment may be required for complex models).
- **Redesigned Modeling Nodes**: Protruding "Index Tabs" for entity types (FACT, DIM, HUB, LINK, etc.) and auto-truncating physical names for a professional look.
- **Interactive Visual Canvas**: 
  - **Drag-to-Connect**: Create relationships between columns intuitively with "Magnetic Snapping".
  - **Semantic Edge Badges**: Visually identify cardinality with `( 1 )` and `[ N ]` badges at the connection points.
  - **Data Lineage Mode**: Visualize data flow with animated dashed arrows.
  - **Domain-Grouped Navigation**: Organize tables into visual business domains and navigate them via a structured sidebar.
- **Unified Undo/Redo & Auto-save**:
  - Graph-level Undo/Redo (`Ctrl+Z` / `Ctrl+Shift+Z`) for visual operations on the canvas.
  - Optional **Auto-save** ensures your local YAML is always up-to-date.
- **YAML Sidebar**: Read-only YAML viewer with a **Diff toggle** to highlight changes since the last disk load, and a **Download** button to export the current model as a YAML file. To edit the YAML directly, open the file in your external editor (VS Code, etc.) — changes are synced automatically.
- **Rich Detail Panel**: Edit table and column metadata directly from the UI — including ID rename (with full cross-reference update), appearance icon & color, and column role toggles (`isPrimaryKey`, `isForeignKey`, `isPartitionKey`).
- **Dark/Light Mode Support**: Switch between themes seamlessly for better eye comfort or documentation exports.
- **Specialized Modeling Types**: Native support for entity types like `fact`, `dimension`, `mart`, `hub`, `link`, `satellite`, and generic `table`.
- **AI-Agent Ready**: Built-in scaffolding for **Gemini CLI, Claude Code, and Codex** — both for modeling (`/modscape:modeling`) and implementation code generation (`/modscape:codegen`).

## Installation

Install Modscape globally via npm:

```bash
npm install -g modscape
```

---

## Getting Started

### Path A: AI-Driven Modeling (Recommended)
Leverage AI coding assistants (**Gemini CLI, Claude Code, or Codex**) to build your models.

1.  **Initialize**: Scaffold modeling rules and commands for your preferred agent.
    ```bash
    modscape init --gemini   # Gemini CLI
    modscape init --claude   # Claude Code
    modscape init --codex    # Codex
    modscape init --all      # all three
    ```
    This creates `.modscape/rules.md` (YAML schema rules) and `.modscape/codegen-rules.md` (code generation rules), plus agent-specific command files.

    > **Updating rules**: After upgrading Modscape, re-run `modscape init` to overwrite `.modscape/rules.md` and `.modscape/codegen-rules.md` with the latest bundled version.

2.  **Start Dev**: Launch the visualizer.
    ```bash
    modscape dev model.yaml
    ```

3.  **Model with AI** — use `/modscape:modeling` to design your data model:
    > *"Use the rules in .modscape/rules.md to add a new 'Marketing' domain with a 'campaign_performance' fact table."*

4.  **Generate implementation code** — use `/modscape:codegen` to turn your YAML into dbt / SQLMesh / Spark SQL:
    > *"Follow .modscape/codegen-rules.md and generate dbt models from model.yaml."*

    The agent generates models in the correct dependency order and adds `-- TODO:` comments wherever the YAML doesn't fully specify the logic.

### Path B: Manual Modeling
Best for direct architectural control.

1.  **Create YAML**: Create a file named `model.yaml` (see [YAML Reference](#defining-your-model-yaml)).
2.  **Start Dev**: Launch the visualizer.
    ```bash
    modscape dev model.yaml
    ```

---

## Defining Your Model (YAML)

Modscape uses a schema designed for data analysis contexts. The full YAML structure is:

```
version      – model format version (optional string, e.g. "1.0.0")
imports      – cross-file table references (resolved at dev/build time)
domains      – visual containers grouping related tables
tables       – entity definitions with tri-layer metadata
relationships – ER cardinality between tables
lineage      – data flow / transformation paths
annotations  – sticky notes / callouts on the canvas
layout       – ALL coordinate data (never put x/y inside tables or domains)
consumers    – downstream consumers (BI dashboards, ML models, applications)
```

### Domains

```yaml
domains:
  - id: core_sales
    name: "Core Sales"
    description: "Transactional data for the sales team."  # optional
    color: "rgba(59, 130, 246, 0.1)"  # background fill
    members: [orders, dim_customers]   # logical membership
```

### Tables

```yaml
tables:
  - id: orders
    name: Orders                          # Conceptual name (large)
    logical_name: "Customer Purchase Record"  # Logical name (medium)
    physical_name: "fct_retail_sales"         # Physical table name (small)

    appearance:
      type: fact        # fact | dimension | mart | hub | link | satellite | table
      sub_type: transaction  # transaction | periodic | accumulating | etc.
      scd: type2        # SCD type for dimensions: type0–type6
      icon: "💰"
      color: "#e0f2fe"  # optional custom header color

    conceptual:  # optional – business context for AI agents
      description: "One row per order line item."
      tags: [WHO, WHAT, WHEN]  # BEAM* tags

    implementation:  # optional – hints for AI code generation
      materialization: incremental  # table | view | incremental | ephemeral
      incremental_strategy: merge   # merge | append | delete+insert
      unique_key: order_id
      partition_by:
        field: order_date       # use a DATE/TIMESTAMP column, not a surrogate key
        granularity: day        # day | month | year | hour
      cluster_by: [customer_id]
      grain: [month_key]        # GROUP BY columns (mart only)
      measures:                 # aggregation definitions (mart only)
        - column: total_revenue
          agg: sum              # sum | count | count_distinct | avg | min | max
          source_column: fct_sales.amount

    columns:
      - id: order_id
        logical:
          name: "Order ID"
          type: Int         # Int | String | Decimal | Date | Timestamp | Boolean | ...
          description: "Surrogate key."
          isPrimaryKey: true
          isForeignKey: false
          isPartitionKey: false
          additivity: fully  # fully | semi | non
        physical:  # optional warehouse overrides
          name: order_id
          type: "BIGINT"
          constraints: [NOT NULL]

    sampleData:  # 2D array of realistic values
      - [1001, 50.0, "COMPLETED"]
      - [1002, 120.5, "PENDING"]
```

### Data Lineage

Top-level `lineage` section declares data flow between tables (which source tables feed which derived tables). This is rendered as dashed arrows in **Lineage Mode**.

```yaml
lineage:
  - id: lin_orders_revenue   # optional; auto-generated as lin-{from}-{to} if omitted
    from: fct_orders         # source table ID
    to: mart_revenue         # derived table ID
    description: "Aggregated daily amounts into monthly buckets."  # optional
  - id: lin_dates_revenue
    from: dim_dates
    to: mart_revenue
```

### Relationships

```yaml
relationships:
  - id: rel_cust_orders
    from:
      table: dim_customers   # table ID
      column: [customer_id]  # column ID(s)
    to:
      table: fct_orders
      column: [customer_id]
    type: one-to-many  # one-to-one | one-to-many | many-to-one | many-to-many
    description: "Optional description of the relationship"  # optional
```

> **ER Relationships** vs **Lineage**: Use `relationships` for structural joins (FKs) and `lineage` for data flow (transformations). Do not duplicate them.

### Imports

Reference table definitions from another YAML file without copying them. Useful for **conformed dimensions** shared across multiple models.

```yaml
imports:
  - from: ./shared/conformed-dims.yaml   # relative path from this file
    ids: [dim_dates, dim_customers]      # optional: omit to import all tables
```

Imported tables are resolved automatically when running `modscape dev` or `modscape build`. They appear on the canvas as read-only nodes. To edit them, update the source file directly.

Imported table IDs work in `domains.members`, `relationships`, and `lineage` entries just like local tables.

### Consumers

Consumers represent the downstream users of your data model — BI dashboards, ML models, applications, or any other system that consumes the data. They appear as distinct nodes on the canvas and can receive lineage edges.

```yaml
consumers:
  - id: revenue_dashboard       # unique ID — used in lineage and layout
    name: "Revenue Dashboard"   # display name
    description: "Monthly KPI dashboard for the finance team."  # optional
    appearance:
      icon: "📊"                # optional (defaults to 📊)
      color: "#e0f2fe"          # optional accent color
    url: "https://bi.example.com/revenue"  # optional link
```

Connect a consumer with lineage by using its `id` as the `to` field:

```yaml
lineage:
  - from: mart_monthly_revenue
    to: revenue_dashboard   # consumer ID
```

Consumers can also be added to domain `members` lists just like tables.

### Annotations

```yaml
annotations:
  - id: note_001
    type: sticky   # sticky | callout
    text: "Grain: one row per invoice line item."
    color: "#fef9c3"          # optional background color
    targetId: fct_orders      # ID of the attached object (optional)
    targetType: table         # table | domain | relationship | lineage | column
    offset:
      x: 100    # offset from target's top-left (or absolute if no target)
      y: -80
```

### Layout

All coordinate data lives in `layout`, keyed by object ID. **Never** place `x`/`y` inside `tables` or `domains`.

```yaml
layout:
  # Domain – requires width and height
  core_sales:
    x: 0
    y: 0
    width: 880
    height: 480

  # Table inside a domain – coordinates are relative to domain origin
  orders:
    x: 280
    y: 200
    parentId: core_sales  # declare domain membership

  # Standalone table – absolute canvas coordinates
  mart_summary:
    x: 1060
    y: 200
```

---

## Usage

### Development Mode (Interactive)
```bash
modscape dev ./models
```
- **Persistence**: Layout and metadata changes are saved directly to your files (supports Auto-save).

### Create New Model
```bash
modscape new models/sales/customer.yaml
```
- **Recursive Scaffolding**: Automatically creates parent directories if they don't exist.
- **Boilerplate**: Generates a valid YAML model with examples of domains, tri-layer naming, relationships, and lineage.

### Build Mode (Static Site)
```bash
modscape build ./models -o docs-site
```

### Export Mode (Markdown)
```bash
modscape export ./models -o docs/ARCHITECTURE.md
```

---

## dbt Integration

Modscape can import your existing dbt project directly from its compiled `manifest.json`.

### Prerequisites

Run `dbt parse` (or any dbt command that produces `target/manifest.json`) in your dbt project before using these commands.

### Import dbt Project

```bash
modscape dbt import [project-dir] [options]
```

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Output directory (default: `modscape-<project-name>`) |
| `--split-by <key>` | Split output files by `schema`, `tag`, or `folder` |

**Examples:**

```bash
# Import from current directory, output to modscape-my_project/
modscape dbt import

# Import from a specific dbt project path
modscape dbt import ./my_dbt_project

# Split into separate YAML files by schema
modscape dbt import --split-by schema

# Split by dbt tag, with custom output directory
modscape dbt import --split-by tag -o ./modscape-models
```

After import, visualize with:
```bash
modscape dev modscape-my_project
```

> **What gets imported:** All `model`, `seed`, `snapshot`, and `source` nodes from `manifest.json`, including columns, descriptions, and lineage (`depends_on`).
> **Split mode:** When `--split-by` is used, each group is written to a separate YAML file. A self-containment score is shown — files below 80% have cross-file lineage edges that won't render in isolation.

### Sync dbt Changes

After modifying your dbt project, sync the changes into existing Modscape YAML files without losing any manual edits (layout, appearance, annotations, relationships):

```bash
modscape dbt sync [project-dir] [options]
```

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Target directory containing existing Modscape YAML files (default: `modscape-<project-name>`) |

```bash
# Sync changes from current dbt project
modscape dbt sync

# Sync from a specific path
modscape dbt sync ./my_dbt_project -o ./modscape-models
```

> **sync vs import:** `import` creates YAML files from scratch; `sync` updates existing files, preserving your manual enrichments (table types, business definitions, sample data, etc.).

---

## Model File Operations

### Merge YAML Files

Combine multiple YAML models into one. Duplicate table/domain IDs are resolved with first-wins semantics.

```bash
modscape merge model-a.yaml model-b.yaml -o merged.yaml

# Merge all YAMLs in a directory
modscape merge ./models -o merged.yaml
```

### Extract Tables

Extract a subset of tables (and their relationships/lineage) into a new YAML file.

```bash
modscape extract model.yaml --tables orders,dim_customers -o subset.yaml

# Extract from multiple files
modscape extract ./models --tables fct_sales,dim_dates -o extracted.yaml
```

### Auto-Layout

Automatically calculate and write layout coordinates based on table relationships.

```bash
modscape layout model.yaml

# Write to a separate output file
modscape layout model.yaml -o model-with-layout.yaml
```

---

## Atomic Model Mutation Commands

These commands let AI agents (or scripts) make precise, targeted changes to a YAML model file. All commands support `--json` for machine-readable output.

### Table Commands

```bash
modscape table list <file>               # List all table IDs
modscape table get <file> --id <id>      # Get a single table as JSON
modscape table add <file> --data <json>  # Add a new table
modscape table update <file> --id <id> --data <json>  # Update a table
modscape table remove <file> --id <id>  # Remove a table
```

### Column Commands

```bash
modscape column add <file> --table <id> --data <json>
modscape column update <file> --table <id> --id <col-id> --data <json>
modscape column remove <file> --table <id> --id <col-id>
```

### Relationship Commands

```bash
modscape relationship list <file>
modscape relationship get <file> --id <id>
modscape relationship add <file> --from <ref> --to <ref> --type <type> [--id <id>] [--description <text>]
modscape relationship update <file> --id <id> [--type <type>] [--description <text>]
modscape relationship remove <file> --id <id>
```

### Lineage Commands

```bash
modscape lineage list <file>
modscape lineage get <file> --id <id>
modscape lineage add <file> --from <table-id> --to <table-id> [--id <id>] [--description <text>]
modscape lineage update <file> --from <table-id> --to <table-id> [--description <text>]
modscape lineage remove <file> --id <id>
```

### Domain Commands

```bash
modscape domain list <file>
modscape domain get <file> --id <id>
modscape domain add <file> --data <json>
modscape domain update <file> --id <id> --data <json>
modscape domain remove <file> --id <id>
modscape domain member add <file> --domain <id> --table <table-id>
modscape domain member remove <file> --domain <id> --table <table-id>
```

## Credits

Modscape is made possible by these incredible open-source projects:

- [CodeMirror 6](https://codemirror.net/) - Next-generation code editor for the web.
- [Dagre](https://github.com/dagrejs/dagre) - Directed graph layout engine.
- [Lucide React](https://lucide.dev/) - Beautifully simple pixel-perfect icons.
- [Zustand](https://github.com/pmndrs/zustand) - Bear necessities for state management.
- [js-yaml](https://github.com/nodeca/js-yaml) - JavaScript YAML parser and dumper.

## License
MIT
