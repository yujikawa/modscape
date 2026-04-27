## 1. CLI コア実装 (`modscape coverage`)

- [x] 1.1 `src/coverage.js` を新規作成し、`calculateStats(schema)` 関数（テーブル数・リレーション数・リネージ数・孤立テーブル一覧）と `calculateCoverage(schema)` 関数（テーブル/カラム/総合カバレッジ）を実装する
- [x] 1.2 `calculateCoverage` に low_coverage_tables（per-table の充足率一覧）の算出を追加する
- [x] 1.3 `modscape coverage <file>` コマンドを `src/index.js` に登録し、人間向けテキスト出力を実装する
- [x] 1.4 `--min-coverage <N>` オプションを実装し、閾値未満で exit 1 を返す
- [x] 1.5 `--json` オプションを実装し、spec に定義されたスキーマで JSON を stdout に出力する
- [x] 1.6 カラムが0件・テーブルが0件のエッジケースを処理する

## 2. SDD カスタムルール統合

- [x] 2.1 `src/templates/modscape-spec.custom.md.example` に `## Coverage Policy` セクションのコメントアウト例を追加する
- [x] 2.2 `src/templates/claude/spec/check.md` の Part 2: Readiness に Documentation Coverage セクションを追加する（Coverage Policy 設定時のみ実行・`modscape coverage` を呼び出す）
- [x] 2.3 `src/templates/claude/spec/archive.md` の validate 直後に coverage ゲートを追加する（Coverage Policy 設定時のみ・y/N 確認フロー）
- [x] 2.4 Gemini 版スキル（`src/templates/gemini/`）に check・archive の変更を同期する
- [x] 2.5 Codex 版スキル（`src/templates/codex/`）に check・archive の変更を同期する

## 3. UI - Model Stats タブ拡張

- [x] 3.1 `visualizer/src/components/RightPanel/ModelStatsTab.tsx` に Documentation Coverage セクション（ボタン + 結果表示エリア）を追加する
- [x] 3.2 ボタンクリック時に `calculateCoverage` 相当のロジック（TypeScript）をフロントエンド側で実装する
- [x] 3.3 per-table カバレッジ一覧をカバレッジ昇順でソートして表示する
- [x] 3.4 テーブル行クリックでキャンバスフォーカス・DetailPanel を開く処理を接続する
- [x] 3.5 schema 更新検知時にカバレッジ結果をリセットしてボタンを再表示する
- [x] 3.6 `npm run build-ui` でビルドが通ることを確認する

## 4. ドキュメント更新

- [x] 4.1 `README.md` の CLI リファレンスに `modscape coverage` を追記する
- [x] 4.2 `README.ja.md` の CLI リファレンスに `modscape coverage` を追記する
- [x] 4.3 `src/templates/rules.md` の Section 12 に `modscape coverage` フラグリファレンスを追記する
- [x] 4.4 `CHANGELOG.md` に v3.2.0 エントリを追加する

## 5. テスト・スナップショット

- [x] 5.1 E2E テストで Model Stats タブの Documentation Coverage セクション表示を確認する
- [x] 5.2 `npm run test:update` でビジュアルスナップショットを更新してコミットする
