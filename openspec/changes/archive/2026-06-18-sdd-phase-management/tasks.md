## 1. CLI — spec-config.yaml への phase フィールド対応

- [x] 1.1 `src/spec.js` の `specList` 関数で `spec-config.yaml` の `phase` を読み取り、出力に含める
- [x] 1.2 `modscape spec list` のテキスト出力に `[<phase>]` を追加する（未設定は `-`）
- [x] 1.3 `modscape spec list --json` の各エントリに `phase` フィールドを追加する

## 2. CLI — modscape spec get コマンド

- [x] 2.1 `src/spec.js` に `specGet(name, opts)` 関数を追加する（phase / title / taskProgress / openQuestions / files を返す）
- [x] 2.2 `src/index.js` に `modscape spec get <name> [--json]` のルーティングを追加する
- [x] 2.3 `spec-config.yaml` に `phase` がない場合は `phase: null` を返すフォールバック処理を実装する

## 3. CLI — modscape spec set-phase コマンド

- [x] 3.1 `src/spec.js` に `specSetPhase(name, phase)` 関数を追加する（有効値: requirements / design / tasks / implement / done）
- [x] 3.2 無効なフェーズ値を渡した場合のバリデーションとエラーメッセージを実装する
- [x] 3.3 `src/index.js` に `modscape spec set-phase <name> <phase>` のルーティングを追加する

## 4. スキル更新 — claude プラットフォーム

- [x] 4.1 `src/templates/claude/spec/requirements.md` — 完了時に `modscape spec set-phase <name> requirements` を呼ぶ手順を追加する
- [x] 4.2 `src/templates/claude/spec/design.md` — 完了時に `modscape spec set-phase <name> design` を呼ぶ手順を追加する
- [x] 4.3 `src/templates/claude/spec/tasks.md` — 完了時に `modscape spec set-phase <name> tasks` を呼ぶ手順を追加する
- [x] 4.4 `src/templates/claude/spec/implement.md` — 初回実行時に `modscape spec set-phase <name> implement` を呼ぶ手順を追加する
- [x] 4.5 `src/templates/claude/spec/archive.md` — 完了時に `modscape spec set-phase <name> done` を呼ぶ手順を追加する
- [x] 4.6 `src/templates/claude/spec/answer.md` — Step 7 を `modscape spec get` でフェーズ取得し、フェーズに応じた Next step 案内に書き換える
- [x] 4.7 `src/templates/claude/spec/status.md` — `modscape spec get <name> --json` でフェーズ取得するよう Step 4 を書き換える（phase: null 時のフォールバック維持）

## 5. スキル更新 — gemini プラットフォーム

- [x] 5.1 `src/templates/gemini/modscape-spec-requirements/SKILL.md` — 4.1 相当
- [x] 5.2 `src/templates/gemini/modscape-spec-design/SKILL.md` — 4.2 相当
- [x] 5.3 `src/templates/gemini/modscape-spec-tasks/SKILL.md` — 4.3 相当
- [x] 5.4 `src/templates/gemini/modscape-spec-implement/SKILL.md` — 4.4 相当
- [x] 5.5 `src/templates/gemini/modscape-spec-archive/SKILL.md` — 4.5 相当
- [x] 5.6 `src/templates/gemini/modscape-spec-answer/SKILL.md` — 4.6 相当
- [x] 5.7 `src/templates/gemini/modscape-spec-status/SKILL.md` — 4.7 相当

## 6. スキル更新 — codex プラットフォーム

- [x] 6.1 `src/templates/codex/modscape-spec-requirements/SKILL.md` — 4.1 相当
- [x] 6.2 `src/templates/codex/modscape-spec-design/SKILL.md` — 4.2 相当
- [x] 6.3 `src/templates/codex/modscape-spec-tasks/SKILL.md` — 4.3 相当
- [x] 6.4 `src/templates/codex/modscape-spec-implement/SKILL.md` — 4.4 相当
- [x] 6.5 `src/templates/codex/modscape-spec-archive/SKILL.md` — 4.5 相当
- [x] 6.6 `src/templates/codex/modscape-spec-answer/SKILL.md` — 4.6 相当
- [x] 6.7 `src/templates/codex/modscape-spec-status/SKILL.md` — 4.7 相当

## 7. テンプレート・フォーマット更新

- [x] 7.1 `src/templates/formats/spec-format.md` から `> **Status:** \`requirements\`` 行を削除する
- [x] 7.2 `npm run build` でビルドエラーがないことを確認する
