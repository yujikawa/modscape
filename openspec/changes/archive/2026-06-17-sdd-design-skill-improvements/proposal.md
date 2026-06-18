## Why

SDDの `design` スキル実行後、改修対象テーブルが1件ずつ設計されるにもかかわらず残りテーブルの案内がなく、作業が完了したかのような印象を与えてしまっていた。また `spec dev` のデザインビューがタブ形式のため、テーブル数が増えると視認性が低下する問題があった。さらに unresolved questions 発生時の次ステップ案内が誤って `implement` スキルを指していた。

## What Changes

- **designスキル（初回実行時）**: 影響テーブルを全件特定した後、全テーブルのスタブファイル `design/<table-id>.md` を一括生成する。スタブにはテーブル名・カラム一覧など既知情報を事前入力する
- **designスキル（進捗管理）**: `design.md` に `## Design Progress` セクションを追加し、テーブルごとの設計状況（⏳ Pending / ✅ Designed）を追跡する。Case B のテーブル選択ロジックをファイル存在チェックからこの進捗テーブルの参照に切り替える
- **designスキル（会話連携）**: ユーザーとのやり取りでテーブルの追加・削除ができるようにする
- **designスキル（Next Step修正）**: unresolved questions 発生時の次ステップ案内を `implement` から `tasks` に修正する
- **spec dev UI**: Designタブのサブナビゲーションを横スクロールタブからサイドバーリストに変更する
- **フォーマットテンプレート**: `design-format.md` に `## Design Progress` セクションを追加、`design-table-format.md` にスタブ用のセクションを追加する

## Capabilities

### New Capabilities

- `sdd-design-stub-and-progress`: デザインスキル初回実行時に全影響テーブルのスタブファイルを一括生成し、`design.md` の進捗テーブルで設計状況を管理する機能
- `sdd-design-sidebar-ui`: `spec dev` のDesignタブにおけるテーブルナビゲーションをサイドバーリスト形式に変更する機能

### Modified Capabilities

（なし。既存のスペックレベルの要件は変わらない）

## Impact

- `src/templates/claude/spec/design.md` — designスキルのメイン定義
- `src/templates/gemini/modscape-spec-design/SKILL.md` — Gemini向けdesignスキル
- `src/templates/codex/modscape-spec-design/SKILL.md` — Codex向けdesignスキル
- `src/templates/formats/design-format.md` — design.mdのフォーマットテンプレート
- `src/templates/formats/design-table-format.md` — design/<table-id>.mdのフォーマットテンプレート
- `visualizer/src/components/SpecPanel.tsx` — spec devのUIコンポーネント（サイドバーリスト化）
