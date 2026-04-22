## Why

複数テーブルにまたがるデータモデルを設計・運用していると、「顧客」「売上」「注文」といった用語が各テーブルで異なる名前・定義で使われ、AIとのSDDやり取りでも人間がモデルを読む際にも認識のズレが生じる。DDD のユビキタス言語に相当する「プロジェクト共通の用語集」を `_glossary.yaml` として定義し、SDD ワークフローの中で自然に育てていく仕組みを作る。

## What Changes

- `.modscape/specs/_glossary.yaml` を新設（用語ID・定義・関連テーブル/カラム・変更履歴を保持）
- `modscape init --sdd` で `_context.yaml` と並んで空テンプレートを生成
- SDD スキル（`spec:requirements`、`spec:answer`）に「用語が登場したら `_glossary.yaml` を確認・更新する」指示を追記
- ContextPanel に Glossary セクションを追加して UI から参照可能にする
- `modscape context export` の出力に glossary を含める

## Capabilities

### New Capabilities
- `glossary-yaml-schema`: `_glossary.yaml` のスキーマ設計（型定義・パーサー・テンプレート）
- `glossary-sdd-integration`: SDD スキルへの glossary 更新フロー組み込み
- `glossary-ui`: ContextPanel での用語集表示

### Modified Capabilities
- `context-export-cli`: `modscape context export` の出力に glossary を追加

## Impact

- `visualizer/src/types/schema.ts` — `GlossaryTerm`・`GlossaryYaml` 型追加
- `visualizer/src/lib/parser.ts` — `parseGlossaryYaml` 追加
- `visualizer/src/store/useStore.ts` — `glossaryData` ステート追加
- `visualizer/src/components/ContextPanel.tsx` — Glossary セクション追加
- `src/init.js` — `--sdd` 時に `_glossary.yaml` 生成
- `src/context.js` — glossary 集約ロジック追加
- `src/templates/claude/spec/requirements.md` — glossary 更新指示追記
- `src/templates/claude/spec/answer.md` — glossary 更新指示追記
- `src/dev.js` — `/api/glossary` エンドポイント追加
- `src/build.js` — `glossaryData` インジェクション追加
