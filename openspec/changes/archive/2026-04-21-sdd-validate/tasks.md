## 1. Claude スキル実装

- [x] 1.1 `src/templates/claude/spec/validate.md` を新規作成する（Usage、チェックカテゴリ A〜D の手順、レポートフォーマットを記載）

## 2. Gemini スキル実装

- [x] 2.1 `src/templates/gemini/modscape-spec-validate/SKILL.md` を Claude 版から派生して作成する（YAMLフロントマター追加、コマンド参照を `@modscape-spec-validate` に変更）

## 3. Codex スキル実装

- [x] 3.1 `src/templates/codex/modscape-spec-validate/SKILL.md` を Claude 版から派生して作成する（YAMLフロントマター + `## COMMAND: /modscape:spec:validate` セクション追加）

## 4. ドキュメント更新

- [x] 4.1 `README.md` の SDD スキル一覧に `/modscape:spec:validate` を追記する
- [x] 4.2 `README.ja.md` の SDD スキル一覧に `/modscape:spec:validate` を追記する
- [x] 4.3 `src/templates/rules.md` の SDD スキル一覧に `validate` を追記する
- [x] 4.4 `CHANGELOG.md` にエントリを追加する（v3.1.1）
