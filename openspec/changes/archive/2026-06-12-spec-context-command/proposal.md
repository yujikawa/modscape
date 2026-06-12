## Why

SDD のアーカイブで蓄積される `_context.yaml` / `_glossary.yaml` / `_questions.yaml` の3ファイルは、AIエージェントがデータ分析・SQL生成を行う際の知識ベースとなることを意図しているが、現状は2つの問題がある。①エントリに `ids` フィールドが欠落しているため、テーブルIDを指定した絞り込み取得ができず、AI が必要な知識だけを効率的に読み込めない。②アーカイブスキルがツール/組織/運用情報も含む SDD の全決定事項を無差別に書き込むため、データ解釈に無関係な情報が混入する。これらを解消するため、① `ids` を必須化した上で絞り込み取得 CLI を追加し、②アーカイブスキルに「データ分析知識のみを収録する」キュレーション基準を組み込む。

## What Changes

- **新 CLI コマンド `modscape spec context --ids`**: 指定されたテーブル ID に関連するエントリを3ファイルから一括抽出して JSON 返却する
- **`_context.yaml` スキーマ変更**: `decisions` エントリに `ids: []` フィールドを追加（テーブルIDで引けない場合は `scope: global`）
- **アーカイブスキル変更（3プラットフォーム）**: Step 4/5 にキュレーション基準を追加 ── データ解釈に影響しない情報（実装ツール選択・組織体制・更新頻度など）は除外する。`ids` が付けられないエントリは書き込まない
- **codegen / spec:implement スキル変更（3プラットフォーム）**: 3ファイルを個別に全量読み込む代わりに `modscape spec context --ids <table-ids>` を実行して必要な知識のみ取得する

## Capabilities

### New Capabilities

- `spec-context-cli`: テーブルIDを指定して3つの知識ベースYAMLから関連エントリを一括取得するCLIコマンド

### Modified Capabilities

- `context-yaml-schema`: `decisions` エントリに `ids` フィールドを追加し、`ids` または `scope: global` を必須化する
- `sdd-archive`: アーカイブ時にデータ分析知識のみを収録するキュレーション基準を追加する

## Impact

- `src/specs.js`: `runContextGet()` 関数を追加
- `src/index.js`: `modscape spec context` コマンドを登録
- `src/templates/claude/codegen.md`: 知識取得ステップをCLIコマンドに変更
- `src/templates/claude/spec/implement.md`: 同上
- `src/templates/claude/spec/archive.md`: キュレーション基準を追加
- `src/templates/codex/modscape-spec-implement/SKILL.md`: 知識取得ステップをCLIコマンドに変更
- `src/templates/codex/modscape-spec-archive/SKILL.md`: キュレーション基準を追加
- `src/templates/gemini/modscape-spec-implement/SKILL.md`: 知識取得ステップをCLIコマンドに変更
- `src/templates/gemini/modscape-spec-archive/SKILL.md`: キュレーション基準を追加
- `.modscape/specs/_context.yaml`: 既存エントリに `ids` または `scope: global` を追加
- `.modscape/specs/_questions.yaml`: `ids` 欠落エントリを補完
