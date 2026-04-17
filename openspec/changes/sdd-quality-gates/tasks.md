## 1. /modscape:spec:review スキル（新規）

- [ ] 1.1 `src/templates/claude/spec/review.md` を新規作成する（未解決質問・仮定・AC カバレッジ・下流分類確信度のサマリー表示）
- [ ] 1.2 `src/templates/gemini/modscape-spec-review/SKILL.md` を新規作成する（Claude 版から Gemini 形式に変換）
- [ ] 1.3 `src/templates/codex/modscape-spec-review/SKILL.md` を新規作成する（Claude 版から Codex 形式に変換）

## 2. /modscape:spec:requirements への AC-NNN 付与

- [ ] 2.1 `src/templates/claude/spec/requirements.md` に「Acceptance Criteria 収集時に AC-NNN ID を付与する」ルールを追加する
- [ ] 2.2 `spec.md` フォーマット例の Acceptance Criteria セクションを AC-NNN 形式に更新する
- [ ] 2.3 `src/templates/gemini/modscape-spec-requirements/SKILL.md` を同期する
- [ ] 2.4 `src/templates/codex/modscape-spec-requirements/SKILL.md` を同期する

## 3. /modscape:spec:design への review サマリー埋め込み + AC ↔ test 紐付け

- [ ] 3.1 `src/templates/claude/spec/design.md` の tasks.md 生成ロジックに「Phase 4 テストタスクへの `[→ AC-NNN]` / `[手動検証]` 付記」を追加する
- [ ] 3.2 `src/templates/claude/spec/design.md` の末尾 Next Step セクションを review サマリー出力 + `implement` / `review` 両案内に変更する
- [ ] 3.3 `src/templates/gemini/modscape-spec-design/SKILL.md` を同期する
- [ ] 3.4 `src/templates/codex/modscape-spec-design/SKILL.md` を同期する

## 4. /modscape:spec:archive への dry-run ステップ追加

- [ ] 4.1 `src/templates/claude/spec/archive.md` に「マージ前に ID 単位の dry-run サマリーを表示して確認を取る」ステップを追加する
- [ ] 4.2 `src/templates/claude/spec/archive.md` の archive 完了サマリーに AC カバレッジ（テスト紐付き / 手動検証 / 未カバー）を追加する
- [ ] 4.3 `src/templates/gemini/modscape-spec-archive/SKILL.md` を同期する
- [ ] 4.4 `src/templates/codex/modscape-spec-archive/SKILL.md` を同期する

## 5. ドキュメント・リリース

- [ ] 5.1 `CHANGELOG.md` に変更エントリを追加する
