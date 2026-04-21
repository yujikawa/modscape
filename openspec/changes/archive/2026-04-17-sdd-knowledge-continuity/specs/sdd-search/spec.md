## ADDED Requirements

### Requirement: modscape spec search コマンドでアーカイブと永続 spec を横断検索できる
CLI コマンド `modscape spec search <keyword>` は `.modscape/archives/` と `.modscape/specs/` を横断してキーワード検索し、関連する過去の設計・実装パターンを返さなければならない（SHALL）。

コマンドは以下を実行しなければならない（SHALL）:
- `.modscape/archives/*/spec.md`・`.modscape/archives/*/design.md`・`.modscape/specs/*.md` をテキストマッチで検索する
- 各マッチに対して「どの change/spec で、どのファイルの何行目に一致したか」を返す
- `--json` フラグで機械可読な JSON 出力を提供する
- `--limit <n>` フラグで結果件数を制限する（デフォルト: 5）
- マッチがゼロ件の場合は「No results found」と表示して正常終了する

#### Scenario: キーワードで過去 archive を検索する
- **WHEN** `.modscape/archives/` に 1 件以上の change が存在する状態で `modscape spec search <keyword>` を実行する
- **THEN** キーワードにマッチした archive のパス・spec タイトル・マッチ箇所の概要が一覧表示される

#### Scenario: --json フラグで機械可読な出力を得る
- **WHEN** `modscape spec search <keyword> --json` を実行する
- **THEN** `[{ "type": "archive"|"spec", "path": "...", "title": "...", "matches": [...] }]` 形式の JSON が標準出力に出力される

#### Scenario: archive が存在しない場合に正常終了する
- **WHEN** `.modscape/archives/` が空または存在しない状態で `modscape spec search <keyword>` を実行する
- **THEN** エラーを出さず「No results found」と表示して終了する

#### Scenario: --limit で結果件数を制限する
- **WHEN** `modscape spec search <keyword> --limit 3` を実行する
- **THEN** マッチ件数にかかわらず最大 3 件のみ表示される

### Requirement: /modscape:spec:search スキルが検索結果を解析して設計に取り込める
AIスキル `/modscape:spec:search <keyword>` は `modscape spec search <keyword> --json` を実行し、結果を読み込んで関連度の高い過去 spec・設計パターンをサマリー表示しなければならない（SHALL）。

ユーザーから「取り込んで」という明示的な指示があった場合のみ（SHALL）、関連する部分（テーブル定義・設計判断・実装パターン）を現在の `spec-model.yaml` または `design.md` に反映する。自動取り込みをしてはならない（SHALL NOT）。

#### Scenario: 検索結果をサマリー表示する
- **WHEN** `/modscape:spec:search monthly incremental` を実行する
- **THEN** マッチした過去 change のタイトル・概要・関連度が一覧表示され、参照すべき archive パスが示される

#### Scenario: 明示的指示で設計に取り込む
- **WHEN** 検索結果を確認後、ユーザーが「`archives/2026-03-15-monthly-sales` の設計を取り込んで」と指示する
- **THEN** スキルが指定 archive の `design.md` と `spec-model.yaml` を読み込み、関連する設計判断・テーブル定義を現在の `design.md` または `spec-model.yaml` に反映する
