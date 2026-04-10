## 1. CLI — --with-downstream フラグの実装

- [x] 1.1 `src/index.js` の extract コマンドに `.option('--with-downstream', 'Recursively collect all downstream tables via lineage traversal')` を追加する
- [x] 1.2 `src/extract.js` の `extractModels()` に `options.withDownstream` を受け取る処理を追加する
- [x] 1.3 全入力YAMLの `lineage` セクションを読み込み、隣接リスト `Map<string, string[]>` としてグラフを構築する関数を実装する（複数ファイルをマージ）
- [x] 1.4 BFS で指定テーブルIDから全下流テーブルIDを収集する関数を実装する（訪問済みセットで循環ガード）
- [x] 1.5 循環が検出された場合に `⚠️ Circular lineage detected` を stderr に出力する処理を追加する
- [x] 1.6 収集した下流IDを `tableIds` に追加し、以降の既存抽出フローをそのまま通す

## 2. --record との連携

- [x] 2.1 `--with-downstream` 使用時、下流テーブルを実際に保持していたYAMLのパスを追跡し、`--record` 時に正しいソースエントリに記録されるよう修正する
- [x] 2.2 下流テーブルのソースYAMLが `spec-config.yaml` に未登録の場合、自動的に新エントリとして追加する

## 3. SDD design スキルの更新

- [x] 3.1 `src/templates/claude/spec/design.md` の手順6（初回抽出コマンド）を `--with-downstream` を使う形式に書き換える
- [x] 3.2 同手順の `design.md` Affected Tables の分類説明を「`--tables` 指定ID = Direct Impact、収集追加ID = Downstream Impact」に更新する
- [x] 3.3 `src/templates/gemini/modscape-spec-design/SKILL.md` に同内容を同期する（GeminiフォーマットでYAML frontmatter付き）
- [x] 3.4 `src/templates/codex/modscape-spec-design/SKILL.md` に同内容を同期する（Codexフォーマット）

## 4. 動作確認

- [x] 4.1 `samples/` 以下のサンプルYAMLを使って `modscape extract --with-downstream` が正しく下流テーブルを収集することを手動確認する
- [x] 4.2 複数YAML入力で下流テーブルが別ファイルに存在するケースを手動確認する
- [x] 4.3 `--with-downstream` なしの既存動作が変わっていないことを確認する
- [x] 4.4 `--record` で `spec-config.yaml` に下流テーブルのソースが正しく記録されることを確認する
