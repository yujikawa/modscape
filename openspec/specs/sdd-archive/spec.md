## Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<model-slug>/<table-id>.html`（または `.md`）を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番の main model.yaml にマージしなければならない（SHALL）。

**model-slug の導出規則（SHALL）:**
- 通常パス: `spec-config.yaml` の `main_yamls` に記載された各 YAML ファイルのパスから `path.parse(filePath).name` で導出する（例: `models/main-model1.yaml` → `main-model1`）
- グリーンフィールドパス: ユーザーがアーカイブ時に指定した出力パスから導出する

**output_format に応じた生成ルール（SHALL）:**
- `output_format: html`（`.modscape/modscape-spec.config.yaml` に設定）の場合: `specs/<model-slug>/<table-id>.html` を生成する
- デフォルト（未設定または `md`）の場合: `specs/<model-slug>/<table-id>.md` を生成する

**既存フォルダ構造の検出と案内（SHALL）:**
- archive 実行時に旧形式（`specs/<table-id>/spec.md` または `specs/<table-id>/spec.html`）が存在する場合、ユーザーに以下を通知する:
  ```
  ⚠ 旧フォルダ形式のspecが検出されました: specs/<table-id>/spec.md
    → 新形式の保存先: specs/<model-slug>/<table-id>.md
    手動で移動することを推奨します。
  ```
- 自動移動は行わない。

スキルはマージを実行する前に dry-run サマリーを表示し、ユーザーの確認を得てからマージを実行しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- dry-run サマリーを表示し確認を得た後、`modscape merge` でマージする
- 重複テーブルIDが検出された場合、警告を表示する（処理はブロックしない）
- Direct Impact および Downstream Impact — Implement テーブルに対してフル同期を実行する
- Downstream Impact — Context Only テーブルに対して Changelog のみ追記する
- `specs/_context.yaml` を更新する
- 同期完了後、作業フォルダを `.modscape/archives/YYYY-MM-DD-<name>/` に移動する

#### Scenario: html モード時に spec.html が正しいパスに生成される
- **WHEN** `output_format: html` 設定下で `/modscape:spec:archive foobar` を実行し、`spec-config.yaml` に `main_yamls: [models/main-model1.yaml]` が記載されている
- **THEN** `specs/main-model1/fct_orders.html` が生成される

#### Scenario: md モード（デフォルト）では spec.md が正しいパスに生成される
- **WHEN** `output_format` が未設定の状態で `/modscape:spec:archive foobar` を実行する
- **THEN** `specs/main-model1/fct_orders.md` が生成される

#### Scenario: 複数モデルのテーブルが別スラグ配下に分離される
- **WHEN** `spec-config.yaml` に `main_yamls: [model-a.yaml, model-b.yaml]` が記載され、各モデルに `fct_orders` が存在する
- **THEN** `specs/model-a/fct_orders.html` と `specs/model-b/fct_orders.html` がそれぞれ生成され、衝突しない

#### Scenario: 旧フォルダ形式のspecが存在する場合に警告が表示される
- **WHEN** `specs/fct_orders/spec.md`（旧フォルダ形式）が存在する状態で archive を実行する
- **THEN** 旧形式ファイルの検出と新形式パスへの手動移動を促す警告が表示される

#### Scenario: マージ前に dry-run サマリーを表示して確認を取る
- **WHEN** `/modscape:spec:archive <name>` を実行する
- **THEN** 「追加するテーブル / 更新するテーブル / 変更なし」のサマリーが表示され、確認が求められる

#### Scenario: ユーザーが確認を拒否した場合にマージをスキップする
- **WHEN** dry-run サマリー確認で拒否を選択する
- **THEN** マージは実行されず「Archive cancelled.」と表示して終了する

## ADDED Requirements

### Requirement: archive 時に glossary.md を _glossary.yaml にマージする
`archive` スキルは `.modscape/changes/<name>/glossary.md` が存在する場合、その内容を `.modscape/specs/_glossary.yaml` にマージしなければならない（SHALL）。マージ後、`glossary.md` を削除しなければならない（SHALL）。

