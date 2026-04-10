# Tasks: YAML Schema v2

## Phase 1: 型定義・パーサー（基盤）

- [x] **T01** `visualizer/src/types/schema.ts` — v2スキーマ型定義に全面改訂
  - `Table`: `conceptual` / `logical` / `physical` / `display` の4セクション構成
  - `Column`: `logical:` ラッパー廃止、フラット構造
  - `Domain`: `display: { color }` に変更
  - `Consumer`: `display: { icon, color }` に変更
  - `Annotation`: `target: { id, type }` に統合、`type`（sticky/callout）廃止
  - `Layout`: `parentId` 廃止
  - 補助型 `TableKind` / `BuildStrategy` / `UpdateMode` / `Granularity` を追加

- [x] **T02** `visualizer/src/lib/parser.ts` — v2専用パーサーに更新
  - `detectVersion(raw)`: `version` フィールドでv1/v2を判定
  - v1（`version: "1.0.0"` または未指定）が来た場合は **エラーを返す**（`"This file uses schema v1. Run: modscape migrate <path>"`）
  - `normalizeV2(raw)`: v2スキーマの正規化（配列正規化、IDの自動生成等）のみ実装
  - 変換ロジックは持たない（`migrate.js` に委ねる）

- [x] **T03** `src/model-format-version.js` — `MODEL_FORMAT_VERSION = '2.0.0'` にバンプ

## Phase 2: マイグレーションコマンド

- [x] **T04** `src/migrate.js` — 新規作成（バージョンチェーン方式）
  - `MIGRATIONS` 配列: `{ from, to, migrate }` のチェーンとして定義
  - `migrateToLatest(yaml)`: 現バージョンから最新まで順次適用
  - `migrateV1toV2(yaml)`: v1→v2の変換ロジック（design.md の変換ルール表に従う）
  - `modscape migrate <path>` コマンドの実装
  - `--dry-run` フラグ: 変換内容をコンソール出力して終了
  - `--out <path>` フラグ: 指定ファイルに出力
  - デフォルト: `<path>.bak` にバックアップを作成してからin-place変換
  - 将来の v2→v3 追加時は `MIGRATIONS` に1エントリ追加するだけでよい設計

- [x] **T05** `src/index.js` — `migrate` コマンドを登録

## Phase 3: CLIミューテーション

- [x] **T06** `src/operations/table.js` — v2フィールド名に更新
  - `logical_name` → `logical.name`
  - `physical_name` → `physical.name`
  - `appearance.type` → `conceptual.kind`
  - `appearance.icon` / `appearance.color` → `display.icon` / `display.color`
  - `conceptual.description` のパス確認

- [x] **T07** `src/operations/column.js` — カラムのフラット化に対応
  - `logical.{name,type,description,isPrimaryKey,...}` の読み書きをトップレベルに変更

- [x] **T08** `src/operations/domain.js` — `color` → `display.color`

- [x] **T09** `src/operations/annotation.js` — v2構造に更新
  - `type`（sticky/callout）引数を廃止
  - `targetId` / `targetType` 引数 → `target: { id, type }` オブジェクトに変更
  - `color` → `display.color`

- [x] **T10** `src/operations/consumer.js` — `appearance` → `display` に変更

- [x] **T11** `src/operations/summarize.js` — フィールド参照をv2に更新

## Phase 4: dbtインテグレーション

- [x] **T12** `src/import-dbt.js` — v2フィールドでYAMLを生成するよう更新
  - `logical_name` / `physical_name` / `appearance: { type }` をv2構造に変更

- [x] **T13** `src/sync-dbt.js` — v2フィールドでの同期処理に更新

## Phase 5: バリデーション

- [x] **T14** `src/validate.js` — v2対応
  - v1フィールド（`appearance`、`implementation`、`logical_name` 等）が残っていたら警告
  - `modscape migrate` の実行を促すメッセージを出力

## Phase 6: ビジュアライザー

- [x] **T15** `visualizer/src/lib/cytoscapeElements.ts` — v2フィールド参照に更新
  - `appearance?.type` → `conceptual?.kind`
  - `appearance?.color` / `appearance?.icon` → `display?.color` / `display?.icon`
  - `domain.color` → `domain.display?.color`
  - `annotation.targetId` → `annotation.target?.id`
  - `layout[id].parentId` 参照を削除

- [x] **T16** `visualizer/src/lib/colors.ts` — `appearance.type` → `conceptual.kind` で色解決

- [x] **T17** `visualizer/src/components/TableCard.tsx` — v2フィールドで表示
  - `appearance.type` / `.icon` / `.color` → `conceptual.kind` / `display.icon` / `display.color`
  - `logical_name` → `logical?.name`
  - `physical_name` → `physical?.name`

- [x] **T18** `visualizer/src/components/ConsumerCard.tsx` — `appearance` → `display`

