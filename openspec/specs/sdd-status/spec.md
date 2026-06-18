## Requirements

### Requirement: statusコマンド
システムは `/modscape:spec:status <name>` コマンドを提供しなければならない（SHALL）。現在のフェーズ・ファイル存在状況・タスク進捗を表示し、**`session.md` が存在する場合は前回のセッション内容を表示し**、**現在の状態から次に実行すべきアクションを1つ明示する**。

#### Scenario: 基本的なステータス表示
- **WHEN** `/modscape:spec:status fct_orders` を実行する
- **THEN** フェーズ・ファイル一覧・タスク進捗を表示する

#### Scenario: session.md が存在する場合
- **WHEN** `.modscape/changes/<name>/session.md` が存在する状態で status を実行する
- **THEN** ステータスブロックの後に「前回のセッション」セクションとして session.md の内容（日付・決定済み事項・未解決事項・次のアクション）を表示する

#### Scenario: session.md が存在しない場合
- **WHEN** `session.md` が存在しない状態で status を実行する
- **THEN** 「前回のセッション」セクションは表示されない

#### Scenario: 次のアクションの提示 — Findingsあり
- **WHEN** `design.md` の `## Findings` に未処理エントリが存在する
- **THEN** 「次にやること」として `/modscape:spec:amend <name>` を提示する

#### Scenario: 次のアクションの提示 — 未回答の質問あり
- **WHEN** `questions.md` に未回答の質問が存在する（`- [ ]` のエントリ）
- **THEN** 「次にやること」として `/modscape:spec:answer <name>` を提示し、未回答件数を添える

#### Scenario: 次のアクションの提示 — 通常フロー
- **WHEN** Findingsも未回答質問もない通常状態
- **THEN** spec.md→design.md→tasks.md→implement→archive の順でフェーズに応じた次コマンドを1つ提示する

#### Scenario: 全タスク完了時
- **WHEN** `tasks.md` の全タスクが `[x]` 完了している
- **THEN** 「次にやること」として `/modscape:spec:check <name>` を提示し、続けて `/modscape:spec:archive <name>` も案内する

---

## MODIFIED Requirements

### Requirement: status スキルがフェーズを spec-config.yaml から取得する

`status` スキルは現在のフェーズを判定する際に `modscape spec get <name> --json` を実行し、返却された `phase` フィールドを使用しなければならない（SHALL）。ファイル存在チェックによるフェーズ推測は `phase` フィールドが利用可能な場合に使用してはならない（SHALL NOT）。

`phase` が `null` の場合（`spec-config.yaml` に `phase` フィールドがない既存 spec）は、従来のファイル存在ベースのフォールバック判定を維持しなければならない（SHALL）。

フォールバック優先順位（`phase: null` 時のみ）:
1. `tasks.md` に `[ ]` が存在する → implement フェーズと判定
2. `tasks.md` が存在する → tasks フェーズと判定
3. `design.md` が存在する → design フェーズと判定
4. それ以外 → requirements フェーズと判定

#### Scenario: phase フィールドがある場合に CLI からフェーズを取得する
- **WHEN** `spec-config.yaml` に `phase: implement` が設定されている spec で status を実行する
- **THEN** スキルは `modscape spec get <name> --json` を実行し、`phase: implement` を使って「次にやること」を判定する

#### Scenario: phase が null の場合にファイル存在ベースでフォールバックする
- **WHEN** `spec-config.yaml` に `phase` フィールドがない既存 spec で status を実行する
- **THEN** スキルは `tasks.md` / `design.md` のファイル存在とタスク完了状況でフェーズを推定する
