## 1. 影響範囲の調査

- [x] 1.1 `grep -r "\.tables\b" src/` で `_glossary.yaml` の `tables` フィールドを読む箇所を洗い出す
- [x] 1.2 `grep -r "\.table\b\|questions.*table\|table.*questions" src/ visualizer/` で `_questions.yaml` の `table` フィールドを読む箇所を洗い出す
- [x] 1.3 visualizer の TypeScript 型定義（`schema.ts`）で `GlossaryTerm.tables`・`QuestionEntry.table` の影響箇所を確認する

## 2. ソースコード更新（src/export.js）

- [x] 2.1 `loadContext` 関数で `glossary` の `tables` → `ids` 読み取りに変更する
- [x] 2.2 `loadContext` 関数で `questions` の `table` → `ids` 読み取りに変更する（単数→配列）
- [x] 2.3 `loadContext` が返すオブジェクトの型・プロパティ名を `ids` に合わせて更新する

## 3. visualizer TypeScript 型定義の更新

- [x] 3.1 `visualizer/src/types/schema.ts` の `GlossaryTerm` 型で `tables?: string[]` → `ids?: string[]` に変更する
- [x] 3.2 `visualizer/src/types/schema.ts` の `QuestionEntry` 型で `table?: string` → `ids?: string[]` に変更する
- [x] 3.3 型変更に伴う visualizer 内の参照箇所を修正する（コンパイルエラーが出ないことを確認）

## 4. SKILLテンプレート更新（3プラットフォーム）

- [x] 4.1 `src/templates/claude/spec/archive.md` の glossary パース記述（`label`, `tables`, `columns`）で `tables` → `ids` に変更する
- [x] 4.2 `src/templates/claude/spec/archive.md` の Step 5 decisions フォーマットに `ids: [<affected-entity-ids>]` フィールドを追加し、Step 2 の Affected Tables から取得する旨を記載する
- [x] 4.3 `src/templates/codex/modscape-spec-archive/SKILL.md` に 4.1・4.2 と同内容の変更を適用する
- [x] 4.4 `src/templates/gemini/modscape-spec-archive/SKILL.md` に 4.1・4.2 と同内容の変更を適用する

## 5. 既存データファイルの移行

- [x] 5.1 `.modscape/specs/_glossary.yaml` の全エントリで `tables:` → `ids:` にリネームする
- [x] 5.2 `.modscape/specs/_questions.yaml` の全エントリで `table:` → `ids:` にリネームし、値を配列形式（`[<value>]`）に変換する

## 6. テスト・フィクスチャの更新

- [x] 6.1 `tests/fixtures/` 配下で `tables:` または `table:` フィールドを持つフィクスチャファイルを `ids:` に更新する
- [x] 6.2 `samples/` 配下で該当フィールドがあれば更新する
- [x] 6.3 既存テストを実行して破壊的変更がないことを確認する（`npm test` 等）
