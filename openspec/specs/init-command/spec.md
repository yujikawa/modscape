## ADDED Requirements

### Requirement: Interactive Init Command
The system SHALL provide an interactive CLI subcommand `init` to guide the project setup.

#### Scenario: Running modscape init
- **WHEN** the user runs `modscape init`
- **THEN** the system prompts the user to select which AI agents they use (Gemini, Codex, Claude)

### Requirement: Safe Scaffolding
The system SHALL NOT overwrite existing configuration files during the `init` process without user consent.

#### Scenario: Running init where .clauderules already exists
- **WHEN** the user runs `init` and `.clauderules` is already present
- **THEN** the system skips that file or asks the user for permission to overwrite

### Requirement: Claude Code向けMCPセットアップ案内
`modscape init --claude` の完了後、MCPサーバーのセットアップ方法を案内するメッセージを表示しなければならない（SHALL）。自動設定はしない。

#### Scenario: Claude Code向けinitでMCP案内が表示される
- **WHEN** `modscape init --claude` が完了する
- **THEN** 「To use the MCP server with Claude Code, run: claude mcp add modscape -- modscape mcp」というメッセージが表示される

## ADDED Requirements

### Requirement: --html フラグによるHTML出力モードの初期化
`modscape init --sdd --html` を実行した場合、`.modscape/modscape-spec.custom.md` に `output_format: html` を追記しなければならない（SHALL）。ファイルが既に存在する場合は末尾に追記する。

#### Scenario: --html フラグでoutput_format: htmlが追記される
- **WHEN** `modscape init --sdd --html` を実行する
- **THEN** `.modscape/modscape-spec.custom.md` に `output_format: html` が記載される

#### Scenario: --html なしでは output_format は追記されない
- **WHEN** `modscape init --sdd` を実行する（--html なし）
- **THEN** `.modscape/modscape-spec.custom.md` に `output_format` の記載はない

#### Scenario: 既存のmodscape-spec.custom.mdへの追記
- **WHEN** `.modscape/modscape-spec.custom.md` が既に存在する状態で `modscape init --html` を実行する
- **THEN** 既存の内容を保持したまま `output_format: html` が追記される
