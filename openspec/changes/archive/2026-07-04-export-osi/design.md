## Context

Modscape は YAML ベースのデータモデリングツールであり、現在 dbt との連携（`import-dbt`）を持つ。今回は OSI（Open Semantic Interchange）フォーマットへのエクスポートを追加し、Modscape を BI/AI プラットフォームへのモデル配信ハブとして機能させる。

既存の `src/export.js` は `--format` オプションを持つ拡張ポイントとして適しており、`src/import-dbt.js` が示す「外部フォーマット変換モジュール」パターンを踏襲する。

## Goals / Non-Goals

**Goals:**
- `modscape export --format osi` コマンドで Modscape YAML を OSI YAML に変換する
- `imports:` による複数ファイル参照を変換前に解決する
- Modscape の共通フィールド（tables, columns, relationships, metrics, domains）を OSI にマッピングする
- expression は `ANSI_SQL` 方言に統一し、プラットフォーム固有方言は対象外とする

**Non-Goals:**
- OSI → Modscape の逆変換
- TABLEAU / SNOWFLAKE / DATABRICKS 等のプラットフォーム固有方言への変換
- OSI バリデーションの完全実装（基本的な構造生成のみ）
- ビジュアルエディタへの影響（CLI のみ）

## Decisions

### 1. 新規モジュール `src/export-osi.js` として分離する

**理由**: `import-dbt.js` と同じパターンで、変換ロジックを独立させる。`export.js` は `--format osi` を受け取ったときに `export-osi.js` に委譲するだけにとどめ、単一責任を維持する。

**代替案**: `export.js` 内に直接書く → フォーマット追加のたびに肥大化するため不採用。

### 2. expression は ANSI_SQL 方言のみ

**理由**: Modscape の expression（カラムID・メトリクス式）は方言非依存の業務定義であり、プラットフォーム固有の変換は OSI 側のコンバーターに任せる。`--dialect` フラグは導入しない（シンプルさ優先）。

**代替案**: `--dialect` フラグで方言を選べるようにする → OSI のエコシステムが担う役割まで引き受けることになるため不採用。

### 3. imports は変換前に解決してマージ

**理由**: OSI に cross-file 参照の概念がないため、単一の OSI 出力に含める必要がある。既存の model-utils の imports 解決ロジックを再利用する。

### 4. ターゲット OSI バージョンを `export-osi.js` 内の定数で管理する

**理由**: OSI はドラフト段階（現在 `0.2.0.dev0`）であり、仕様変更時に追従が必要。変更箇所を一か所に集約するため、モジュール冒頭に定数として宣言する。外部設定や CLI フラグは導入しない（シンプルさ優先）。

```js
const OSI_VERSION = "0.2.0.dev0";
```

OSI バージョンを上げる際は、この定数の更新と CHANGELOG への記録をセットで行う。

**代替案**: `--osi-version` フラグで指定可能にする → 複数バージョン対応の複雑さを招くため不採用。

### 5. `custom_extensions.modscape` に Modscape 固有メタデータを残す

**理由**: OSI の `custom_extensions` はベンダー固有メタデータのための拡張ポイント。`kind`（hub/link/sat/fact/dim）や `domain` を保存することで、将来的な Modscape 固有ツールが OSI ファイルから情報を復元できる余地を残す。

## Risks / Trade-offs

- **[情報損失] `display`・`sampleData` は変換不可** → OSI に対応フィールドがなく切り捨て。Modscape での再編集が必要な場合は元 YAML を参照する運用とする。
- **[型情報の喪失] Modscape の `type`（String, Timestamp 等）は OSI に直接対応するフィールドがない** → `custom_extensions` に残すか、description に付記する形で対応を検討する（実装時判断）。
- **[OSI スキーマの変化] OSI は現在 `0.2.0.dev0` でドラフト段階** → 仕様変更があった場合は追従が必要。初版では現行スキーマに合わせる。
