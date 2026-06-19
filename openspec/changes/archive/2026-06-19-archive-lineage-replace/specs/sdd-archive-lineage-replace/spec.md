## ADDED Requirements

### Requirement: merge --patch がスコープ内リネージを置換するモードをサポートする

`modscape merge <base> <patch> --patch --replace-owned-lineage` を実行すると、patch YAML に含まれる owned テーブル（`isImported !== true` のテーブル）を自動検出し、base YAML から「両端が owned テーブルに収まるリネージ」を削除してからマージしなければならない（SHALL）。

「境界またぎのリネージ」（`from` または `to` の片方だけが owned テーブル）は削除せず保持しなければならない（SHALL）。

処理順序は以下の通りでなければならない（SHALL）：
1. patch YAML の全テーブルを走査し、`isImported !== true` のテーブル ID を owned テーブルとして収集する
2. base の `lineage` 配列から `from` と `to` の両方が owned テーブルに含まれるエントリを削除する
3. `lineageIndex` を再構築する
4. 通常の upsert マージを実行する（patch の lineage エントリを追加・上書き）

`--replace-owned-lineage` が指定されていない場合は従来の upsert 動作を維持しなければならない（SHALL）。

#### Scenario: スコープ内リネージが置換される
- **WHEN** base に `int→factA`（both owned）と `other→int`（cross-boundary）が存在し、patch に owned tables `[int, intA, factA]` と lineage `[int→intA, intA→factA]` が含まれる状態で `--replace-owned-lineage` を指定してマージする
- **THEN** base の `int→factA` は削除され、`int→intA` と `intA→factA` が追加される。`other→int` は保持される

#### Scenario: 境界またぎのリネージは保持される
- **WHEN** base に `external→int`（external は patch に含まれない）が存在し `--replace-owned-lineage` を指定してマージする
- **THEN** `external→int` はマージ後も base に残存する

#### Scenario: フラグなしでは従来の upsert 動作を維持する
- **WHEN** `--replace-owned-lineage` を指定せずに `modscape merge --patch` を実行する
- **THEN** 従来通りリネージの追加・上書きのみが行われ、base のリネージは削除されない

#### Scenario: isImported テーブルはスコープから除外される
- **WHEN** patch YAML に `isImported: true` のテーブル `ctx_table` と owned テーブル `fact_a` が混在する
- **THEN** owned テーブルの集合は `fact_a` のみとなり、`ctx_table` が端点のリネージは置換対象から除外される

---

### Requirement: lineage list コマンドが関与テーブルによるフィルタをサポートする

`modscape lineage list <file> --involves <tableId>` を実行すると、`from` または `to` が指定 ID と一致するリネージエントリのみを返さなければならない（SHALL）。既存の引数なし動作は変更しないことで後方互換を維持しなければならない（SHALL）。

#### Scenario: --involves フィルタが from/to の両方にマッチする
- **WHEN** `modscape lineage list model.yaml --involves fact_a` を実行し、`from: fact_a` のエントリと `to: fact_a` のエントリが存在する
- **THEN** どちらのエントリも出力に含まれる

#### Scenario: マッチしない場合は空リストを返す
- **WHEN** `modscape lineage list model.yaml --involves unknown_table` を実行する
- **THEN** 空のリスト（または空配列 JSON）が返される
