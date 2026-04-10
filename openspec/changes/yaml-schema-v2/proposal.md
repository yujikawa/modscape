## Why

現在の `model.yaml`（スキーマv1）は機能追加を重ねた結果、概念の配置が散在し、オントロジーとしての一貫性が失われている。

具体的な問題：
- `appearance` という視覚的な名前のセクションに `type: fact` など概念層の情報が混在している
- `implementation` という名前のセクションに `grain`（論理的モデリング判断）と `partition_by`（物理的実装詳細）が同居している
- `physical_name`（トップレベル）と `physical.name`（オブジェクト内）が重複している
- `appearance.scd` と `implementation.scd2` で同一概念が2箇所に分散している
- `domains.members` と `layout.parentId` でドメイン所属が重複管理されている
- `materialization`・`partition_by` など特定ツール（dbt/BigQuery）に依存した用語が埋め込まれている
- カラムの `logical:` ラッパーが冗長で、シンプルな定義でも毎回3行必要になる

Modscapeは「概念・論理・物理」という3層オントロジーと、それを横断する視覚軸を体現するツールである。YAMLはその哲学を忠実に表現する存在であるべきで、この再設計はその理念への回帰である。

## What Changes

### オントロジー軸の再構成

テーブルの構造を3層オントロジーに忠実に再配置する。

| 変更前 | 変更後 | 理由 |
|--------|--------|------|
| `appearance.type` | `conceptual.kind` | 概念層の情報を概念層へ。`type` は予約語的な曖昧さを避け `kind` に改名 |
| `appearance.scd` + `implementation.scd2` | `logical.scd`（統合） | SCDはモデリング判断であり論理層。二重管理を解消 |
| `implementation.grain` / `measures` | `logical.grain`（`measures`は廃止） | 粒度はモデリング判断。集計定義は `column.expression` で代替 |
| `implementation.*` (dbt/BQ固有) | `physical.*`（抽象化） | ツール非依存の用語に統一 |
| `logical_name` / `physical_name` | `logical.name` / `physical.name` | 層構造に収める |
| `conceptual.tags` | `metadata.tags` | タグはユーザー定義メタデータ。`metadata` でカバー可能 |

### 視覚軸の分離

`icon` / `color` などの純粋な視覚情報を `display` セクションとして独立させる。

| 変更前 | 変更後 |
|--------|--------|
| `appearance.icon` / `appearance.color` | `display.icon` / `display.color` |
| `consumers.appearance.icon/color` | `consumers.display.icon/color` |
| `domains.color` | `domains.display.color` |
| `annotations.color` | `annotations.display.color` |

### カラム構造のフラット化

カラム定義の `logical:` ラッパーを廃止し、シンプルなケースを簡潔に記述できるようにする。物理定義が論理と異なる場合のみ `physical:` サブオブジェクトを記述する。

```yaml
# Before
columns:
  - id: order_id
    logical:
      name: Order ID
      type: Int
      isPrimaryKey: true

# After
columns:
  - id: order_id
    name: Order ID
    type: Int
    isPrimaryKey: true
    physical:            # 必要な時だけ
      type: BIGINT
      constraints: [NOT NULL]
```

### physical フィールドの抽象化

dbt / BigQuery 固有の用語をツール非依存な抽象概念に統一する。全フィールドはオプションで、`strategy` の値によって挙動が変わるような条件分岐は持たない。

| 変更前 | 変更後 |
|--------|--------|
| `materialization` | `strategy` |
| `incremental_strategy` | `update_mode` |
| `unique_key` | `merge_key` |
| `partition_by` | `partition` |
| `cluster_by` | `cluster` |
| `incremental_key` | `filter_key` |
| `incremental_lookback` | `lookback` |

### その他の整理

- `layout.parentId` 廃止 → `domains.members` に一元化
- `annotation.type`（sticky/callout）廃止 → そもそも不要
- `annotation.targetId` + `annotation.targetType` → `target: { id, type }` に統合

## Capabilities

### Modified Capabilities

- `yaml-schema`: スキーマを v1 から v2 に更新
- `parser`: v2スキーマのパース・正規化対応、v1からv2へのマイグレーション処理
- `cli-mutation`: `table`・`column`・`domain`・`relationship`・`lineage` の全CLIコマンドをv2フィールド名に対応
- `visualizer`: v2スキーマに対応したコンポーネント・ストアの更新
- `type-definitions`: `schema.ts` の型定義を全面改訂

### New Capabilities

- `schema-migration`: v1 → v2 への自動変換ツール（`modscape migrate` コマンド）

## Impact

これは**破壊的変更（breaking change）**である。

- 既存の `model.yaml`（v1スキーマ）はそのままでは動作しない
- `modscape migrate` コマンドによる自動変換を提供する
- Modscape アプリリリース v3.0.0 として公開する
- スキーマバージョンは `version: "2.0.0"` となる
