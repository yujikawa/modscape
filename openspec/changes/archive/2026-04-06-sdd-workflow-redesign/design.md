## Context

現行のSDD機能は `.modscape/sdd/` 配下にシングルトンの `spec.md` / `tasks.md` を持つ。これはアプリ開発的な「変更の管理」を踏襲した設計だが、データ開発では「エンティティ（テーブル）の管理」が本質であり、構造が合っていない。

課題：
- `sdd/spec.md` が1プロジェクト1ファイルのため並行作業ができない
- 実装完了後にビジネス要件の記録が消える（さぼり構造）
- 実データで動かして気づきが生まれた際の設計ループに対応できない
- 「今テーブルに何が期待されているか」を確認する場所がない

## Goals / Non-Goals

**Goals:**
- SDD作業を名前付きフォルダ単位で管理し、並行作業を可能にする
- 作業完了（archive）時にテーブル単位の恒久specを自動更新する仕組みを作る
- `design.md` を「設計判断 + 実データの気づき」の蓄積場所にする
- `/modscape:sdd:design` を再実行可能にし、完了済みタスクを保持したまま差分更新する

**Non-Goals:**
- 既存の `.modscape/sdd/` ファイルの自動移行（手動対応とする）
- `specs/<table>.md` のバージョン管理（gitに委ねる）
- model.yamlスキーマの変更（今回はスキルのプロンプト変更のみ）

## Decisions

### 1. 一時ファイルと恒久ファイルの分離

```
.modscape/
├── sdd/
│   ├── <name>/               ← 作業ごとの一時ファイル
│   │   ├── spec.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── sdd.custom.md         ← 共通カスタムルール（変更なし）
└── specs/
    └── <table-id>.md         ← テーブル単位の恒久spec
```

**理由**: データ仕様はエンティティのライフサイクルに紐づく。作業フォルダは消えてもよいが、`specs/<table>.md` はテーブルが存在する限り生きる。この2つを同じ場所に置くと「どちらが最新か」が曖昧になるため明確に分離する。

### 2. フォルダ名はAIが提案、ユーザーが承認

`/modscape:sdd:requirements` 実行時にAIがspec内容から短いkebab-caseのフォルダ名を提案し、ユーザーが承認またはリネームする。

**理由**: フォルダ名が後からの参照キーになる（archiveのchangelog等）。ユーザーに強制させるよりAI提案+確認の方がスムーズ。

### 3. `/modscape:sdd:design` は再実行可能

再実行時の動作:
1. 既存の `design.md`（気づき含む）を読み込む
2. 現在の `model.yaml` の状態と比較
3. `tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を再生成

**理由**: 実データで動かして気づきが発生するのはデータ開発の常態。設計ループを「エラー」ではなく「正常なフロー」として扱う。

### 4. archive時の影響テーブル特定はAIが自動判断

`sdd/<name>/spec.md` + `design.md` + `model.yaml` の lineage を読み、影響テーブルを自動特定して `specs/<table>.md` に同期。

影響テーブルの分類:
- **直接影響**: 新規作成・カラム追加されたテーブル → Overview + Business Context + Business Rules を更新
- **間接影響**: lineageで上流に存在するテーブル → Changelog のみ追記

削除確認: 同期完了後「`sdd/<name>/` を削除しますか？」をユーザーに確認。残す場合は参照履歴として保持。

### 5. `specs/<table>.md` のフォーマット

```markdown
# <table-id>

## Overview
- **Owner**: ...
- **Update Frequency**: ...
- **SLA**: ...

## Business Context
（テーブルのビジネス上の意味・用途）

## Business Rules
- ...

## Known Issues / Caveats
- ...

## Changelog
- YYYY-MM-DD: 初版 (SDD: <name>)
- YYYY-MM-DD: <変更内容> (SDD: <name>)
```

**理由**: `model.yaml` の `conceptual.description` はAI向けの簡潔な記述に使い、`specs/<table>.md` はステークホルダー向けの詳細なビジネス文書として役割を分ける。

## Risks / Trade-offs

- **既存プロジェクトの移行コスト** → `sdd/spec.md` を `sdd/<name>/spec.md` に手動移行が必要。初回のみのコストであり許容する。
- **specs/ の陳腐化リスク** → archiveをさぼると `specs/` が更新されない。これはarchiveをワークフローの必須ステップとして定義することで抑制する（完全には防げない）。
- **フォルダ名の命名衝突** → 同名フォルダが既に存在する場合、AIは警告してリネームを促す。
- **design.mdの肥大化** → 気づきを追記し続けるとファイルが大きくなる。ただしarchive後にフォルダごと削除される前提なので問題ない。
