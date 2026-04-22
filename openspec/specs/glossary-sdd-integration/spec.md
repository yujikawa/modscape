## ADDED Requirements

### Requirement: `spec:requirements` スキルで用語登場時に `_glossary.yaml` を更新する

`spec:requirements` スキルの実行中に新しいビジネス用語・データ用語が登場した場合、スキルは `_glossary.yaml` を確認し、未登録であれば追記する。既存エントリの定義が会話で更新された場合は修正する。

#### Scenario: 新規用語を glossary に追加する
- **WHEN** requirements の作成中に未登録の用語（例: "純売上"）が確定する
- **THEN** スキルは `_glossary.yaml` に当該用語のエントリを追加する

#### Scenario: 既存用語の定義が変わった場合は更新する
- **WHEN** requirements の作成中にすでに glossary に存在する用語の定義が修正される
- **THEN** スキルは既存エントリの `definition` を更新する

#### Scenario: glossary ファイルが存在しない場合はスキップする
- **WHEN** `.modscape/specs/_glossary.yaml` が存在しない
- **THEN** スキルはエラーを出さずに glossary 更新をスキップする

### Requirement: `spec:answer` スキルで回答確定時に `_glossary.yaml` を更新する

`spec:answer` スキルで質問への回答が確定したとき、その回答に用語定義が含まれる場合は `_glossary.yaml` を確認・更新する。

#### Scenario: 回答に用語定義が含まれる場合に glossary を更新する
- **WHEN** `spec:answer` で「net_revenue は税抜き金額」という回答が確定する
- **THEN** スキルは `_glossary.yaml` の該当エントリを追加または更新する

#### Scenario: 用語定義を含まない回答はスキップする
- **WHEN** `spec:answer` の回答が運用ルールや実装方針のみを含む（用語定義なし）
- **THEN** スキルは `_glossary.yaml` を変更しない
