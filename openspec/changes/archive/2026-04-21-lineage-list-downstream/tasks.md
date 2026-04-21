## 1. CLI 実装

- [x] 1.1 `src/operations/lineage.js` に `listDownstreamLineages(entries, fromId, { recursive, depth })` を追加する（BFS、訪問済みセットで循環参照を防ぐ）
- [x] 1.2 `src/cli.js` の `lineage list` に `--from <tableId>`、`--recursive`、`--depth <n>` オプションを追加する
- [x] 1.3 テキスト出力に `(depth: N)` 表示を追加する（`--recursive` 時のみ）

## 2. SDD design スキルへの統合

- [x] 2.1 `src/templates/claude/spec/design.md` の影響範囲確認ステップに `modscape lineage list --from --recursive --json` の使用例を追記する
- [x] 2.2 `src/templates/gemini/modscape-spec-design/SKILL.md` を Claude 版に合わせて更新する
- [x] 2.3 `src/templates/codex/modscape-spec-design/SKILL.md` を Claude 版に合わせて更新する

## 3. ドキュメント更新

- [x] 3.1 `README.md` の CLI リファレンスに `lineage list` の新オプションを追記する
- [x] 3.2 `README.ja.md` を同様に更新する
- [x] 3.3 `src/templates/rules.md` の Section 12 CLI Flag Reference に追記する
- [x] 3.4 `CHANGELOG.md` にエントリを追加する（v3.1.1）
