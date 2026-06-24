## 1. CLI: lineage list に --involves フィルタを追加

- [x] 1.1 `src/operations/lineage.js` の `listLineages()` に `involves` オプションを追加し、`from` または `to` が一致するエントリのみ返すようにする
- [x] 1.2 `src/cli.js` の `lineage list` コマンドに `--involves <tableId>` オプションを追加する
- [x] 1.3 `modscape lineage list model.yaml --involves <id>` が正しくフィルタされることをユニットテストで確認する

## 2. CLI: merge --patch に --replace-owned-lineage を追加

- [x] 2.1 `src/merge.js` の `mergeModelsPatched()` に `replaceOwnedLineage` オプションを追加する
- [x] 2.2 patch YAML から owned テーブル（`isImported !== true`）の ID セットを収集するロジックを実装する
- [x] 2.3 base の `lineage` 配列から「両端が owned テーブル」のエントリをフィルタ削除し `lineageIndex` を再構築するロジックを実装する
- [x] 2.4 `src/index.js` の merge コマンドに `--replace-owned-lineage` フラグを追加する
- [x] 2.5 境界またぎのリネージが保持されることをユニットテストで確認する
- [x] 2.6 フラグなしで従来の upsert 動作が維持されることをユニットテストで確認する

## 3. archive スキル: tables_to_remove のリネージクリーンアップ追加

- [x] 3.1 `src/templates/claude/spec/archive.md` の Step 2.5 を更新し、テーブル削除前に `modscape lineage list --involves <id>` → `modscape lineage remove` を実行する手順を追記する
- [x] 3.2 `src/templates/codex/modscape-spec-archive` に同内容を反映する
- [x] 3.3 `src/templates/gemini/modscape-spec-archive` に同内容を反映する

## 4. archive スキル: --replace-owned-lineage フラグを merge コマンドに追加

- [x] 4.1 `src/templates/claude/spec/archive.md` の Step 5（merge 実行）で `--replace-owned-lineage` を付与するよう更新する
- [x] 4.2 dry-run サマリーに「置換予定リネージ（within-scope の削除対象件数）」を表示するロジックを追記する
- [x] 4.3 `src/templates/codex/modscape-spec-archive` に同内容を反映する
- [x] 4.4 `src/templates/gemini/modscape-spec-archive` に同内容を反映する

## 5. archive スキル: lineage_to_remove サポートを追加

- [x] 5.1 `src/templates/claude/spec/archive.md` に `lineage_to_remove` を読み取り、マージ前に削除する Step を追加する（Step 2 と Step 5 の間）
- [x] 5.2 存在しないリネージ ID を指定した場合に警告を出して続行するハンドリングを追記する
- [x] 5.3 `src/templates/codex/modscape-spec-archive` に同内容を反映する
- [x] 5.4 `src/templates/gemini/modscape-spec-archive` に同内容を反映する

## 6. 動作確認

- [x] 6.1 中間テーブル挿入シナリオ（`int→factA` → `int→intA→factA`）で archive を実行し、古いリネージが消えることを手動確認する
- [x] 6.2 `tables_to_remove` あり + リネージクリーンアップのシナリオを手動確認する
- [x] 6.3 `lineage_to_remove` の明示削除シナリオを手動確認する
- [x] 6.4 境界またぎのリネージが archive 後も保持されることを確認する
- [x] 6.5 `npm run build` でビルドエラーがないことを確認する
