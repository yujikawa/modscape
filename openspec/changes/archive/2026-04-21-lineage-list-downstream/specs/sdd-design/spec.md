## ADDED Requirements

### Requirement: design スキルが影響範囲確認に lineage list --from --recursive を案内する
design スキルは既存テーブルを変更する場合、影響範囲を `modscape lineage list --from <tableId> --recursive` で事前確認する手順を示さなければならない（SHALL）。

#### Scenario: 既存テーブルの変更時に影響範囲コマンドが案内される
- **WHEN** design スキルが既存テーブルへの変更を含む spec を処理する
- **THEN** 影響範囲の確認手段として `modscape lineage list <file> --from <tableId> --recursive --json` の実行例を出力に含める
