## Why

カラム追加・テーブルリネームといった軽微なスキーマ変更に対し、フルSDD（requirements → design → tasks）はオーバーエンジニアリングになるケースがある。作り手が「これはライトで十分」と判断した変更を、1スキルで素早く着手できる入口が必要。

## What Changes

- 新スキル `/modscape:spec:requirements-lite` を追加（Claude / Gemini / Codex の3エージェント版）
- フル SDD の requirements → design → tasks を1スキルで圧縮して実行する
- 生成されるフォルダ構成・ファイル構成はフル SDD と同一だが、各ファイルの内容が簡素
  - `spec.md`: インタビューなし・AC なし・ビジネスコンテキスト深掘りなし（what / why のみ）
  - `design.md`: downstream 分析なし・per-table 詳細分析なし（mutations サマリのみ）
  - `design/<id>.md`: カラム一覧と基本情報のみ
  - `tasks.md`: 1フェーズのシンプルな構成
  - `spec-model.yaml` / `spec-config.yaml`: フル SDD と同様に生成
- その後の `/modscape:spec:implement` → `/modscape:spec:archive` は既存スキルをそのまま使用（変更なし）

## Capabilities

### New Capabilities

- `sdd-requirements-lite`: フル SDD の requirements・design・tasks を1スキルで圧縮して実行する軽量版スタートスキル。対象は作り手がライトと判断した軽微なスキーマ変更（カラム追加・テーブルリネーム・型変更など）。

### Modified Capabilities

（なし）

## Impact

- `src/templates/claude/spec/requirements-lite.md` を新規追加
- `src/templates/gemini/modscape-spec-requirements-lite/SKILL.md` を新規追加
- `src/templates/codex/modscape-spec-requirements-lite/SKILL.md` を新規追加
- `src/template-files.js` の `SPEC_SKILL_NAMES` に `requirements-lite` を追加
- `AGENTS.md` の SDD スキルリストを更新
