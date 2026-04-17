## Why

modscape:spec の SDD ワークフローは `design → implement → archive` の各ステップ間に確認の停留点がなく、設計の仮定や未解決質問を抱えたまま実装に突入したり、誤った設計のまま本番 YAML へのマージを実行できてしまう。取り消しが難しいミスを事前に防ぐ仕組みと、受け入れ条件（Acceptance Criteria）が実際にテストで検証されたかを追跡する仕組みが必要である。

## What Changes

- **`/modscape:spec:review` スキルの追加（独立コマンド）**: 現在の change の未解決質問・仮定・下流分類の確信度・AC カバレッジを一覧表示し、実装前の go/no-go 判断を支援する。
- **`/modscape:spec:design` の末尾に review サマリーを埋め込む**: design 完了時に自動で同内容のサマリーを表示し、`implement` と `review` 両方への導線を示す。
- **受け入れ条件（AC）と Phase 4 テストの紐付け**: `spec.md` の Acceptance Criteria に `AC-NNN` ID を付与し、`tasks.md` の Phase 4 テストタスクと対応させる。archive 時に「何件の AC がテストでカバーされたか」をサマリーに含める。
- **`/modscape:spec:archive` に dry-run ステップを追加**: 本番 YAML へのマージ前に ID 単位の変更サマリー（追加・更新・変更なし）を表示し、ユーザーの確認を得てからマージを実行する。

## Capabilities

### New Capabilities

- `sdd-review`: `/modscape:spec:review <name>` スキル。未解決質問・仮定・AC カバレッジ・下流分類確信度を集約して表示し、go/no-go を判断させる。design の末尾でも同内容を自動出力する。

### Modified Capabilities

- `sdd-design`: design ステップの末尾に review サマリーを埋め込み、次ステップとして `implement` と `review` の両方を案内するよう変更する。
- `sdd-requirements`: Acceptance Criteria に `AC-NNN` ID の付与を必須化する。
- `sdd-archive`: 本番 YAML へのマージ前に ID 単位の dry-run サマリーを表示し、確認を取ってからマージするステップを追加する。

## Impact

- `src/templates/claude/spec/review.md` — 新規スキルファイル
- `src/templates/claude/spec/design.md` — 末尾の Next Step セクションに review サマリー出力を追加
- `src/templates/claude/spec/requirements.md` — AC-NNN ID の付与ルールを追加
- `src/templates/claude/spec/archive.md` — dry-run ステップを追加
- `src/templates/gemini/modscape-spec-review/SKILL.md` — 新規
- `src/templates/gemini/modscape-spec-design/SKILL.md` — 同期
- `src/templates/gemini/modscape-spec-requirements/SKILL.md` — 同期
- `src/templates/gemini/modscape-spec-archive/SKILL.md` — 同期
- `src/templates/codex/` — 同上
- `CHANGELOG.md` — エントリ追加
