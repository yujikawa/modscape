# CLAUDE.md

## Communication Rules

- **Always respond to the user in Japanese**, regardless of the language used in this file.
- Internal reasoning and thinking can be in English.

## Project Overview

**Modscape** — A YAML-driven data modeling visualizer. A CLI tool for visually modeling Star Schema, Data Vault, and Data Mart for the Modern Data Stack.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Cytoscape.js, CodeMirror 6, Zustand |
| Styling | Tailwind CSS, ShadCN UI |
| YAML | js-yaml |
| CLI | Node.js (ESM), Commander |
| Test | Playwright (E2E) |
| Build | Vite (visualizer), ESM (CLI) |

## Repository Structure

```
modscape/
├── src/                   # CLI (Node.js ESM)
│   ├── index.js           # Entry point
│   ├── dev.js             # Dev server
│   ├── build.js           # Build command
│   ├── init.js            # init command
│   ├── create.js          # create command
│   ├── export.js          # export command
│   ├── import-dbt.js      # dbt import command
│   ├── sync-dbt.js        # dbt sync command
│   ├── merge.js           # merge command
│   ├── extract.js         # extract command
│   ├── model-utils.js     # shared YAML read/write utilities
│   ├── table.js           # table subcommands
│   ├── column.js          # column subcommands
│   ├── relationship.js    # relationship subcommands
│   ├── lineage.js         # lineage subcommands
│   ├── domain.js          # domain subcommands
│   └── templates/         # Templates for init/create
├── visualizer/
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── CytoscapeCanvas.tsx   # Main graph canvas
│       │   ├── DetailPanel.tsx       # Entity detail panel
│       │   ├── CommandPalette.tsx
│       │   ├── PresentationOverlay.tsx
│       │   ├── SelectionToolbar.tsx
│       │   ├── SampleDataGrid.tsx
│       │   ├── TableCard.tsx
│       │   ├── RightPanel/           # Right sidebar (TablesTab, PathFinderTab, NoteSearchTab)
│       │   ├── Sidebar/              # Left sidebar (EntitiesTab, EditorTab, QuickConnectTab, FileSelector)
│       │   └── ui/                   # ShadCN UI components
│       ├── store/
│       │   └── useStore.ts           # Zustand store
│       ├── lib/
│       │   ├── parser.ts             # YAML parser
│       │   ├── cytoscapeElements.ts  # Cytoscape graph builder
│       │   ├── graph.ts              # Graph utilities
│       │   └── utils.ts
│       └── types/
│           └── schema.ts             # YAML model type definitions
├── tests/                 # Playwright E2E tests
│   ├── comprehensive.spec.ts
│   ├── import-dbt.spec.ts
│   ├── sync-stability.spec.ts
│   └── fixtures/
├── visualizer-dist/       # Built visualizer (committed to repo)
├── openspec/              # OpenSpec spec management
│   ├── config.yaml
│   ├── specs/             # Active feature specs (~41)
│   └── changes/archive/   # Archived changes (~339)
└── samples/               # Sample model.yaml files
```

## Key Commands

```bash
# Build
npm run build-ui          # Build visualizer into visualizer-dist/

# Development
npm run dev               # Start local dev server

# Testing
npm run test:e2e          # Run E2E tests
npm run test:cli          # Run CLI tests (dbt import/sync)
npm run test:all          # build-ui + test:cli

# Update snapshots (required after visual UI changes)
npm run test:update       # build-ui + update snapshots
```

## CLI Commands

```bash
# Model visualization
modscape dev <paths...>          # Start dev visualizer
modscape build <paths...>        # Build static site
modscape export <paths...>       # Export to Mermaid markdown

# Model initialization
modscape init                    # Initialize project with AI rules
modscape new <path>              # Create new YAML from template

# YAML file operations
modscape merge <paths...>        # Merge multiple YAMLs (first-wins on duplicate ID)
modscape extract <paths...> --tables <ids>  # Extract specific tables by ID
modscape layout <path>           # Auto-calculate layout coordinates

# dbt integration
modscape dbt import [dir]        # Import dbt project into YAML
modscape dbt sync [dir]          # Sync dbt changes into existing YAML

# Model mutation (AI-friendly atomic operations)
modscape table list/get/add/update/remove <file>
modscape column add/update/remove <file>
modscape relationship list/add/remove <file>
modscape lineage list/add/remove <file>
modscape domain list/get/add/update/remove <file>
modscape domain member add/remove <file>
# All mutation commands support --json for machine-readable output
```

## Development Rules

- After UI changes, always verify `npm run build-ui` succeeds.
- After visual UI changes, run `npm run test:update` to update snapshots before committing.
- Keep the YAML schema as stable as possible.
- Maintain sync between the visual editor and YAML.
- Prefer simple architecture; avoid heavy abstractions.
- Do not introduce database-specific assumptions.
- Maintain compatibility with Star Schema and Data Vault modeling patterns.
- UI text (labels, placeholders, descriptions, options) must be written in **English**.

## Change Checklists

### When changing or adding to the YAML schema

When adding or modifying fields or sections, verify all of the following:

