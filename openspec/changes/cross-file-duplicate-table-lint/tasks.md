## 1. lint マルチファイル対応

- [x] 1.1 `src/lint.js` に `lintModels(filePaths[], opts)` 関数を追加する（単一ファイルの `lintModel` を内部で呼び出し、結果をマージする）
- [x] 1.2 CLI エントリポイント（`src/cli.js` 等）の `lint` コマンドを `<file|dir> [<file|dir>...]` を受け付けるよう変更し、ディレクトリ展開ロジックを追加する
- [x] 1.3 ディレクトリ内ファイルのフィルタリング実装（`version:` フィールドを持つ YAML のみモデル対象とする）

## 2. no-duplicate-table-ids ルール実装

- [x] 2.1 `lintModels` 内で全ファイルのテーブルIDを収集し、重複検出ロジックを実装する（`Map<tableId, filePath[]>` を構築）
- [x] 2.2 import 関係の解析ロジックを実装する（各ファイルの `imports[].from` + `imports[].ids` を読み取り、正当な参照かを判定する）
- [x] 2.3 重複が検出された場合に `no-duplicate-table-ids` warning を生成し、`files` フィールドに対象ファイルパスを含める
- [x] 2.4 `lint-rules.yaml` の `no-duplicate-table-ids` エントリでオン/オフを切り替えられるよう既存のルールロード処理に組み込む
- [x] 2.5 `--json` 出力の warnings 配列に `files` フィールドが含まれることを確認する

## 3. extract の重複警告実装

- [x] 3.1 `src/extract.js` の `tableMap.set(table.id, table)` 前に `tableMap.has(table.id)` チェックを追加する
- [x] 3.2 上書き発生時に `WARN: <id>  duplicate-table-id` を stderr に出力し、初出ファイルと上書きファイルを表示する

## 4. テスト追加

- [x] 4.1 `tests/` に複数ファイル lint のフィクスチャ YAML を追加する（重複あり・importで解消・重複なしの3パターン）
- [x] 4.2 `no-duplicate-table-ids` ルールの単体テストを追加する（重複検出・import除外・off設定）
- [x] 4.3 extract の重複 WARN 出力テストを追加する
- [x] 4.4 `npm run build-ui` でビルドが通ることを確認する
