## 1. design-format.md の更新

- [x] 1.1 `src/templates/formats/design-format.md` から `## Implementation Details` セクションを削除する
- [x] 1.2 `design-format.md` の `## Affected Tables` をフラットなテーブル形式（Direct / Downstream—Implement / Downstream—Context Only を1列で表現）に更新する

## 2. design/<table-id>.md フォーマットの新規作成

- [x] 2.1 `src/templates/formats/design-table-format.md` を新規作成する（テーブル固有 Implementation Details のテンプレート）
- [x] 2.2 `src/specs.js` の `modscape spec new` scaffold の `design.md` 初期内容を新フォーマットに合わせて更新する

## 3. Claudeテンプレート: design.md の更新

- [x] 3.1 `src/templates/claude/spec/design.md` に 1テーブル=1呼び出しモードの指示を追記する（未設計テーブルの判定方法、終了条件、次回実行の案内）
- [x] 3.2 `src/templates/claude/spec/design.md` の design.md 書き込みルールを「テーブル非依存のみ」に更新する
- [x] 3.3 `src/templates/claude/spec/design.md` に `design/<table-id>.md` への Implementation Details 書き込みルールを追記する

## 4. Claudeテンプレート: implement.md の更新

- [x] 4.1 `src/templates/claude/spec/implement.md` に 1タスク=1呼び出しモードの指示を追記する（1タスク実装後に終了、次回実行の案内）
- [x] 4.2 `src/templates/claude/spec/implement.md` の Context Only スキップリスト取得を `design.md` の Affected Tables から直接読む形に更新する（design.md が小さくなるため全文読みで問題なし）
- [x] 4.3 `src/templates/claude/spec/implement.md` の Implementation Details 読み取りを `design/<table-id>.md` 優先・`design.md` フォールバックに更新する

## 5. Geminiテンプレートの同期更新

- [x] 5.1 `src/templates/gemini/modscape-spec-design` を Claude テンプレートと同じ方針で更新する（1テーブル=1呼び出し、design/<table>.md への書き出し）
- [x] 5.2 `src/templates/gemini/modscape-spec-implement` を Claude テンプレートと同じ方針で更新する（1タスク=1呼び出し、design/<table>.md 読み取り）

## 6. spec dev ビューアーの対応

- [x] 6.1 `src/spec.js` に `GET /api/spec/design-tables` エンドポイントを追加する（`design/` 配下の `*.md` ファイルをテーブルIDのリストとして返す）
- [x] 6.2 `src/spec.js` に `GET /api/spec/design/:tableId` エンドポイントを追加する（`design/<tableId>.md` を HTML に変換して返す）
- [x] 6.3 `visualizer/src/components/SpecPanel.tsx` の Design タブにサブタブを追加する（Overview + テーブルごとのサブタブ、iframe src を切り替え）

## 7. 動作確認

- [ ] 7.1 既存の `.modscape/changes/` 配下のspecに対して `/modscape:spec:design` を再実行し、後方互換（`design/` ディレクトリなし）で正常動作することを確認する
- [ ] 7.2 新規specで `/modscape:spec:design` → `/modscape:spec:implement` のフローを実行し、1テーブル=1呼び出しが正しく動作することを確認する
- [ ] 7.3 Context Only テーブルが Affected Tables から正しく読み取られスキップされることを確認する
- [ ] 7.4 `modscape spec dev <name>` の Design タブでサブタブが表示され、テーブルごとの実装詳細を切り替えられることを確認する
- [x] 7.5 `npm run build-ui` が通ることを確認し、`npm run test:e2e -- --update-snapshots` でスナップショットを更新する
