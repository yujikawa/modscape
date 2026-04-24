## 1. Claude Code スキル実装

- [x] 1.1 `src/templates/claude/spec/generate.md` を新規作成する
  - 引数ありの場合（ファイルパス・glob）: 指定ファイルを読む
  - 引数なしの場合: 「参照するファイルを指定してください」と対話で収集する
  - インプット収集後に「model.yamlも更新しますか？」を確認する
  - model.yaml → `modscape table list` / `modscape table get` で情報取得
  - SQLファイル → CREATE TABLE / SELECT / dbt model（`{{ config() }}`）からテーブル名・カラム・型を解析
  - Pythonファイル → SQLAlchemy `Column()`・pandas・PySpark スキーマ定義を解析
  - テーブルIDは物理テーブル名を使用（ユーザー指定があればそちらを優先）
  - 既存の `.modscape/specs/<table-id>/spec.md` はスキップ
  - 全テーブル処理後に「生成: N件、スキップ: M件」のサマリーを表示
- [x] 1.2 spec.md の生成フォーマットを `archive.md` の `## specs/<table-id>/spec.md Format` に準拠させる
  - Overview（Owner / Update Frequency / SLA）: YAMLの`metadata.owner`・`physical.strategy`・`metadata.sla`から取得、なければ `—`
  - Business Context: `conceptual.description`、なければ `—`
  - Business Rules: カラムの`description`・`expression`から推論、なければ `—`
  - Changelog: `- <today>: Bootstrapped from existing implementation`

## 2. Gemini スキル実装

- [x] 2.1 `src/templates/gemini/modscape-spec-generate/SKILL.md` を新規作成する
  - Claude版（`generate.md`）をベースに以下の差分を適用する:
    - YAMLフロントマター（`name`・`description`）を追加する
    - コマンド参照を `@modscape-spec-generate` 形式に変更する

## 3. Codex スキル実装

- [x] 3.1 `src/templates/codex/modscape-spec-generate/SKILL.md` を新規作成する
  - Claude版（`generate.md`）をベースに以下の差分を適用する:
    - YAMLフロントマター（`name`・`description`）を追加する
    - ファイル末尾に `## COMMAND: /modscape:spec:generate` セクションを追加する
    - コマンド構文は `/modscape:spec:generate` のまま

## 4. init コマンド対応確認

- [x] 4.1 `src/init.js` を確認し、`modscape init` 実行時に `generate.md` がコピー対象に含まれているかチェックする
  - 含まれていなければコピー対象に追加する

## 5. ドキュメント更新

- [x] 5.1 `README.md` のSDDスキル一覧に `/modscape:spec:generate` を追記する
- [x] 5.2 `README.ja.md` のSDDスキル一覧に `/modscape:spec:generate` を追記する
- [x] 5.3 `CHANGELOG.md` に追記する
