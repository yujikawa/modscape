## ADDED Requirements

### Requirement: archive 時に知識ベースへの収録内容をキュレーションする

archiveスキルは `_questions.yaml`・`_glossary.yaml`・`_context.yaml` への書き込み前に、収録対象のエントリがデータ分析知識であるかを判断しなければならない（SHALL）。

**収録する（データ分析知識）:**
- フィルター不変条件（「このカラムにはこの条件が必要」）
- NULL値・フラグ・ステータスコードの実際のビジネス的意味
- JOIN時のファンアウト・粒度・重複計上の罠
- タイムゾーン・通貨・単位の変換ルール
- 判断が割れる局面での根拠（`why` / `rationale` フィールド）と反例（`counter_case` フィールド）
- ビジネス用語のSQL表現可能な定義

**収録しない（ツール/組織/運用情報）:**
- 実装ツールの選択（「dbtを使う」「SQLMeshを使う」「Pythonで処理する」）
- 組織担当・更新頻度・SLA・デプロイ手順
- `ids` が特定できない（どのエンティティにも紐づかない）抽象的な決定
- モデリングYAMLのスキーマ情報（model.yamlから読み取れるもの）

**`ids` の必須化:**
archiveスキルはエントリを書き込む際、`ids` フィールドに少なくとも1つのエンティティIDを付与しなければならない（SHALL）。複数テーブルに適用されるルール（タイムゾーン変換基準等）は `scope: global` を付与しなければならない（SHALL）。`ids` も `scope: global` も付けられないエントリは書き込んではならない（SHALL NOT）。

#### Scenario: ツール選択の決定は _context.yaml に書き込まれない
- **WHEN** SDD中に「dbtを使用する」という決定が記録され、archive を実行する
- **THEN** `_context.yaml` にその決定エントリは書き込まれない

#### Scenario: フィルター条件の決定は _questions.yaml に書き込まれる
- **WHEN** SDD中に「status='cancelled'のレコードは集計から除外する」という Q&A が記録され、archive を実行する
- **THEN** `_questions.yaml` にそのエントリが書き込まれ、`ids` に対象テーブルIDが含まれる

#### Scenario: ids なしのエントリは書き込まれない
- **WHEN** archive スキルがエントリを生成したが、どのエンティティIDにも紐づけられない
- **THEN** そのエントリは `_questions.yaml` / `_context.yaml` / `_glossary.yaml` に書き込まれない

#### Scenario: 複数テーブルに適用されるルールは scope: global で書き込まれる
- **WHEN** タイムゾーン変換ルール（全テーブル共通）を archive する
- **THEN** `_context.yaml` の該当エントリに `scope: global` が付与される
