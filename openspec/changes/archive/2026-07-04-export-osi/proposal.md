## Why

Modscapeで設計したセマンティックモデルを、BI・AI・データ分析エコシステム共通の標準フォーマットである OSI（Open Semantic Interchange）に変換し、Tableau・Databricks・GoodData等の各プラットフォームへ配信できるようにする。Modscapeを「設計・文書化ハブ」、OSIを「流通フォーマット」として位置づけることで、モデルの再利用性と可搬性を高める。

## What Changes

- `modscape export --format osi [model.yaml]` コマンドを追加する
- 既存の `export` コマンドに `--format osi` オプションを追加する形で拡張する
- 変換対象：
  - `tables[]` → OSI `datasets[]`（physical name を source として使用）
  - `columns[]` → OSI `fields[]`（expression は `ANSI_SQL` 方言のみ、値はカラムID）
  - `relationships[]` → OSI `relationships[]`（ほぼ1:1マッピング）
  - `metrics[]` → OSI `metrics[]`（expression は `ANSI_SQL` 方言に固定）
  - `domains[]` / `kind` → `custom_extensions.modscape` に保存
  - `display` / `sampleData` は変換対象外（破棄）
- `imports:` による複数ファイル参照は変換前に解決してマージする
- 出力ファイル名のデフォルト：`<input-basename>.osi.yaml`
- `--output` オプションで出力先を指定可能

## Capabilities

### New Capabilities

- `osi-export`: Modscape YAML を OSI フォーマットへ変換するエクスポート機能。`modscape export --format osi` コマンドとして実装され、imports の解決・共通フィールドのマッピング・ANSI_SQL 方言への統一を行う。

### Modified Capabilities

（なし）

## Impact

- **CLI**: `src/export.js` に `--format osi` 分岐を追加
- **新規モジュール**: `src/export-osi.js`（変換ロジック）
- **依存**: 既存の `js-yaml` を利用（追加依存なし）
- **テスト**: `tests/` に OSI 変換の E2E テストを追加
- **ドキュメント**: README に `export --format osi` コマンドの説明を追記
