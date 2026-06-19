## ADDED Requirements

### Requirement: archive 時に tables_to_remove テーブルのリネージを自動クリーンアップする

`archive` スキルは `spec-config.yaml` の `tables_to_remove` にテーブルが列挙されている場合、テーブル削除（`modscape table remove`）の前に、各削除テーブルが端点（`from` または `to`）となっているリネージを全て削除しなければならない（SHALL）。

クリーンアップ手順（SHALL）：
1. `modscape lineage list <master>.yaml --involves <table_id>` で対象リネージを特定する
2. 検出したリネージを `modscape lineage remove <master>.yaml --id <lineage-id>` で削除する
3. リネージ削除完了後に `modscape table remove <master>.yaml --id <table_id>` を実行する

`tables_to_remove` が空または未設定の場合はこのステップをスキップしなければならない（SHALL）。

#### Scenario: テーブル削除前にリネージが自動削除される
- **WHEN** `tables_to_remove: [old_fact]` が設定されており、main YAML に `int→old_fact` と `old_fact→mart` のリネージが存在する状態で archive を実行する
- **THEN** `old_fact` の削除前に `int→old_fact` と `old_fact→mart` が削除され、その後 `old_fact` テーブルが削除される

#### Scenario: tables_to_remove が空の場合はスキップされる
- **WHEN** `tables_to_remove` が空または spec-config.yaml に未設定の状態で archive を実行する
- **THEN** リネージクリーンアップステップはスキップされ、エラーを出さずに続行する

---

### Requirement: archive 時に spec スコープ内のリネージを自動置換する

`archive` スキルは `modscape merge --patch` を実行する際に `--replace-owned-lineage` フラグを付与しなければならない（SHALL）。これにより、spec-model.yaml の owned テーブル間に存在する main YAML のリネージが自動的に置換される。

dry-run サマリーには「置換予定リネージ（削除される古いパス）」の件数を表示しなければならない（SHALL）。

#### Scenario: 中間テーブル挿入後にリネージが正しく置換される
- **WHEN** main YAML に `int→factA` が存在し、spec-model.yaml に owned テーブル `[int, intA, factA]` と lineage `[int→intA, intA→factA]` が定義されている状態で archive を実行する
- **THEN** マージ後の main YAML では `int→factA` が削除され、`int→intA` と `intA→factA` が追加される

#### Scenario: 境界またぎのリネージは archive 後も保持される
- **WHEN** main YAML に `external→int`（external は spec-model.yaml に含まれない）が存在する状態で archive を実行する
- **THEN** マージ後の main YAML でも `external→int` が保持される

#### Scenario: dry-run サマリーに置換予定リネージ件数が表示される
- **WHEN** archive の dry-run フェーズで within-scope の置換対象リネージが 2 件存在する
- **THEN** サマリーに「Lineage to replace: 2」（または相当する日本語）が表示される

---

### Requirement: spec-config.yaml の lineage_to_remove で明示的なリネージ削除を指定できる

`spec-config.yaml` に `lineage_to_remove` フィールドを追加できなければならない（SHALL）。`archive` スキルはこのフィールドが存在する場合、マージの前に列挙されたリネージ ID を main YAML から削除しなければならない（SHALL）。

```yaml
# spec-config.yaml の例
lineage_to_remove:
  - lin-int-factA
  - lin-other-stg
```

`lineage_to_remove` が空または未設定の場合はスキップしなければならない（SHALL）。

#### Scenario: lineage_to_remove に列挙されたリネージが削除される
- **WHEN** `lineage_to_remove: [lin-int-factA]` が設定されており、main YAML に `lin-int-factA` が存在する状態で archive を実行する
- **THEN** マージ前に `lin-int-factA` が main YAML から削除される

#### Scenario: lineage_to_remove が空の場合はスキップされる
- **WHEN** `lineage_to_remove` が空または spec-config.yaml に未設定の状態で archive を実行する
- **THEN** 明示リネージ削除ステップはスキップされ、エラーを出さずに続行する

#### Scenario: 存在しないリネージ ID を指定した場合は警告を出して続行する
- **WHEN** `lineage_to_remove` に main YAML に存在しないリネージ ID が指定されている
- **THEN** 警告メッセージを表示した上で archive 処理を続行し、中断しない
