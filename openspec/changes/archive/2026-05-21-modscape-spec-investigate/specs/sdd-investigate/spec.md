## ADDED Requirements

### Requirement: ユーザー起点の静的調査タスクを受け付ける
AIスキル `/modscape:spec:investigate <name>` は、ユーザーが自由記述で渡した調査依頼を受け取り、リポジトリ内の関連ファイルを静的に読んで解析し、発見を `design.md` の `## Findings` セクションに記録しなければならない（SHALL）。

調査対象はリポジトリ内の静的ファイルのみとする（SQL・dbt モデル・spec.md・spec-model.yaml・design.md・model.yaml 等）。DB への実際のクエリ実行は対象外とする。

#### Scenario: 既存テーブルとの差異調査を依頼する
- **WHEN** ユーザーが「既存の `oo` テーブルと新テーブルのロジックを比較してほしい」と依頼する
- **THEN** AI が両テーブルに関連するファイル（SQL・spec・model.yaml）を読み、ロジック差異をまとめて `design.md` の `## Findings` に記録する

#### Scenario: 依頼が曖昧な場合は 1 点だけ確認する
- **WHEN** 調査依頼の対象ファイルや比較軸が不明確なとき
- **THEN** AI は 1 つだけ確認してから調査を開始する（複数質問しない）

### Requirement: 発見を design.md の Findings に記録する
スキルは調査完了後、発見を以下の形式で `design.md` の `## Findings` セクションに追記しなければならない（SHALL）。

```
### Finding: <タイトル> (<日付>)
**調査依頼:** <依頼の要約>
**調査対象:** <読んだファイル一覧>
**発見:** <何がわかったか>
**影響:** <設計・実装・仕様への影響>
**次のアクション:** <推奨アクション>
```

`## Findings` セクションが存在しない場合は作成する。

#### Scenario: 発見を Findings に追記する
- **WHEN** 調査が完了する
- **THEN** design.md の `## Findings` セクションに Finding エントリが追記され、調査依頼・調査対象・発見・影響・次のアクションが記載される

#### Scenario: Findings セクションが存在しない場合は作成する
- **WHEN** design.md に `## Findings` セクションがない
- **THEN** セクションを作成してから Finding を追記する

### Requirement: 発見に応じた次のアクション案内
スキルは発見の内容に応じて適切な次のアクションをユーザーに案内しなければならない（SHALL）。

| 発見の内容 | 案内するアクション |
|---|---|
| 実装ロジックの誤りや差異 | `/modscape:spec:implement <name>` の inline fix フロー |
| モデル構造の変更が必要 | `/modscape:spec:design <name>` 再実行 |
| 仕様（AC）との矛盾 | spec.md の該当 AC-NNN を更新 |
| 参考情報のみ（修正不要） | 発見を記録して終了 |

#### Scenario: 実装ロジックの誤りが見つかった場合
- **WHEN** 調査の結果、実装済みの SQL に誤りがあることが判明する
- **THEN** Finding を記録したうえで「`/modscape:spec:implement <name>` を実行して inline fix フローで修正してください」と案内する

#### Scenario: 参考情報のみで修正不要な場合
- **WHEN** 調査の結果、仕様・実装ともに問題なく、背景情報として記録するだけでよい
- **THEN** Finding を記録して「修正は不要です」と表示して終了する
