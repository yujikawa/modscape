## 1. 変換モジュールの実装

- [x] 1.1 `src/export-osi.js` を新規作成し、モジュール冒頭に `OSI_VERSION` 定数を宣言する（初期値: `"0.2.0.dev0"`）
- [x] 1.2 `exportOsi(inputPath, options)` 関数のスケルトンを作る
- [x] 1.3 imports の解決ロジックを実装する（既存の model-utils の imports 解決を再利用）
- [x] 1.4 `tables[]` → `datasets[]` のマッピングを実装する（name, source, description）
- [x] 1.5 `columns[]` → `fields[]` のマッピングを実装する（name, expression.ANSI_SQL）
- [x] 1.6 `isPrimaryKey: true` のカラムを `datasets[].primary_key[]` に収集する
- [x] 1.7 `relationships[]` → OSI `relationships[]` のマッピングを実装する
- [x] 1.8 `metrics[]` → OSI `metrics[]` のマッピングを実装する（expression.ANSI_SQL に固定）
- [x] 1.9 `conceptual.kind` と domain を `custom_extensions.modscape` に保存する
- [x] 1.10 OSI YAML を `js-yaml` で文字列化し、出力ファイルに書き込む

## 2. CLI への組み込み

- [x] 2.1 `src/export.js` に `--format osi` オプションを追加し、`export-osi.js` に委譲する
- [x] 2.2 `--output` オプションで出力先ファイルパスを指定できるようにする
- [x] 2.3 デフォルト出力名を `<input-basename>.osi.yaml` にする
- [x] 2.4 `src/index.js` のコマンド定義に `export` コマンドの `--format` オプションを追記する

## 3. テスト

- [x] 3.1 `samples/1-retail-analytics.yaml` を変換した期待出力 fixture を作成する
- [x] 3.2 Playwright の CLI テスト（`tests/export-osi.spec.ts`）を作成し、基本的な変換結果を検証する
- [x] 3.3 imports を含むモデル（`1-retail-analytics.yaml` + `2-conformed-dims.yaml`）の変換をテストする

## 4. ドキュメント

- [x] 4.1 `README.md` に `modscape export --format osi` の使い方とユースケースを追記する
