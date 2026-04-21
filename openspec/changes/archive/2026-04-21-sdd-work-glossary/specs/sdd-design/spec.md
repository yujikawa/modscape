## ADDED Requirements

### Requirement: design フェーズで発見した用語を glossary.md に記録する
design スキルはテーブル定義・ビジネスルールの文脈で登場したプロジェクト固有のビジネス用語を `.modscape/changes/<name>/glossary.md` に記録しなければならない（SHALL）。

用語の記録は design 完了後のステップとして実行する。`glossary.md` が存在しない場合は新規作成する。

#### Scenario: design 完了後に用語が glossary.md に記録される
- **WHEN** design スキルが完了し、テーブル設計の文脈でプロジェクト固有の用語が登場していた
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: 登録対象の用語がなければスキップされる
- **WHEN** design スキルが完了したが、プロジェクト固有の用語が登場しなかった
- **THEN** glossary.md への書き込みはスキップされる
