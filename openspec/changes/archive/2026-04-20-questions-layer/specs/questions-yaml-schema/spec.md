## ADDED Requirements

### Requirement: _questions.yaml ファイルのスキーマ定義
`.modscape/specs/_questions.yaml` を Q&A の一元管理ファイルとして定義する。ファイルは `questions:` リストを持ち、各エントリは id・question・status フィールドを必須とし、answer・assumption・table・date・change を任意とする。

#### Scenario: 有効な _questions.yaml の読み込み
- **WHEN** `_questions.yaml` が正しい構造で存在する
- **THEN** `parseQuestionsYaml` がエントリリストを返す

#### Scenario: table フィールドによるフィルタリング
- **WHEN** `table: fct_orders` が指定されたエントリが存在する
- **THEN** テーブル ID で絞り込み検索ができる

#### Scenario: status フィールドによる状態管理
- **WHEN** エントリの status が `answered` / `open` / `assumed` のいずれかである
- **THEN** ContextPanel の Q&A タブで状態に応じた表示ができる

### Requirement: modscape init --sdd での _questions.yaml テンプレート生成
`modscape init --sdd` 実行時に `.modscape/specs/_questions.yaml` の空テンプレートを生成する。

#### Scenario: --sdd フラグ付き init でファイルが生成される
- **WHEN** `modscape init --sdd` を実行する
- **THEN** `.modscape/specs/_questions.yaml` が空の questions リストで作成される

#### Scenario: 既存ファイルを上書きしない
- **WHEN** `.modscape/specs/_questions.yaml` が既に存在する状態で `modscape init --sdd` を実行する
- **THEN** 既存ファイルは変更されない

### Requirement: TypeScript 型定義の追加
`visualizer/src/types/schema.ts` に `QuestionEntry` および `QuestionsYaml` 型を追加する。

#### Scenario: 型定義が正しく import できる
- **WHEN** `QuestionEntry` / `QuestionsYaml` を import する
- **THEN** TypeScript コンパイルエラーが発生しない
