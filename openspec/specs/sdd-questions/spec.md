## Requirements

### Requirement: questions.md を作業フォルダの一部として生成する
`modscape spec new <name>` は `.modscape/changes/<name>/questions.md` を空ファイルとして生成しなければならない（SHALL）。

生成される `questions.md` の初期フォーマット：
```markdown
# Questions: <name>

## Pipeline-level

## Table-level
```

#### Scenario: spec new 実行時に questions.md が生成される
- **WHEN** `modscape spec new <name>` を実行する
- **THEN** `.modscape/changes/<name>/questions.md` が空のフォーマットで生成される

#### Scenario: questions.md がすでに存在する場合は上書きしない
- **WHEN** `modscape spec new <name>` を実行し `.modscape/changes/<name>/questions.md` が既に存在する
- **THEN** 既存の `questions.md` は上書きされない

### Requirement: AIが調査必要事項を questions.md に随時追記する
SDDの任意フェーズで、AIが人間の調査なしに判断できない事項を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

追記トリガーの例：
- 要件が曖昧で仮定が必要（requirementsフェーズ）
- カラム定義・ソーステーブル・ビジネスロジックが不明（designフェーズ）
- 実装中に想定外の型・レコード不在・制約違反を発見（implementフェーズ）

質問にはchange内でシーケンシャルなID（`Q-001`, `Q-002`, ...）を付与しなければならない（SHALL）。

```markdown
- [ ] **Q-001** <質問内容>
  **仮定:** <仮定した内容>（未確認）
```

#### Scenario: 設計中に不明な仕様を発見したとき
- **WHEN** AIが設計中にカラムのビジネスルールを判断できない場合
- **THEN** AIは `questions.md` に `Q-NNN` IDを付与した質問を追記する

#### Scenario: 質問IDがchange内でユニークである
- **WHEN** 複数の質問が追記される
- **THEN** 各質問IDは `Q-001`, `Q-002`, ... と順に採番され重複しない

### Requirement: 未解決質問があってもユーザーの許可で進行できる
未解決の質問（`- [ ]`）がある状態でフェーズを進める場合、AIは確認を1回挟み、ユーザーが許可したら仮定を `questions.md` に記録して続行しなければならない（SHALL）。

#### Scenario: 未解決質問があるときに確認を挟む
- **WHEN** 未解決の質問が存在する状態でフェーズを進めようとする
- **THEN** AIは「未解決の質問が X 件あります。仮定で進めますか？」と確認する

#### Scenario: ユーザーが進行を許可した場合
- **WHEN** ユーザーが「進んでいい」と回答する
- **THEN** AIは仮定内容を質問の `**仮定:**` 行に記録して処理を続行する

#### Scenario: ユーザーが回答してから進む場合
- **WHEN** ユーザーが質問に直接回答する
- **THEN** AIは該当質問を `[x]` にして `**A:**` を追記してからフェーズを継続する

### Requirement: SDDワークフロー全体を通じたQ&A管理機能
`questions.md` の生成・更新・回答・archive sync を行う。

質問への回答は CLI コマンドではなく AI スキル `/modscape:spec:answer` を通じて行わなければならない（SHALL）。`modscape spec answer` CLI コマンドは廃止する（SHALL NOT use）。

その他の要件（質問の積み方・フォーマット・archive sync）は変更なし。

#### Scenario: questions.md への回答は AI スキルを通じて行う
- **WHEN** Q-NNN に回答したい
- **THEN** `/modscape:spec:answer <name> <id>` を実行する（`modscape spec answer` CLI は使用しない）

### Requirement: archive時に .modscape/specs/questions.md へsyncする
`/modscape:spec:archive <name>` は `.modscape/changes/<name>/questions.md` の内容を `.modscape/specs/questions.md` へテーブル単位フラットマージでsyncしなければならない（SHALL）。

syncルール：
- テーブル単位でフラットにマージ（同じテーブルの質問を集約）
- 既存 `specs/questions.md` との矛盾・廃止があればstrikethrough＋コメントを付記
- 同一本文の質問は重複追加しない
- change名は `<!-- <name> -->` コメントとして残す

```markdown
### fct_orders
- [x] **Q-002** amount は税込？税抜？ <!-- monthly-sales -->
  **A:** 税抜と確認済み
- ~~[ ] **Q-005** discount_amount の計算ロジックは？~~ <!-- revenue-by-region にて discount_amount カラム廃止 -->
```

#### Scenario: 新規質問が specs/questions.md に追記される
- **WHEN** archive を実行し `questions.md` に新規質問が存在する
- **THEN** 該当テーブルセクションに質問が追記され、change名コメントが付く

#### Scenario: 矛盾する既存質問にコメントが付く
- **WHEN** archive時にchange内の設計変更が既存質問と矛盾する（例：カラム廃止）
- **THEN** 既存質問はstrikethroughになり矛盾内容のコメントが付記される

#### Scenario: 同一本文の質問は重複しない
- **WHEN** archive時に同一テーブルの同一本文の質問が既に存在する
- **THEN** 重複追加はせずchange名コメントのみ追記する
