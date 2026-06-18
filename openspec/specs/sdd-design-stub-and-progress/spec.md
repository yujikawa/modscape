## ADDED Requirements

### Requirement: 初回 design スキル実行時に全影響テーブルのスタブを一括生成する

designスキルの初回実行（Case A）において、`## Affected Tables` で特定された全テーブル（Direct Impact + Downstream — Implement）のスタブファイル `design/<table-id>.md` を一括生成しなければならない（SHALL）。スタブには `modscape table get` で取得できるテーブル名・カラム一覧を含め、Implementation Details は TBD とする。スタブのヘッダーには `⏳ Pending design` バナーを含めなければならない（SHALL）。

#### Scenario: 初回実行でスタブが全テーブル分生成される

- **WHEN** designスキルを初めて実行し（`design.md` が存在しない）、3テーブルが影響テーブルとして特定された場合
- **THEN** `design/` ディレクトリに3件のスタブファイルが生成され、最初の1件が詳細設計で上書きされる

#### Scenario: スタブにテーブル情報が事前入力される

- **WHEN** スタブファイルが生成される場合
- **THEN** 各スタブには `## Table Overview`（Type・Kind）と `## Columns` テーブル（カラム名・型・FK有無）が含まれる

#### Scenario: スタブに Pending バナーが表示される

- **WHEN** `design/<table-id>.md` がスタブ状態の場合
- **THEN** ファイルの冒頭に `> ⏳ **Pending design**` バナーが存在する

---

### Requirement: design.md の ## Design Progress セクションで進捗を管理する

`design.md` は `## Design Progress` セクションを持たなければならない（SHALL）。このセクションはテーブルごとの設計状況（⏳ Pending / ✅ Designed）を持つ Markdown テーブル形式で管理され、設計完了時に該当テーブルの Status が更新される。Case B のテーブル選択ロジックはこのセクションを参照しなければならない（SHALL）。

#### Scenario: 初回実行後に Progress テーブルが作成される

- **WHEN** designスキルの初回実行が完了した場合
- **THEN** `design.md` の `## Design Progress` に全影響テーブルが ⏳ Pending または ✅ Designed として記録されている

#### Scenario: テーブルの詳細設計完了後にステータスが更新される

- **WHEN** `design/<table-id>.md` に詳細設計が書かれた場合
- **THEN** `design.md` の `## Design Progress` における該当テーブルの Status が `✅ Designed` に更新される

#### Scenario: 全テーブル設計完了の検出

- **WHEN** designスキルが Case B で実行され、`## Design Progress` に `⏳ Pending` が1件もない場合
- **THEN** スキルは「全テーブル設計完了」メッセージを出力し、`/modscape:spec:tasks` への案内を表示して処理を停止する

#### Scenario: 既存 design.md に Progress セクションがない場合のフォールバック

- **WHEN** `design.md` が存在するが `## Design Progress` セクションがない場合（旧バージョンとの後方互換）
- **THEN** スキルはファイル存在チェックをフォールバックとして使用し、Progress セクションを `design.md` に追記する

---

### Requirement: 会話でテーブルの追加・削除ができる

ユーザーがデザイン会話中にテーブルの追加または削除を要求した場合、スキルはそれに応じて `design.md` の `## Affected Tables` と `## Design Progress` を更新し、`spec-config.yaml` も同期しなければならない（SHALL）。

#### Scenario: テーブルを設計スコープに追加する

- **WHEN** ユーザーが「`dim_date` を設計対象に追加して」と要求した場合
- **THEN** `design.md` の `## Affected Tables` と `## Design Progress` に追記され、スタブファイルが生成され、`spec-config.yaml` が更新される

#### Scenario: テーブルを設計スコープから削除する

- **WHEN** ユーザーが「`mart_x` を対象から外して」と要求した場合
- **THEN** `design.md` の `## Affected Tables` と `## Design Progress` から除去され、`spec-config.yaml` が更新される

---

### Requirement: Next Step で残りテーブルの進捗を表示する

デザインスキルの Next Step 出力は、`## Design Progress` の状態を要約し、設計済み件数・残り件数・次の対象テーブルを表示しなければならない（SHALL）。

#### Scenario: 残りテーブルがある場合の Next Step

- **WHEN** 3テーブル中 1テーブルが設計完了した場合
- **THEN** Next Step には「Designed 1/3 tables. Next: `dim_customers`」のような進捗サマリーが含まれる

#### Scenario: unresolved questions 発生時の次ステップ案内

- **WHEN** 設計後に unresolved questions（open / assumed）が存在する場合
- **THEN** スキルは `/modscape:spec:tasks` への案内を表示する（`/modscape:spec:implement` ではない）
