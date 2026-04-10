## 1. TypeScript 型定義の更新

- [x] 1.1 `Column` 型に `expression?: string` を追加する（`visualizer/src/types/schema.ts`）
- [x] 1.2 `LineageEdge` 型に `join_type?: 'inner' | 'left' | 'cross' | 'none'` を追加する
- [x] 1.3 `Implementation` 型に `incremental_key?: string` と `incremental_lookback?: string` を追加する
- [x] 1.4 `Implementation` 型に `scd2?: { business_key: string[]; valid_from: string; valid_to: string; current_flag?: string }` を追加する

## 2. ドキュメント更新

- [x] 2.1 `src/templates/rules.md` に `columns[].expression` の説明・例・ルールを追記する
- [x] 2.2 `src/templates/rules.md` に `lineage[].join_type` の説明・値一覧を追記する
- [x] 2.3 `src/templates/rules.md` に `implementation.incremental_key` / `incremental_lookback` の説明を追記する
- [x] 2.4 `src/templates/rules.md` に `implementation.scd2` の説明・例を追記する
- [x] 2.5 `README.md` の YAML フォーマット例に4フィールドを追記する
- [x] 2.6 `README.ja.md` の YAML フォーマット例に4フィールドを追記する
- [x] 2.7 `CLAUDE.md` の YAML フォーマット例に4フィールドを追記する

## 3. SDD implement スキルの更新（Claude Code）

- [x] 3.1 `src/templates/claude/spec/implement.md` に `columns[].expression` を参照して SELECT 句を生成するロジックを追記する
- [x] 3.2 `src/templates/claude/spec/implement.md` に `lineage[].join_type` を参照して JOIN 句を生成するロジックを追記する
- [x] 3.3 `src/templates/claude/spec/implement.md` に `implementation.incremental_key` を参照して WHERE 句を生成するロジックを追記する
- [x] 3.4 `src/templates/claude/spec/implement.md` に `implementation.scd2` を参照して SCD Type2 SQL を生成するロジックを追記する

## 4. Gemini / Codex への同期

- [x] 4.1 `src/templates/gemini/modscape-spec-implement/SKILL.md` に同じ変更を同期する
- [x] 4.2 `src/templates/codex/modscape-spec-implement/SKILL.md` に同じ変更を同期する

## 5. CHANGELOG と動作確認

- [x] 5.1 `CHANGELOG.md` に 2.9.0 として4フィールドの追加を記載する
- [x] 5.2 サンプル YAML に新フィールドを記述してバリデーションが通ることを確認する
- [x] 5.3 `npm run build-ui` が成功することを確認する
