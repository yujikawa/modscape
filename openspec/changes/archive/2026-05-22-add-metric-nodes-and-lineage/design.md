## Context

現在のmodscapeはテーブル・コンシューマー・リレーションシップ・リネージをYAMLで表現できるが、「ビジネス指標（Metric）」という概念は存在しない。コンシューマーはダッシュボードやレポートといった最終消費者を表すが、指標は計算式を持つビジネス概念であり別物として扱う必要がある。

リネージは現在 `lineage[].from/to` にテーブルIDまたはコンシューマーIDを指定できる。指標を追加しても同じ仕組みを流用できる。バリデーション側（`findNodeById`）と型定義（`schema.ts`）の拡張が主な変更点になる。

ビジュアライザーはCytoscapeベースのキャンバスで動作し、テーブルノードとコンシューマーノードが既に実装されている。MetricCardは `ConsumerCard` の構造を参考にしつつ計算式プレビューを追加した独自の見た目にする。

## Goals / Non-Goals

**Goals:**
- YAMLに `metrics:` セクションを追加し、id・name・expression・descriptionを定義できる
- 既存の `lineage:` の `to` にmetric_idを使えるよう拡張する
- ビジュアライザーでメトリクスノードを表示し、テーブルとのリネージを可視化する
- ノードに計算式プレビューを表示し（長い場合は省略）、クリックで詳細を開ける
- 右パネルの検索・ツール系にMetricを追加する
- AIスキルにmetric定義からlineage自動生成の指示を追加する

**Non-Goals:**
- カラムレベルのリネージ（計算式の詳細パネルで補完する）
- 指標間の派生リネージ（派生指標のfrom/toはスコープ外）
- YAML上からのメトリクスのCRUD操作コマンド（CLI add/remove metric）
- 外部semantic layer（dbt metrics等）との同期

## Decisions

### 決定1: metricsはトップレベルセクション（consumers とは分離）

**選択**: `metrics:` をYAMLのトップレベルに独立したセクションとして追加する。

**理由**: consumerは「データの利用者（ダッシュボード・レポート）」であり、metricは「計算式を持つビジネス指標の定義」で意味的に別物。同じセクションに混在させると将来的な型の区別・バリデーション・UI上の扱いが複雑になる。

**却下した案**: `consumers[]` に `kind: metric` フィールドを追加する → 既存consumerとの型混在、バリデーション複雑化のため却下。

### 決定2: リネージは既存の `lineage:` セクションをそのまま使う

**選択**: `lineage[].to` にmetric_idを指定できるよう拡張する。metricsセクション内にsourcesフィールドは持たない。

**理由**: 既存のリネージ可視化（ハイライト・PathFinder等）がそのまま動作する。指標定義とリネージの分離で、AIがリネージのみを独立して書き込める。

**却下した案**: `metrics[].sources: [table_id]` で自己完結させる → リネージ処理の二重管理が発生するため却下。

### 決定3: MetricCardの計算式プレビューはCSSで省略

**選択**: `expression` テキストを固定幅コンテナにCSSの `text-overflow: ellipsis` + `overflow: hidden` + `white-space: nowrap` で省略表示する。

**理由**: JSでのtruncate処理より実装がシンプルで、フォントサイズ変更時にも自動対応できる。

### 決定4: MetricのUI統合はテーブルと同じパターンに従う

**選択**: クリック時のSelectionToolbar表示、DetailPanel構造、SearchTabへの追加を、既存のテーブル・コンシューマーの実装パターンをそのまま踏襲する。

**理由**: UXの一貫性を保ち、実装コストを下げる。

## Risks / Trade-offs

- **リスク: lineageバリデーションのmetric_id未認識** → `findNodeById`（`src/operations/lineage.js`）と`src/validate.js`の両方にmetricsの検索を追加することで対応。
- **リスク: Cytoscapeレイアウト（Dagre）でのMetricノード配置が崩れる** → ConsumerCardと同じノードタイプ設定を踏襲し、レイアウト対象として正しく登録する。
- **トレードオフ: カラムレベルリネージは非対応** → 計算式をDetailPanelに表示することで代替。テーブルレベルのリネージでも「テーブルを変更したら影響を受ける可能性がある」という実用上の判断として十分。
