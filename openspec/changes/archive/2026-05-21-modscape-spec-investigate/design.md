## Context

SDD の questions.md フローは「AI → ユーザー」方向（AI が確認事項を問い、ユーザーが回答）。今回追加する investigate スキルはその逆で「ユーザー → AI」方向（ユーザーが調査依頼を出し、AI がファイルを読んで解析する）。

対象は AI が自力でアクセスできる静的なリポジトリ内ファイル（SQL・dbt モデル・spec.md・model.yaml・spec-model.yaml・design.md など）。DB への直接クエリ実行は対象外（それは questions.md の `🔵` 調査クエリで対応）。

## Goals / Non-Goals

**Goals:**
- ユーザーが自由記述で調査依頼を渡せる
- AI がリポジトリ内の関連ファイルを自律的に読んで比較・解析する
- 発見を design.md の `## Findings` に記録する
- 発見が実装修正を要する場合は implement inline fix フローへ案内する
- 発見がモデル設計の変更を要する場合は design 再実行を案内する

**Non-Goals:**
- DB への実際のクエリ実行（questions.md `🔵` の担当）
- 自動修正（調査と記録のみ。修正は implement に委ねる）

## Decisions

### 1. スキルの入力形式: 自由記述

ユーザーは「既存の `oo` テーブルと新テーブルのロジック差異を調べてほしい」のように自然言語で依頼を渡す。AI が依頼を解析し、どのファイルを読むべきかを自律判断する。

フォーマットを強制しない理由: 調査ニーズは毎回異なり、固定フォームでは表現しきれないケースが多い。

### 2. AI が読むファイルの優先順位

1. `.modscape/changes/<name>/spec-model.yaml` — テーブル定義・カラム・lineage
2. `.modscape/changes/<name>/design.md` — 既存の設計決定と Findings
3. `.modscape/changes/<name>/spec.md` — 受け入れ条件
4. `.modscape/specs/<table-id>/spec.md` — 既存テーブルの永続 spec
5. プロジェクト内の SQL / dbt モデルファイル（依頼内容に応じて）
6. `model.yaml`（メインモデル）

### 3. 発見の記録先: design.md の `## Findings`

発見は design.md の `## Findings` セクションに追記する。既存の Findings があればその後に追記。形式:

```markdown
### Finding: <タイトル> (<日付>)
**調査依頼:** <ユーザーが渡した依頼の要約>
**調査対象:** <読んだファイル一覧>
**発見:** <何がわかったか>
**影響:** <設計・実装・仕様への影響>
**次のアクション:** <推奨アクション>
```

### 4. 次のアクションの判定ロジック

| 発見の内容 | 次のアクション |
|---|---|
| 実装ロジックの誤り（既存ファイルと差異） | implement inline fix フローへ案内 |
| モデル構造の変更が必要（テーブル追加・lineage 変更） | `/modscape:spec:design <name>` 再実行を案内 |
| 仕様（spec.md AC）との矛盾 | spec.md の該当 AC を更新するよう案内 |
| 参考情報のみ（修正不要） | 発見を記録して終了 |

### 5. questions.md との分離

investigate で得た発見は design.md の Findings に記録し、questions.md には書かない。questions.md はあくまで「AI がユーザーに確認を求める Q」専用。

## Risks / Trade-offs

- **リスク**: ユーザーの依頼が曖昧で AI が何を調べればいいか不明な場合
  → **緩和策**: 依頼が不明確な場合は 1 つだけ確認してから調査を開始する

- **リスク**: 調査対象ファイルが多く、AI がコンテキストを使いすぎる
  → **緩和策**: 依頼に直接関係するファイルのみを読む。全ファイルを網羅的に読まない

- **トレードオフ**: 静的解析のみなので、実際のデータ差異（NULLの混入・想定外の値分布）は発見できない
  → 許容。DB を要する調査は questions.md `🔵` で対応するという役割分担を明確にする
