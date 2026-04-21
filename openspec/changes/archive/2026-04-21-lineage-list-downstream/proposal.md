## Why

`modscape lineage list` は全エントリをフラットに返すだけで、特定テーブルから始まる下流を辿る手段がない。`modscape extract --with-downstream` でBFSは実装済みだが、これはYAML抽出コマンドであり「下流テーブルを確認する」用途には重すぎる。

SDD の `design` スキルは影響範囲を手動で分類しているが、「このテーブルを変えたら何が影響を受けるか」を素早く確認するCLIコマンドが存在しない。`lineage list` に `--from` フィルターと `--recursive` オプションを追加することで、影響範囲調査をCLI一発で行えるようにする。

## What Changes

- `modscape lineage list <file> --from <tableId>` — 指定テーブルを起点に直接の下流エントリを返す
- `modscape lineage list <file> --from <tableId> --recursive` — BFSで全下流を再帰的に返す（`--depth <n>` で深さ制限）
- SDD `design` スキルの影響範囲調査ステップに `lineage list --from --recursive` を案内として追記する

## Capabilities

### New Capabilities

- `lineage-list-downstream`: `modscape lineage list` の `--from` / `--recursive` / `--depth` フィルターオプション

### Modified Capabilities

- `sdd-design`: design スキルの影響範囲調査ステップに新CLIコマンドの使用例を追記

## Impact

- `src/cli.js` — `lineage list` コマンドにオプション追加
- `src/operations/lineage.js` — BFSトラバーサルのユーティリティ追加
- `src/templates/claude/spec/design.md` — 影響範囲確認手順に追記
- `src/templates/gemini/modscape-spec-design/SKILL.md` — 同期
- `src/templates/codex/modscape-spec-design/SKILL.md` — 同期
- `README.md` / `README.ja.md` — CLIリファレンス更新
- `src/templates/rules.md` — Section 12 CLI Flag Reference 更新