1. `visualizer/src/types/schema.ts` — Update TypeScript type definitions
2. `visualizer/src/lib/parser.ts` — Update parser / normalizer
3. `src/templates/rules.md` — Update AI agent rules (field descriptions, examples, CLI flags)
4. `README.md` / `README.ja.md` — Update user-facing documentation
5. `CHANGELOG.md` — Add a changelog entry
6. CLI mutation commands (`src/domain.js`, etc.) — Verify field names match the schema exactly

### When adding or changing a CLI command

1. `src/index.js` — Verify command is registered
2. `README.md` / `README.ja.md` — Update CLI reference sections
3. `src/templates/rules.md` — Update Section 13 (CLI Flag Reference)
4. `CHANGELOG.md` — Add a changelog entry

### CLI mutation command implementation rules

When reading/writing YAML from CLI commands, field names must exactly match the schema:

- `domains[].members` — domain member list (NOT `tables`)
- Coordinates (`x`, `y`, `width`, `height`) belong in `layout` only — never inside `tables` or `domains`
- When validating table IDs in a YAML that may contain `imports:`, always call `resolveImports()` before `findTableById()`

## YAML Model Format

Seven root-level sections. Do not write coordinates inside `tables` or `domains`.

```yaml
version: "1.0.0"   # optional; current model format version

# ── Domains ──────────────────────────────────────────────
domains:
  - id: sales_ops
    name: "Sales Operations"
    description: "Group of sales-related tables."  # optional
    color: "rgba(59, 130, 246, 0.1)"
    members: [fct_orders, dim_customers]

# ── Tables ───────────────────────────────────────────────
tables:
  - id: fct_orders
    name: Orders                               # conceptual name
    logical_name: "Order Transactions"         # optional
    physical_name: "fct_retail_sales"          # optional
    appearance:
      type: fact       # fact|dimension|mart|hub|link|satellite|table
      sub_type: transaction  # optional sub-classification
      scd: type2       # SCD for dimensions (type0–type6)
      icon: "💰"
      color: "#e0f2fe" # optional header color
    conceptual:        # Business context for AI agents (optional)
      description: "One row = one order line item."
      tags: [WHAT, HOW_MUCH]   # BEAM* tags: WHO|WHAT|WHEN|WHERE|HOW|COUNT|HOW_MUCH
    implementation:    # AI codegen hints (optional); inferred from appearance.type if omitted
      materialization: incremental          # table|view|incremental|ephemeral
      incremental_strategy: merge          # merge|append|delete+insert
      unique_key: order_id
      partition_by: { field: event_date, granularity: day }  # day|month|year|hour
      cluster_by: [customer_id]
      grain: [month_key]                   # GROUP BY (mart only)
      measures:                            # Aggregation definitions (mart only)
        - column: total_revenue
          agg: sum                         # sum|count|count_distinct|avg|min|max
          source_column: fct_sales.amount  # upstream column (<table_id>.<col_id>)
    columns:
      - id: order_id
        logical:
          name: "Order ID"
          type: Int
          description: "Surrogate key."
          isPrimaryKey: true
          isForeignKey: false
          isPartitionKey: false
          additivity: fully    # fully|semi|non
        physical:              # Override physical definition (optional)
          name: order_id
          type: "BIGINT"
          constraints: [NOT NULL]
    sampleData:                # 2D array of plain data rows (no header)
      - [1001, 150.00]
      - [1002, 89.50]

# ── Lineage ───────────────────────────────────────────────
lineage:
  - id: lin_orders_summary  # optional; auto-generated as lin-{from}-{to} if omitted
    from: fct_orders        # upstream table id
    to: mart_summary        # downstream table id
  # Do not duplicate entries in relationships

# ── Relationships ─────────────────────────────────────────
relationships:
  - id: rel_cust_orders
    from: { table: dim_customers, column: [customer_id] }
    to:   { table: fct_orders,    column: [customer_id] }
    type: one-to-many   # one-to-one|one-to-many|many-to-one|many-to-many

# ── Annotations ──────────────────────────────────────────
annotations:
  - id: note_001
    type: sticky             # sticky|callout
    text: "Grain: one row = one order line item"
    color: "#fef9c3"         # optional background color
    targetId: fct_orders     # attachment target ID (optional)
    targetType: table        # table|domain|relationship|lineage|column
    offset: { x: 100, y: -80 }  # offset from target top-left (absolute coord if omitted)

# ── Layout ───────────────────────────────────────────────
layout:
  sales_ops:                  # Domain: width/height required
    x: 0
    y: 0
    width: 880
    height: 480
  fct_orders:                 # Table inside domain: coords relative to domain origin
    x: 280
    y: 200
    parentId: sales_ops       # Declares domain membership
  mart_summary:               # Standalone table: absolute canvas coordinates
    x: 1060
    y: 200
```

## OpenSpec Workflow

This project uses **OpenSpec** for spec-driven development.

```
explore → propose → apply → archive
```

| Command | Purpose |
|---------|---------|
| `/opsx:explore` | Explore ideas and clarify requirements |
| `/opsx:propose` | Propose a new change with design and tasks |
| `/opsx:apply`   | Implement tasks |
| `/opsx:archive` | Archive a completed change |

Active specs are in `openspec/specs/` — see each `spec.md` for details.
