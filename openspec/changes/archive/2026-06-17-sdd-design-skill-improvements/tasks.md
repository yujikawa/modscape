## 1. フォーマットテンプレートの更新

- [x] 1.1 `src/templates/formats/design-format.md` に `## Design Progress` セクションを追加する
- [x] 1.2 `src/templates/formats/design-table-format.md` にスタブ用の Pending バナー・Table Overview・Columns セクションを追加する
- [x] 1.3 `src/templates/formats/design-table-format.md` が `modscape init --sdd` でインストールされるよう `src/template-files.js` の formatWriteFn 呼び出しリストに追加する

## 2. designスキルの改修（スタブ一括生成 + 進捗管理）

- [x] 2.1 `src/templates/claude/spec/design.md` のステップ4 Case A に「全影響テーブルのスタブを一括生成する」処理を追加する
- [x] 2.2 `src/templates/claude/spec/design.md` のステップ4 Case B のテーブル選択ロジックを「`## Design Progress` の ⏳ Pending 参照」に変更し、Progress セクションが存在しない場合のフォールバックを追記する
- [x] 2.3 `src/templates/claude/spec/design.md` のステップ15に `## Design Progress` セクションの生成・更新を追記する
- [x] 2.4 `src/templates/claude/spec/design.md` のステップ15.5にスタブ生成のロジック（Case A 初回時に全テーブル分を生成）を追記する
- [x] 2.5 `src/templates/claude/spec/design.md` のステップ15.5に設計完了後の Progress ステータス更新（⏳ → ✅）を追記する
- [x] 2.6 `src/templates/claude/spec/design.md` のステップ18の unresolved questions 案内を `implement` → `tasks` に修正する
- [x] 2.7 `src/templates/claude/spec/design.md` の Next Step 出力に Progress サマリー（"Designed N/M tables. Next: `<table-id>`"）を追加する
- [x] 2.8 `src/templates/claude/spec/design.md` に会話でのテーブル追加・削除の手順を追記する

## 3. designスキルの改修（gemini / codex への同期）

- [x] 3.1 `src/templates/gemini/modscape-spec-design/SKILL.md` に 2.1〜2.8 と同じ変更を適用する
- [x] 3.2 `src/templates/codex/modscape-spec-design/SKILL.md` に 2.1〜2.8 と同じ変更を適用する

## 4. UIコンポーネントの変更（サイドバーリスト化）

- [x] 4.1 `visualizer/src/components/SpecPanel.tsx` のDesignタブ サブナビ部分（行253〜289）を削除する
- [x] 4.2 Designタブがアクティブかつ designTables.length > 0 の場合、コンテンツエリアを `flex row` レイアウト（左150px サイドバー + 右 iframe）に変更する
- [x] 4.3 サイドバーに Overview + 各テーブルをリスト表示し、選択中アイテムをハイライトするスタイルを実装する
- [x] 4.4 designTables が空の場合は全幅 iframe 表示を維持する（非 Design タブも含む）
- [x] 4.5 `npm run build-ui` でビルドが通ることを確認する
- [x] 4.6 E2Eテストのビジュアルスナップショットを更新する（`npm run test:e2e -- --update-snapshots`）
