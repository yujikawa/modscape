## Context

SDDワークフローでは、テーブルごとの永続スペック（`.modscape/specs/<table-id>/spec.md`）は`/modscape:spec:archive`の最終ステップで初めて生成される。そのため、既存プロジェクトをSDDに組み込む際には全テーブルのspec.mdが存在せず、ベースラインが欠落した状態でSDDを開始することになる。

本チェンジでは、任意の実装アーティファクト（model.yaml・SQL・Python等）を読んで全テーブルのspec.mdを一括生成するスキル `/modscape:spec:generate` を追加する。これにより既存PJのSDD導入初日からspecsディレクトリを整備できる。

## Goals / Non-Goals

**Goals:**
- model.yaml・SQLファイル（DDL/dbt model）・Pythonファイル（SQLAlchemy等）を入力とし、各テーブルの`.modscape/specs/<table-id>/spec.md`を生成する
- 既存のspec.mdはスキップ（上書きしない）
- 引数ありなら即実行、引数なしなら対話でファイル収集
- 実行開始時にmodel.yamlの更新有無を確認する
- Claude Code / Gemini / Codex の3形式でスキルファイルを提供する

**Non-Goals:**
- spec.mdのAI補完（YAMLに`description`がなければ空欄で生成）
- 既存spec.mdのマージ・部分更新
- テーブルIDのインタラクティブなリネーム（常に物理テーブル名）

## Decisions

### テーブル情報の抽出方法

**model.yaml**: modscape CLIコマンドで取得する（`modscape table list`・`modscape table get`）。grep/直接読みは使わない。

**SQLファイル**: AIがファイルを読んでCREATE TABLE / SELECT / dbt model（`{{ config() }}`）からテーブル名・カラム・型を解析する。dbt modelの場合は`ref()`からlineageも取れるが、本スキルではspec.mdの生成のみに留める。

**Pythonファイル**: AIがファイルを読んでSQLAlchemyの`Column()`定義、pandasの`read_sql`、PySparkのスキーマ定義を解析する。フレームワーク非依存でベストエフォート解析とする。

この方針を選んだ理由: modscapeはCLI駆動であり、YAMLに関してはCLIが最も正確なI/Fである。SQLとPythonはファイル種別ごとに専用パーサを持つことが現実的でなく、AIのコード理解能力を活用する方が保守コストが低い。

### テーブルID決定ルール

物理テーブル名をそのままIDとして使用する（`conceptual.name`ではなく`physical.name` / DDLのテーブル名）。ユーザーが引数または対話で別IDを指定した場合はそちらを優先する。

### インプット指定の方式

- 引数ありの場合（ファイルパス・glob）: そのファイルをすべて読む
- 引数なしの場合: 「どのファイルを参照しますか？」と対話で収集する
- 両者は混在可能

### model.yaml更新の確認タイミング

インプット収集直後（ファイル解析より前）に確認する。SQLやPythonのみが入力で既存model.yamlがない場合は、「新規model.yamlとして保存しますか？」の形で聞く。

### スキルファイルの実装順序

CLAUDE.mdのルールに従い、Claude Code版（`src/templates/claude/spec/generate.md`）を先行実装し、Gemini版・Codex版はそれを元に派生させる。

## Risks / Trade-offs

- **[Risk] SQL解析の精度**: dbt modelの複雑なJinjaやCTE、Python DSLの独自フレームワークでは誤読が起きうる → AIのベストエフォート解析とし、生成後に内容確認を促すサマリーを出力することでカバー
- **[Risk] 同一テーブルが複数ファイルに存在**: 例えばCREATE TABLEとdbt modelが両方あるケース → 最初に見つかったソースを使い、その旨をサマリーに明記する（マージはしない）
- **[Trade-off] spec.mdの内容の薄さ**: SQLや一部Pythonは`description`相当の情報が少ないため、Business Contextが空になりがち → `—`プレースホルダーで生成し、後からSDD通常フローで肉付けする想定であることをドキュメントに明記する
