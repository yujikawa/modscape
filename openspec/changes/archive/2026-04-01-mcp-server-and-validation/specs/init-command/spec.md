## ADDED Requirements

### Requirement: Claude Code向けMCPセットアップ案内
`modscape init --claude` の完了後、MCPサーバーのセットアップ方法を案内するメッセージを表示しなければならない（SHALL）。自動設定はしない。

#### Scenario: Claude Code向けinitでMCP案内が表示される
- **WHEN** `modscape init --claude` が完了する
- **THEN** 「To use the MCP server with Claude Code, run: claude mcp add modscape -- modscape mcp」というメッセージが表示される
