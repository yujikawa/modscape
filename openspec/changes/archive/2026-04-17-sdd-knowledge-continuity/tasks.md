## 1. modscape spec search CLI コマンド

- [x] 1.1 `src/search.js` を新規作成し、`modscape spec search <keyword>` コマンドを実装する（`.modscape/archives/` と `.modscape/specs/` のテキストマッチ検索）
- [x] 1.2 `--json` フラグで機械可読な JSON 出力を実装する
- [x] 1.3 `--limit <n>` フラグで結果件数を制限できるようにする（デフォルト: 5）
- [x] 1.4 `src/index.js` に `modscape spec search` サブコマンドを登録する
- [x] 1.5 `src/templates/rules.md` の Section 12 に `spec search` コマンドを追記する
- [x] 1.6 `README.md` と `README.ja.md` の CLI リファレンスに `spec search` を追記する

## 2. /modscape:spec:search スキル

- [x] 2.1 `src/templates/claude/spec/search.md` を新規作成する（`modscape spec search --json` を実行し結果をサマリー表示、明示的指示で取り込み）
- [x] 2.2 `src/templates/gemini/modscape-spec-search/SKILL.md` を新規作成する（Claude 版から Gemini 形式に変換）
- [x] 2.3 `src/templates/codex/modscape-spec-search/SKILL.md` を新規作成する（Claude 版から Codex 形式に変換）

## 3. /modscape:spec:design への questions 参照挿入

- [x] 3.1 `src/templates/claude/spec/design.md` に「Direct Impact テーブルに関連する `specs/questions.md` の未解決 Q-NNN を `## Known Open Questions` セクションへ参照挿入する」ロジックを追加する
- [x] 3.2 `src/templates/claude/spec/design.md` に「Direct Impact テーブル名で `modscape spec search` を実行し、結果を `## Related Past Specs` セクションへ記録する」ロジックを追加する
- [x] 3.3 `src/templates/gemini/modscape-spec-design/SKILL.md` を同期する
- [x] 3.4 `src/templates/codex/modscape-spec-design/SKILL.md` を同期する

## 4. ドキュメント・リリース

- [x] 4.1 `CHANGELOG.md` に変更エントリを追加する
