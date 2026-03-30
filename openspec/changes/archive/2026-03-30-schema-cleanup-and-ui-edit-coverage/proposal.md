## Why

YAMLスキーマに意図せず追加されたフィールド（`businessDefinitions`、`isMetadata`）が存在しており、実際には使用されず混乱を招いていた。また、UI上から編集できないフィールドが複数あり、YAMLを直接書かなければ設定できない項目があった。スキーマをシンプルに保ちつつ、UIだけでモデリングを完結できる状態にする。

## What Changes

- **`conceptual.businessDefinitions` の削除** **BREAKING**: `description` で代替可能なため、型定義・ドキュメント・サンプル・UIから完全削除する（実施済み）
- **`columns[].logical.isMetadata` の削除** **BREAKING**: Data Vault 監査カラム用フラグ。実際には使用されないため、型定義・ドキュメント・サンプル・UIから完全削除する（実施済み）
- **`tables[].id` のリネーム対応**: DetailPanel から ID を変更できるようにする。`layout` / `domains.members` / `relationships` / `lineage` / `annotations` の参照を一括置換する
- **`columns[].id` のリネーム対応**: DetailPanel から カラム ID を変更できるようにする。`relationships.from.column` / `to.column` も更新する
- **`appearance.icon` の編集対応**: テーブル詳細パネルで絵文字アイコンをテキスト入力で変更できるようにする
- **`appearance.color` の編集対応**: テーブル詳細パネルでヘッダー色をカラーピッカーで変更できるようにする（ドメインに既存の実装と同様）
- **`columns[].logical.isForeignKey` のトグル追加**: `isPrimaryKey` と同様のトグルボタンを追加する
- **`columns[].logical.isPartitionKey` のトグル追加**: `isPrimaryKey` と同様のトグルボタンを追加する

## Capabilities

### New Capabilities

- `id-rename`: テーブルおよびカラムIDをUIから変更でき、YAML全体の参照を一括置換する機能

### Modified Capabilities

- `detail-panel`: 編集対応フィールドの追加（appearance.icon、appearance.color、isForeignKey、isPartitionKey）
- `column-role-indicators`: isMetadata の削除に伴い、🕒アイコン表示を除去
- `visualizer-core`: businessDefinitions・isMetadata のスキーマ型定義・パーサーからの削除

## Impact

- `visualizer/src/types/schema.ts` — isMetadata・businessDefinitions 型の削除（実施済み）、新フィールド型の追加なし（既存型を活用）
- `visualizer/src/components/DetailPanel.tsx` — ID編集フィールド、icon/colorピッカー、FK/PKトグルの追加
- `visualizer/src/components/TableCard.tsx` — isMetadata アイコン表示の削除（実施済み）
- `visualizer/src/store/useStore.ts` — `renameTableId()`、`renameColumnId()` アクションの追加
- `src/templates/rules.md` / `codegen-rules.md` — isMetadata・businessDefinitions の削除（実施済み）
- `CLAUDE.md` / `README.md` / `README.ja.md` — 同上（実施済み）
- `samples/1-retail-analytics.yaml` — isMetadata・businessDefinitions の削除（実施済み）