マージ戦略：
- `id` で既存エントリを照合する
- 未登録の場合 → `_glossary.yaml` の `terms:` に新規追加する
- 既登録の場合 → `change` フィールドのみ更新し、`definition` は上書きしない（手動編集を保護する）
- `_glossary.yaml` が存在しない場合 → 新規作成してマージする

#### Scenario: glossary.md が存在する場合にマージが実行される
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在する状態で archive を実行する
- **THEN** glossary.md の全エントリが `_glossary.yaml` にマージされ、glossary.md が削除される

#### Scenario: glossary.md が存在しない場合はスキップされる
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在しない状態で archive を実行する
- **THEN** glossary マージステップはスキップされ、エラーを出さずに続行する

#### Scenario: 既登録の用語は definition を上書きしない
- **WHEN** `_glossary.yaml` に既に登録されている用語が glossary.md にも存在する
- **THEN** `change` フィールドのみ更新され、`definition` は元の値を保持する

---

## ADDED Requirements

### Requirement: Coverage Policy 設定時に archive の merge 前にカバレッジゲートを実行する

`modscape:spec:archive` スキルは、`.modscape/modscape-spec.custom.md` に Coverage Policy（最小カバレッジ閾値）が設定されている場合、`modscape validate` の直後・merge の前に `modscape coverage` を実行しなければならない（SHALL）。

Coverage Policy が設定されていない場合、カバレッジチェックをスキップしなければならない（SHALL）。既存プロジェクトへの影響はゼロでなければならない（SHALL）。

カバレッジが閾値を下回る場合は警告を表示し、ユーザーに y/N で続行を確認しなければならない（SHALL）。ユーザーが N を選択した場合は merge をキャンセルしなければならない（SHALL）。ブロックではなく確認であるため、ユーザーが y を選択すれば閾値未満でも merge を続行できなければならない（SHALL）。

#### Scenario: Coverage Policy 設定時に閾値以上でそのまま続行する
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 75% の場合に archive を実行する
- **THEN** 「Coverage OK: 75% >= 70%」と表示されて merge ステップに進む

#### Scenario: Coverage Policy 設定時に閾値未満で確認を求める
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 45% の場合に archive を実行する
- **THEN** 「⚠ Coverage: 45% < 70% (threshold). Proceed anyway? (y/N)」と表示されてユーザーの入力を待つ

#### Scenario: 閾値未満でユーザーが y を選択して続行する
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに y を入力する
- **THEN** 警告を記録した上で merge ステップに進む

#### Scenario: 閾値未満でユーザーが N を選択してキャンセルする
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに N を入力する
- **THEN** 「Archive cancelled.」を表示して処理を終了し、main YAML への変更は行わない

#### Scenario: Coverage Policy が未設定の場合にスキップする
- **WHEN** `.modscape/modscape-spec.custom.md` に Coverage Policy が記述されていない状態で archive を実行する
- **THEN** カバレッジチェックをスキップして通常の validate → merge の流れで処理する

---

## MODIFIED Requirements

### Requirement: archiveスキルの Step 5 で decisions に ids を付与する

archiveスキルの Step 5（`_context.yaml` の更新）において、decisions を書き込む際に `ids` フィールドを付与しなければならない（SHALL）。`ids` の値は Step 2 で分類した Affected Tables の ID リスト（Direct Impact + Downstream Impact — Implement + Downstream Impact — Context Only）とする。

Affected Tables が空の場合（`design.md` に `## Affected Tables` セクションがない場合）は `ids` フィールドを省略してよい（MAY）。

```yaml
# decisions の書き込みフォーマット
- id: D-NNN
  summary: "<one-line summary>"
  rationale: "<why this decision was made>"  # optional
  date: <YYYY-MM-DD>
  change: <name>
  ids: [<affected-entity-id>, ...]           # Step 2 のAffected Tablesから
```

#### Scenario: Affected Tables が存在する場合に ids を付与する
- **WHEN** `design.md` の `## Affected Tables` に `fct_orders`（Direct Impact）が記載されており、decisionsを書き込む
- **THEN** decision エントリに `ids: [fct_orders]` が含まれる

