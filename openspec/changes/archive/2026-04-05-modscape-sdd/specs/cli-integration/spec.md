## MODIFIED Requirements

### Requirement: Init Subcommand Integration
`modscape` CLI の `init` サブコマンドは `--sdd` フラグをサポートしなければならない（SHALL）。

`--sdd` フラグは `--claude` と組み合わせた場合にのみ有効とし、以下のファイルを生成しなければならない（SHALL）:
- `.modscape/claude/sdd/requirements.md`
- `.modscape/claude/sdd/design.md`
- `.modscape/claude/sdd/tasks.md`
- `.modscape/claude/sdd/implement.md`
- `.modscape/sdd/sdd.custom.md.example`

`--sdd` を `--gemini` や `--codex` と組み合わせた場合、CLI は「SDD スキルは現在 Claude Code のみ対応しています」というメッセージを表示し、`--sdd` フラグを無視しなければならない（SHALL）。

#### Scenario: Running modscape help after update
- **WHEN** ユーザーが `modscape --help` を実行する
- **THEN** コマンド一覧に `init` が含まれ、説明に `--sdd` フラグへの言及がある

#### Scenario: --claude --sdd フラグで SDD スキルを生成する
- **WHEN** ユーザーが `modscape init --claude --sdd` を実行する
- **THEN** `.modscape/claude/sdd/` 配下に4つのスキルファイルと `.modscape/sdd/sdd.custom.md.example` が生成される

#### Scenario: --sdd を --claude なしで指定した場合に案内する
- **WHEN** ユーザーが `modscape init --sdd`（`--claude` なし）を実行する
- **THEN** CLI は「SDD スキルは現在 Claude Code のみ対応しています。`--claude --sdd` を使用してください」と案内する