- [x] **T19** `visualizer/src/components/DetailPanel.tsx` — タブ構成とフィールドをv2に再設計
  - タブ: `conceptual | logical | physical | sample | metadata`（`implementation` タブ廃止）
  - `conceptual` タブ: `kind` / `name` / `description` の編集UI
  - `logical` タブ: `name` / `grain` / `scd` の編集UI
  - `physical` タブ: `name` / `schema` / `strategy` 等の編集UI（旧implementationの内容を統合）
  - `display` セクション: `icon` / `color` をどこかのタブに配置
  - `consumers` の `appearance` → `display`

- [x] **T20** `visualizer/src/store/useStore.ts` — v2型に合わせてアクション・セレクターを更新

## Phase 7: サンプルYAML

- [x] **T21** `samples/1-retail-analytics.yaml` — v2スキーマに変換（`modscape migrate` またはmanual）

- [x] **T22** `samples/2-conformed-dims.yaml` — v2スキーマに変換

- [x] **T23** `samples/sdd-sample/` 配下のYAML — v2スキーマに変換

- [x] **T24** `src/templates/default-model.yaml` — v2スキーマのテンプレートに更新

## Phase 8: AIルール・スキル（Claude版が正）

- [x] **T25** `src/templates/rules.md` — v2スキーマに全面書き直し
  - Quick Reference の `parentId` ルールを削除
  - Section 2（Tables）: `conceptual` / `logical` / `physical` / `display` 構造に書き直し
  - Section 3（Columns）: フラット構造に更新
  - Section 6（Annotations）: `type` フィールド削除、`target:` オブジェクト構造に更新
  - Section 9（Consumers）: `display` 構造に更新
  - Section 13（CLI Flag Reference）: v2フラグ名に全面更新
  - `MODEL_FORMAT_VERSION` プレースホルダーが `2.0.0` を参照するよう確認

- [x] **T26** `src/templates/claude/spec/implement.md` — v2フィールド参照に更新
  - `implementation.*` → `physical.*`
  - `appearance.scd` → `logical.scd`
  - `appearance.type` → `conceptual.kind`

- [x] **T27** `src/templates/claude/spec/design.md` — v2フィールド参照に更新

- [x] **T28** `src/templates/claude/codegen.md` — v2フィールド参照に更新

- [x] **T29** `src/templates/claude/modeling.md` — v2フィールド参照に更新

- [x] **T30** `src/templates/codegen-rules.md` — v2フィールド参照に更新

- [x] **T31** Gemini版スキルを Claude 版から派生してv2に同期
  - `src/templates/gemini/modscape-spec-implement/SKILL.md`
  - `src/templates/gemini/modscape-spec-design/SKILL.md`
  - `src/templates/gemini/modscape-codegen/SKILL.md`
  - `src/templates/gemini/modscape-modeling/SKILL.md`

- [x] **T32** Codex版スキルを Claude 版から派生してv2に同期
  - `src/templates/codex/modscape-spec-implement/SKILL.md`
  - `src/templates/codex/modscape-spec-design/SKILL.md`
  - `src/templates/codex/modscape-codegen/SKILL.md`
  - `src/templates/codex/modscape-modeling/SKILL.md`

## Phase 9: ドキュメント

- [x] **T33** `CLAUDE.md` — YAML Model Format セクションをv2に全面更新

- [x] **T34** `README.md` — YAMLスキーマリファレンスをv2に更新

- [x] **T35** `README.ja.md` — 同上（日本語版）

- [x] **T36** `CHANGELOG.md` — v3.0.0エントリ追加（破壊的変更の詳細を記載）

## Phase 10: テスト

### ユニットテスト: パーサー（`visualizer/src/lib/parser.test.ts`）

- [x] **T37** v2 YAMLの正常パース
  - `version: "2.0.0"` のYAMLが正しくパースされること
  - `conceptual` / `logical` / `physical` / `display` の各フィールドが正しく読み取られること
  - `annotation.target: { id, type }` が正しく読み取られること

- [x] **T38** v1 YAMLのエラー検出
  - `version: "1.0.0"` のYAMLを渡したらエラーが返ること
  - `version` 未指定のYAMLを渡したらエラーが返ること
  - エラーメッセージに `modscape migrate` の実行を示す文言が含まれること

- [x] **T39** v2 正規化ロジック
  - `annotation.target` が省略された場合に `undefined` として扱われること
  - `layout` に `parentId` が含まれていても無視されること（後方互換のため警告は出してよい）
  - `column.physical` が省略された場合に `undefined` として扱われること

### ユニットテスト: マイグレーション（新規: `tests/migrate.test.mjs`）

- [x] **T40** `migrateV1toV2` — テーブルフィールドの変換
  - `name` → `conceptual.name`
  - `logical_name` → `logical.name`
  - `physical_name` → `physical.name`
  - `appearance.type` → `conceptual.kind`
  - `appearance.icon` / `appearance.color` → `display.icon` / `display.color`
  - `appearance.scd` → `logical.scd.type`

