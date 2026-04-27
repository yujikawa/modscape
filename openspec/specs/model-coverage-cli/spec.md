## Requirements

### Requirement: `modscape coverage` コマンドでモデル統計とドキュメントカバレッジを一体で出力する

システムは `modscape coverage <file>` コマンドを提供しなければならない（SHALL）。指定された model YAML ファイルを解析し、**Model Stats**（モデル統計）と **Documentation Coverage**（ドキュメント充足率）を一体で表示する。任意の model YAML ファイル（main model.yaml、spec-model.yaml を問わず）に適用できなければならない（SHALL）。

出力は以下の2セクション構成でなければならない（SHALL）:

**Model Stats セクション**:
- テーブル総数
- リレーション総数
- リネージエッジ総数
- 孤立テーブル数と ID 一覧（lineage に一度も登場しないテーブル）

**Documentation Coverage セクション**:
- **テーブルカバレッジ**: `conceptual.description` が定義されているテーブル数 / 総テーブル数 × 100
- **カラムカバレッジ**: `type` が定義されているカラム数 / 総カラム数 × 100
- **総合カバレッジ**: (テーブルカバレッジ + カラムカバレッジ) / 2
- カバレッジが低いテーブルの一覧（per-table 充足率付き）

出力例:
```
Model Stats
  Tables:        23
  Relationships:  8
  Lineage edges: 14
  Isolated:       3  (fct_x, dim_y, stg_z)

Documentation Coverage
  Tables:   15/23  (65%)  [conceptual.description]
  Columns:  89/130 (68%)  [type defined]
  Overall:  67%

Low coverage tables:
  fct_orders     table: 0%  columns: 40%
  stg_raw_events table: 0%  columns: 55%
```

#### Scenario: 基本的な出力を確認する
- **WHEN** `modscape coverage model.yaml` を実行する
- **THEN** Model Stats セクション（テーブル数・リレーション数・リネージ数・孤立テーブル）と Documentation Coverage セクション（テーブル/カラム/総合カバレッジ）が表示される

#### Scenario: カラムが存在しないモデルを処理する
- **WHEN** カラムが一切定義されていない YAML に対して実行する
- **THEN** カラムカバレッジは N/A として表示し、テーブルカバレッジのみで計算する

#### Scenario: テーブルが0件のモデルを処理する
- **WHEN** tables が空の YAML に対して実行する
- **THEN** エラーを投げず「テーブルが見つかりません」と表示して終了コード 0 で終了する

### Requirement: `--min-coverage` オプションで閾値チェックを行う

`modscape coverage <file> --min-coverage <N>` を実行したとき、総合カバレッジが N% を下回る場合は終了コード 1 で終了しなければならない（SHALL）。CI/CD パイプラインでのゲートとして利用できる。

#### Scenario: 閾値を超えている場合
- **WHEN** 総合カバレッジが 80% で `--min-coverage 70` を指定して実行する
- **THEN** 「Coverage OK: 80% >= 70%」と表示され終了コード 0 で終了する

#### Scenario: 閾値を下回る場合
- **WHEN** 総合カバレッジが 45% で `--min-coverage 70` を指定して実行する
- **THEN** 「Coverage FAILED: 45% < 70%」と表示され終了コード 1 で終了する

### Requirement: `--json` オプションで構造化出力する

`modscape coverage <file> --json` を実行したとき、カバレッジ結果を JSON 形式で stdout に出力しなければならない（SHALL）。

JSON スキーマ:
```json
{
  "stats": {
    "tables": 23,
    "relationships": 8,
    "lineage_edges": 14,
    "isolated_tables": ["fct_x", "dim_y", "stg_z"]
  },
  "coverage": {
    "overall": 67.0,
    "tables": { "covered": 15, "total": 23, "pct": 65.0 },
    "columns": { "covered": 89, "total": 130, "pct": 68.5 },
    "low_coverage_tables": [
      { "id": "fct_orders", "table_pct": 0, "column_pct": 40.0 }
    ]
  },
  "passed": true
}
```

#### Scenario: JSON 形式で出力する
- **WHEN** `modscape coverage model.yaml --json` を実行する
- **THEN** 上記スキーマに準拠した JSON が stdout に出力される

#### Scenario: --min-coverage と --json を組み合わせる
- **WHEN** `modscape coverage model.yaml --json --min-coverage 70` を実行して閾値を下回る
- **THEN** JSON 出力に `"passed": false` フィールドが含まれ、終了コード 1 で終了する
