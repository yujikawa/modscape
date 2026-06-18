## Requirements

### Requirement: spec-config.yaml に phase フィールドを持つ

`spec-config.yaml` はフェーズ状態の単一の真実の源として `phase:` フィールドを持たなければならない（SHALL）。

有効なフェーズ値: `requirements` | `design` | `tasks` | `implement` | `done`

```yaml
phase: requirements   # ← 追加フィールド
main_yamls:
  - path: model.yaml
    tables: []
```

既存の `spec-config.yaml` に `phase` がない場合は後方互換を保ち、`phase: null` として扱わなければならない（SHALL）。

#### Scenario: spec-config.yaml に phase フィールドが存在する場合に読み取れる
- **WHEN** `spec-config.yaml` に `phase: design` が設定されている
- **THEN** `modscape spec get <name>` は `"phase": "design"` を返す

#### Scenario: phase フィールドがない既存ファイルで null を返す
- **WHEN** 既存の `spec-config.yaml` に `phase` フィールドがない
- **THEN** `modscape spec get <name>` は `"phase": null` を返す

---

### Requirement: modscape spec get コマンドで spec 情報を一括取得できる

`modscape spec get <name> [--json]` コマンドは、指定した spec のフェーズ・タイトル・タスク進捗・未回答質問数・ファイル一覧を返さなければならない（SHALL）。

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

`--json` フラグがない場合は人間が読みやすいテキスト形式で出力しなければならない（SHALL）。

`phase` が `null` の場合は `taskProgress` の `[ ]` 数を使ったフォールバック表示を行わなければならない（SHALL）。

#### Scenario: --json フラグ付きで JSON を返す
- **WHEN** `modscape spec get monthly-sales --json` を実行する
- **THEN** 上記フォーマットの JSON が標準出力に出力される

#### Scenario: --json なしで人間が読める形式で出力する
- **WHEN** `modscape spec get monthly-sales` を実行する
- **THEN** フェーズ・タスク進捗・質問数がテキスト形式で表示される

#### Scenario: 存在しない spec 名でエラーを返す
- **WHEN** `modscape spec get nonexistent-spec` を実行する
- **THEN** エラーメッセージを表示して終了する

---

### Requirement: modscape spec set-phase コマンドでフェーズを更新できる

`modscape spec set-phase <name> <phase>` コマンドは、`spec-config.yaml` の `phase:` フィールドを指定したフェーズ値に更新しなければならない（SHALL）。

有効なフェーズ値以外を渡した場合はバリデーションエラーを返さなければならない（SHALL）。

```bash
modscape spec set-phase monthly-sales design
# → spec-config.yaml の phase: を design に更新
```

AIが直接 `spec-config.yaml` を編集するのではなく、このコマンドを通じてフェーズを更新しなければならない（SHALL）。

#### Scenario: 有効なフェーズ値でフェーズが更新される
- **WHEN** `modscape spec set-phase monthly-sales design` を実行する
- **THEN** `spec-config.yaml` の `phase:` が `design` に更新され、成功メッセージが表示される

#### Scenario: 無効なフェーズ値でエラーを返す
- **WHEN** `modscape spec set-phase monthly-sales invalid-phase` を実行する
- **THEN** 「有効なフェーズ値は requirements / design / tasks / implement / done です」というエラーメッセージを表示する

#### Scenario: 存在しない spec 名でエラーを返す
- **WHEN** `modscape spec set-phase nonexistent invalid` を実行する
- **THEN** spec が存在しない旨のエラーメッセージを表示する

---

### Requirement: modscape spec list にフェーズ列を追加する

`modscape spec list` のテキスト出力は各 spec のフェーズを `[<phase>]` 形式で表示しなければならない（SHALL）。フェーズ未設定の場合は `-` を表示しなければならない（SHALL）。

`modscape spec list --json` の各エントリには `phase` フィールドを含めなければならない（SHALL）。

#### Scenario: spec list にフェーズが表示される
- **WHEN** `modscape spec list` を実行する
- **THEN** 各 spec エントリに `[design]` や `[-]` のようなフェーズ表示が含まれる

#### Scenario: spec list --json に phase フィールドが含まれる
- **WHEN** `modscape spec list --json` を実行する
- **THEN** 各エントリに `"phase": "design"` または `"phase": null` が含まれる
