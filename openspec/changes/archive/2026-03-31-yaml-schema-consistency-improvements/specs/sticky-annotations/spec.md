## MODIFIED Requirements

### Requirement: Annotation Target Binding
The system SHALL allow binding an annotation to a specific modeling object (table, domain, relationship, or lineage edge) via a `targetId`.

`targetType` の有効な値は `table | domain | relationship | column | lineage` とする。
`targetType: 'relationship'` は、対象の relationship エントリに `id` が付与されている場合に機能する。
`targetType: 'lineage'` は、対象の lineage エントリに `id` が付与されている場合に機能する。

#### Scenario: Binding to a table
- **WHEN** user creates a "sticky" annotation for table "orders"
- **THEN** the annotation record SHALL have `targetId: "orders"` and `targetType: "table"`

#### Scenario: relationship への targetType: relationship でのバインド
- **WHEN** `targetType: "relationship"` かつ `targetId: "rel_001"` を持つ annotation が定義されている
- **THEN** システムは `id: "rel_001"` を持つ relationship エントリを探し、アノテーションを関連付ける

#### Scenario: lineage エッジへのバインド
- **WHEN** `targetType: "lineage"` かつ `targetId: "lin_001"` を持つ annotation が定義されている
- **THEN** システムは `id: "lin_001"` を持つ lineage エントリを探し、アノテーションを関連付ける

#### Scenario: id のない relationship への targetType: relationship は無効
- **WHEN** `targetType: "relationship"` かつ `targetId` が指定されているが、対応する id を持つ relationship が存在しない
- **THEN** システムはアノテーションをターゲットなしとして扱い、canvas の絶対座標に配置する