- [x] **T41** `migrateV1toV2` — implementation の分割
  - `implementation.grain` → `logical.grain`
  - `implementation.materialization` → `physical.strategy`
  - `implementation.incremental_strategy` → `physical.update_mode`（`delete+insert` → `delete_insert`）
  - `implementation.unique_key` → `physical.merge_key`
  - `implementation.partition_by` → `physical.partition`
  - `implementation.cluster_by` → `physical.cluster`
  - `implementation.incremental_key` → `physical.filter_key`
  - `implementation.incremental_lookback` → `physical.lookback`
  - `implementation.measures` は消去されること

- [x] **T42** `migrateV1toV2` — SCD統合
  - `appearance.scd: type2` + `implementation.scd2: { business_key, valid_from, valid_to }` が `logical.scd` に統合されること
  - `appearance.scd` のみ存在する場合: `logical.scd.type` のみ設定されること
  - `implementation.scd2` のみ存在する場合: `logical.scd` に全フィールドが設定されること

- [x] **T43** `migrateV1toV2` — カラムのフラット化
  - `column.logical.name` → `column.name`
  - `column.logical.type` → `column.type`
  - `column.logical.isPrimaryKey` → `column.isPrimaryKey`
  - `column.logical.isForeignKey` → `column.isForeignKey`
  - `column.logical.isPartitionKey` → `column.isPartitionKey`
  - `column.logical.additivity` → `column.additivity`
  - `column.logical.description` → `column.description`
  - `column.physical` はそのまま保持されること

- [x] **T44** `migrateV1toV2` — その他
  - `conceptual.tags` → `metadata.tags`（既存 metadata があればマージ）
  - `domains.color` → `domains.display.color`
  - `consumers.appearance` → `consumers.display`
  - `annotation.targetId` + `annotation.targetType` → `annotation.target: { id, type }`
  - `annotation.type`（sticky/callout）は消去されること
  - `annotation.color` → `annotation.display.color`
  - `layout[id].parentId` は消去されること

- [x] **T45** `migrateV1toV2` — エッジケース
  - `appearance` が省略されたテーブルでもエラーにならないこと
  - `implementation` が省略されたテーブルでもエラーにならないこと
  - `columns` が空のテーブルでもエラーにならないこと
  - `logical` / `physical` が空オブジェクトにならず `undefined` になること（不要なキーを生やさない）

- [x] **T46** バージョンチェーンの動作
  - v1ファイルを `migrateToLatest()` に渡すと v2 になること
  - すでに v2 のファイルを `migrateToLatest()` に渡しても変更されないこと
  - 変換後の `version` フィールドが `"2.0.0"` になること

- [x] **T47** `modscape migrate` CLIコマンド
  - v1サンプルファイルに対して実行すると v2 YAMLが生成されること
  - `--dry-run` で実際のファイルが変更されないこと
  - `--out` で指定ファイルに出力されること
  - `.bak` バックアップが作成されること
  - すでに v2 のファイルに対して実行するとスキップされること（またはメッセージを出すこと）

### ユニットテスト: cytoscapeElements（`visualizer/src/lib/cytoscapeElements.test.ts`）

- [x] **T48** v2フィールドでノードが正しく生成されること
  - `conceptual.kind` がノードのクラス/スタイルに反映されること
  - `display.color` / `display.icon` がノードデータに反映されること
  - `domain.display.color` がドメインノードに反映されること
  - `annotation.target.id` でアノテーションの接続先が解決されること

### E2Eテスト（`tests/`）

- [x] **T49** fixtures のv2スキーマ対応
  - `tests/fixtures/test-model.yaml` を v2 スキーマに更新
  - 各 spec ファイルが参照する fixture を v2 に対応

- [x] **T50** v2 YAMLの基本表示テスト（`tests/comprehensive.spec.ts`）
  - v2 YAMLを読み込んだ時にテーブルノードが正しく表示されること
  - `conceptual.kind: fact` のテーブルが fact スタイルで表示されること
  - `display.icon` / `display.color` が正しく反映されること

- [~] **T51** DetailPanel の v2 タブ表示テスト（スキップ: E2Eでの実装コストが高いためロジックテストで代替）
  - `conceptual` / `logical` / `physical` / `sample` / `metadata` タブが存在すること
  - `implementation` タブが存在しないこと
  - 各タブで正しいフィールドが編集できること

- [x] **T52** v1 YAMLを読み込んだ時のエラー表示テスト
  - エラーメッセージが UI に表示されること
  - `modscape migrate` の実行を促すメッセージが含まれること

### ビルド・スナップショット

- [x] **T53** `npm run build-ui` — ビルドが通ることを確認

- [ ] **T54** `npm run test:update` — E2Eスナップショットを更新・コミット
