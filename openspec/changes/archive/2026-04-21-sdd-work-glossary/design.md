## Context

現在の SDD ワークフローでは `_questions.yaml` に対して work-scoped な `questions.md` が存在し、archive 時にマージされる対称的な設計になっている。しかし用語集（`_glossary.yaml`）は work-scoped な中間ファイルを持たず、`requirements` / `answer` スキル実行時に `_glossary.yaml` へ直接書き込むフローになっている。

この非対称により：
- `design` / `implement` フェーズで発見されたビジネス用語が記録されない
- archive 時に用語集の同期ステップが存在しない

## Goals / Non-Goals

**Goals:**
- `questions.md` と同じパターンで `glossary.md` を work-scoped ファイルとして導入する
- `requirements` / `design` スキルで用語が出たら `glossary.md` に記録する
- `archive` スキルで `glossary.md` を `_glossary.yaml` にマージし、その後削除する

**Non-Goals:**
- 用語の重複排除アルゴリズムの厳密化（既存の `_glossary.yaml` とのマージは id ベースの上書きで十分）
- `answer` スキルの書き込み先変更（直接 `_glossary.yaml` への書き込みのままでよい）
- UI / ビジュアライザー側の変更

## Decisions

### glossary.md のフォーマット

`questions.md` に合わせたMarkdownリスト形式を採用する。YAMLではなくMarkdownにすることで、AIが自然な文章の流れで追記しやすい。archive 時に AI が parse して `_glossary.yaml` エントリに変換する。

```markdown
## <change-name>

- **<term-id>**: <definition>
  - label: <日本語名>（任意）
  - tables: <table_a>, <table_b>（任意）
  - columns: <table_a.col>（任意）
```

### マージ戦略

archive 時に `_glossary.yaml` の既存エントリを `id` で照合する：
- 未登録 → 新規追加
- 既存 → `change` フィールドを更新、`definition` は上書きしない（手動編集を保護）

### 用語化の基準

スキルへの指示として以下を明示する：
- プロジェクト固有・社内用語・略語を対象とする
- SQLの一般用語（JOIN, GROUP BY 等）やデータモデリングの標準概念（fact, dimension 等）は除外する
- 判断に迷ったら記録する（後から `_glossary.yaml` を直接編集して削除できる）

## Risks / Trade-offs

- [リスク] AIが基準を守らず一般用語を大量に glossary.md に書き込む → 許容。`_glossary.yaml` を直接編集すれば整理できる
- [リスク] 既存の `requirements` / `answer` スキルが `_glossary.yaml` 直書きのまま残る → `answer` は変更不要（正常な経路）。`requirements` のみ `glossary.md` 経由に切り替える
