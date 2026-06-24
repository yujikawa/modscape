## 1. SKILL.md の作成

- [x] 1.1 `src/templates/gemini/modscape-spec-explore/` ディレクトリを作成する
- [x] 1.2 `SKILL.md` を新規作成する（フロントマター: name, description）
- [x] 1.3 スタンスセクションを書く（会話型・固定質問なし・modscapeドメイン特化）
- [x] 1.4 modscape MCPツールの使い方を記述する（schema/lineage/既存spec参照方法）
- [x] 1.5 着地ロジックを記述する（lite vs full の案内基準と案内メッセージ）

## 2. コマンド登録

- [x] 2.1 `SPEC_SKILL_NAMES` に `'explore'` を追加する（`src/template-files.js`）
- [x] 2.2 `src/templates/claude/spec/explore.md` を作成し `/modscape:spec:explore` コマンドとして登録する
