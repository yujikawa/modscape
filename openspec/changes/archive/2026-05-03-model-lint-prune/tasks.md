## 1. modscape lint の実装

- [x] 1.1 `src/lint.js` を新規作成し、`lintModel(filePath, rulesPath)` 関数を実装する（`readYaml` / `resolveImports` を利用）
- [x] 1.2 デフォルトルールセットを定義する（全ルールを `severity: warn` で適用）
- [x] 1.3 `require-description` ルールを実装する（`target: tables|columns|all` オプション対応）
- [x] 1.4 `require-primary-key` ルールを実装する
- [x] 1.5 `require-physical-name` ルールを実装する（`kinds` オプション対応）
- [x] 1.6 `require-column-type` ルールを実装する
- [x] 1.7 `require-tags` ルールを実装する（`kinds` オプション対応）
- [x] 1.8 `no-orphan-references` ルールを実装する（relationship/lineage/domains.members/layout を対象）
- [x] 1.9 `incremental-requires-merge-key` ルールを実装する
- [x] 1.10 `.modscape/lint-rules.yaml` の読み込みと設定マージ処理を実装する（ファイルなし時はデフォルトルールセット使用）
- [x] 1.11 CLIエントリを実装する（テキスト出力・`--json`・`--rules` オプション、exitコード制御）

## 2. modscape prune の実装

- [x] 2.1 `src/prune.js` を新規作成し、`pruneModel(filePath, options)` 関数を実装する（`resolveImports` でインポート解決してからチェック）
- [x] 2.2 参照切れ relationship（from.table / to.table）の検出を実装する
- [x] 2.3 参照切れ lineage（from / to）の検出を実装する
- [x] 2.4 参照切れ layout エントリの検出を実装する
- [x] 2.5 参照切れ domain.members エントリの検出を実装する
- [x] 2.6 `--include-isolated` フラグ時の孤立テーブル検出を実装する
- [x] 2.7 `--write` フラグ時のYAML書き込み処理を実装する（`writeYaml` を利用）
- [x] 2.8 CLIエントリを実装する（dry-runテキスト出力・`--write`・`--json`・`--include-isolated` オプション）

## 3. コマンド登録とドキュメント更新

- [x] 3.1 `src/index.js` に `lint` コマンドを登録する
- [x] 3.2 `src/index.js` に `prune` コマンドを登録する
- [x] 3.3 `README.md` の CLIリファレンスセクションに `lint` / `prune` コマンドを追記する
- [x] 3.4 `README.ja.md` に同様の追記を行う
- [x] 3.5 `src/templates/rules.md` のSection 12に `lint` / `prune` のフラグリファレンスを追記する
- [x] 3.6 `CHANGELOG.md` にv3.3.0エントリを追加する

## 4. 動作確認

- [x] 4.1 サンプルモデル（`samples/` 配下）に対して `modscape lint` を実行し、出力を確認する
- [x] 4.2 サンプルモデルに対して `modscape prune` を実行し、dry-run出力を確認する
- [x] 4.3 `--json` オプションの出力がパース可能なJSONであることを確認する
- [x] 4.4 `imports:` を含むモデルに対して lint / prune が正しく動作することを確認する
