## Context

現在の `tasks` スキルは tasks.md を生成する際に以下の3つの問題を持つ。

1. **materialization 表示の誤り**: `physical.strategy` の値（`table` / `incremental`）を正確に転記せず、AIが推測で `view` や `increment` 等の誤った値を生成する。
2. **Phase名のハードコード**: "Staging / Core / Mart" が固定値として埋め込まれており、`spec-model.yaml` の `domains.name` と一致しないケース（例: "Reference Data" / "Mart"）で全フェーズが空になる。
3. **不要な情報の生成**: `← upstream` 記法はフェーズ順序が既に実装順を示しているため冗長。Tests フェーズは仕様によっては不要。

変更対象はスキルのプロンプトテンプレート（markdown ファイル）と フォーマット定義ファイル（`tasks-format.md`）のみ。コードの変更は不要。

## Goals / Non-Goals

**Goals:**
- tasks.md から materialization 表示（`[table]` 等）を削除する
- tasks.md から `← upstream` 記法を削除する
- Phase名を `spec-model.yaml` の `domains.name` をトポロジカル順に使用して動的生成する
- "Phase N: Tests" を必須から外し任意とする
- Claude / Codex / Gemini の3つのスキルテンプレートと tasks-format.md を一貫した内容に更新する

**Non-Goals:**
- `spec-model.yaml` の YAML スキーマ変更
- tasks.md のマージロジック変更
- `spec set-phase` コマンドの動作変更

## Decisions

### Phase名を domains から生成する

`spec-model.yaml` には `domains` セクションがあり、各ドメインは `id` / `name` / `members`（テーブルIDリスト）を持つ。

```yaml
domains:
  - id: staging_domain
    name: Staging
    members: [stg_billing_subscriptions]
  - id: mart_domain
    name: Mart
    members: [mart_arr]
```

スキルは以下の手順でフェーズを決定する：

1. `domains` 一覧を取得し、各ドメインの `members` テーブルを特定する
2. `lineage` を使って「どのドメインのテーブルがどのドメインのテーブルに依存しているか」を解析し、ドメイン間の依存グラフを構築する
3. ドメインをトポロジカルソートし、上流から順に Phase 1, 2, 3, ... と番号を振る
4. Phase名は `domains.name` をそのまま使用する（ハードコードしない）

**代替案**: lineage の深さ（depth）で自動分類 → ドメイン名が使われず、Staging/Core/Mart の決め打ちに戻りがちなため不採用。

### どのドメインにも属さないテーブルの扱い

lineage に存在するが domains のどの `members` にも含まれていないテーブルは、依存グラフ上の位置（depth）に基づいて最も近い既存フェーズに割り当てる。フォールバックが発生した場合はスキルがユーザーに注記を表示する。

### consumers はフェーズ分類の対象外

`spec-model.yaml` の `consumers` セクション（ダッシュボード等）は lineage に含まれる場合があるが、`tables` に存在しないため tasks.md に含めない。lineage のトラバーサル時に consumers を除外する。

### Tests セクションの廃止

固定 "Phase 4: Tests" を削除し、スキルは Tests の生成を行わない。テストタスクが必要な場合はユーザーが手動で tasks.md に追記する。format テンプレートにも Tests セクションを含めない。

## Risks / Trade-offs

- **既存の tasks.md との非互換**: フォーマット変更後にスキルを再実行すると、既存の `[incremental]` 等の表記が消える。ただし tasks.md は再生成可能なため影響は軽微。
- **domain 未定義プロジェクト**: `domains` セクションが空または未定義の場合、フォールバックとして lineage の深さでフェーズ名を自動生成（"Phase 1", "Phase 2" 等）する。
