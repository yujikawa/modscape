## Why

`/modscape:spec:generate` により `specs/<table-id>/spec.md` を生成できるようになったが、生成後にspecを更新するコマンドが存在しない。対面での会話やSlackのやり取りで得た知識（ビジネスルール、注意点、背景など）を「忘れないうちに」specに書き留めたいケースは頻繁に発生するが、現状はSDD実装ワークフロー内の `amend`（`changes/<name>/` を対象）しかなく、ワークフロー外での軽量な知識キャプチャ手段がない。

## What Changes

- `/modscape:spec:note [table-id]` スキルを新規追加する（Claude / Gemini / Codex）
- テーブルID指定あり: 指定した `specs/<table-id>/spec.md` を更新する
- テーブルID指定なし: フリーテキストを解析し、対象テーブルを自動推定する
- いずれも更新内容を確認してからファイルに書き込む（confirm → write）
- SDD実装ワークフロー（requirements → design → implement）の **外側** に位置するメンテナンスコマンド

## Capabilities

### New Capabilities

- `sdd-note`: `specs/<table-id>/spec.md` に対して、フリーテキスト入力から知識をキャプチャ・追記するスキル。テーブル指定の有無に関わらず動作し、書き込み前に確認ステップを挟む。

### Modified Capabilities

（なし）

## Impact

- `src/templates/claude/spec/note.md` — 新規スキルファイル（Claude版、一次実装）
- `src/templates/gemini/modscape-spec-note/SKILL.md` — Gemini版（Claude版から同期）
- `src/templates/codex/modscape-spec-note/SKILL.md` — Codex版（Claude版から同期）
- `README.md` / `README.ja.md` — スキル一覧への追記
- `CHANGELOG.md` — 変更履歴への追記
