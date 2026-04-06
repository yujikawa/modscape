## ADDED Requirements

### Requirement: CLI Entry Point
The system SHALL provide a `modscape` command with subcommands for development and building.

#### Scenario: Running the help command
- **WHEN** the user runs `modscape --help`
- **THEN** the system displays usage instructions for `dev` and `build` subcommands

### Requirement: CLI Development Mode
The system SHALL support a `dev` command that starts a local modeling session.

#### Scenario: Starting development mode
- **WHEN** the user runs `modscape dev my-model.yaml`
- **THEN** the system starts a local server and opens the visualizer in the default browser

### Requirement: CLI Build Mode
The system SHALL support a `build` command that generates a static site.

#### Scenario: Building a static site
- **WHEN** the user runs `modscape build my-model.yaml`
- **THEN** the system generates a `dist/` directory containing a standalone version of the visualizer with the model data embedded
## ADDED Requirements

### Requirement: Init Subcommand Integration
The `modscape` CLI SHALL register a new `init` subcommand.

`modscape` CLI の `init` サブコマンドは `--sdd` フラグをサポートしなければならない（SHALL）。

`--sdd` フラグは `--claude` と組み合わせた場合にのみ有効とし、以下のファイルを生成しなければならない（SHALL）:
- `.modscape/claude/sdd/requirements.md`
- `.modscape/claude/sdd/design.md`
- `.modscape/claude/sdd/tasks.md`
- `.modscape/claude/sdd/implement.md`
- `.modscape/spec/modscape-spec.custom.md.example`

`--sdd` を `--gemini` や `--codex` と組み合わせた場合、CLI は「SDD スキルは現在 Claude Code のみ対応しています」というメッセージを表示し、`--sdd` フラグを無視しなければならない（SHALL）。

#### Scenario: Running modscape help after update
- **WHEN** the user runs `modscape --help`
- **THEN** the list of commands includes `init` with a description like "Initialize project with AI modeling rules"

#### Scenario: --claude --sdd フラグで SDD スキルを生成する
- **WHEN** ユーザーが `modscape init --claude --sdd` を実行する
- **THEN** `.modscape/claude/sdd/` 配下に4つのスキルファイルと `.modscape/spec/modscape-spec.custom.md.example` が生成される

#### Scenario: --sdd を --claude なしで指定した場合に案内する
- **WHEN** ユーザーが `modscape init --sdd`（`--claude` なし）を実行する
- **THEN** CLI は「SDD スキルは現在 Claude Code のみ対応しています。`--claude --sdd` を使用してください」と案内する
