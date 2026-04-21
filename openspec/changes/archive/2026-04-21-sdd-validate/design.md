## Context

SDD の `review` スキルは「実装に進んでいいか」のgo/no-go判定に特化している。未解決Q&A数・仮定数・AC カバレッジ・下流分類の信頼度を確認するが、アーティファクト間の構造的な矛盾（spec.md と design.md のズレなど）は検出しない。`validate` はこれを補完する「ドキュメント整合チェック」として設計する。

## Goals / Non-Goals

**Goals:**
- 全アーティファクトを横断して矛盾・抜け・ズレを検出する
- カテゴリ別にレポートし、どのファイルの何行目が問題かを示す
- 修正ヒント（次に実行すべきコマンド）を提示する
- `review` との重複を避ける（AC カバレッジの再チェックは行わない）

**Non-Goals:**
- 自動修正は行わない（報告のみ）
- `spec-model.yaml` の YAML 構文バリデーション（`modscape validate` が担う）
- `review` が行うgo/no-go判定の置き換え

## Decisions

### チェック項目の定義

| カテゴリ | チェック内容 | ソース |
|----------|------------|--------|
| A. spec ↔ design | spec.md に記載されたテーブルが design.md の Affected Tables に存在するか | spec.md, design.md |
| A. spec ↔ design | design.md の "Requires Model Change" エントリが tasks.md に対応タスクとして存在するか | design.md, tasks.md |
| B. design ↔ model | design.md の Direct Impact テーブルが spec-model.yaml に存在するか | design.md, spec-model.yaml |
| B. design ↔ model | spec-model.yaml に存在するテーブルが design.md の Affected Tables に分類されているか | design.md, spec-model.yaml |
| C. design ↔ tasks | design.md の Direct Impact テーブルそれぞれに対応するタスクが tasks.md に存在するか | design.md, tasks.md |
| D. questions ↔ design | questions.md の未解決Q&A（`- [ ]`）が design.md の仮定（Assumption）に記録されているか | questions.md, design.md |

### レポート形式

問題をカテゴリ別（A/B/C/D）に表示し、各問題に修正ヒントを付与する。問題がないカテゴリは `✅` で表示してスキップする。

### review との差別化

- `review`：go/no-go（未解決Q&A数、AC カバレッジ）
- `validate`：アーティファクト間の構造的整合（テーブルID突合、Requires Model Change の追跡など）
- 両方実行することで実装前の品質を多角的に確認できる

### ファイルが存在しない場合

チェック対象ファイルが存在しない場合はそのカテゴリをスキップし、スキップした旨を表示する（エラーにしない）。

## Risks / Trade-offs

- [リスク] spec.md のテーブル言及がフリーテキストのため、AI によるパース精度が低い → テーブルID（kebab-case）の正規表現マッチに絞ることで精度を上げる
- [リスク] design.md の "Requires Model Change" の書式がバラつく → design スキルが生成する固定セクション名（`### Requires Model Change`）に依存する
