## Context

SDD ワークフローは `spec-model.yaml` → `main model.yaml` のマージで完結するが、マージ前のドキュメント品質を測る手段がない。テーブルの description やカラムの type が欠けたまま本番 YAML に取り込まれるリスクを、CLI コマンドと SDD スキル統合によって防ぐ。

既存の Model Stats タブはリネージ・孤立テーブル統計を持つが、ドキュメント充足率は含まれていない。check/archive スキルはプロジェクト固有設定を `modscape-spec.custom.md` から読み取る仕組みがある。これを Coverage Policy の格納場所として流用する。

## Goals / Non-Goals

**Goals:**
- `modscape coverage <file>` CLI で任意 YAML のカバレッジを即時算出できる
- CI/CD で `--min-coverage` による品質ゲートを設定できる
- SDD check でカバレッジを readiness 指標として確認できる（Coverage Policy 設定時のみ）
- SDD archive で merge 前にカバレッジ確認を挟める（Coverage Policy 設定時のみ）
- Coverage Policy 未設定のプロジェクトへの影響がゼロ

**Non-Goals:**
- カラムレベルの lineage 追跡（設計フェーズに SQL が存在しない）
- warehouse への接続・実データとの照合（SDD が整合性を保証する設計）
- リアルタイム自動計算（グラフ操作への影響を排除するため）
- SDDドリフト検知（別バージョンに先送り）

## Decisions

### D-1: カバレッジ計算指標の選定

**決定**: テーブルカバレッジ = `conceptual.description` 充足率、カラムカバレッジ = `type` 充足率、総合 = 両者の平均とする。

**理由**: description と type は「最低限あるべき情報」として全員が合意しやすい。SCD・grain・strategyなど任意フィールドを含めると閾値の意味が曖昧になる。シンプルな2指標にすることで「何を直せばスコアが上がるか」が明確になる。

**不採用の案**: フィールド数重み付けスコア（実装複雑・閾値の直感的理解が難しい）

### D-2: カバレッジチェックのオプトイン方式

**決定**: `modscape-spec.custom.md` の `## Coverage Policy` セクション記述の有無で check/archive 統合を ON/OFF する。

**理由**: 全プロジェクトにカバレッジ要件があるわけではない。既存ユーザーへの影響ゼロを最優先とし、必要なチームだけが有効化できるオプトイン方式とする。custom.md はすでに SDD スキルが読み込む仕組みがあるため、新しい設定ファイルを増やさない。

**不採用の案**: `.modscape/coverage.yaml` を新規追加（設定ファイルが増え管理が煩雑）

### D-3: UI カバレッジの計算タイミング

**決定**: ボタン押下時のみ計算。schema 変更・タブ開閉では自動計算しない。計算結果は schema 更新で無効化してボタンを再表示する。

**理由**: Cytoscape グラフの描画・操作感を最優先。カバレッジはリアルタイムで変わる情報ではなく、たまに確認するもの。自動計算によるレイテンシは許容しない。

### D-4: archive のカバレッジチェックはブロックではなく確認

**決定**: カバレッジが閾値未満でも y/N 確認で続行できる。

**理由**: 緊急マージや段階的改善など、意図的に閾値未満でも進めたいケースがある。完全ブロックは SDD の柔軟性を損なう。警告と確認によってユーザーの意図を明示させる。

## Risks / Trade-offs

- **計算指標の硬直化** → 将来「description も必須にしたい」という要望が出る可能性。カバレッジ計算ロジックを独立した関数（`calculateCoverage(schema)`）に分離し、拡張しやすくする。
- **custom.md の解析ミス** → `## Coverage Policy` の下の行をパースするヒューリスティックが脆い場合がある。正規表現で `Minimum documentation coverage:\s*(\d+)%` を抽出するシンプルな実装とし、マッチしない場合はスキップ（エラーではない）とする。
- **UI の古いカバレッジを表示し続けるリスク** → schema 更新を検知して結果をリセットすることで緩和。「最終算出: XX分前」のタイムスタンプを表示して古さを示す。

## Affected Tables

### Direct Impact
- なし（model.yaml への schema 変更なし）

## Migration Plan

- YAML スキーマ変更なし。既存 model.yaml への移行作業不要。
- check.md・archive.md テンプレート更新はスキル呼び出し時に自動的に新しい動作になる。
- `modscape-spec.custom.md.example` 更新は `modscape init` 再実行で取得できる（既存ファイルは上書きしない）。

## Open Questions

- なし（探索フェーズで主要決定事項は合意済み）
