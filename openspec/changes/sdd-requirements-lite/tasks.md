## 1. Claude版スキルの実装

- [x] 1.1 `src/templates/claude/spec/requirements-lite.md` を新規作成する
- [x] 1.2 スキルの冒頭にライト / フル SDD の使い分けガイドを記載する
- [x] 1.3 変更内容収集（対象テーブル・変更種別・理由）のステップを実装する
- [x] 1.4 `modscape spec new` → `modscape extract` → mutations 適用のフローを実装する
- [x] 1.5 `spec.md`（Background のみ）の生成ロジックを実装する
- [x] 1.6 `design.md`（mutations サマリ・Affected Tables）の生成ロジックを実装する
- [x] 1.7 `design/<id>.md`（カラム一覧・基本情報のみ）の生成ロジックを実装する
- [x] 1.8 `tasks.md`（1フェーズ・最小限）の自動生成ロジックを実装する
- [x] 1.9 `modscape spec set-phase <name> tasks` を実行してフェーズをセットする
- [x] 1.10 完了後に `/modscape:spec:implement <name>` への誘導メッセージを実装する

## 2. Gemini版・Codex版スキルの実装

- [x] 2.1 `src/templates/gemini/modscape-spec-requirements-lite/SKILL.md` を新規作成する（Claude版と同等の動作）
- [x] 2.2 `src/templates/codex/modscape-spec-requirements-lite/SKILL.md` を新規作成する（Claude版と同等の動作）

## 3. インストール登録

- [x] 3.1 `src/template-files.js` の `SPEC_SKILL_NAMES` に `requirements-lite` を追加する
- [x] 3.2 `AGENTS.md` の SDD スキルリストに `requirements-lite` を追加する

## 4. 動作確認

- [x] 4.1 サンプルモデルで `/modscape:spec:requirements-lite` を実行し、全ファイルが生成されることを確認する
- [x] 4.2 生成後に `/modscape:spec:implement` が追加入力なしに動作することを確認する
- [x] 4.3 `modscape spec list` に生成した変更が表示されることを確認する
- [x] 4.4 `npm run build-ui` が成功することを確認する