#### Scenario: Affected Tables が空の場合は ids を省略する
- **WHEN** `design.md` に `## Affected Tables` セクションが存在しない
- **THEN** decision エントリに `ids` フィールドは含まれない

---

### Requirement: archiveスキルの glossary パースで ids フィールドを使用する

archiveスキルが `glossary.md` を `_glossary.yaml` にマージする際、エンティティ参照フィールドとして `tables` ではなく `ids` を使用しなければならない（SHALL）。

#### Scenario: glossary.md の ids フィールドが _glossary.yaml に正しくマージされる
- **WHEN** `glossary.md` に `ids: [fct_orders]` を持つ用語エントリが存在する
- **THEN** `_glossary.yaml` の該当エントリに `ids: [fct_orders]` が書き込まれる

#### Scenario: 既存エントリの更新時も ids フィールドが保持される
- **WHEN** 既存の `_glossary.yaml` エントリ（`ids: [fct_orders]`）に対して同一IDの用語が `glossary.md` に存在する
- **THEN** マージ後も `ids` フィールドが正しく保持される

---

## ADDED Requirements

### Requirement: archive 時に知識ベースへの収録内容をキュレーションする

`modscape:spec:archive` スキルは、`_context.yaml`・`_glossary.yaml`・`_questions.yaml` へのエントリ書き込み時に、以下のキュレーション基準を適用しなければならない（SHALL）。

**収録するもの（データ分析知識）:**
- フィルター不変条件（「このカラムには必ずこの条件が要る」）
- NULL / フラグの実際の意味
- JOIN時のファンアウト・粒度の罠
- タイムゾーン・通貨・単位の変換ルール
- ビジネス用語の定義（SQLレベルで表現できるもの）
- 判断が割れる局面での根拠（`why` フィールド）と反例（`counter_case` フィールド）

**除外するもの（ツール/組織/運用情報）:**
- 実装ツールの選択（「dbtを使う」「SQLMeshを使う」）
- 組織の担当・更新頻度・SLA
- インフラ・デプロイ手順
- `ids` が付けられない（どのエンティティにも紐づかない）抽象的な決定

スキルは全エントリに対して対象テーブルIDを示す `ids` フィールドを付与しなければならない（SHALL）。複数テーブルに適用されるルールには `scope: global` を付与しなければならない（SHALL）。

#### Scenario: データ分析知識のみが収録される
- **WHEN** archive 実行時に、実装ツール選択の決定と、NULLの意味を示すフィルター条件の決定が混在する
- **THEN** NULLの意味を示すフィルター条件のみが `_context.yaml` に書き込まれ、実装ツール選択の決定は除外される

#### Scenario: 収録エントリに ids が付与される
- **WHEN** `fct_orders` に関するビジネスルールを archive で `_context.yaml` に書き込む
- **THEN** エントリに `ids: [fct_orders]` が付与される

#### Scenario: 複数テーブルに適用されるルールに scope: global を付与する
- **WHEN** タイムゾーン変換ルールなど全テーブルに適用されるルールを archive で書き込む
- **THEN** エントリに `scope: global` が付与される

---

## ADDED Requirements

### Requirement: archive 完了時に phase を done に更新する

`archive` スキルは作業フォルダを `.modscape/archives/` に移動する直前に `modscape spec set-phase <name> done` を実行し、`spec-config.yaml` のフェーズを `done` に更新しなければならない（SHALL）。

#### Scenario: archive 完了時に phase が done に設定される
- **WHEN** `/modscape:spec:archive <name>` が正常に完了しフォルダをアーカイブに移動する
- **THEN** `modscape spec set-phase <name> done` が実行され、`spec-config.yaml` の `phase` が `done` に更新される

#### Scenario: archive がキャンセルされた場合は phase を変更しない
- **WHEN** dry-run 確認でユーザーが N を選択して archive をキャンセルする
- **THEN** `modscape spec set-phase` は実行されず、`phase` は変更されない
