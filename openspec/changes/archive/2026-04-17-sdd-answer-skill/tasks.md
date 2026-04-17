## 1. CLI の削除

- [x] 1.1 `src/index.js` から `import { answerQuestion, resolveChangeName } from './operations/questions.js'` を削除する
- [x] 1.2 `src/index.js` から `specCommand.command('answer')` ブロック全体を削除する
- [x] 1.3 `src/operations/questions.js` を削除する

## 2. /modscape:spec:answer スキル（新規）

- [x] 2.1 `src/templates/claude/spec/answer.md` を新規作成する（Q-NNN 表示 → 回答受付 → 追加ヒアリング → questions.md 記録 → 設計影響判断）
- [x] 2.2 `src/templates/gemini/modscape-spec-answer/SKILL.md` を新規作成する（Claude 版から Gemini 形式に変換）
- [x] 2.3 `src/templates/codex/modscape-spec-answer/SKILL.md` を新規作成する（Claude 版から Codex 形式に変換）

## 3. ドキュメント・リリース

- [x] 3.1 `CHANGELOG.md` に変更エントリを追加する
