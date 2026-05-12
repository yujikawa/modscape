## MODIFIED Requirements

### Requirement: SDD 作業フォルダ内の全アーティファクトの整合性を一発チェックできる
`/modscape:spec:validate <name>` は `.modscape/changes/<name>/` 内のすべての SDD アーティファクトを横断して整合性チェックを行い、矛盾・抜け・ズレをカテゴリ別に報告しなければならない（SHALL）。自動修正は行わず、報告と修正ヒントの提示のみを行わなければならない（SHALL）。

`output_format: html` が設定されている場合、チェック対象ファイルは `.html` 拡張子のファイルになる。HTMLファイルを読む際は以下のHTML構造からデータを抽出しなければならない（SHALL）:
- 未解決質問: `class="q-item"` かつ `class` に `open` を含む要素
- 仮定（Assumption）: `data-type="assumption"` 属性を持つ要素、またはテキスト内に「仮定:」「Assumption:」を含む要素
- Acceptance Criteria: `class="ac-id"` を持つ要素のテキスト（例: `AC-001`）
- タスク内AC参照: `.task-text` を持つ要素のテキスト内の `[→ AC-NNN]` パターン

チェックカテゴリ：

**A. spec ↔ design の整合**
- `spec.md`（または `spec.html`）に記載されたテーブルIDが `design.md`（または `design.html`）の Affected Tables に存在するか
- `design.md`（または `design.html`）の `### Requires Model Change` エントリが `tasks.md`（または `tasks.html`）に対応タスクとして存在するか

**B. design ↔ spec-model.yaml の整合**
- `design.md`（または `design.html`）の Direct Impact テーブルIDが `spec-model.yaml` に存在するか
- `spec-model.yaml` に存在するテーブルIDが `design.md`（または `design.html`）の Affected Tables のいずれかに分類されているか

**C. design ↔ tasks の整合**
- `design.md`（または `design.html`）の Direct Impact テーブルごとに対応する実装タスクが `tasks.md`（または `tasks.html`）に存在するか

**D. questions ↔ design の整合（MDモード）**
- `questions.md` の未解決Q&A（`- [ ]` 行）が `design.md` の仮定（`**Assumption:**` 行）として記録されているか

**D. questions ↔ design の整合（HTMLモード）**
- `questions.html` の未解決Q&A（`class="q-item open"` 相当の要素）が `design.html` の仮定として記録されているか

#### Scenario: 全アーティファクトが整合している場合
- **WHEN** すべてのチェックカテゴリで問題が検出されない
- **THEN** 各カテゴリに ✅ を表示し「No issues found. Ready to implement.」と出力する

#### Scenario: spec.md のテーブルが design.md に存在しない場合
- **WHEN** `spec.md` に `fct_orders` というテーブルIDが記載されているが `design.md` の Affected Tables に存在しない
- **THEN** カテゴリ A に `❌ fct_orders: spec.md に記載されているが design.md の Affected Tables に未分類` と表示し、`/modscape:spec:design <name>` を再実行するよう促す

#### Scenario: Requires Model Change が tasks.md に未反映の場合
- **WHEN** `design.md` の `### Requires Model Change` に `fct_orders: add column revenue_net` が存在するが `tasks.md` に対応タスクがない
- **THEN** カテゴリ A に `❌ Requires Model Change "fct_orders: add column revenue_net" が tasks.md に未反映` と表示する

#### Scenario: spec-model.yaml に存在しないテーブルが design.md に記載されている場合
- **WHEN** `design.md` の Direct Impact に `mart_summary` が含まれるが `spec-model.yaml` に該当テーブルが存在しない
- **THEN** カテゴリ B に `❌ mart_summary: design.md に記載されているが spec-model.yaml に未定義` と表示する

#### Scenario: Direct Impact テーブルに対応するタスクがない場合
- **WHEN** `design.md` の Direct Impact に `stg_orders` が含まれるが `tasks.md` にそのテーブルを扱うタスクが存在しない
- **THEN** カテゴリ C に `⚠️ stg_orders: Direct Impact だが tasks.md に対応タスクが見当たらない` と表示する

#### Scenario: 未解決Q&Aが design.md の仮定に記録されていない場合（MDモード）
- **WHEN** `questions.md` に `- [ ] Q-003` の未解決Q&Aが存在するが `design.md` に仮定として記録されていない
- **THEN** カテゴリ D に `⚠️ Q-003: questions.md に未解決だが design.md の Assumption に未記録` と表示する

#### Scenario: 未解決Q&Aが design.html の仮定に記録されていない場合（HTMLモード）
- **WHEN** `output_format: html` 設定下で `questions.html` に `class="q-item open"` の未解決Q&A `Q-003` が存在するが `design.html` に対応する仮定が記録されていない
- **THEN** カテゴリ D に `⚠️ Q-003: questions.html に未解決だが design.html の Assumption に未記録` と表示する

#### Scenario: チェック対象ファイルが存在しない場合はスキップする
- **WHEN** `spec-model.yaml` が存在しない状態で validate を実行する
- **THEN** カテゴリ B をスキップし `⏭ spec-model.yaml が存在しないためスキップ` と表示してエラーにしない
