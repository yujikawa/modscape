## Why

SDDワークフローで「修正対象テーブル」を起点に設計を始めるとき、下流への影響テーブルが自動的に `spec-model.yaml` に含まれない。現状はAIが lineage を手動で読み取って抽出対象を判断しており、深い依存グラフでは漏れが発生しやすい。`modscape extract` に下流トラバーサル機能を追加し、起点テーブルから全下流テーブルを自動収集することで、設計スコープの抜け漏れをなくす。

## What Changes

- `modscape extract` に `--with-downstream` フラグを追加する
  - 複数の入力YAMLにまたがって lineage グラフを合成する
  - 指定テーブルIDを起点に、lineage を再帰的に下流トラバーサルする
  - 収集した全テーブルIDを通常の抽出フローに流す
- SDD design スキル（`src/templates/claude/spec/design.md`）を更新する
  - 初回抽出コマンドに `--with-downstream` を使用するよう手順を変更する
  - `design.md` の Affected Tables（Direct / Downstream）を抽出結果から導出するよう変更する
- `src/templates/gemini/` および `src/templates/codex/` の design スキルを同期する

## Capabilities

### New Capabilities

- `extract-downstream-traversal`: `modscape extract --with-downstream` による lineage 下流トラバーサル機能。複数YAMLをまたいでグラフを合成し、起点テーブルから再帰的に全下流テーブルを収集する。

### Modified Capabilities

- `cli-extract-command`: `--with-downstream` フラグ追加により、出力セクションの制限要件（tables のみ）が変わる。relationships / lineage も下流テーブル間で自動的に含まれるようになる。
- `sdd-design`: 初回抽出コマンドの呼び出し方が変わる。`--with-downstream` を使う条件と、Affected Tables の導出方法が要件レベルで変わる。

## Impact

- `src/extract.js` — `--with-downstream` フラグの実装（lineage グラフ構築 + 再帰トラバーサル）
- `src/index.js` — extract コマンドへの `--with-downstream` オプション登録
- `src/templates/claude/spec/design.md` — 抽出コマンドの手順変更
- `src/templates/gemini/modscape-spec-design/SKILL.md` — 同期
- `src/templates/codex/modscape-spec-design/SKILL.md` — 同期
- 既存の extract 動作への後方互換性への影響なし（フラグなし時は現状と同じ挙動）
