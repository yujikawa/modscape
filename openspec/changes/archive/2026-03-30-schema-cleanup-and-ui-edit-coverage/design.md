## Context

YAMLスキーマには `businessDefinitions`（`conceptual` セクション）と `isMetadata`（`columns[].logical` セクション）という2つの未使用フィールドが存在していた。これらはユーザーの意図なく追加されたものであり、スキーマの可読性を下げていた。今回これらを削除した。

また、DetailPanel では多くのフィールドが既に編集可能だが、`appearance.icon`・`appearance.color`・`columns[].id`・`tables[].id`・`isForeignKey`・`isPartitionKey` はUI非対応だった。ユーザーはこれらを変更するためにYAMLを直接編集する必要があり、UIだけでモデリングが完結しなかった。

## Goals / Non-Goals

**Goals:**
- `businessDefinitions`・`isMetadata` の全ファイルからの完全削除（実施済み）
- テーブルIDとカラムIDのUIからのリネーム（参照の一括置換を含む）
- `appearance.icon`・`appearance.color` の DetailPanel での編集
- `isForeignKey`・`isPartitionKey` のトグルボタン追加

**Non-Goals:**
- YAMLエディタの再編集可能化（readOnly のまま維持）
- `annotations.type`（sticky/callout）の変更UI（作成後変更ニーズが稀）
- `lineage.from` / `to` の変更UI（エッジ張り替えはキャンバス操作で代替）
- CLIコマンドへの同期（UIで編集した結果はYAML自動保存で反映される既存の仕組みに乗る）

## Decisions

### ID リネームの実装方針

**決定**: Zustand store に `renameTableId(oldId, newId)` と `renameColumnId(tableId, oldId, newId)` アクションを追加し、スキーマ全体を走査して参照を置換する。

**理由**: ID は `layout`・`domains.members`・`relationships`・`lineage`・`annotations.targetId` の5箇所で参照される。UI側（DetailPanel）から単純に `updateTable` を呼ぶだけでは参照が壊れる。store レイヤーで一括置換することで、UIコンポーネントは1つのアクションを呼ぶだけでよく、整合性を保証できる。

**代替案**: DetailPanel 側で置換ロジックを実装 → ロジックの分散・重複が発生するため却下。

**ID 変更UIの配置**: DetailPanel のヘッダー部分（テーブル名入力の近く）に小さなテキストフィールドで表示する。既存の `name` 編集欄とは明確に区別（ラベルを "ID" と表示）し、変更時は確認なしに即時反映する（undo/redo でロールバック可能）。

### appearance.color の実装

**決定**: ドメインの色編集（`DetailPanel.tsx` 既存実装）と同じカラーピッカーUIを流用する。

**理由**: 既存のコードパターンを再利用することで実装コストを最小化できる。UIの一貫性も保たれる。

### isForeignKey / isPartitionKey のトグル

**決定**: `isPrimaryKey` の既存トグルボタン（🔑）と同パターンで実装する。FK は 🔩 アイコン（TableCard で既に使用）、PK は 📂 アイコン（同）を使用する。

## Risks / Trade-offs

- **ID リネームの競合リスク**: 変更後のIDが既存IDと重複した場合、YAMLが壊れる。→ store 側でバリデーション（重複チェック）を行い、重複時はエラーを `set({ error: ... })` で表示して保存しない。

- **空文字のIDリスク**: ID フィールドを空にした場合の挙動。→ 空文字・空白のみの場合はリネームを適用しない（元のIDを維持）。

- **isMetadata 削除の破壊的変更**: 既存のYAMLファイルに `isMetadata: true` が含まれている場合、パーサーはフィールドを無視する（パーサーが未知フィールドをパススルーするため）。ただしUIには表示されなくなる。→ 既存ユーザーへの通知として CHANGELOG に記載する。
