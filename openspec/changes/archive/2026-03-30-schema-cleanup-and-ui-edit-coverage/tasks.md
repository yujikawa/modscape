## 1. スキーマクリーンアップ（実施済み確認）

- [x] 1.1 `visualizer/src/types/schema.ts` から `businessDefinitions` と `isMetadata` を削除
- [x] 1.2 `visualizer/src/components/DetailPanel.tsx` から `isMetadata` トグルボタンを削除
- [x] 1.3 `visualizer/src/components/TableCard.tsx` から `isMetadata` アイコン表示を削除
- [x] 1.4 `src/templates/rules.md` / `codegen-rules.md` から両フィールドの記述を削除
- [x] 1.5 `CLAUDE.md` / `README.md` / `README.ja.md` から両フィールドの記述を削除
- [x] 1.6 `samples/1-retail-analytics.yaml` から両フィールドの記述を削除
- [x] 1.7 `openspec/specs/visualizer-core/spec.md` から `isMetadata` 要件を削除

## 2. store に ID リネームアクションを追加

- [x] 2.1 `useStore.ts` に `renameTableId(oldId: string, newId: string)` アクションを実装する（layout / domains.members / relationships / lineage / annotations の参照を一括置換し、重複IDの場合はエラーをセット）
- [x] 2.2 `useStore.ts` に `renameColumnId(tableId: string, oldId: string, newId: string)` アクションを実装する（relationships.from.column / to.column を更新し、重複の場合はエラーをセット）
- [x] 2.3 型定義（`StoreState` インターフェース）に `renameTableId` と `renameColumnId` を追加する

## 3. DetailPanel にテーブル / カラム ID 編集フィールドを追加

- [x] 3.1 DetailPanel のテーブルヘッダー部分（テーブル名の近く）に ID 入力フィールドを追加する（ラベル "ID"、onBlur で `renameTableId` を呼び出す）
- [x] 3.2 DetailPanel の Logical タブのカラム行に ID 列を追加する（onBlur で `renameColumnId` を呼び出す）
- [x] 3.3 エラー表示（重複IDの場合）を DetailPanel 内に表示する

## 4. appearance.icon / appearance.color の編集UI追加

- [x] 4.1 DetailPanel のテーブルヘッダー部分に `appearance.icon` テキスト入力フィールドを追加する（onBlur で `updateTable` を呼び出す）
- [x] 4.2 DetailPanel に `appearance.color` のカラーピッカーを追加する（ドメインの既存実装を参考に `updateTable` を呼び出す）

## 5. isForeignKey / isPartitionKey トグルの追加

- [x] 5.1 DetailPanel の Logical タブのカラム行に `isForeignKey` トグルボタン（🔩）を追加する（`isPrimaryKey` トグルと同じパターンで `handleUpdateLogicalColumn` を呼び出す）
- [x] 5.2 DetailPanel の Logical タブのカラム行に `isPartitionKey` トグルボタン（📂）を追加する（同上）

## 6. ビルド・スナップショット更新

- [x] 6.1 `npm run build-ui` を実行してビルドが成功することを確認する
- [x] 6.2 `npm run test:update` を実行してスナップショットを更新しコミットする
