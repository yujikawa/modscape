## Why

modscape:spec の SDD ワークフローは現在、各 change が独立したサイロとして完結しており、過去の設計知識（archive、specs/questions.md の未解決質問）が次の設計へ流入しない。同じテーブルを繰り返し設計するたびに過去の文脈がゼロリセットされ、既知の問題を見落としたり、過去に確立済みのパターンを再発明する非効率が生じている。

## What Changes

- **`modscape spec search` CLI コマンドの追加**: キーワードでアーカイブ・スペックを横断検索し、関連する過去の設計・実装パターンを探せるようにする。スキルが結果を読み込み、ユーザーの明示的な指示があれば関連部分を現在の設計に取り込む。
- **`/modscape:spec:design` の改善**: Direct Impact テーブルに関連する `specs/questions.md` の未解決質問（Q-NNN）を `design.md` の冒頭に参照リンクとして自動挿入する。質問本文のコピーではなく ID 参照のみ。
- **`/modscape:spec:design` でのサーチ統合**: design 実行時に関連する過去 spec を自動サジェストし、参照情報として design.md に記録する。

## Capabilities

### New Capabilities

- `sdd-search`: `modscape spec search <keyword>` CLI コマンドおよびスキル。archives と specs を横断検索し、関連する過去の設計パターン・テーブル実装を提示する。ユーザーの明示的な指示があれば関連部分を spec-model.yaml または design.md に取り込む。

### Modified Capabilities

- `sdd-design`: design ステップが `specs/questions.md` の未解決質問を Direct Impact テーブル単位で参照する機能、および過去 archive のサジェスト機能を追加する。

## Impact

- `src/templates/claude/spec/design.md` — design スキルに questions 参照と search サジェストのロジックを追加
- `src/templates/gemini/modscape-spec-design/SKILL.md` — 同期
- `src/templates/codex/modscape-spec-design/SKILL.md` — 同期
- `src/` — `modscape spec search` CLI コマンド実装（新ファイル `src/search.js` + `src/index.js` への登録）
- `src/templates/claude/spec/` — `search.md` スキルファイル追加
- `src/templates/gemini/` — `modscape-spec-search/SKILL.md` 追加
- `src/templates/codex/` — `modscape-spec-search/SKILL.md` 追加
- `src/templates/rules.md` — Section 12 に `spec search` コマンド追加
- `README.md` / `README.ja.md` — CLI リファレンスに `spec search` を追記
- `CHANGELOG.md` — エントリ追加
