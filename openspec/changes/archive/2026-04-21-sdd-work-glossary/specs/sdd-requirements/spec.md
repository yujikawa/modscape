## MODIFIED Requirements

### Requirement: requirements フェーズで発見した用語を glossary.md に記録する
requirements スキルは会話で登場したプロジェクト固有のビジネス用語を `.modscape/changes/<name>/glossary.md` に記録しなければならない（SHALL）。従来の `_glossary.yaml` への直接書き込みは行ってはならない（SHALL NOT）。

用語の記録は requirements 完了後のステップとして実行し、`_glossary.yaml` が存在するかどうかに関わらず `glossary.md` に追記する。

#### Scenario: requirements 完了後に用語が glossary.md に記録される
- **WHEN** requirements スキルが完了し、会話にプロジェクト固有の用語が含まれていた
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: _glossary.yaml への直接書き込みは行わない
- **WHEN** requirements スキルが用語を記録する
- **THEN** `.modscape/specs/_glossary.yaml` は変更されない
