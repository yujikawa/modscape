## Why

`_glossary.yaml` の `terms[].tables` と `_questions.yaml` の `questions[].table` はエンティティIDへの参照フィールドだが、名前が「テーブル限定」に見える。将来リレーション・ドメイン・メトリクス等にも参照先が広がることを考慮し、汎用的な `ids` に統一する。あわせて `_context.yaml` の `decisions` にはエンティティ参照が存在しないため、archiveスキルがAffected Tablesから自動付与できるよう `ids` フィールドを追加する。これにより `modscape export --format osi` 等でのコンテキスト統合（どのエンティティにどの決定・用語・Q&Aが紐づくか）が明示的になる。

## What Changes

- **BREAKING** `_glossary.yaml` の `terms[].tables` フィールドを `ids` にリネーム
- **BREAKING** `_questions.yaml` の `questions[].table`（単数・テーブル限定）を `ids`（複数・任意エンティティ）にリネーム
- `_context.yaml` の `decisions[]` に任意フィールド `ids` を追加（影響エンティティIDのリスト）
- archiveスキル（claude / codex / gemini）のStep 5を更新：decisionsへの `ids` 書き込みをStep 2のAffected Tablesから自動付与
- archiveスキルの glossary パース記述を `tables` → `ids` に更新
- `src/export.js` の `loadContext` でのフィールド名読み取りを対応
- 既存サンプル・フィクスチャファイルのフィールド名移行

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `glossary-yaml-schema`: `terms[].tables` → `ids` へのフィールドリネーム（BREAKING）
- `questions-yaml-schema`: `questions[].table` → `ids` へのフィールドリネーム（BREAKING）
- `context-yaml-schema`: `decisions[].ids` フィールド追加（任意）
- `sdd-archive`: archiveスキルがdecisions書き込み時に `ids` を付与するよう更新（claude / codex / gemini 3プラットフォーム）
- `context-export-cli`: `loadContext` が `ids` フィールドを読むよう対応

## Impact

- `src/export.js` — `loadContext` の glossary / questions フィールド参照
- `src/templates/claude/spec/archive.md` — glossaryパース記述・Step 5
- `src/templates/codex/modscape-spec-archive/SKILL.md` — 同上
- `src/templates/gemini/modscape-spec-archive/SKILL.md` — 同上
- `.modscape/specs/_glossary.yaml` — 既存データのフィールド名移行
- `.modscape/specs/_questions.yaml` — 既存データのフィールド名移行
- `tests/fixtures/` — 該当フィールドを持つフィクスチャの更新
- `samples/` — 該当フィールドを持つサンプルの確認・更新
