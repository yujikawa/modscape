## ADDED Requirements

### Requirement: lineage エッジに結合種別を指定できる
`lineage[]` の各エントリに `join_type` フィールドを追加し、下流テーブルがこの上流テーブルをどのように結合して読み込むかを明示できなければならない（SHALL）。

`join_type` は以下の値を取らなければならない（SHALL）:
- `inner` — INNER JOIN（一致する行のみ）
- `left` — LEFT JOIN（上流に一致しなくても下流を保持）
- `cross` — CROSS JOIN（全行の組み合わせ）
- `none` — JOIN なし（CTE またはサブクエリとして取り込むが明示的な JOIN 句を生成しない）

`join_type` は省略可能（SHALL）。省略時の動作:
- 対応する `relationships` エントリが存在する場合: relationships の結合列を使用し、SDD implement スキルが `left` を基本として生成する
- `relationships` が存在しない場合: `none` として扱う

#### Scenario: join_type が指定された lineage エッジから JOIN 句を生成する
- **WHEN** `lineage[].join_type: left` が設定されている
- **THEN** SDD implement スキルは対応するテーブルへの LEFT JOIN 句を生成する

#### Scenario: join_type が none の場合 JOIN 句を生成しない
- **WHEN** `lineage[].join_type: none` が設定されている
- **THEN** SDD implement スキルはそのテーブルへの明示的な JOIN 句を生成せず、CTE として参照するコードを生成する

#### Scenario: join_type が省略された既存 lineage は動作を変えない
- **WHEN** `join_type` が設定されていない既存の lineage エントリが存在する
- **THEN** バリデーションはエラーを出さず、従来通りの動作をする（後退互換）
