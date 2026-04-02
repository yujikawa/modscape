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
