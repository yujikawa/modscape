## MODIFIED Requirements

### Requirement: spec.md と既存specを読み込んで spec-model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/spec-model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに関連テーブルを自動判定し、`modscape extract <master>.yaml --tables <ids> --with-downstream` で `changes/<name>/spec-model.yaml` を生成する（Downstream Impact のテーブルも自動包含）
- 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計する（mutation CLIの対象は `changes/<name>/spec-model.yaml`）
- 設計判断と影響テーブルリストを `changes/<name>/design.md` に記録する
- 設計完了後に `modscape layout changes/<name>/spec-model.yaml` でレイアウトを更新する

スキルは再実行可能でなければならず（SHALL）、再実行時は以下を行わなければならない（SHALL）:
- 既存の `changes/<name>/design.md` の気づきセクションを読み込み設計に反映する
- `changes/<name>/tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を差分更新する

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは `changes/<name>/spec-model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `changes/<name>/tasks.md` を生成しなければならない（SHALL）。

tasks.md の Phase 4 テストタスクを生成する際、スキルは `spec.md` の `## Acceptance Criteria` から AC-NNN ID を読み込み、各テストタスクに対応する AC-NNN を `[→ AC-NNN]` 形式で付記しなければならない（SHALL）。自動テスト生成が困難な AC（数値一致検証等）は `[手動検証]` フラグを付けなければならない（SHALL）。

スキルは設計完了後に review サマリーを表示しなければならない（SHALL）。review サマリーには以下を含めなければならない（SHALL）:
- `questions.md` の未解決質問件数と Q-NNN 一覧
- `design.md` 内の仮定の件数
- AC カバレッジ（テスト紐付き / 手動検証 / 未カバーの件数）
- 下流分類の確信度が低いテーブル一覧

スキルは下流テーブルを以下のように分類しなければならない（SHALL）:
- **Direct Impact**: `--tables` で指定したテーブル（新規作成または構造変更対象）
- **Downstream Impact — Implement**: Direct Impact テーブルで追加・変更されるカラムを参照する下流テーブル → コード変更が必要
- **Downstream Impact — Context Only**: Direct Impact テーブルを参照するが変更カラムを使用しない下流テーブル → コード変更不要、参照のみ
- カラム詳細がない下流テーブル（lineage のみ）→ **Context Only** に分類し、分類確度が低い旨のコメントを付記する

この分類は **AI の提案** であり（SHALL）、`design.md` に免責注記を記載し、分類が誤っている場合はユーザーが直接編集するよう案内しなければならない（SHALL）。

スキルは設計中に人間の調査なしに判断できない事項（例：カラム定義不明、ソーステーブルの実在未確認）を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

#### Scenario: spec.md のData Sourcesから関連テーブルを抽出して作業用YAMLを生成する
- **WHEN** `changes/<name>/spec.md` が存在し `/modscape:spec:design <name>` を実行する
- **THEN** AIはData Sourcesを読み、`modscape extract --with-downstream`で関連テーブルおよびその下流（Downstream Impact）を抽出して `changes/<name>/spec-model.yaml` を生成する

#### Scenario: 本番YAMLを変更しない
- **WHEN** `/modscape:spec:design <name>` を実行する
- **THEN** 本番のmaster model.yaml（HR.yaml等）は一切変更されない

#### Scenario: 設計中に不明な事項を questions.md に積む
- **WHEN** 設計中にAIがカラム定義やソーステーブルの仕様を判断できない
- **THEN** AIは `questions.md` に該当質問を追記し、仮定で進む場合は `**仮定:**` 行を付ける

#### Scenario: design.md の気づきを反映して再実行する
- **WHEN** `changes/<name>/design.md` に気づきが追記された状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは気づきの内容を読み込んで `changes/<name>/spec-model.yaml` の設計を更新し、tasks.md の完了済みタスクを保持したまま未完了部分を差分更新する

#### Scenario: spec.md が存在しない場合にエラーメッセージを表示する
- **WHEN** `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:requirements` を実行して spec.md を作成してください」と案内する

#### Scenario: Downstream Impact の分類を design.md に記録する
- **WHEN** 下流テーブルが特定される
- **THEN** AIは各テーブルを Direct / Downstream Impact — Implement / Downstream Impact — Context Only に分類し、免責注記とともに `design.md` の `## Affected Tables` セクションに記録する

#### Scenario: Context Only テーブルを tasks.md に含めない
- **WHEN** tasks.md を生成する
- **THEN** Downstream Impact — Context Only に分類されたテーブルのタスクは tasks.md に含めない

#### Scenario: Phase 4 テストタスクに AC-NNN を紐付ける
- **WHEN** tasks.md の Phase 4 を生成し、`spec.md` に AC-NNN 形式の Acceptance Criteria が存在する
- **THEN** 各テストタスクの末尾に対応する `[→ AC-NNN]` を付記し、自動生成できない AC には `[手動検証]` フラグを付ける

#### Scenario: design 完了後に review サマリーを表示する
- **WHEN** `/modscape:spec:design <name>` が完了する
- **THEN** 未解決質問件数・仮定件数・AC カバレッジ・下流分類確信度の低いテーブルを含む review サマリーが表示され、`/modscape:spec:implement <name>` と `/modscape:spec:review <name>` への次ステップ案内が出力される
