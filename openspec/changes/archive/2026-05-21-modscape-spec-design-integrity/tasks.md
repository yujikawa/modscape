## 1. implement スキルの修正（claude / codex / gemini）

- [x] 1.1 `src/templates/claude/spec/implement.md` に生成済みファイルへの直接編集禁止ルールを冒頭に追加する
- [x] 1.2 `src/templates/claude/spec/implement.md` の軽微な修正フローを「design.md 更新 → spec-model.yaml 更新 → ユーザーに提示 → タスク戻し確認 → SQL 再生成」の順序に改定する
- [x] 1.3 `src/templates/claude/spec/implement.md` のタスク戻し確認フォーマット（[y/N] プロンプト）を追加する
- [x] 1.4 `src/templates/codex/modscape-spec-implement/` の SKILL.md に同じ変更を反映する
- [x] 1.5 `src/templates/gemini/modscape-spec-implement/` の SKILL.md に同じ変更を反映する

## 2. spec.md フォーマットのシンプル化（claude / codex / gemini）

- [x] 2.1 `src/templates/claude/spec/requirements.md`（または spec.md フォーマット定義ファイル）の生成フォーマットを Background + Acceptance Criteria のみに変更し、WHEN/THEN シナリオ・検証 SQL の記載禁止ルールを追加する
- [x] 2.2 `src/templates/codex/modscape-spec-requirements/` の SKILL.md に同じ変更を反映する
- [x] 2.3 `src/templates/gemini/modscape-spec-requirements/` の SKILL.md に同じ変更を反映する

## 3. design.md フォーマットへの Implementation Details セクション追加

- [x] 3.1 `src/templates/formats/design-format.md`（または相当ファイル）に `## Implementation Details` セクションを追加する（変換式・フィルター条件・検証SQL・テストパターンを記載するテーブル別セクション）
- [x] 3.2 `src/templates/claude/spec/design.md` の design.md 生成指示に `## Implementation Details` セクションへの記載ルールを追加する
- [x] 3.3 `src/templates/codex/modscape-spec-design/` の SKILL.md に同じ変更を反映する
- [x] 3.4 `src/templates/gemini/modscape-spec-design/` の SKILL.md に同じ変更を反映する

## 4. tasks.md マージ挙動の追加（design スキル内）

- [x] 4.1 `src/templates/claude/spec/design.md` の tasks.md 生成ロジックに「既存 [x] がある場合はマージ + 差分表示 + 確認」フローを追加する
- [x] 4.2 `src/templates/codex/modscape-spec-design/` の SKILL.md に同じ変更を反映する
- [x] 4.3 `src/templates/gemini/modscape-spec-design/` の SKILL.md に同じ変更を反映する

## 5. answer スキルへの design.md 更新ステップ追加（claude / codex / gemini）

- [x] 5.1 `src/templates/claude/spec/answer.md` に回答前の design.md 影響判断ステップと更新フローを追加する
- [x] 5.2 `src/templates/codex/modscape-spec-answer/` の SKILL.md に同じ変更を反映する
- [x] 5.3 `src/templates/gemini/modscape-spec-answer/` の SKILL.md に同じ変更を反映する

## 6. ビルド確認

- [x] 6.1 `npm run build-ui` でビルドが通ることを確認する
