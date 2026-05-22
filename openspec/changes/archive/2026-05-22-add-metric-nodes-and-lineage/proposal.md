## Why

データモデルとビジネス指標の繋がりが現在のmodscapeでは表現できず、「どのテーブルがどの指標を生み出しているか」がダイアグラム上で見えない。指標（Metric）を一級市民のノードとしてモデルに追加することで、データエンジニアとビジネスステークホルダーの共通言語を可視化する。

## What Changes

- YAMLのトップレベルに `metrics:` セクションを追加（id, name, expression, descriptionなど）
- 既存の `lineage:` の `to` に metric_id を指定できるよう拡張（テーブル → 指標のリネージ）
- ビジュアライザーに指標専用ノード（MetricCard）を追加：計算式のプレビュー表示（truncate）、クリックで右上ツールバー表示、詳細パネルで計算式全文を閲覧
- 右パネルの検索系（SearchTab、PathFinder等）にMetricを検索対象として追加
- AIスキル（modeling.md等）に指標定義からリネージを自動生成する指示を追加

## Capabilities

### New Capabilities

- `metric-yaml-schema`: YAMLモデルに `metrics:` セクションを定義するスキーマ仕様。id・name・expression・descriptionフィールドを持ち、lineageのtoにmetric_idを使用できる。
- `metric-nodes`: ビジュアライザー上での指標ノードの表示・操作仕様。MetricCard、SelectionToolbar連携、DetailPanel連携を含む。

### Modified Capabilities

- `data-lineage`: lineageの `to` フィールドにmetric_idを参照できるよう要件を拡張する。
- `unified-search-tab`: Metricをドメインツリーおよびフルテキスト検索の対象として追加する。

## Impact

- `src/validate.js`：lineageバリデーションでmetric_idを有効なtoとして認識
- `src/operations/lineage.js`：findNodeById関数にmetricsの検索を追加
- `src/model-utils.js`：metricsフィールドのパース対応
- `visualizer/src/`：MetricCardコンポーネント追加、SelectionToolbar・DetailPanel・SearchTab・PathFinderのmetric対応
- `src/templates/claude/modeling.md` 等AIスキルテンプレート：metric定義からlineage自動生成の指示追加
