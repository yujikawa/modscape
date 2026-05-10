## 1. `/modscape:spec:save` スキルの新規作成

- [ ] 1.1 `src/templates/claude/spec/save.md` を新規作成する（会話から決定済み事項・未解決事項・次のアクション・メモを抽出して `session.md` に書き出す手順）
- [ ] 1.2 Gemini版 `src/templates/gemini/modscape-spec-save/SKILL.md` を作成する（フロントマター追加・コマンド参照を `@modscape-spec-save` 形式に変更）
- [ ] 1.3 Codex版 `src/templates/codex/modscape-spec-save/SKILL.md` を作成する（フロントマター + `## COMMAND: /modscape:spec:save` セクション追加）
- [ ] 1.4 `src/init.js` の `specSkillNames` に `save` を追加し、`modscape init --sdd` 時にコピーされるようにする

## 2. `/modscape:spec:status` の拡張

- [ ] 2.1 `src/templates/claude/spec/status.md` に `session.md` の読み込みと表示ロジックを追加する（日付・決定済み事項・未解決事項・次のアクション）
- [ ] 2.2 `src/templates/claude/spec/status.md` の「次のアクション」判定をルールベースに強化する（Findings → 未回答質問 → フェーズ順の優先度判定）
- [ ] 2.3 Gemini版 `status` スキルに同様の変更を反映する
- [ ] 2.4 Codex版 `status` スキルに同様の変更を反映する

## 3. 既存スキルへの save ヒント組み込み

- [ ] 3.1 `src/templates/claude/spec/requirements.md` の出力末尾に save ヒントを追加する
- [ ] 3.2 `src/templates/claude/spec/design.md` の出力末尾に save ヒントを追加する
- [ ] 3.3 `src/templates/claude/spec/implement.md` の出力末尾に save ヒントを追加する
- [ ] 3.4 `src/templates/claude/spec/amend.md` の出力末尾に save ヒントを追加する
- [ ] 3.5 Gemini版 `requirements`・`design`・`implement`・`amend` スキルに同様の変更を反映する
- [ ] 3.6 Codex版 `requirements`・`design`・`implement`・`amend` スキルに同様の変更を反映する

## 4. ドキュメント・初期化テンプレートの更新

- [ ] 4.1 `README.md` の SDD コマンド一覧に `save` を追記する
- [ ] 4.2 `README.ja.md` に同様の追記を行う
- [ ] 4.3 `src/templates/claude/spec/help.md` のコマンド一覧に `save` を追加する
- [ ] 4.4 Gemini/Codex 版 `help` スキルにも同様の変更を反映する
- [ ] 4.5 `CHANGELOG.md` に v3.3.0 エントリとして追記する
