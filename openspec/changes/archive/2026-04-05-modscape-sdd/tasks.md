## 1. スキルテンプレートの作成

- [x] 1.1 `src/templates/claude/sdd/requirements.md` を新規作成する（`/modscape:sdd:requirements` スキル）
- [x] 1.2 `src/templates/claude/sdd/design.md` を新規作成する（`/modscape:sdd:design` スキル）
- [x] 1.3 `src/templates/claude/sdd/tasks.md` を新規作成する（`/modscape:sdd:tasks` スキル）
- [x] 1.4 `src/templates/claude/sdd/implement.md` を新規作成する（`/modscape:sdd:implement` スキル）
- [x] 1.5 `src/templates/claude/sdd/sdd.custom.md.example` を新規作成する（カスタマイズ例）

## 2. CLI の拡張（src/init.js）

- [x] 2.1 `init` コマンドに `--sdd` フラグを追加する
- [x] 2.2 `--claude --sdd` の組み合わせで `.modscape/claude/sdd/` 配下の4スキルファイルを生成する処理を実装する
- [x] 2.3 `--sdd` を `--gemini` / `--codex` と組み合わせた場合に「Claude Code のみ対応」メッセージを表示する処理を追加する
- [x] 2.4 `sdd.custom.md.example` を `.modscape/sdd/` に生成する処理を追加する

## 3. ドキュメントの更新

- [x] 3.1 `README.md` に SDD ワークフローのセクション（4ステップの説明、スキル一覧）を追加する
- [x] 3.2 `README.ja.md` に同内容を日本語で追加する
- [x] 3.3 `src/templates/rules.md` の Section 13（CLI Flag Reference）に `--sdd` フラグを追記する
- [x] 3.4 `CHANGELOG.md` にエントリを追加する

## 4. サンプルシナリオの作成

- [x] 4.1 `samples/sdd-sample/` ディレクトリを作成する
- [x] 4.2 `samples/sdd-sample/spec.md` を作成する（通し確認用のサンプル要件書）
- [x] 4.3 `samples/sdd-sample/model.yaml` を作成する（spec.md に対応するサンプルモデル）
- [x] 4.4 `samples/sdd-sample/tasks.md` を作成する（model.yaml から生成した期待タスク一覧）
