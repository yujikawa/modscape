## Context

`--with-downstream` 導入後、spec-model.yaml には「修正する予定のない参照用テーブル」が含まれる。現状の implement / archive は spec-model.yaml に存在するテーブルをすべて処理対象とみなすため、既存テーブルのコードを不用意に上書き・再生成してしまうリスクがある。分類情報を `design.md` に持たせることで、スキーマ変更なしに実装範囲を制御できる。

## Goals / Non-Goals

**Goals:**
- `design.md` の Downstream Impact を `Implement` / `Context Only` の2行に分割し、AI が初期分類を提案する
- implement スキルが `Context Only` テーブルをスキップする
- archive スキルが `Context Only` テーブルには Changelog のみ追記する

**Non-Goals:**
- spec-model.yaml にフィールドを追加するスキーマ変更（テキスト分類で十分）
- 自動的にコードベース上の既存ファイルを検出する仕組み（スコープ外）

## Decisions

### 1. 分類情報は design.md のみに持つ

**決定:** spec-model.yaml に `role:` フィールドは追加しない。`design.md` の `## Affected Tables` セクションのサブセクション名で判断する。

**理由:** スキーマ変更を避けることで後方互換性を保てる。design.md はすでに人間が編集する場所として確立されており、ユーザーによる分類修正のハードルが低い。

### 2. AI による初期分類ロジック

**決定:** design スキルは以下の基準で初期分類を提案する：
- Direct Impact テーブルに追加・変更されるカラムを参照する下流テーブル → `Implement`
- Direct Impact テーブルを参照しているが、変更カラムを使っていない下流テーブル → `Context Only`
- lineage のみ存在し、カラム情報がない場合 → 安全側に倒して `Context Only` を提案しコメントを添える

**理由:** AIが判断を誤るケースもあるため、あくまで提案。ユーザーが design.md を直接編集して修正できることを明記する。

### 3. implement スキルの判断方法

**決定:** implement スキルは `design.md` を読み、`### Downstream Impact — Context Only` に列挙されているテーブル ID を抽出してスキップリストとする。スキップ時は「⏭️ Skipping `<id>` (Context Only)」とメッセージを出力する。

### 4. archive スキルの処理分岐

**決定:** archive スキルは Direct Impact と `Downstream Impact — Implement` をフル spec sync の対象とし、`Downstream Impact — Context Only` には Changelog エントリのみ追記する。現状の "Indirect Impact" の扱いと同じ。

## Risks / Trade-offs

- **AIの分類が不正確な場合** → ユーザーが design.md を編集して修正する。design.md の冒頭に「この分類は AI の提案です。変更が必要な場合は直接編集してください」と注記を入れる。
- **design.md を読まずに implement を実行した場合** → design.md が存在しない場合、implement は全テーブルを実装対象とする（現状維持）。後退互換。
