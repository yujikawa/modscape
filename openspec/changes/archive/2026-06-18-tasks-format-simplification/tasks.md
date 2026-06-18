## 1. tasks-format.md の更新

- [x] 1.1 `src/templates/formats/tasks-format.md` から `[<materialization>]` を削除する
- [x] 1.2 `src/templates/formats/tasks-format.md` から `← <upstream>` 記法を削除する
- [x] 1.3 `src/templates/formats/tasks-format.md` から `## Phase N: Tests` セクションを削除する
- [x] 1.4 Phase名プレースホルダーを `<domain-name>` 形式に変更する（ハードコードの Staging/Core/Mart を削除）

## 2. Claude スキルテンプレートの更新

- [x] 2.1 `src/templates/claude/spec/tasks.md` のステップ 6 をドメインベースのフェーズ決定ロジックに書き換える
- [x] 2.2 「Materialization type in brackets」の指示を削除する
- [x] 2.3 「Upstream dependencies with ← notation」の指示を削除する
- [x] 2.4 Phase 4: Tests の生成指示を削除する
- [x] 2.5 consumers を除外する指示を追加する

## 3. Codex スキルテンプレートの更新

- [x] 3.1 `src/templates/codex/modscape-spec-tasks/SKILL.md` を Claude テンプレートと同内容に合わせて更新する

## 4. Gemini スキルテンプレートの更新

- [x] 4.1 `src/templates/gemini/modscape-spec-tasks/SKILL.md` を Claude テンプレートと同内容に合わせて更新する

## 5. spec ファイルの更新

- [x] 5.1 `openspec/specs/sdd-tasks/spec.md` を本 change の delta spec で上書きする
