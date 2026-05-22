## 1. YAMLスキーマ・型定義の拡張

- [x] 1.1 `visualizer/src/types/schema.ts` に `Metric` 型を追加（id, name, expression?, description?）
- [x] 1.2 `Schema` 型に `metrics?: Metric[]` フィールドを追加
- [x] 1.3 `src/model-utils.js` のパース処理でmetricsフィールドを読み込めるよう対応

## 2. バックエンド（CLI）のlineageバリデーション拡張

- [x] 2.1 `src/operations/lineage.js` の `findNodeById` にmetricsの検索を追加（`schema.metrics?.find(m => m.id === id)`）
- [x] 2.2 `src/validate.js` のlineageバリデーションでmetric_idを有効な `to` として認識するよう修正
- [x] 2.3 `metric-yaml-schema` spec のIDユニーク検証をバリデーションに追加

## 3. ビジュアライザー：MetricCardノードの追加

- [x] 3.1 `visualizer/src/components/MetricCard.tsx` を新規作成（ConsumerCardを参考に計算式プレビュー付きの独自スタイル）
- [x] 3.2 `visualizer/src/lib/cytoscapeElements.ts`（または相当ファイル）にmetricsノードのCytoscape要素生成を追加
- [x] 3.3 `visualizer/src/lib/parser.ts` でmetricsをパースしてノードに変換する処理を追加

## 4. ビジュアライザー：SelectionToolbar・DetailPanelのMetric対応

- [x] 4.1 `visualizer/src/components/SelectionToolbar.tsx` にmetric選択時の表示を追加（テーブルと同じパターン）
- [x] 4.2 `visualizer/src/components/DetailPanel.tsx` にMetric詳細表示を追加（name, expression全文, description）

## 5. ビジュアライザー：右パネル検索系のMetric対応

- [x] 5.1 `visualizer/src/components/RightPanel/SearchTab.tsx` の検索対象にMetricを追加（name・expressionをキーワードマッチ）
- [x] 5.2 SearchTabのドメイン階層ツリーにMetricを表示する
- [x] 5.3 `visualizer/src/components/RightPanel/PathFinderTab.tsx` にMetricノードを選択対象として追加

## 6. AIスキルテンプレートの更新

- [x] 6.1 `src/templates/claude/modeling.md` にmetricsセクションの定義方法とexpression解析によるlineage自動生成の指示を追加
- [x] 6.2 Gemini・Codexのテンプレートにも同様の指示を追加（`src/templates/gemini/modscape-modeling/SKILL.md` 等）

## 7. ビルド・スナップショット検証

- [x] 7.1 `npm run build-ui` でビルドが通ることを確認
- [x] 7.2 `npm run test:e2e -- --update-snapshots` でビジュアルスナップショットを更新・コミット
