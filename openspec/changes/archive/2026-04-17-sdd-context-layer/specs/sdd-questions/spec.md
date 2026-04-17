## MODIFIED Requirements

### Requirement: AIが調査必要事項を questions.md に随時追記する
SDDの任意フェーズで、AIが人間の調査なしに判断できない事項を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

追記トリガーの例：
- 要件が曖昧で仮定が必要（requirementsフェーズ）
- カラム定義・ソーステーブル・ビジネスロジックが不明（designフェーズ）
- 実装中に想定外の型・レコード不在・制約違反を発見（implementフェーズ）

質問にはchange内でシーケンシャルなID（`Q-001`, `Q-002`, ...）を付与しなければならない（SHALL）。

`changes/<name>/questions.md` は以下のセクション構成を持たなければならない（SHALL）：
- `## Pipeline-level` — テーブルに紐づかないパイプライン全体の質問
- `## Table-level` — テーブルごとのサブセクション（`### <table-id>`）

archive 時に `## Table-level` の各テーブルセクションは `specs/<table-id>/questions.md` へ同期される（SHALL）。`## Pipeline-level` の質問は `specs/` に昇格されず、archive フォルダに保持される（SHALL）。

```markdown
- [ ] **Q-001** <質問内容>
  **Assumption:** <仮定した内容>（未確認）
```

#### Scenario: 設計中に不明な仕様を発見したとき
- **WHEN** AIが設計中にカラムのビジネスルールを判断できない場合
- **THEN** AIは `questions.md` の該当テーブルセクションに `Q-NNN` IDを付与した質問を追記する

#### Scenario: 質問IDがchange内でユニークである
- **WHEN** 複数の質問が追記される
- **THEN** 各質問IDは `Q-001`, `Q-002`, ... と順に採番され重複しない

#### Scenario: archive 時にテーブル質問が per-table ファイルに同期される
- **WHEN** archive を実行し `## Table-level` の `### fct_orders` に質問が存在する
- **THEN** `.modscape/specs/fct_orders/questions.md` に同期され、`changes/<name>/questions.md` の pipeline-level 質問は specs/ に書き込まれない
