## Why

SDD ワークフローで `spec-model.yaml` を積み上げて main model.yaml にマージする流れが確立されているが、「テーブルとカラムがどれだけドキュメント化されているか」を定量的に把握する手段がない。結果として、説明・型・主キー情報が欠けたまま本番 YAML に取り込まれるケースが生じる。カバレッジを測定・ゲート化することで、SDD ループを「品質を保証するループ」として完成させる。

## What Changes

- **新規 CLI コマンド `modscape coverage`** を追加する。任意の model YAML ファイルに対してテーブル・カラムのドキュメント充足率を算出し、`--min-coverage` オプションで閾値未満の場合 exit 1 を返す。CI/CD パイプラインでのゲートとしても利用できる。
- **`modscape:spec:check` スキル**の Part 2: Readiness に "Documentation Coverage" セクションを追加する。`modscape-spec.custom.md` に Coverage Policy が設定されている場合のみ実行され、`spec-model.yaml` の per-table カバレッジを表示して閾値未満テーブルを ⚠ フラグで示す。
- **`modscape:spec:archive` スキル**に coverage ゲートを追加する。`modscape validate` の直後に実行され、閾値未満なら警告を表示してユーザーが y/N で続行を判断する（ブロックではなく確認）。こちらも Coverage Policy が設定されている場合のみ動作する。
- **`modscape-spec.custom.md` テンプレート**に `## Coverage Policy` セクションを追加する。ここに最小カバレッジ閾値を記述すると check/archive が自動で読み取る。記述がなければ完全スキップ（既存プロジェクトへの影響ゼロ）。
- **UI の Model Stats タブ**に "Documentation Coverage" セクションを追加する。手動実行ボタンで算出するため、グラフ描画や操作感には一切影響しない。テーブルごとのカバレッジ内訳を表示し、クリックでキャンバス上の該当テーブルにフォーカスする。

## Capabilities

### New Capabilities

- `model-coverage-cli`: `modscape coverage <file> [--min-coverage N]` コマンドの仕様。カバレッジ計算ロジック・出力フォーマット・終了コードの定義。

### Modified Capabilities

- `model-stats-tab`: UI の Model Stats タブに手動実行の Documentation Coverage セクションを追加する要件変更。
- `sdd-archive`: Coverage Policy 設定時に archive の merge 前カバレッジゲートを実行する要件変更。
- `sdd-custom`: `modscape-spec.custom.md` テンプレートに Coverage Policy セクションを追加する要件変更。

## Impact

- **CLI**: `src/coverage.js`（新規）、`src/index.js`（コマンド登録）
- **Visualizer**: `visualizer/src/components/RightPanel/ModelStatsTab.tsx`
- **SDD スキルテンプレート**: `src/templates/claude/spec/check.md`、`src/templates/claude/spec/archive.md`
- **カスタムルールテンプレート**: `src/templates/modscape-spec.custom.md.example`
- Gemini・Codex 版スキルへの同期（後続タスク）
- 破壊的変更なし。Coverage Policy 未設定時は既存動作を完全に維持する。
