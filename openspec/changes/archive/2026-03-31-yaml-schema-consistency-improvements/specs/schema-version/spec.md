## ADDED Requirements

### Requirement: root-level version フィールド

`model.yaml` の root レベルは、オプションの `version` フィールドを持てる。
値は文字列（例: `"1"`, `"2"`）とする。
`version` が省略された場合、システムはエラーなく動作し、`version: undefined` として扱う。
現バージョンでは `version` の値によるパーサー分岐は行わない（将来のスキーマ移行のための記録用フィールド）。

#### Scenario: version フィールドを持つ YAML は正常にパースされる
- **WHEN** YAML の root に `version: "2.0.0"` が指定されている
- **THEN** パーサーはエラーなく Schema オブジェクトを返し、`schema.version` が `"2.0.0"` になる

#### Scenario: version フィールドがない YAML は従来通り動作する
- **WHEN** YAML の root に `version` フィールドが存在しない
- **THEN** パーサーはエラーなく Schema オブジェクトを返す

#### Scenario: rules.md が version フィールドをオプションとして記載している
- **WHEN** AIエージェントが rules.md を参照して YAML を生成する
- **THEN** `version` はオプションフィールドとして記載されており、現在のスキーマバージョンが `"2.0.0"`（semver 形式）であることが明記されている
