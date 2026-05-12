## 1. HTMLテンプレート カラースキーム書き換え

- [x] 1.1 `src/templates/spec/html/spec-template.html` の全カラー定義をライトグレーベースに書き換える（body: #f8f9fa、card: #ffffff、text: #334155 等）
- [x] 1.2 `src/templates/spec/html/design-template.html` の全カラー定義をライトグレーベースに書き換える
- [x] 1.3 `src/templates/spec/html/tasks-template.html` の全カラー定義をライトグレーベースに書き換える
- [x] 1.4 `src/templates/spec/html/questions-template.html` の全カラー定義をライトグレーベースに書き換える
- [x] 1.5 `src/templates/spec/html/table-spec-template.html` の全カラー定義をライトグレーベースに書き換える

## 2. spec.js のLIGHT_MODE_CSS削除

- [x] 2.1 `src/spec.js` の `LIGHT_MODE_CSS` 定数を削除する
- [x] 2.2 `src/spec.js` の `/api/spec/:file` エンドポイントから `?theme=light` による CSS 注入ロジック（`if (req.query.theme === 'light')` ブロック）を削除する

## 3. check.md HTML mode 対応

- [x] 3.1 `src/templates/claude/spec/check.md` のセクションD-1「未解決Q&Aの検出」に HTMLモード時の代替パターンを追加する（`- [ ]` → `class="q-item open"` 相当の要素）
- [x] 3.2 `src/templates/claude/spec/check.md` のPart2「Unresolved questions カウント」に HTMLモード時の代替パターンを追加する
- [x] 3.3 `src/templates/claude/spec/check.md` のPart2「Assumptions 検索」に HTMLモード時の代替パターンを追加する（`**仮定:**` / `**Assumption:**` → HTML内のデータ属性またはテキストパターン）
- [x] 3.4 `src/templates/claude/spec/check.md` のPart2「AC Coverage 抽出」に HTMLモード時のHTML構造ベース抽出指示を追加する（`<span class="ac-id">` からのAC-NNN抽出）

## 4. generate.md HTML mode 対応

- [x] 4.1 `src/templates/claude/spec/generate.md` の Step 4 に `output_format: html` 検出ロジックを追加する
- [x] 4.2 `src/templates/claude/spec/generate.md` の HTML mode 時の出力先パスを `.modscape/specs/<model-slug>/<table-id>.html` とし、`table-spec-template.html` テンプレートを使用する旨を記述する

## 5. note.md HTML mode 対応

- [x] 5.1 `src/templates/claude/spec/note.md` の Step 1（またはsetup）に `output_format: html` の検出とファイル拡張子の切り替えを追加する
- [x] 5.2 `src/templates/claude/spec/note.md` の Step 3「spec ファイル存在確認」を HTML mode 時は `.html` 拡張子で確認するよう修正する
- [x] 5.3 `src/templates/claude/spec/note.md` の Step 6「ファイル読み書き」を HTML mode 時は `.html` ファイルを対象にし、HTMLセクション構造（`<h2>` 要素など）でセクション検索する旨を追記する
