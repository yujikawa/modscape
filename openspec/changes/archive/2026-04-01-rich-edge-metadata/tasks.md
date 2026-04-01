## 1. スキーマ・パーサー（Relationship description）

- [x] 1.1 `visualizer/src/types/schema.ts` の `Relationship` インターフェースに `description?: string` を追加する
- [x] 1.2 `visualizer/src/lib/parser.ts` の normalizeRelationship 相当処理で `description` フィールドをパスするよう確認・修正する

## 2. Zustand ストア（Relationship description）

- [x] 2.1 `visualizer/src/store/useStore.ts` に `updateRelationshipDescription` アクションを追加する（`updateLineageDescription` と対称的な設計）
- [x] 2.2 `getSelectedRelationship` の戻り値に `description` が含まれることを確認する

## 3. Detail Panel UI

- [x] 3.1 Relationship エッジパネルのヘッダーに ID 表示 + コピーボタンを追加する（`visualizer/src/components/DetailPanel.tsx`）
- [x] 3.2 Lineage エッジパネルのヘッダーに ID 表示 + コピーボタンを追加する（同ファイル）
- [x] 3.3 Relationship パネルのボディに `description` 編集用 textarea を追加し、onBlur で `updateRelationshipDescription` を呼ぶ

## 4. CLI — `relationship get` / `relationship update`

- [x] 4.1 `src/relationship.js` に `get` サブコマンドを追加する（`--id` または `--from`/`--to` で1件取得、`--json` 対応）
- [x] 4.2 `src/relationship.js` に `update` サブコマンドを追加する（`--id` または `--from`/`--to` で対象特定、`--type` / `--description` で更新）
- [x] 4.3 `relationship add` に `--description` オプションを追加する

## 5. CLI — `lineage get`

- [x] 5.1 `src/lineage.js` に `get` サブコマンドを追加する（`--id` または `--from`/`--to` で1件取得、`--json` 対応）

## 6. ドキュメント更新

- [x] 6.1 `CLAUDE.md` の YAML フォーマット例の `relationships` セクションに `description` フィールドを追記する
- [x] 6.2 `src/templates/rules.md` の CLI フラグリファレンスに `relationship get/update`、`lineage get`、`--description` フラグを追記する
- [x] 6.3 `README.md` / `README.ja.md` の CLI リファレンスおよびスキーマ説明を更新する
- [x] 6.4 `CHANGELOG.md` に v2.5.0 エントリとして今回の変更を追記する

## 7. ビルド確認・スナップショット更新

- [x] 7.1 `npm run build-ui` を実行してビルドが成功することを確認する
- [x] 7.2 `npm run test:update` を実行してビジュアルスナップショットを更新する
