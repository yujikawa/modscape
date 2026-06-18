## Context

SDDワークフローの各スキルは現在、フェーズ（requirements / design / tasks / implement / done）を「どのファイルが存在するか」から推測している。しかし `modscape spec new` がすべてのファイルをスタブとして作成するため、ファイル存在チェックはどのフェーズでも同じ結果になり、判定が機能しない。

結果として `answer` スキルなどがフェーズを認識できず、常に「次は implement」と誤った案内をする。

## Goals / Non-Goals

**Goals:**
- `spec-config.yaml` に `phase:` フィールドを追加して、フェーズの単一の真実の源にする
- `modscape spec get <name>` CLI でフェーズ・進捗・質問数を一括取得できるようにする
- `modscape spec set-phase <name> <phase>` CLI でフェーズを安全に更新できるようにする
- `modscape spec list` にフェーズを表示する
- 各 SDD スキルが起動時・終了時に CLI 経由でフェーズを読み書きするよう更新する

**Non-Goals:**
- フェーズの自動検出・自動遷移（常に明示的なコマンド呼び出しが必要）
- UIへのフェーズ表示
- 複数フェーズの並行管理

## Decisions

### 1. フェーズを spec-config.yaml に持つ（新ファイルを作らない）

`spec-config.yaml` はすでに全スキルが認識しているファイルであり、YAMLなので機械読み取りしやすい。新たに `spec-state.yaml` を増やすと管理ファイルが増えてユーザーの負担になるため、既存ファイルへの追加を選択。

```yaml
phase: requirements   # ← 追加
main_yamls:
  - path: model.yaml
    tables: []
```

フェーズ値: `requirements` | `design` | `tasks` | `implement` | `done`

**却下した代替案:**
- `spec.md` の末尾に `> **Status:** \`requirements\`` を書く → スキルがMarkdownをパースして取得する必要があり信頼性が低い
- `spec-state.yaml` を新設 → ファイル数が増える

### 2. フェーズ操作は CLI コマンド経由（AIが直接YAMLを編集しない）

AIが直接 `spec-config.yaml` を編集するとインデントミスやフィールド破壊が起きる。CLI に集約することでバリデーションを一箇所に持てる。

**`modscape spec get <name> [--json]`** — フェーズ・進捗・質問数など全情報を返す
```json
{
  "name": "monthly-sales-summary",
  "phase": "design",
  "title": "Monthly Sales Summary",
  "taskProgress": { "done": 3, "total": 8 },
  "openQuestions": 2,
  "files": ["spec.md", "design.md", "tasks.md", "questions.md"]
}
```

**`modscape spec set-phase <name> <phase>`** — 有効なフェーズ値のみ受け付けてYAMLを更新
```bash
modscape spec set-phase monthly-sales design
# → spec-config.yaml の phase: を design に更新
```

### 3. 後方互換: phase 未設定の既存 spec はフォールバック動作

既存の `spec-config.yaml` に `phase` がない場合、`spec get` は `phase: null` を返す。スキル側は `phase` が `null` の場合のみ旧来のフォールバック（tasks.md の `[ ]` 数で判断）を使い、`phase` がある場合は必ずそちらを優先する。

### 4. 各スキルの責任

| スキル | 起動時 | 終了時 |
|---|---|---|
| requirements | — | `spec set-phase <name> requirements` |
| design | `spec get <name>` でフェーズ確認 | `spec set-phase <name> design` |
| tasks | `spec get <name>` でフェーズ確認 | `spec set-phase <name> tasks` |
| implement | `spec get <name>` でフェーズ確認 | `spec set-phase <name> implement` |
| answer | `spec get <name>` でフェーズ確認 → Step 7 の Next step をフェーズに基づいて変える | — |
| status | `spec get <name>` でフェーズ取得 → Priority ルールに使用 | — |
| archive | `spec get <name>` でフェーズ確認 | `spec set-phase <name> done` |

## Risks / Trade-offs

- **フェーズの手動ズレ**: スキルが `set-phase` を呼び忘れるとフェーズが古い状態のまま残る。ただしユーザーが `modscape spec list` で視覚的に確認できるため検出は容易。
  → Mitigation: 各スキルの SKILL.md の Next Step セクションに `set-phase` 呼び出しを明記し、忘れにくくする

- **既存プロジェクトの移行**: `phase` フィールドがない既存の `spec-config.yaml` はフォールバック動作。ユーザーが手動で `modscape spec set-phase <name> <phase>` を呼べばいつでも移行できる。

- **gemini / codex プラットフォームへの反映漏れ**: claude だけ直して他を忘れるリスク。
  → Mitigation: tasks に claude / gemini / codex を個別タスクとして列挙する
