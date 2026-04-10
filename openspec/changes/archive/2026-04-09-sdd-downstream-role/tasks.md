## 1. design スキルの更新（Claude Code）

- [x] 1.1 `src/templates/claude/spec/design.md` の Affected Tables セクションで Downstream Impact を `### Downstream Impact — Implement` と `### Downstream Impact — Context Only` に分割する
- [x] 1.2 AI分類ロジックを design.md に追記する（変更カラムを参照→Implement、参照のみ→Context Only、カラム情報なし→Context Only + コメント）
- [x] 1.3 `design.md` の冒頭に「この Affected Tables 分類は AI の提案です。内容が異なる場合は直接編集してください」という注記を入れるよう指示を追加する

## 2. implement スキルの更新（Claude Code）

- [x] 2.1 `src/templates/claude/spec/implement.md` に `design.md` 読み込みステップを追加する
- [x] 2.2 `### Downstream Impact — Context Only` セクションからテーブル ID をスキップリストとして抽出するロジックを追加する
- [x] 2.3 スキップ時に「⏭️ Skipping `<id>` (Context Only)」と出力するよう記述する
- [x] 2.4 `design.md` が存在しない場合は全テーブルを実装対象とする後退互換の記述を追加する

## 3. archive スキルの更新（Claude Code）

- [x] 3.1 `src/templates/claude/spec/archive.md` に `design.md` 読み込みステップを追加する
- [x] 3.2 Direct Impact と `Downstream Impact — Implement` → フル spec sync の処理を明記する
- [x] 3.3 `Downstream Impact — Context Only` → Changelog のみ追記の処理を明記する
- [x] 3.4 `design.md` が存在しない場合は全テーブルをフル sync とする後退互換の記述を追加する

## 4. Gemini / Codex への同期

- [x] 4.1 `src/templates/gemini/modscape-spec-design/SKILL.md` に design スキルの変更を同期する
- [x] 4.2 `src/templates/gemini/modscape-spec-implement/SKILL.md` に implement スキルの変更を同期する
- [x] 4.3 `src/templates/gemini/modscape-spec-archive/SKILL.md` に archive スキルの変更を同期する
- [x] 4.4 `src/templates/codex/modscape-spec-design/SKILL.md` に design スキルの変更を同期する
- [x] 4.5 `src/templates/codex/modscape-spec-implement/SKILL.md` に implement スキルの変更を同期する
- [x] 4.6 `src/templates/codex/modscape-spec-archive/SKILL.md` に archive スキルの変更を同期する

## 5. 動作確認

- [x] 5.1 design スキルのサンプル実行で Affected Tables 分類が正しく出力されることを確認する
- [x] 5.2 implement スキルが Context Only テーブルをスキップすることを確認する
- [x] 5.3 archive スキルが Context Only テーブルに Changelog のみ追記することを確認する
